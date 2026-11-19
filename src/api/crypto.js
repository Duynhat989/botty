import CryptoJS from 'crypto-js'

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY

export function isEncryptionEnabled() {
  const flag = String(import.meta.env.VITE_IS_ENCRYPTION_ENABLED ?? '').toLowerCase()
  return flag === '1' || flag === 'true' || flag === 'yes'
}

export function encryptPayload(data) {
  const jsonString = JSON.stringify(data ?? null)
  return CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString()
}

export function decryptPayload(encrypted) {
  if (!encrypted) return encrypted
  const bytes = CryptoJS.AES.decrypt(String(encrypted), ENCRYPTION_KEY)
  const text = bytes.toString(CryptoJS.enc.Utf8)
  if (!text) throw new Error('DECRYPT_FAILED')
  return JSON.parse(text)
}
