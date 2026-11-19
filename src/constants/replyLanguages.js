export const REPLY_LANGUAGE_MODES = [
  {
    value: 'first_user',
    label: 'Theo tin nhắn đầu tiên của khách',
    hint: 'Bot bám ngôn ngữ tin đầu tiên trong phiên (Messenger / thử).',
  },
  {
    value: 'fixed',
    label: 'Cố định theo lựa chọn shop',
    hint: 'Luôn trả lời bằng ngôn ngữ mặc định bên dưới.',
  },
]

export const REPLY_LANGUAGE_OPTIONS = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ja', label: '日本語' },
  { value: 'ko', label: '한국어' },
  { value: 'th', label: 'ภาษาไทย' },
  { value: 'fr', label: 'Français' },
  { value: 'es', label: 'Español' },
]

export const DEFAULT_REPLY_LANGUAGE_MODE = 'first_user'
export const DEFAULT_REPLY_LANGUAGE = 'vi'