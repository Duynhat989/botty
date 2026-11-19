/** @typedef {{ id: string, label: string, hint: string, sample: string }} ChatStyleOption */

/** @type {ChatStyleOption[]} */
export const CHAT_STYLES = [
  {
    id: 'natural',
    label: 'Tự nhiên',
    hint: 'Inbox thường ngày',
    sample: 'Dạ shop còn size M màu be ạ, bạn muốn chốt không?',
  },
  {
    id: 'warm',
    label: 'Gần gũi',
    hint: 'Dạ/ạ, quan tâm',
    sample: 'Dạ còn bạn nha 🙏 bạn để lại size giúp shop nha?',
  },
  {
    id: 'pro',
    label: 'Chuyên nghiệp',
    hint: 'Anh/chị, ít emoji',
    sample: 'Shop còn size M. Anh/chị cho em xin địa chỉ giao ạ.',
  },
  {
    id: 'youth',
    label: 'Trẻ trung',
    hint: 'Năng động, emoji nhẹ',
    sample: 'Còn nè bạn ơi 😊 bạn lấy mấy chiếc?',
  },
  {
    id: 'luxury',
    label: 'Tinh tế',
    hint: 'Cao cấp, không emoji',
    sample: 'Mẫu này shop còn size M. Anh/chị cần em gửi ảnh chi tiết không ạ?',
  },
  {
    id: 'concise',
    label: 'Siêu ngắn',
    hint: 'Thẳng ý, 1–2 câu',
    sample: 'Còn M. Giá 289k. Ship Q1 25k.',
  },
]

export const DEFAULT_CHAT_STYLE = 'natural'