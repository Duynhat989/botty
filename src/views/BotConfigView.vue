<template>
  <div class="b-studio config-page">
    <header class="config-hero">
      <div class="head-row">
        <h1 class="hero-title">
          Bot của bạn
          <span v-if="auth.isLoggedIn && !loading" class="hero-count">{{ bots.length }}</span>
        </h1>
        <button
          v-if="auth.isLoggedIn"
          type="button"
          class="b-btn b-btn--primary b-btn--sm"
          :disabled="!canCreateMore"
          :title="canCreateMore ? '' : 'Miễn phí chỉ 1 bot — nâng cấp gói Botty AI'"
          @click="openWizard"
        >
          Tạo bot
        </button>
      </div>
      <p v-if="auth.isLoggedIn && !canCreateMore" class="head-hint">
        <RouterLink to="/pricing">Nâng cấp gói</RouterLink> để tạo thêm bot.
      </p>
    </header>

    <Transition name="config-toast">
      <p
        v-if="toast && auth.isLoggedIn"
        class="config-toast"
        :class="`config-toast--${toast.type}`"
        role="status"
      >
        {{ toast.text }}
      </p>
    </Transition>

    <div v-if="!auth.isLoggedIn" class="panel empty-panel">
      <div class="empty-art" aria-hidden="true" />
      <p class="empty-title">Đăng nhập để quản lý bot</p>
      <p class="b-caption">Sau khi đăng nhập bạn sẽ thấy danh sách và wizard tạo bot từng bước.</p>
      <RouterLink to="/login" class="b-btn b-btn--primary">Đăng nhập</RouterLink>
    </div>

    <template v-else>
      <p v-if="loading" class="load-state">
        <span class="load-dot" />
        Đang tải danh sách…
      </p>

      <div v-else-if="!bots.length" class="panel empty-panel">
        <div class="empty-art" aria-hidden="true" />
        <p class="empty-title">Chưa có bot nào</p>
        <p class="b-caption">Bấm «Tạo bot» để đặt tên và kết nối Facebook trong vài phút.</p>
        <button type="button" class="b-btn b-btn--primary" @click="openWizard">Tạo bot đầu tiên</button>
      </div>

      <ul v-else class="bot-list">
        <li v-for="b in bots" :key="b.id" class="bot-list-item">
          <div
            class="bot-card"
            :class="{
              'bot-card--active': b.status === 'active',
              'bot-card--menu-open': openMenuId === b.id,
            }"
          >
            <div class="bot-card-glow" aria-hidden="true" />
            <div class="bot-card-bar" aria-hidden="true" />

            <header class="bot-card-top">
              <div class="bot-card-power" @click.stop>
                <label class="b-switch bot-card-switch" :class="{ 'is-busy': statusBusyId === b.id }">
                  <input
                    type="checkbox"
                    :checked="b.status === 'active'"
                    :disabled="statusBusyId === b.id"
                    :aria-label="b.status === 'active' ? `Tạm dừng ${b.name}` : `Bật ${b.name}`"
                    @change="onToggleStatus(b, $event)"
                  />
                  <span class="b-switch-track" aria-hidden="true" />
                </label>
                <span
                  class="bot-card-pill"
                  :class="b.status === 'active' ? 'bot-card-pill--on' : 'bot-card-pill--off'"
                >
                  <span class="bot-card-pill-dot" aria-hidden="true" />
                  {{ statusBusyId === b.id ? 'Đang lưu…' : b.status === 'active' ? 'Đang chạy' : 'Tạm dừng' }}
                </span>
              </div>
              <div class="card-menu" @click.stop>
                <button
                  type="button"
                  class="card-menu-trigger"
                  :aria-expanded="openMenuId === b.id"
                  aria-haspopup="menu"
                  :aria-label="`Tùy chọn ${b.name}`"
                  @click.stop="toggleMenu(b.id)"
                >
                  <MoreVertical :size="18" aria-hidden="true" />
                </button>
                <div v-if="openMenuId === b.id" class="card-menu-pop" role="menu">
                <RouterLink
                  role="menuitem"
                  class="card-menu-item"
                  :to="`/bots/${b.id}/test`"
                  @click="closeMenu"
                >
                  Thử bot
                </RouterLink>
                <RouterLink
                  role="menuitem"
                  class="card-menu-item"
                  :to="`/bots/${b.id}/setup`"
                  @click="closeMenu"
                >
                  Thiết lập
                </RouterLink>
                <RouterLink
                  role="menuitem"
                  class="card-menu-item"
                  :to="`/bots/${b.id}/dashboard`"
                  @click="closeMenu"
                >
                  Tổng quan
                </RouterLink>
                <button
                  type="button"
                  role="menuitem"
                  class="card-menu-item"
                  :title="canCreateMore ? '' : 'Đã đạt giới hạn bot'"
                  @click="onMenuDuplicate(b)"
                >
                  Sao chép bot…
                </button>
                </div>
              </div>
            </header>

            <RouterLink :to="`/bots/${b.id}/test`" class="bot-card-link">
              <img
                class="bot-card-avatar"
                :src="resolveBotAvatarUrl(b)"
                :alt="`Ảnh ${b.name}`"
                width="72"
                height="72"
                loading="lazy"
                decoding="async"
              />
              <div class="bot-card-main">
                <div class="bot-card-copy">
                  <h2 class="bot-card-name">{{ b.name }}</h2>
                  <p v-if="botShopLine(b)" class="bot-card-shop">{{ botShopLine(b) }}</p>
                  <p class="bot-card-hint">{{ botHint(b) }}</p>
                  <ul v-if="botChips(b).length" class="bot-card-chips" aria-label="Tính năng">
                    <li v-for="chip in botChips(b)" :key="chip" class="bot-card-chip">{{ chip }}</li>
                  </ul>
                </div>
                <span class="bot-card-cta">
                  Thử bot
                  <ChevronRight :size="16" class="bot-card-cta-icon" aria-hidden="true" />
                </span>
              </div>
            </RouterLink>
          </div>
        </li>
      </ul>
    </template>

    <BotCreateWizardModal v-model:open="wizardOpen" @created="onBotCreated" />
    <BotDuplicateModal
      v-model:open="dupOpen"
      :source-id="dupSource?.id || ''"
      :source-name="dupSource?.name || ''"
      @duplicated="onDuplicated"
      @failed="onDuplicateFailed"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChevronRight, MoreVertical } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import BotCreateWizardModal from '@/components/BotCreateWizardModal.vue'
