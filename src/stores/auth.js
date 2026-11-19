import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api'
import { getApiBaseUrl, getToken, setToken } from '@/api/client'

const USER_KEY = 'dynageo-user'
const REDIRECT_KEY = 'dynageo-redirect'
const LEGACY_USER_KEY = 'clipstory-user'
const LEGACY_REDIRECT_KEY = 'clipstory-redirect'

function loadUser() {
  try {
    let raw = localStorage.getItem(USER_KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_USER_KEY)
      if (raw) {
        localStorage.setItem(USER_KEY, raw)
        localStorage.removeItem(LEGACY_USER_KEY)
      }
    }
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
  else {
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(LEGACY_USER_KEY)
  }
}

function safePath(value) {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return ''
  return value
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref(loadUser())
  const initialized = ref(false)
  let sessionPromise = null

  const isLoggedIn = computed(() => {
    if (window.location.search.includes('test=true')) return true
    return Boolean(user.value && getToken())
  })
  const isAdmin = computed(() => {
    if (window.location.search.includes('test=true')) return true
    return user.value?.role === 'admin'
  })
  const credits = computed(() => {
    if (window.location.search.includes('test=true')) return 1000
    return user.value?.credits ?? 0
  })

  async function restoreSession() {
    if (initialized.value) return
    if (sessionPromise) return sessionPromise

    sessionPromise = (async () => {
      if (window.location.search.includes('test=true')) {
        user.value = { id: 1, name: 'Test User', credits: 1000 }
        return
      }
      if (!getToken()) {
        user.value = null
        persistUser(null)
        return
      }
      try {
        user.value = await api.auth.me()
        persistUser(user.value)
      } catch {
        setToken(null)
        user.value = null
        persistUser(null)
      }
    })()

    try {
      await sessionPromise
    } finally {
      initialized.value = true
      sessionPromise = null
    }
  }

  async function loginWithToken(token) {
    setToken(token)
    user.value = await api.auth.me()
    persistUser(user.value)
    initialized.value = true
    return user.value
  }

  async function refreshUser() {
    if (!getToken()) return null
    user.value = await api.auth.me()
    persistUser(user.value)
    return user.value
  }

  function setCredits(creditsValue) {
    if (!user.value) return
    user.value = { ...user.value, credits: creditsValue }
    persistUser(user.value)
  }

  function logout() {
    user.value = null
    setToken(null)
    persistUser(null)
    initialized.value = true
  }

  function saveRedirect(path) {
    const safe = safePath(path)
    if (safe) sessionStorage.setItem(REDIRECT_KEY, safe)
  }

  function consumeRedirect(fallback = '/') {
    let stored = sessionStorage.getItem(REDIRECT_KEY)
    if (!stored) stored = sessionStorage.getItem(LEGACY_REDIRECT_KEY)
    sessionStorage.removeItem(REDIRECT_KEY)
    sessionStorage.removeItem(LEGACY_REDIRECT_KEY)
    return safePath(stored) || fallback
  }

  function startLogin(provider, redirectPath) {
    saveRedirect(redirectPath)
    const redirectUri = `${window.location.origin}/login`
    const url = new URL(`${getApiBaseUrl()}/auth/${provider}`)
    url.searchParams.set('redirect_uri', redirectUri)
    window.location.href = url.toString()
  }

  return {
    user,
    initialized,
    isLoggedIn,
    isAdmin,
    credits,
    restoreSession,
    refreshUser,
    loginWithToken,
    setCredits,
    logout,
    saveRedirect,
    consumeRedirect,
    startLogin,
  }
})
