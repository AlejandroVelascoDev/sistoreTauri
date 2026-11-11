export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const media = window.matchMedia("(prefers-color-scheme: dark)");

export function getStoredTheme(): Theme {
  const value = localStorage.getItem(STORAGE_KEY);
  return value === "light" || value === "dark" || value === "system"
    ? value
    : "system";
}

export function applyTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  const isDark = theme === "dark" || (theme === "system" && media.matches);
  document.documentElement.classList.toggle("dark", isDark);
}

media.addEventListener("change", () => {
  if (getStoredTheme() === "system") applyTheme("system");
});
