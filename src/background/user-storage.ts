import ThemeEngines from "../generators/theme-engines";
import { isURLMatched } from "../utils/url";
import { UserSettings } from "../definitions";

export default class UserStorage {
  settings: Readonly<UserSettings> = {
    enabled: false,
    theme: {
      mode: 1,
      brightness: 100,
      contrast: 100,
      grayscale: 0,
      sepia: 0,
      engine: ThemeEngines.dynamicTheme,
      stylesheet: ""
    },
    customThemes: [],
    siteList: [],
    applyToListedOnly: false
  };

  cleanup() {
    chrome.storage.local.remove(["activationTime", "deactivationTime"]);
    chrome.storage.sync.remove(["activationTime", "deactivationTime"]);
  }

  set($settings: Partial<UserSettings>) {
    if ($settings.siteList) {
      if (!Array.isArray($settings.siteList)) {
        const list = [];
        for (let key in $settings.siteList as any) {
          const index = Number(key);
          if (!isNaN(index)) {
            list[index] = $settings.siteList[key];
          }
        }
        $settings.siteList = list;
      }
      const siteList = $settings.siteList.filter(pattern => {
        let isOK = false;
        try {
          isURLMatched("https://google.com/", pattern);
          isOK = true;
        } catch (err) {
          console.warn(`Pattern "${pattern}" excluded`);
        }
        return isOK && pattern !== "/";
      });
      $settings = { ...$settings, siteList };
    }
    this.settings = { ...this.settings, ...$settings };
  }
}
