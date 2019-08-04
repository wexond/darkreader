import {
  ExtensionData,
  FilterConfig,
  TabInfo,
  Message,
  UserSettings
} from "../definitions";

interface ExtensionAdapter {
  collect: () => Promise<ExtensionData>;
  getActiveTabInfo: () => Promise<TabInfo>;
  changeSettings: (settings: Partial<UserSettings>) => void;
  setTheme: (theme: Partial<FilterConfig>) => void;
  setShortcut: ({ command, shortcut }) => void;
  toggleSitePattern: (pattern: string) => void;
  onPopupOpen: () => void;
}

export default class Messenger {
  private reporters: Set<(info: ExtensionData) => void>;
  private adapter: ExtensionAdapter;

  constructor(adapter: ExtensionAdapter) {
    this.reporters = new Set();
    this.adapter = adapter;
    chrome.runtime.onConnect.addListener(port => {
      if (port.name === "ui") {
        port.onMessage.addListener(message => this.onUIMessage(port, message));
        this.adapter.onPopupOpen();
      }
    });

    chrome.runtime.onMessage.addListener(msg => {
      if (msg.name === "toggle") {
        this.adapter.changeSettings({
          enabled: msg.toggle
        });
      }
    });
  }

  private async onUIMessage(
    port: chrome.runtime.Port,
    { type, id, data }: Message
  ) {
    switch (type) {
      case "get-data": {
        const data = await this.adapter.collect();
        port.postMessage({ id, data });
        break;
      }
      case "get-active-tab-info": {
        const data = await this.adapter.getActiveTabInfo();
        port.postMessage({ id, data });
        break;
      }
      case "subscribe-to-changes": {
        const report = data => port.postMessage({ id, data });
        this.reporters.add(report);
        port.onDisconnect.addListener(() => this.reporters.delete(report));
        break;
      }
      case "change-settings": {
        this.adapter.changeSettings(data);
        break;
      }
      case "set-theme": {
        this.adapter.setTheme(data);
        break;
      }
      case "set-shortcut": {
        this.adapter.setShortcut(data);
        break;
      }
      case "toggle-site-pattern": {
        this.adapter.toggleSitePattern(data);
        break;
      }
    }
  }

  reportChanges(data: ExtensionData) {
    this.reporters.forEach(report => report(data));
  }
}
