const PBKDF2_ITERATIONS = 120_000

export function isValidGeminiPin(pin) {
  return /^\d{6}$/.test(String(pin || ''))
}

function b64(buf) {
  const bytes = buf instanceof ArrayBuffer ? new Uint8Array(buf) : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

async function deriveAesKeyFromPin(pin, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(String(pin)), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/**
 * RSA cặp khóa + API key mã hóa public; private mã hóa bằng PIN 6 số (đồng bộ với server).
 */
export async function buildGeminiKeyBundle(apiKey, pin) {
  const key = String(apiKey || '').trim()
  if (!key) throw new Error('GEMINI_KEY_EMPTY')
  if (!isValidGeminiPin(pin)) throw new Error('GEMINI_PIN_INVALID')

  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt'],
  )

  const apiKeyEnc = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    keyPair.publicKey,
    new TextEncoder().encode(key),
  )

  const publicKeySpki = await crypto.subtle.exportKey('spki', keyPair.publicKey)
  const privateKeyPkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey)

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const privateIv = crypto.getRandomValues(new Uint8Array(12))
  const aesKey = await deriveAesKeyFromPin(pin, salt)

  const privateCipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: privateIv }, aesKey, privateKeyPkcs8)

  return {
    v: 1,
    publicKeySpki: b64(publicKeySpki),
    privateKeyEnc: b64(privateCipher),
    apiKeyEnc: b64(apiKeyEnc),
    salt: b64(salt),
    privateIv: b64(privateIv),
  }
}

/** Gắn bundle + PIN vào body PATCH bot (không gửi plain key). */
export async function attachEncryptedGeminiKey(body, apiKey, pin) {
  const key = String(apiKey || '').trim()
  if (!key) return
  if (!isValidGeminiPin(pin)) {
    const e = new Error('GEMINI_PIN_INVALID')
    throw e
  }
  body.geminiKeyBundle = await buildGeminiKeyBundle(key, pin)
  body.geminiKeyPin = pin
}