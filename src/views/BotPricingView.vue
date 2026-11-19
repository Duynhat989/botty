<template>
  <div class="b-studio pricing-page">
    <header class="head">
      <p class="b-kicker">Gói cước</p>
      <h1 class="b-title">Chọn cách dùng Gemini</h1>
      <p class="b-lede b-lede--left">
        Tự mang API key (miễn phí nền tảng, không giới hạn Botty) hoặc gói <strong>Botty AI</strong> theo tháng — không cần cài Gemini, hệ thống lo AI.
      </p>
    </header>

    <div class="plans-grid">
      <div class="b-card b-card-pad-lg plan">
        <span class="b-badge">Miễn phí</span>
        <h2 class="b-title-sm">Gemini của bạn</h2>
        <p class="price">0đ <span class="b-micro">/ tháng Botty</span></p>
        <ul class="list">
          <li><strong>1 bot</strong> trên tài khoản</li>
          <li>Không giới hạn hội thoại (theo quota Google)</li>
          <li>Bạn tự tạo key tại Google AI Studio</li>
        </ul>
        <RouterLink :to="auth.isLoggedIn ? '/config?create=1' : '/login'" class="b-btn b-btn--ghost">
          {{ auth.isLoggedIn ? 'Tạo bot + key' : 'Đăng nhập' }}
        </RouterLink>
      </div>

      <div
        v-for="pack in botPlans"
        :key="pack.id"
        class="b-card b-card-pad-lg plan"
        :class="{ featured: pack.highlight }"
      >
        <span v-if="pack.highlight" class="b-badge b-badge--ok">Phổ biến</span>
        <span v-else class="b-badge">Botty AI</span>
        <h2 class="b-title-sm">{{ packMonthlyLabel(pack) }}</h2>
        <p class="price">{{ formatVnd(pack.priceVnd) }} <span class="b-micro">/ tháng</span></p>
        <ul class="list">
          <li>
            <strong>{{ packMonthlyCount(pack).toLocaleString('vi-VN') }}</strong>
            hội thoại bot / tháng (mỗi lượt bot trả lời = 1, reset đầu tháng)
          </li>
          <li>Không cần Gemini API key</li>
          <li><strong>Tạo bot không giới hạn</strong></li>
          <li>Dùng cho mọi bot chế độ «AI Botty»</li>
        </ul>
        <button
          type="button"
          class="b-btn b-btn--primary"
          :disabled="!auth.isLoggedIn"
          @click="openCheckout(pack)"
        >
          {{ auth.isLoggedIn ? 'Mua gói' : 'Đăng nhập để mua' }}
        </button>
      </div>
    </div>

    <div v-if="auth.isLoggedIn && auth.user?.bottyPlan?.active" class="b-card b-card-pad active-plan">
      <h3 class="b-title-sm">Gói đang dùng</h3>
      <p class="b-caption">
        {{ auth.user.bottyPlan.packageName || auth.user.bottyPlan.packageCode }}
        · còn
        <strong>{{ remainingMonth }}</strong>
        / {{ monthlyLimit }} hội thoại còn trong tháng
        · hết hạn {{ formatDate(auth.user.bottyPlan.expiresAt) }}
      </p>
    </div>

    <BotHostingCheckoutModal
      :open="checkoutOpen"
      :pack="checkoutPack"
      @close="checkoutOpen = false"
      @paid="onPaid"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import BotHostingCheckoutModal from '@/components/BotHostingCheckoutModal.vue'

const auth = useAuthStore()
const botPlans = ref([])
const checkoutOpen = ref(false)
const checkoutPack = ref(null)

function formatVnd(n) {
  return `${(Number(n) || 0).toLocaleString('vi-VN')}đ`
}

function packMonthlyCount(pack) {
  return Number(pack.monthlyConversations) || (Number(pack.dailyConversations) || 0) * 30
}

function packMonthlyLabel(pack) {
  const n = packMonthlyCount(pack)
  return `${n.toLocaleString('vi-VN')} hội thoại/tháng`
}

const monthlyLimit = computed(
  () => Number(auth.user?.bottyPlan?.monthlyLimit ?? auth.user?.bottyPlan?.dailyLimit) || 0,
)
const remainingMonth = computed(
  () =>
    Number(auth.user?.bottyPlan?.remainingThisMonth ?? auth.user?.bottyPlan?.remainingToday) || 0,
)

function formatDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false })
  } catch {
    return String(iso)
  }
}

function openCheckout(pack) {
  if (!auth.isLoggedIn) return
  checkoutPack.value = pack
  checkoutOpen.value = true
}

async function onPaid() {
  checkoutOpen.value = false
  try {
    await auth.refreshUser()
  } catch {
    /* ignore */
  }
}

onMounted(async () => {
  try {
    botPlans.value = (await api.packages.list('bot_hosting')) || []
  } catch (e) {
    console.error(e)
    botPlans.value = []
  }
})
</script>

<style scoped>
.head {
  margin-bottom: 28px;
}

.plans-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  align-items: stretch;
}

.plan {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.plan.featured {
  border-color: #bbf7d0;
  box-shadow: 0 8px 28px rgba(5, 150, 105, 0.12);
}

.price {
  margin: 0;
  font-size: clamp(26px, 3.5vw, 34px);
  font-weight: 750;
  letter-spacing: -0.03em;
}

.list {
  margin: 0;
  padding-left: 1.1rem;
  color: var(--b-muted);
  font-size: 14px;
  line-height: 1.55;
  flex: 1;
}

.plan .b-btn {
  margin-top: auto;
  width: 100%;
  justify-content: center;
}

.active-plan {
  margin-top: 20px;
  border-color: #bbf7d0;
  background: var(--b-accent-soft);
}
</style>