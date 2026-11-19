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
        <li v-for="b in bots" :key="b.id">
          <RouterLink :to="`/bots/${b.id}/test`" class="bot-tile">
            <div class="tile-leading">
              <span class="tile-avatar" aria-hidden="true">{{ botInitial(b.name) }}</span>
              <span
                class="status-dot"
                :class="b.status === 'active' ? 'status-dot--on' : 'status-dot--off'"
                :title="b.status === 'active' ? 'Đang chạy' : 'Tạm dừng'"
              />
            </div>
            <div class="tile-main">
              <div class="tile-head">
                <h2 class="tile-name">{{ b.name }}</h2>
                <span v-if="b.orderClosingEnabled" class="tile-tag">Chốt đơn</span>
              </div>
              <p class="tile-sub">{{ tileSubtitle(b) }}</p>
            </div>
            <ChevronRight :size="18" class="tile-chev" aria-hidden="true" />
          </RouterLink>
        </li>
      </ul>
    </template>

    <BotCreateWizardModal v-model:open="wizardOpen" @created="loadBots" />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ChevronRight } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import BotCreateWizardModal from '@/components/BotCreateWizardModal.vue'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const bots = ref([])
const loading = ref(false)
const wizardOpen = ref(false)
const quota = ref(null)

const canCreateMore = computed(() => {
  if (quota.value) return Boolean(quota.value.canCreateMore)
  if (auth.user?.botQuota) return Boolean(auth.user.botQuota.canCreateMore)
  return bots.value.length < 1
})

function botInitial(name) {
  return String(name || '?').trim().slice(0, 1).toUpperCase()
}

function tileSubtitle(b) {
  const shop = String(b.shopName || '').trim()
  if (shop && shop !== b.name) return shop
  if (b.status !== 'active') return 'Đang tạm dừng'
  if (!b.hasFacebookToken) return 'Chưa kết nối Facebook'
  if (!b.hasGeminiKey && !b.usesBottyAi) return 'Chưa bật phản hồi tự động'
  return 'Messenger'
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
  } finally {
    loading.value = false
  }
}

function openWizard() {
  if (!canCreateMore.value) return
  wizardOpen.value = true
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

onMounted(loadBots)
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
  gap: 14px;
}

@media (min-width: 768px) {
  .bot-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
  }
}

@media (min-width: 1100px) {
  .bot-list {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.bot-tile {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 100%;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: var(--color-surface);
  text-decoration: none;
  color: inherit;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background 0.18s ease;
}

.bot-tile:hover {
  border-color: color-mix(in srgb, var(--b-accent) 28%, var(--b-border));
  background: color-mix(in srgb, var(--b-accent-soft) 35%, var(--color-surface));
  box-shadow: 0 6px 18px -12px rgba(15, 23, 42, 0.18);
}

.tile-leading {
  position: relative;
  flex-shrink: 0;
}

.tile-avatar {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--b-ink-secondary);
  background: var(--b-surface-2);
  border: 1px solid var(--b-border);
}

.status-dot {
  position: absolute;
  right: -2px;
  bottom: -2px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--color-surface);
  box-sizing: border-box;
}

.status-dot--on {
  background: var(--b-accent);
}

.status-dot--off {
  background: var(--b-muted);
}

.bot-tile:hover .status-dot--on {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--b-accent) 25%, transparent);
}

.tile-main {
  min-width: 0;
  flex: 1;
}

.tile-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.tile-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--b-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--b-accent-hover);
  background: color-mix(in srgb, var(--b-accent-soft) 80%, var(--color-surface));
  border: 1px solid color-mix(in srgb, var(--b-accent) 12%, var(--b-border));
}

.tile-sub {
  margin: 3px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--b-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tile-chev {
  flex-shrink: 0;
  color: var(--b-border-strong, var(--b-muted));
  opacity: 0.6;
  transition:
    color 0.18s ease,
    transform 0.18s ease,
    opacity 0.18s ease;
}

.bot-tile:hover .tile-chev {
  color: var(--b-muted);
  opacity: 1;
  transform: translateX(2px);
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