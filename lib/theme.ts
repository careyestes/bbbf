export const THEME_STORAGE_KEY = "bbb-theme";

export type ThemeName = "light" | "dark";

export const THEME_COLOR: Record<ThemeName, string> = {
  light: "#fff8e0",
  dark: "#17140f",
};

export function readStoredTheme(): ThemeName | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* private mode / blocked storage */
  }
  return null;
}

export function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function resolveTheme(stored: ThemeName | null): ThemeName {
  if (stored) return stored;
  return prefersDark() ? "dark" : "light";
}

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.style.colorScheme = theme;

  const metas = document.querySelectorAll('meta[name="theme-color"]');
  metas.forEach((meta) => {
    meta.setAttribute("content", THEME_COLOR[theme]);
  });
}

/** Runs before paint so the first frame matches the saved / system theme. */
export const THEME_INIT_SCRIPT = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var s=localStorage.getItem(k);var t=s==="light"||s==="dark"?s:(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");var r=document.documentElement;r.setAttribute("data-theme",t);r.style.colorScheme=t}catch(e){}})();`;
