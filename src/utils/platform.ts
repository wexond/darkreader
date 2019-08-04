export function isWindows() {
  return navigator.platform.toLowerCase().startsWith("win");
}

export function isMacOS() {
  return navigator.platform.toLowerCase().startsWith("mac");
}

export function isMobile() {
  const agent = navigator.userAgent.toLowerCase();
  return agent.includes("mobile");
}

export function getChromeVersion() {
  const agent = navigator.userAgent.toLowerCase();
  const m = agent.match(/chrom[e|ium]\/([^ ]+)/);
  if (m && m[1]) {
    return m[1];
  }
  return null;
}

export function compareChromeVersions($a: string, $b: string) {
  const a = $a.split(".").map(x => parseInt(x));
  const b = $b.split(".").map(x => parseInt(x));
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return a[i] < b[i] ? -1 : 1;
    }
  }
  return 0;
}

export function isDeepSelectorSupported() {
  try {
    document.querySelector("x /deep/ x");
    return true;
  } catch (err) {
    return false;
  }
}
