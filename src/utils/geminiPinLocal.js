import { isValidGeminiPin } from '@/utils/geminiKeyCrypto'

const STORAGE_PREFIX = 'botty-local-gemini-pin:'

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`
}

/** PIN đã nhập trước đó trên trình duyệt này (không đồng bộ máy khác). */
export function loadLocalGeminiPin(userId) {
  if (!userId) return ''
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return isValidGeminiPin(raw) ? String(raw) : ''
  } catch {
    return ''
  }
}

export function saveLocalGeminiPin(userId, pin) {
  if (!userId || !isValidGeminiPin(pin)) return
  try {
    localStorage.setItem(storageKey(userId), String(pin))
  } catch {
    /* quota / private mode */
  }
}

export function clearLocalGeminiPin(userId) {
  if (!userId) return
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    /* ignore */
  }
}

/** Ưu tiên PIN vừa nhập; không thì lấy từ local. */
export function resolveGeminiPinForUser(userId, typedPin) {
  if (isValidGeminiPin(typedPin)) return String(typedPin)
  return loadLocalGeminiPin(userId)
}

export function hasLocalGeminiPin(userId) {
  return Boolean(loadLocalGeminiPin(userId))
}