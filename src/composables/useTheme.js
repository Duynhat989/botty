const STORAGE_KEY = 'botty-theme'

/** @typedef {'light' | 'dark' | 'system'} ThemeMode */

export function getTheme() {
  if (typeof document === 'undefined') return 'light'
  const t = document.documentElement.dataset.theme
  return t === 'dark' ? 'dark' : 'light'
}

/**
 * @param {ThemeMode} mode
 */
export function setTheme(mode) {
  if (typeof document === 'undefined') return
  if (mode === 'system') {
    document.documentElement.removeAttribute('data-theme')
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  document.documentElement.dataset.theme = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
}

export function initThemeFromStorage() {
  if (typeof document === 'undefined') return
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') {
      document.documentElement.dataset.theme = saved
    }
  } catch {
    /* ignore */
  }
}