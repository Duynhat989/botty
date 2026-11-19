import { t, te } from '@/i18n'
import { ApiError } from '@/api/client'

/**
 * Đổi lỗi API (messageCode) sang chuỗi đúng ngôn ngữ user.
 * @param {unknown} err
 * @param {string} [fallbackKey] — i18n key khi không có messageCode
 */
export function apiMessage(err, fallbackKey = 'api.messages.SERVER_ERROR') {
  const code = err instanceof ApiError
    ? (err.messageCode || err.code)
    : (err?.messageCode || err?.code)
  const params = err instanceof ApiError
    ? { ...err.messageParams }
    : { ...(err?.messageParams || {}) }

  if (params.detail != null && params.detail !== '') {
    params.detail = String(params.detail).startsWith(':')
      ? String(params.detail)
      : `: ${params.detail}`
  } else {
    params.detail = ''
  }

  if (code) {
    const key = `api.messages.${code}`
    if (te(key)) return t(key, params)
  }
  if (te(fallbackKey)) return t(fallbackKey, params)
  return code || t('api.messages.SERVER_ERROR')
}