import BotDuplicateModal from '@/components/BotDuplicateModal.vue'
import { resolveBotAvatarUrl } from '@/utils/botAvatar'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const bots = ref([])
const loading = ref(false)
const wizardOpen = ref(false)
const dupOpen = ref(false)
const dupSource = ref(null)
const quota = ref(null)
const openMenuId = ref(null)
const statusBusyId = ref(null)
const toast = ref(null)
let toastTimer = null

const canCreateMore = computed(() => {
  if (quota.value) return Boolean(quota.value.canCreateMore)
  if (auth.user?.botQuota) return Boolean(auth.user.botQuota.canCreateMore)
  return bots.value.length < 1
})

function botShopLine(b) {
  const shop = String(b.shopName || '').trim()
  if (shop && shop !== b.name) return shop
  return ''
}

async function onToggleStatus(b, ev) {
  const wantActive = Boolean(ev.target.checked)
  const next = wantActive ? 'active' : 'paused'
  const prev = b.status
  if (next === prev) return

  statusBusyId.value = b.id
  b.status = next

  try {
    const data = await api.bots.update(b.id, { status: next })
    if (data?.bot?.status) b.status = data.bot.status
    if (wantActive) {
      if (!b.hasFacebookToken) {
        showToast(`«${b.name}» đang chạy — chưa kết nối Facebook.`, 'warn')
      } else if (!b.hasGeminiKey && !b.usesBottyAi) {
        showToast(`«${b.name}» đang chạy — chưa bật phản hồi tự động.`, 'warn')
      } else {
        showToast(`«${b.name}» đang nhận tin Messenger.`, 'ok')
      }
    } else {
      showToast(`«${b.name}» đã tạm dừng.`, 'ok')
    }
  } catch (e) {
    b.status = prev
    ev.target.checked = prev === 'active'
    console.error(e)
    showToast('Không đổi trạng thái bot được. Thử lại.', 'err')
  } finally {
    statusBusyId.value = null
  }
}

