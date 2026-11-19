const PAYMENT_QR_MARKER = '|||BOTTY_PAYMENT_QR|||'

export function parseBotChatContent(raw) {
  const text = String(raw || '')
  const idx = text.indexOf(PAYMENT_QR_MARKER)
  if (idx === -1) {
    return {
      text: text.replace(/https:\/\/payment\.pay2s\.vn\S+/gi, '').trim(),
      qrImageUrl: null,
    }
  }
  const visible = text
    .slice(0, idx)
    .replace(/https:\/\/payment\.pay2s\.vn\S+/gi, '')
    .trim()
  const qrImageUrl = text.slice(idx + PAYMENT_QR_MARKER.length).trim().split(/\s/)[0] || null
  return { text: visible, qrImageUrl }
}