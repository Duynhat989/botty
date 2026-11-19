import { resolveBankCode, defaultBankNameForCode } from '@/constants/vietnamBanks'

export const DEFAULT_ORDER_CLOSING_PAYMENT = {
  paymentEnabled: false,
  collectInstallerName: false,
  bankName: 'VietinBank',
  bankCode: 'ICB',
  accountNumber: '',
  accountHolder: '',
  qrTemplate:
    'https://payment.pay2s.vn/quicklink/{bankCode}/{accountNumber}/{accountHolder}?amount={amount}&memo={memo}&is_mask=0&payqr=1',
  memoPrefix: 'BOTTY',
}

function migratePay2sQrTemplate(tpl) {
  const s = String(tpl || '').trim()
  if (!/payment\.pay2s\.vn\/quicklink/i.test(s)) return s
  return s
    .replace(/\/\{phone\}\//gi, '/{accountNumber}/')
    .replace(/\/\{phone\}\?/gi, '/{accountNumber}?')
}

export function cloneOrderClosingPayment(src) {
  const merged = { ...DEFAULT_ORDER_CLOSING_PAYMENT, ...(src && typeof src === 'object' ? src : {}) }
  const rawCode = String(merged.bankCode || '').trim().toUpperCase()
  merged.bankCode = rawCode || DEFAULT_ORDER_CLOSING_PAYMENT.bankCode
  if (!merged.bankName) merged.bankName = defaultBankNameForCode(merged.bankCode)
  merged.qrTemplate = migratePay2sQrTemplate(merged.qrTemplate || DEFAULT_ORDER_CLOSING_PAYMENT.qrTemplate)
  return merged
}