function botHint(b) {
  if (b.status !== 'active') return 'Bật công tắt phía trên khi sẵn sàng nhận tin.'
  if (!b.hasFacebookToken) return 'Chưa kết nối Facebook Page.'
  if (!b.hasGeminiKey && !b.usesBottyAi) return 'Chưa bật phản hồi tự động.'
  return 'Sẵn sàng nhận tin Messenger.'
}

function botChips(b) {
  const chips = []
  if (b.orderClosingEnabled) chips.push('Chốt đơn')
  if (b.usesBottyAi) chips.push('Botty AI')
  else if (b.hasGeminiKey) chips.push('Gemini')
  if (b.hasFacebookToken) chips.push('Messenger')
  return chips
}

function showToast(text, type = 'ok') {
  if (toastTimer) clearTimeout(toastTimer)
  toast.value = { text, type }
  toastTimer = setTimeout(() => {
    toast.value = null
    toastTimer = null
  }, 4200)
}

function closeMenu() {
  openMenuId.value = null
}

function toggleMenu(id) {
  openMenuId.value = openMenuId.value === id ? null : id
}

function onMenuDuplicate(b) {
  closeMenu()
  openDuplicate(b)
}

function onDocClick() {
  closeMenu()
}

function onKeydown(e) {
  if (e.key === 'Escape') closeMenu()
}

async function loadBots() {
  if (!auth.isLoggedIn) return
  loading.value = true
  try {
    const data = await api.bots.list()
    bots.value = data?.bots || []
    quota.value = data?.quota || null
  } catch (e) {
    console.error(e)
    showToast('Không tải được danh sách bot.', 'err')
  } finally {
    loading.value = false
  }
}

async function onBotCreated() {
  await loadBots()
  showToast('Đã tạo bot — bạn có thể hoàn tất thiết lập trong wizard.', 'ok')
}

function openWizard() {
  if (!canCreateMore.value) return
  wizardOpen.value = true
}

function openDuplicate(b) {
  if (!canCreateMore.value) {
    showToast('Đã đạt giới hạn bot — nâng cấp gói để tạo thêm.', 'warn')
    return
  }
  dupSource.value = b
  dupOpen.value = true
}

function onDuplicateFailed(payload) {
  const type = payload?.code === 'BOT_LIMIT_REACHED' ? 'warn' : 'err'
  showToast(payload?.text || 'Không sao chép được bot.', type)
}

async function onDuplicated(payload) {
  await loadBots()
  const bot = payload?.bot
  if (bot?.id) {
    const docs = payload?.documentsCopied
    const docHint = typeof docs === 'number' && docs > 0 ? ` (${docs} tài liệu)` : ''
    showToast(`Đã sao chép «${bot.name}»${docHint}. Bot mới tạm dừng — gắn Facebook trong Thiết lập.`, 'ok')
    router.push(`/bots/${bot.id}/setup`)
  }
}

function clearCreateQuery() {
  if (route.query.create) {
    const q = { ...route.query }
    delete q.create
    router.replace({ path: route.path, query: q })
  }
}

watch(
  () => route.query.create,
  (v) => {
    if (v && auth.isLoggedIn) {
      wizardOpen.value = true
      clearCreateQuery()
    }
  },
  { immediate: true },
)

watch(wizardOpen, (v) => {
  if (!v) clearCreateQuery()
})

onMounted(() => {
  loadBots()
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKeydown)
  if (toastTimer) clearTimeout(toastTimer)
})
</script>

