declare const browser: {
  commands: {
    update({ name, shortcut }): void;
  };
};

export function canInjectScript(url: string) {
  return (
    url &&
    !url.startsWith("chrome") &&
    !url.startsWith("https://chrome.google.com/webstore")
  );
}

export function getCommands() {
  return new Promise<chrome.commands.Command[]>(resolve => {
    if (!chrome.commands) {
      resolve([]);
      return;
    }
    chrome.commands.getAll(commands => {
      if (commands) {
        resolve(commands);
      } else {
        resolve([]);
      }
    });
  });
}

export function setShortcut(command: string, shortcut: string) {
  if (
    typeof browser !== "undefined" &&
    browser.commands &&
    browser.commands.update
  ) {
    browser.commands.update({ name: command, shortcut });
  }
}
