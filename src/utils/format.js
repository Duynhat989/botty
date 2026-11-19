import { getLocale, t } from '@/i18n'

export function formatVnd(value) {
  const locale = getLocale() === 'en' ? 'en-US' : 'vi-VN'
  return `${new Intl.NumberFormat(locale).format(value || 0)}₫`
}

export function formatWhen(value) {
  if (!value) return t('common.dash')
  const locale = getLocale() === 'en' ? 'en-US' : 'vi-VN'
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value))
}

function labelProxy(prefix) {
  return new Proxy(
    {},
    {
      get(_, prop) {
        if (typeof prop !== 'string' || prop === 'then') return undefined
        return t(`${prefix}.${prop}`)
      },
    },
  )
}

export const SOURCE_LABEL = labelProxy('source')
export const STATUS_LABEL = labelProxy('status')
export const PHASE_LABEL = labelProxy('phase')

export const PHASES = ['queued', 'rendering', 'uploading', 'done']