<style scoped>
.config-page {
  max-width: var(--b-max, 1440px);
  padding-bottom: 48px;
}

.config-hero {
  margin-bottom: 1.25rem;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--b-border);
}

.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
}

.hero-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--b-ink);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.hero-count {
  display: inline-grid;
  place-items: center;
  min-width: 1.5rem;
  height: 1.5rem;
  padding: 0 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-accent);
  background: var(--b-accent-soft);
}

.head-hint {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--b-muted);
}

.head-hint a {
  color: var(--b-accent-hover);
  font-weight: 600;
  text-decoration: none;
}

.head-hint a:hover {
  text-decoration: underline;
}

.load-state {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
  padding: 20px 0;
  font-size: 14px;
  color: var(--b-muted);
}

.load-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--b-accent);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.92);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.panel {
  position: relative;
  padding: 36px 28px 32px;
  border-radius: 20px;
  border: 1px dashed color-mix(in srgb, var(--b-border-strong, var(--b-border)) 80%, var(--b-accent));
  background:
    radial-gradient(90% 70% at 50% 0%, color-mix(in srgb, var(--b-accent) 6%, transparent), transparent 60%),
    var(--b-surface-2);
  text-align: center;
  overflow: hidden;
}

.empty-panel {
  display: grid;
  justify-items: center;
  gap: 12px;
  max-width: 480px;
  margin: 0 auto;
}

.empty-art {
  width: 72px;
  height: 72px;
  margin-bottom: 4px;
  border-radius: 22px;
  background:
    linear-gradient(145deg, var(--b-accent-soft), color-mix(in srgb, var(--b-accent) 25%, #fff));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.5),
    0 12px 28px -16px color-mix(in srgb, var(--b-accent) 40%, transparent);
}

.empty-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--b-ink);
}

.bot-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 16px;
}

.bot-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  border-radius: 18px;
  border: 1px solid var(--b-border);
  background: var(--color-surface);
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 8px 24px -20px rgba(15, 23, 42, 0.12);
  overflow: hidden;
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.22s ease;
}

.bot-card--active {
  border-color: color-mix(in srgb, var(--b-accent) 18%, var(--b-border));
}

.bot-card--menu-open {
  z-index: 3;
  box-shadow: 0 16px 40px -24px rgba(15, 23, 42, 0.28);
}

.bot-card-glow {
  pointer-events: none;
  position: absolute;
  top: -40%;
  right: -20%;
  width: 55%;
  height: 70%;
  border-radius: 50%;
  background: radial-gradient(
    closest-side,
    color-mix(in srgb, var(--b-accent) 14%, transparent),
    transparent 70%
  );
  opacity: 0.85;
}

.bot-card:not(.bot-card--active) .bot-card-glow {
  opacity: 0;
}

.bot-card-bar {
  height: 3px;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--b-muted) 55%, transparent),
    color-mix(in srgb, var(--b-muted) 25%, transparent)
  );
}

.bot-card--active .bot-card-bar {
  background: linear-gradient(
    90deg,
    var(--b-accent),
    color-mix(in srgb, var(--b-accent) 45%, #fff)
  );
}

.bot-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px 0 14px;
}

.bot-card-power {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.bot-card-switch {
  flex-shrink: 0;
  margin: 0;
}

.bot-card-switch.is-busy {
  opacity: 0.55;
  pointer-events: none;
}

.bot-card-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.01em;
  border: 1px solid var(--b-border);
  background: var(--b-surface-2);
  color: var(--b-muted);
}

.bot-card-pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--b-muted);
}

.bot-card-pill--on {
  color: var(--b-accent-hover);
  border-color: color-mix(in srgb, var(--b-accent) 22%, var(--b-border));
  background: color-mix(in srgb, var(--b-accent-soft) 55%, var(--color-surface));
}

.bot-card-pill--on .bot-card-pill-dot {
  background: var(--b-accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--b-accent) 22%, transparent);
}

.card-menu {
  position: relative;
  flex-shrink: 0;
  z-index: 2;
}

