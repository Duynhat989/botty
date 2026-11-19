import { reactive, readonly } from 'vue'

const state = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: '',
  cancelLabel: '',
  danger: true,
  /** Chỉ nút OK — thay cho `alert()` trình duyệt */
  alertOnly: false,
})

let resolver = null

function settle(value) {
  state.open = false
  state.alertOnly = false
  const resolve = resolver
  resolver = null
  resolve?.(value)
}

/**
 * @param {string | { message?: string, title?: string, confirmLabel?: string, cancelLabel?: string, danger?: boolean }} options
 * @returns {Promise<boolean>}
 */
function confirm(options) {
  const opts = typeof options === 'string' ? { message: options } : options || {}
  if (resolver) settle(false)

  state.open = true
  state.title = opts.title || ''
  state.message = opts.message || ''
  state.confirmLabel = opts.confirmLabel || ''
  state.cancelLabel = opts.cancelLabel || ''
  state.danger = opts.danger !== false
  state.alertOnly = Boolean(opts.alertOnly)

  return new Promise((resolve) => {
    resolver = resolve
  })
}

/**
 * Popup một nút OK — thay `window.alert`.
 * @returns {Promise<void>}
 */
function alert(options) {
  const opts = typeof options === 'string' ? { message: options } : options || {}
  return confirm({
    ...opts,
    alertOnly: true,
    danger: false,
    confirmLabel: opts.confirmLabel || 'Đã hiểu',
  }).then(() => {})
}

export function useConfirm() {
  return {
    state: readonly(state),
    confirm,
    alert,
    accept: () => settle(true),
    dismiss: () => settle(false),
  }
}

export { confirm, alert }
