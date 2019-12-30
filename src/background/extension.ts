import ConfigManager from "./config-manager";
import Messenger from "./messenger";
import TabManager from "./tab-manager";
import UserStorage from "./user-storage";
import {
  canInjectScript
} from "./utils/extension-api";
import { isURLInList, getURLHost, isURLEnabled } from "../utils/url";
import ThemeEngines from "../generators/theme-engines";
import createCSSFilterStylesheet from "../generators/css-filter";
import { getDynamicThemeFixesFor } from "../generators/dynamic-theme";
import createStaticStylesheet from "../generators/static-theme";
import {
  createSVGFilterStylesheet,
  getSVGFilterMatrixValue,
  getSVGReverseFilterMatrixValue
} from "../generators/svg-filter";
import {
  ExtensionData,
  FilterConfig,
  UserSettings,
  TabInfo
} from "../definitions";

export class Extension {
  ready: boolean;

  config: ConfigManager;
  messenger: Messenger;
  tabs: TabManager;
  user: UserStorage;

  constructor() {
    this.ready = false;

    this.config = new ConfigManager();
    this.messenger = new Messenger(this.getMessengerAdapter());
    this.tabs = new TabManager({
      getConnectionMessage: (url, frameURL) =>
        this.getConnectionMessage(url, frameURL),
        onColorSchemeChange: this.onColorSchemeChange,
    });
    this.user = new UserStorage();
    this.awaiting = [];
  }

  isEnabled() {
    return this.user.settings.enabled;
  }

  private awaiting: (() => void)[];

  private wasEnabledOnLastCheck: boolean;

  async start() {
    await this.config.load({ local: true });

    this.changeSettings(this.user.settings);
    console.log("loaded", this.user.settings);

    this.ready = true;
    this.tabs.updateContentScript();

    this.awaiting.forEach(ready => ready());
    this.awaiting = null;

    this.user.cleanup();
  }

  private getMessengerAdapter() {
    return {
      collect: async () => {
        if (!this.ready) {
          await new Promise(resolve => this.awaiting.push(resolve));
        }
        return await this.collectData();
      },
      getActiveTabInfo: async () => {
        if (!this.ready) {
          await new Promise(resolve => this.awaiting.push(resolve));
        }
        const url = await this.tabs.getActiveTabURL();
        return await this.getURLInfo(url);
      },
      changeSettings: settings => this.changeSettings(settings),
      setTheme: theme => this.setTheme(theme),
    };
  }

  private handleAutoCheck = () => {
    if (!this.ready) {
        return;
    }
    const isEnabled = this.isEnabled();
    if (this.wasEnabledOnLastCheck !== isEnabled) {
        this.wasEnabledOnLastCheck = isEnabled;
        // this.onAppToggle();
        this.tabs.sendMessage(this.getTabMessage);
        this.reportChanges();
    }
};

  private wasLastColorSchemeDark = null;

  private onColorSchemeChange = ({isDark}) => {
      this.wasLastColorSchemeDark = isDark;
      this.handleAutoCheck();
  };

  private async collectData(): Promise<ExtensionData> {
    return {
      isEnabled: this.isEnabled(),
      isReady: this.ready,
      settings: this.user.settings
    };
  }

  private getConnectionMessage(url, frameURL) {
    if (this.ready) {
      return this.isEnabled() && this.getTabMessage(url, frameURL);
    } else {
      return new Promise(resolve => {
        this.awaiting.push(() => {
          resolve(this.isEnabled() && this.getTabMessage(url, frameURL));
        });
      });
    }
  }

  changeSettings($settings: Partial<UserSettings>) {
    this.user.set($settings);
    this.onSettingsChanged();
  }

  setTheme($theme: Partial<FilterConfig>) {
    this.user.set({ theme: { ...this.user.settings.theme, ...$theme } });

    this.onSettingsChanged();
  }

  private async reportChanges() {
    const info = await this.collectData();
    this.messenger.reportChanges(info);
  }

  toggleSitePattern(pattern: string) {
    const siteList = this.user.settings.siteList.slice();
    const index = siteList.indexOf(pattern);
    if (index < 0) {
      siteList.push(pattern);
    } else {
      siteList.splice(index, 1);
    }
    this.changeSettings({ siteList });
  }

  /**
   * Adds host name of last focused tab
   * into Sites List (or removes).
   */
  async toggleCurrentSite() {
    const url = await this.tabs.getActiveTabURL();
    const host = getURLHost(url);
    this.toggleSitePattern(host);
  }

  //------------------------------------
  //
  //       Handle config changes
  //

  private onSettingsChanged() {
    if (!this.ready) {
      return;
    }

    this.tabs.sendMessage(this.getTabMessage);
    this.saveUserSettings();
    this.reportChanges();
  }

  //----------------------
  //
  // Add/remove css to tab
  //
  //----------------------

  private getURLInfo(url: string): TabInfo {
    const { DARK_SITES } = this.config;
    const isInDarkList = isURLInList(url, DARK_SITES);
    const isProtected = !canInjectScript(url);
    return {
      url,
      isInDarkList,
      isProtected
    };
  }

  private getTabMessage = (url: string, frameURL: string) => {
    const urlInfo = this.getURLInfo(url);
    if (this.isEnabled() && isURLEnabled(url, this.user.settings, urlInfo)) {
      const custom = this.user.settings.customThemes.find(({ url: urlList }) =>
        isURLInList(url, urlList)
      );
      const filterConfig = custom ? custom.theme : this.user.settings.theme;

      console.log(`Creating CSS for url: ${url}`);
      switch (filterConfig.engine) {
        case ThemeEngines.cssFilter: {
          return {
            type: "add-css-filter",
            data: createCSSFilterStylesheet(
              filterConfig,
              url,
              frameURL,
              this.config.INVERSION_FIXES
            )
          };
        }
        case ThemeEngines.svgFilter: {
          return {
            type: "add-svg-filter",
            data: {
              css: createSVGFilterStylesheet(
                filterConfig,
                url,
                frameURL,
                this.config.INVERSION_FIXES
              ),
              svgMatrix: getSVGFilterMatrixValue(filterConfig),
              svgReverseMatrix: getSVGReverseFilterMatrixValue()
            }
          };
        }
        case ThemeEngines.staticTheme: {
          return {
            type: "add-static-theme",
            data:
              filterConfig.stylesheet && filterConfig.stylesheet.trim()
                ? filterConfig.stylesheet
                : createStaticStylesheet(
                    filterConfig,
                    url,
                    frameURL,
                    this.config.STATIC_THEMES
                  )
          };
        }
        case ThemeEngines.dynamicTheme: {
          const filter = { ...filterConfig };
          delete filter.engine;
          const fixes = getDynamicThemeFixesFor(
            url,
            frameURL,
            this.config.DYNAMIC_THEME_FIXES
          );
          const isIFrame = frameURL != null;
          return {
            type: "add-dynamic-theme",
            data: { filter, fixes, isIFrame }
          };
        }
        default: {
          throw new Error(`Unknown engine ${filterConfig.engine}`);
        }
      }
    } else {
      console.log(`Site is not inverted: ${url}`);
    }
    return {
      type: "clean-up"
    };
  };

  //-------------------------------------
  //          User settings

  private async saveUserSettings() {
    console.log("saved", this.user.settings);
  }
}
