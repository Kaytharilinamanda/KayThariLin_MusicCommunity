const KEY = "harmony-theme"
const listeners = new Set()

export function currentTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark"
}

export function setTheme(theme) {
  const next = theme === "light" ? "light" : "dark"
  document.documentElement.dataset.theme = next
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* storage can be blocked; the page still switches for this visit */
  }
  listeners.forEach((listener) => listener(next))
}

export function subscribeTheme(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
