import { decryptPayload, encryptPayload, isEncryptionEnabled } from './crypto'

const TOKEN_KEY = 'dynageo-token'
const LEGACY_TOKEN_KEY = 'clipstory-token'

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:2053/api').replace(/\/$/, '')
}

export function getToken() {
  let token = localStorage.getItem(TOKEN_KEY)
  if (!token) {
    token = localStorage.getItem(LEGACY_TOKEN_KEY)
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.removeItem(LEGACY_TOKEN_KEY)
    }
  }
  return token
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(LEGACY_TOKEN_KEY)
  }
}

export class ApiError extends Error {
  constructor(code, status, messageCode, messageParams) {
    const resolvedCode = messageCode || code || 'SERVER_ERROR'
    super(resolvedCode)
    this.code = code || 'SERVER_ERROR'
    this.status = status
    this.messageCode = resolvedCode
    this.messageParams = messageParams && typeof messageParams === 'object' ? messageParams : {}
  }
}

function parsePayload(raw, response) {
  if (!raw || typeof raw !== 'object') return raw
  const encrypted = response.headers.get('x-encrypted') === 'true' || Boolean(raw.r)
  if (encrypted && raw.r) {
    try {
      return decryptPayload(raw.r)
    } catch {
      throw new ApiError('INVALID_ENCRYPTED_DATA', response.status || 400)
    }
  }
  return raw
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, auth = false } = options
  const headers = { Accept: 'application/json' }
  const useCrypto = isEncryptionEnabled()

  if (useCrypto) headers['X-Encrypted'] = 'true'
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth === true || auth === 'optional') {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let requestBody
  if (body !== undefined) {
    requestBody = useCrypto
      ? JSON.stringify({ e: encryptPayload(body) })
      : JSON.stringify(body)
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: requestBody,
  })

  let raw = null
  try {
    raw = await response.json()
  } catch {
    raw = null
  }

  let payload = null
  try {
    payload = parsePayload(raw, response)
  } catch (err) {
    if (err instanceof ApiError) throw err
    throw new ApiError('INVALID_ENCRYPTED_DATA', response.status || 400)
  }

  if (!response.ok || payload?.success === false) {
    const err = new ApiError(
      payload?.code || 'SERVER_ERROR',
      response.status,
      payload?.messageCode || payload?.code,
      payload?.messageParams,
    )
    if (payload?.message) err.message = payload.message
    throw err
  }

  return payload?.data
}

export async function apiUpload(path, formData, { auth = false } = {}) {
  const headers = { Accept: 'application/json' }
  // FormData không mã hóa body — response vẫn nhận plain (không gửi X-Encrypted)
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  let payload = null
  try {
    payload = await response.json()
  } catch {
    payload = null
  }

  if (!response.ok || payload?.success === false) {
    const err = new ApiError(
      payload?.code || 'SERVER_ERROR',
      response.status,
      payload?.messageCode || payload?.code,
      payload?.messageParams,
    )
    if (payload?.message) err.message = payload.message
    throw err
  }

  return payload?.data
}
