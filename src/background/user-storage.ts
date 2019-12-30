import ThemeEngines from "../generators/theme-engines";
import { isURLMatched } from "../utils/url";
import { UserSettings } from "../definitions";

const SAVE_TIMEOUT = 1000;

export default class UserStorage {
    private defaultSettings: UserSettings;

    constructor() {
        this.defaultSettings = {
            enabled: true,
            theme: {
                mode: 1,
                brightness: 100,
                contrast: 100,
                grayscale: 0,
                sepia: 0,
                engine: ThemeEngines.dynamicTheme,
                stylesheet: '',
            },
            customThemes: [],
            siteList: [],
            siteListEnabled: [],
            applyToListedOnly: false,
        };
        this.settings = null;
    }

    settings: Readonly<UserSettings>;

    async loadSettings() {
        this.settings = await this.loadSettingsFromStorage();
    }

    cleanup() {
        chrome.storage.local.remove(['activationTime', 'deactivationTime']);
        chrome.storage.sync.remove(['activationTime', 'deactivationTime']);
    }

    private loadSettingsFromStorage() {
        return new Promise<UserSettings>((resolve) => {
            chrome.storage.local.get(this.defaultSettings, (local: UserSettings) => {
              local.theme = {...this.defaultSettings.theme, ...local.theme};
              resolve(local);
            });
        });
    }

    async saveSettings() {
        const saved = await this.saveSettingsIntoStorage(this.settings);
        this.settings = saved;
    }

    private saveSettingsIntoStorage(settings: UserSettings) {
        if (this.timeout) {
            clearInterval(this.timeout);
        }
        return new Promise<UserSettings>((resolve) => {
            this.timeout = setTimeout(() => {
                this.timeout = null;
                chrome.storage.local.set(settings, () => resolve(settings));
            }, SAVE_TIMEOUT);
        });
    }

    private timeout: number = null;

    set($settings: Partial<UserSettings>) {
        if ($settings.siteList) {
            if (!Array.isArray($settings.siteList)) {
                const list = [];
                for (const key in ($settings.siteList as any)) {
                    const index = Number(key);
                    if (!isNaN(index)) {
                        list[index] = $settings.siteList[key];
                    }
                }
                $settings.siteList = list;
            }
            const siteList = $settings.siteList.filter((pattern) => {
                let isOK = false;
                try {
                    isURLMatched('https://google.com/', pattern);
                    isOK = true;
                } catch (err) {
                    console.warn(`Pattern "${pattern}" excluded`);
                }
                return isOK && pattern !== '/';
            });
            $settings = {...$settings, siteList};
        }
        this.settings = {...this.settings, ...$settings};
    }
}