.card-menu-trigger {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 10px;
  background: color-mix(in srgb, var(--color-surface) 88%, transparent);
  color: var(--b-muted);
  cursor: pointer;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.card-menu-trigger:hover,
.card-menu-trigger[aria-expanded='true'] {
  border-color: var(--b-border);
  background: var(--b-surface-2);
  color: var(--b-ink);
}

.card-menu-pop {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 168px;
  padding: 6px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  background: var(--color-surface);
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
}

.card-menu-item {
  display: block;
  width: 100%;
  padding: 9px 12px;
  border: 0;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  text-align: left;
  text-decoration: none;
  color: var(--b-ink);
  background: transparent;
  cursor: pointer;
}

.card-menu-item:hover:not(:disabled) {
  background: var(--b-accent-soft);
  color: var(--b-accent-hover);
}

.card-menu-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.config-toast {
  position: fixed;
  top: calc(env(safe-area-inset-top, 0px) + 12px);
  left: 50%;
  transform: translateX(-50%);
  z-index: 1400;
  margin: 0;
  max-width: min(92vw, 420px);
  padding: 10px 16px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.4;
  text-align: center;
  border: 1px solid var(--b-border);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.14);
}

.config-toast--ok {
  background: color-mix(in srgb, var(--b-accent-soft) 70%, var(--color-surface));
  color: var(--b-ink);
}

.config-toast--err {
  background: var(--b-danger-soft, #fef2f2);
  color: var(--b-danger, #b91c1c);
  border-color: #fecaca;
}

.config-toast--warn {
  background: #fffbeb;
  color: #92400e;
  border-color: #fde68a;
}

.config-toast-enter-active,
.config-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.config-toast-enter-from,
.config-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-8px);
}

.bot-card-link {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  flex: 1;
  gap: 12px;
  margin-top: 10px;
  padding: 4px 14px 14px;
  text-decoration: none;
  color: inherit;
  border-radius: 0 0 17px 17px;
  transition: background 0.2s ease;
}

.bot-card-link:hover {
  background: color-mix(in srgb, var(--b-accent-soft) 28%, var(--color-surface));
}

.bot-card:has(.bot-card-link:hover),
.bot-card:has(.bot-card-link:focus-visible) {
  border-color: color-mix(in srgb, var(--b-accent) 32%, var(--b-border));
  box-shadow:
    0 4px 12px rgba(15, 23, 42, 0.06),
    0 20px 40px -28px color-mix(in srgb, var(--b-accent) 35%, transparent);
  transform: translateY(-2px);
}

.bot-card-avatar {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 16px;
  object-fit: cover;
  background: var(--b-surface-2);
  border: 1px solid color-mix(in srgb, var(--b-accent) 12%, var(--b-border));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.35),
    0 10px 20px -14px color-mix(in srgb, var(--b-accent) 35%, transparent);
}

.bot-card-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  gap: 8px;
}

.bot-card-copy {
  min-width: 0;
  flex: 1;
}

.bot-card-name {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.25;
  color: var(--b-ink);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bot-card-shop {
  margin: 4px 0 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--b-ink-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bot-card-hint {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--b-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.bot-card-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 10px 0 0;
  padding: 0;
  list-style: none;
}

.bot-card-chip {
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--b-ink-secondary);
  background: var(--b-surface-2);
  border: 1px solid var(--b-border);
}

.bot-card-cta {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid color-mix(in srgb, var(--b-border) 85%, transparent);
  font-size: 13px;
  font-weight: 600;
  color: var(--b-accent-hover);
}

.bot-card-cta-icon {
  flex-shrink: 0;
  opacity: 0.75;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.bot-card-link:hover .bot-card-cta-icon {
  opacity: 1;
  transform: translateX(3px);
}

@media (min-width: 768px) {
  .bot-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 18px;
  }
}

@media (min-width: 1100px) {
  .bot-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
}

@media (max-width: 520px) {
  .head-row {
    flex-wrap: wrap;
  }

  .head-row .b-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>