import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api } from '@/api'
import { getPicadsToken, getPicadsUser, setPicadsToken, setPicadsUser } from '@/api/client'

export const usePicadsAuthStore = defineStore('picadsAuth', () => {
  const user = ref(getPicadsUser())
  const initialized = ref(false)

  const isLoggedIn = computed(() => Boolean(user.value && getPicadsToken()))

  async function restoreSession() {
    if (initialized.value) return
    initialized.value = true
    if (!getPicadsToken()) {
      user.value = null
      setPicadsUser(null)
      return
    }
    user.value = getPicadsUser()
  }

  async function login(email, password) {
    const data = await api.picads.login({ email, password })
    setPicadsToken(data.token)
    setPicadsUser(data.user)
    user.value = data.user
    return data
  }

  async function register(payload) {
    const data = await api.picads.register(payload)
    setPicadsToken(data.token)
    setPicadsUser(data.user)
    user.value = data.user
    return data
  }

  function logout() {
    setPicadsToken(null)
    setPicadsUser(null)
    user.value = null
  }

  return { user, isLoggedIn, initialized, restoreSession, login, register, logout }
})