import { hasLocalGeminiPin, loadLocalGeminiPin } from '@/utils/geminiPinLocal'
import { requestGeminiUnlockPin } from '@/composables/useGeminiPinGate'

/** PIN trên máy hoặc mở popup xác minh — không hiện ô nhập inline. */
export async function ensureGeminiPinForUser(userId) {
  if (hasLocalGeminiPin(userId)) return loadLocalGeminiPin(userId)
  return requestGeminiUnlockPin()
}