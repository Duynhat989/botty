export const DEFAULT_BOT_AVATAR = '/bot-default-avatar.jpg'

export function resolveBotAvatarUrl(bot) {
  const custom = String(bot?.avatarUrl || '').trim()
  return custom || DEFAULT_BOT_AVATAR
}

export function botHasCustomAvatar(bot) {
  return Boolean(String(bot?.avatarUrl || '').trim())
}