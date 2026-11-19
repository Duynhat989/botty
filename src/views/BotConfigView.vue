<template>
  <div class="b-studio config-page">
    <header class="head">
      <div class="head-row">
        <div>
          <p class="b-kicker">Quản lý</p>
          <h1 class="b-section-title">Danh sách bot</h1>
          <p class="b-caption head-desc">
            Mỗi bot có mã UUID riêng. Chọn một bot để chỉnh webhook, Gemini, tài liệu và kho hàng.
            <template v-if="!canCreateMore">
              · Miễn phí: tối đa <strong>1 bot</strong> — <RouterLink to="/pricing">mua gói</RouterLink> để tạo không giới hạn.
            </template>
          </p>
        </div>
        <button
          v-if="auth.isLoggedIn"
          type="button"
          class="b-btn b-btn--primary"
          :disabled="!canCreateMore"
          :title="canCreateMore ? '' : 'Miễn phí chỉ 1 bot — nâng cấp gói Botty AI'"
          @click="openWizard"
        >
          Tạo bot
        </button>
      </div>
    </header>

    <div v-if="!auth.isLoggedIn" class="b-card b-card-pad empty">
      <p class="b-caption">Đăng nhập để quản lý bot.</p>
      <RouterLink to="/login" class="b-btn b-btn--primary">Đăng nhập</RouterLink>
    </div>

    <template v-else>
      <p v-if="loading" class="b-caption">Đang tải…</p>

      <div v-else-if="!bots.length" class="b-card b-card-pad empty">
        <p class="b-caption">Chưa có bot. Bấm «Tạo bot» để bắt đầu wizard thiết lập.</p>
        <button type="button" class="b-btn b-btn--primary" @click="openWizard">Tạo bot</button>
      </div>

      <div v-else class="b-card list-card">
        <RouterLink
          v-for="b in bots"
          :key="b.id"
          :to="`/bots/${b.id}/test`"
          class="b-row b-row-click"
        >
          <div class="row-main">
            <span class="name">{{ b.name }}</span>
            <span class="badges">
              <span class="b-badge" :class="b.status === 'active' ? 'b-badge--ok' : 'b-badge--off'">
                {{ b.status === 'active' ? 'Đang chạy' : 'Tạm dừng' }}
              </span>
              <span class="b-badge" :class="b.hasGeminiKey ? 'b-badge--ok' : 'b-badge--err'">
                {{ b.hasGeminiKey ? 'Gemini' : 'Thiếu key' }}
              </span>
              <span v-if="b.orderClosingEnabled" class="b-badge b-badge--ok">Chốt đơn</span>
            </span>
            <span class="code">{{ b.id }}</span>
          </div>
          <ChevronRight :size="18" class="chev" aria-hidden="true" />
        </RouterLink>
      </div>
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
  max-width: var(--b-layout);
}

.head {
  margin-bottom: 24px;
}

.head-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.head-desc {
  margin-top: 8px;
  max-width: 52ch;
}

.empty {
  display: grid;
  gap: 16px;
}

.list-card {
  overflow: hidden;
  padding: 0;
}

.row-main {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.name {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--b-ink);
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.code {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: var(--b-muted);
  overflow: hidden;
  text-overflow: ellipsis;
}

.chev {
  flex-shrink: 0;
  color: #94a3b8;
}
</style>