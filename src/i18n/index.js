import { computed, ref } from 'vue'
import vi from './local/vi.js'

/** Tạm thời chỉ tiếng Việt — bật lại `en` khi cần đa ngôn ngữ. */
export const SUPPORTED_LOCALES = ['vi']
export const DEFAULT_LOCALE = 'vi'

const messages = { vi }
const locale = ref(DEFAULT_LOCALE)

export function detectLang() {
  return DEFAULT_LOCALE
}

function getByPath(obj, path) {
  return String(path || '')
    .split('.')
    .reduce((acc, key) => (acc && acc[key] != null ? acc[key] : undefined), obj)
}

function interpolate(template, params = {}) {
  return String(template).replace(/\{(\w+)\}/g, (_, key) => {
    if (params[key] == null) return `{${key}}`
    return String(params[key])
  })
}

export function t(key, params) {
  const pack = messages[DEFAULT_LOCALE]
  const raw = getByPath(pack, key)
  if (raw == null) return key
  return typeof raw === 'string' ? interpolate(raw, params) : raw
}

export function te(key) {
  return getByPath(messages[DEFAULT_LOCALE], key) != null
}

export function setLocale() {
  locale.value = DEFAULT_LOCALE
  if (typeof document !== 'undefined') {
    document.documentElement.lang = DEFAULT_LOCALE
  }
  return DEFAULT_LOCALE
}

export function getLocale() {
  return locale.value
}

function upsertMeta(attr, key, content) {
  if (!content || typeof document === 'undefined') return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function applyDocumentMeta({ routeName, fullPath = '/' } = {}) {
  const titleKey = routeName ? `meta.pages.${routeName}` : 'meta.title'
  const title = te(titleKey) ? t(titleKey) : t('meta.title')
  const description = t('meta.description')
  const imageAlt = t('meta.imageAlt')
  const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://dynageo.app').replace(/\/$/, '')
  const path = fullPath === '/' ? '/' : fullPath
  const url = `${siteUrl}${path}`
  const image = `${siteUrl}/og-image.png`

  document.documentElement.lang = DEFAULT_LOCALE
  document.title = title

  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:locale', 'vi_VN')
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', image)
  upsertMeta('property', 'og:image:alt', imageAlt)
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', image)

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)

  return DEFAULT_LOCALE
}

export function useI18n() {
  return {
    locale: computed(() => DEFAULT_LOCALE),
    t,
    te,
    setLocale,
    applyDocumentMeta,
    messages,
  }
}

export function createI18n() {
  setLocale()
  return {
    t,
    te,
    locale,
    setLocale,
    detectLang,
    applyDocumentMeta,
    install(app) {
      app.config.globalProperties.$t = t
      app.config.globalProperties.$te = te
      app.config.globalProperties.$i18n = {
        locale,
        t,
        te,
        setLocale,
      }
      app.provide('i18n', {
        locale,
        t,
        te,
        setLocale,
        applyDocumentMeta,
      })
    },
  }
}

export { messages, locale }
export default createI18n
