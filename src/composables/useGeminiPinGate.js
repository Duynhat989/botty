import { reactive } from 'vue'

export const geminiPinGateState = reactive({
  open: false,
  mode: 'unlock',
  forced: false,
  _resolve: null,
  _reject: null,
})

export function requestGeminiUnlockPin() {
  return new Promise((resolve, reject) => {
    geminiPinGateState.open = true
    geminiPinGateState.mode = 'unlock'
    geminiPinGateState.forced = false
    geminiPinGateState._resolve = resolve
    geminiPinGateState._reject = reject
  })
}

export function openGeminiPinSetup(forced = true) {
  geminiPinGateState.open = true
  geminiPinGateState.mode = 'setup'
  geminiPinGateState.forced = forced
  geminiPinGateState._resolve = null
  geminiPinGateState._reject = null
}

export function completeGeminiPinGate(pin) {
  const resolve = geminiPinGateState._resolve
  geminiPinGateState.open = false
  geminiPinGateState._resolve = null
  geminiPinGateState._reject = null
  if (typeof resolve === 'function') resolve(pin)
}

export function dismissGeminiPinGate() {
  if (geminiPinGateState.forced && geminiPinGateState.mode === 'setup') return
  const reject = geminiPinGateState._reject
  geminiPinGateState.open = false
  geminiPinGateState._resolve = null
  geminiPinGateState._reject = null
  if (typeof reject === 'function') reject(new Error('GEMINI_PIN_CANCELLED'))
}