<template>
  <div class="pricing-shell">
    <div class="pricing-bg" aria-hidden="true">
      <span class="orb orb-a" />
      <span class="orb orb-b" />
    </div>

    <div class="b-studio pricing-page">
      <header class="head reveal">
        <p class="b-kicker">{{ page.kicker }}</p>
        <h1 class="b-title pricing-title">{{ page.title }}</h1>
        <p class="b-lede b-lede--left pricing-lede">{{ page.lede }}</p>
      </header>

      <div class="plans-bleed">
        <div class="plans-wrap">
        <div class="slider-row">
          <button
            v-if="slideCount > 1"
            type="button"
            class="slider-btn slider-btn--side"
            :disabled="activeSlide <= 0"
            aria-label="Gói trước"
            @click="scrollToSlide(activeSlide - 1)"
          >
            ‹
          </button>

          <div
            ref="viewportRef"
          class="slider-viewport"
          @scroll.passive="onSliderScroll"
          >
          <div ref="trackRef" class="plans-track">
          <article class="plan-card plan-card--free" :class="{ 'plan-card--active': activeSlide === 0 }">
            <div class="plan-inner">
              <span class="plan-badge">{{ free.badge }}</span>
              <h2 class="plan-name">{{ free.title }}</h2>
              <p class="plan-price">
                {{ free.priceLabel || '0đ' }}
                <span v-if="free.priceSuffix" class="plan-price-sub">{{ free.priceSuffix }}</span>
              </p>
              <ul class="plan-features">
                <li v-for="(line, i) in freeBullets" :key="'f-' + i">{{ line }}</li>
              </ul>
              <RouterLink
                :to="auth.isLoggedIn ? '/config?create=1' : '/login'"
                class="b-btn b-btn--ghost plan-cta"
              >
                {{ auth.isLoggedIn ? 'Tạo bot' : 'Đăng nhập' }}
              </RouterLink>
            </div>
          </article>

          <article
            v-for="(pack, idx) in botPlans"
            :key="pack.id"
            class="plan-card"
            :class="{
              'plan-card--featured': pack.highlight,
              'plan-card--active': activeSlide === idx + 1,
              'reveal-stagger': true,
            }"
            :style="{ '--stagger': idx }"
          >
            <div v-if="pack.highlight" class="featured-glow" aria-hidden="true" />
            <div class="plan-inner">
              <span class="plan-badge" :class="{ 'plan-badge--hot': pack.highlight }">
                {{ pack.badgeLabel || (pack.highlight ? 'Phổ biến' : 'Botty AI') }}
              </span>
              <h2 class="plan-name">{{ pack.name }}</h2>
              <p class="plan-price">
                {{ formatVnd(pack.priceVnd) }}
                <span class="plan-price-sub">/ tháng</span>
              </p>
              <p v-if="pack.description" class="plan-desc">{{ pack.description }}</p>
              <ul class="plan-features">
                <li v-for="(line, i) in planBullets(pack)" :key="pack.id + '-' + i">{{ line }}</li>
              </ul>
              <div class="plan-limits">
                <span v-if="packMonthlyCount(pack)">
                  {{ packMonthlyCount(pack).toLocaleString('vi-VN') }} hội thoại/tháng
                </span>
                <span v-if="pack.maxBots"> · tối đa {{ pack.maxBots }} bot</span>
                <span v-else-if="pack.kind === 'bot_hosting'"> · bot không giới hạn</span>
              </div>
              <button
                type="button"
                class="b-btn plan-cta"
                :class="pack.highlight ? 'b-btn--primary btn-glow' : 'b-btn--primary'"
                :disabled="!auth.isLoggedIn"
                @click="openCheckout(pack)"
              >
                {{ auth.isLoggedIn ? 'Mua gói' : 'Đăng nhập để mua' }}
              </button>
            </div>
          </article>
          </div>
          </div>

          <button
            v-if="slideCount > 1"
            type="button"
            class="slider-btn slider-btn--side"
            :disabled="activeSlide >= slideCount - 1"
            aria-label="Gói sau"
            @click="scrollToSlide(activeSlide + 1)"
          >
            ›
          </button>
        </div>

        <div v-if="slideCount > 1" class="slider-dots" role="tablist" aria-label="Chọn gói">
          <button
            v-for="i in slideCount"
            :key="i"
            type="button"
            class="dot"
            :class="{ on: activeSlide === i - 1 }"
            :aria-label="`Gói ${i}`"
            :aria-selected="activeSlide === i - 1"
            @click="scrollToSlide(i - 1)"
          />
        </div>
        </div>
      </div>

      <div
        v-if="auth.isLoggedIn && auth.user?.bottyPlan?.active"
        class="b-card b-card-pad active-plan reveal"
      >
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
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'
import BotHostingCheckoutModal from '@/components/BotHostingCheckoutModal.vue'

const auth = useAuthStore()
const botPlans = ref([])
const page = ref({ kicker: 'Gói cước', title: '', lede: '' })
const free = ref({
  badge: 'Miễn phí',
  title: 'Bắt đầu miễn phí',
  priceLabel: '0đ',
  priceSuffix: '/ tháng Botty',
  maxBots: 1,
  bullets: [],
})
const checkoutOpen = ref(false)
const checkoutPack = ref(null)

const viewportRef = ref(null)
const trackRef = ref(null)
const activeSlide = ref(0)
const canScrollLeft = ref(false)
const canScrollRight = ref(true)

const slideCount = computed(() => 1 + botPlans.value.length)

function getPlanCards() {
  const track = trackRef.value
  if (!track) return []
  return [...track.querySelectorAll('.plan-card')]
}

function updateScrollHints() {
  const vp = viewportRef.value
  if (!vp) return
  const sl = vp.scrollLeft
  const max = vp.scrollWidth - vp.clientWidth - 2
  canScrollLeft.value = sl > 4
  canScrollRight.value = sl < max
}

function pickActiveSlide() {
  const vp = viewportRef.value
  const cards = getPlanCards()
  if (!vp || !cards.length) return 0
  const vpRect = vp.getBoundingClientRect()
  const anchor = vpRect.left + 12
  let idx = 0
  let best = Infinity
  cards.forEach((card, i) => {
    const left = card.getBoundingClientRect().left
    const dist = Math.abs(left - anchor)
    if (dist < best) {
      best = dist
      idx = i
    }
  })
  return idx
}

function onSliderScroll() {
  activeSlide.value = pickActiveSlide()
  updateScrollHints()
}

function scrollToSlide(index) {
  const vp = viewportRef.value
  const cards = getPlanCards()
  if (!vp || !cards.length) return
  const i = Math.max(0, Math.min(index, cards.length - 1))
  const card = cards[i]
  const vpRect = vp.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  const delta = cardRect.left - vpRect.left
  vp.scrollTo({ left: vp.scrollLeft + delta, behavior: 'smooth' })
  activeSlide.value = i
}

watch(botPlans, () => {
  nextTick(() => {
    onSliderScroll()
  })
})

let resizeObs

const freeBullets = computed(() => {
  const lines = Array.isArray(free.value.bullets) ? [...free.value.bullets] : []
  if (!lines.length) {
    const n = Number(free.value.maxBots) || 1
    return [`${n} bot trên tài khoản`, 'Trả lời tin nhắn tự động', 'Dễ bắt đầu trong vài phút']
  }
  return lines.map((line) =>
    String(line).replace(/\{maxBots\}/g, String(Number(free.value.maxBots) || 1)),
  )
})

function formatVnd(n) {
  return `${(Number(n) || 0).toLocaleString('vi-VN')}đ`
}

function packMonthlyCount(pack) {
  return Number(pack.monthlyConversations) || (Number(pack.dailyConversations) || 0) * 30
}

function planBullets(pack) {
  if (pack.bullets?.length) return pack.bullets
  const n = packMonthlyCount(pack)
  const items = []
  if (n) {
    items.push(`${n.toLocaleString('vi-VN')} hội thoại / tháng`)
  }
  items.push('Không cần cài đặt phức tạp')
  if (pack.maxBots) {
    items.push(`Tối đa ${pack.maxBots} bot`)
  } else {
    items.push('Tạo nhiều bot')
  }
  return items
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
    const data = await api.packages.pricing()
    if (data?.page) page.value = { ...page.value, ...data.page }
    if (data?.free) free.value = { ...free.value, ...data.free }
    botPlans.value = data?.plans || []
  } catch (e) {
    console.error(e)
    try {
      botPlans.value = (await api.packages.list('bot_hosting')) || []
    } catch {
      botPlans.value = []
    }
  }
  await nextTick()
  onSliderScroll()
  if (viewportRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObs = new ResizeObserver(() => onSliderScroll())
    resizeObs.observe(viewportRef.value)
  }
  viewportRef.value?.addEventListener('scrollend', onSliderScroll, { passive: true })
})

onUnmounted(() => {
  resizeObs?.disconnect?.()
  viewportRef.value?.removeEventListener('scrollend', onSliderScroll)
})

</script>

<style scoped>
.pricing-shell {
  position: relative;
  overflow: visible;
}

.pricing-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  opacity: 0.55;
  animation: float-orb 18s ease-in-out infinite alternate;
}

.orb-a {
  width: min(420px, 70vw);
  height: min(420px, 70vw);
  top: -12%;
  right: -8%;
  background: radial-gradient(circle, rgba(245, 197, 24, 0.35), transparent 70%);
}

.orb-b {
  width: min(360px, 60vw);
  height: min(360px, 60vw);
  bottom: 5%;
  left: -12%;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.22), transparent 70%);
  animation-delay: -6s;
}

.pricing-page {
  position: relative;
  z-index: 1;
  padding-bottom: 48px;
}

.head {
  margin-bottom: 36px;
  max-width: 680px;
}

.pricing-title {
  font-size: clamp(2rem, 4.5vw, 2.75rem);
  line-height: 1.05;
}

.pricing-lede {
  font-size: 1.05rem;
  color: var(--b-muted);
}

.plans-bleed {
  width: 100vw;
  max-width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-right: calc(50% - 50vw);
  margin-top: 8px;
  overflow: visible;
  animation: reveal-fade 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
}

.plans-wrap {
  width: 100%;
}

.slider-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: stretch;
  gap: 10px;
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding-inline: clamp(10px, 2vw, 20px);
  box-sizing: border-box;
}

.slider-btn {
  width: 44px;
  min-height: 44px;
  align-self: center;
  flex-shrink: 0;
  border-radius: 12px;
  border: 1px solid var(--line, #e5e7eb);
  background: #fff;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #0f172a;
  position: relative;
  z-index: 5;
}

.slider-btn--side {
  z-index: 5;
}

.slider-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  box-shadow: none;
}

.slider-row .slider-viewport {
  flex: 1;
  min-width: 0;
}

.slider-viewport {
  overflow-x: auto;
  overflow-y: visible;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  padding: 8px 4px 16px;
  position: relative;
  z-index: 1;
}

.slider-viewport::-webkit-scrollbar {
  display: none;
}

.plans-track {
  display: flex;
  align-items: stretch;
  gap: 16px;
  width: max-content;
  min-height: 100%;
  padding-inline: 4px 20px;
}

.plan-card {
  position: relative;
  isolation: isolate;
  flex: 0 0 min(320px, calc(100vw - 140px));
  max-width: 380px;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  border-radius: 20px;
  padding: 2px;
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.08), rgba(255, 255, 255, 0.9));
  transition:
    transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.35s ease;
}

.plan-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12);
}

.plan-card--active {
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.14);
}

.plan-card--active:not(.plan-card--featured) {
  background: linear-gradient(145deg, rgba(245, 197, 24, 0.35), rgba(255, 255, 255, 0.95));
}

.slider-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 4px 16px 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: none;
  background: #cbd5e1;
  padding: 0;
  cursor: pointer;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.dot.on {
  width: 22px;
  background: #f5c518;
}

.plan-card--featured {
  background: linear-gradient(145deg, #f5c518, #10b981, #f5c518);
  background-size: 200% 200%;
  animation: border-shimmer 6s ease infinite;
}

.plan-card--free .plan-inner {
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(8px);
}

.featured-glow {
  position: absolute;
  inset: 0;
  border-radius: 18px;
  background: radial-gradient(circle at 50% 0%, rgba(245, 197, 24, 0.18), transparent 62%);
  pointer-events: none;
  z-index: 0;
  animation: pulse-glow 4s ease-in-out infinite;
}

.plan-inner {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 20px 20px;
  border-radius: 18px;
  background: #fff;
}

.plan-badge {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--b-accent-soft, #f4f4f5);
  color: var(--b-muted);
}

.plan-badge--hot {
  background: #ecfdf5;
  color: #047857;
}

.plan-name {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: -0.03em;
}

.plan-price {
  margin: 0;
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 750;
  letter-spacing: -0.04em;
}

.plan-price-sub {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--b-muted);
}

.plan-desc {
  margin: 0;
  font-size: 13px;
  color: var(--b-muted);
  line-height: 1.45;
}

.plan-features {
  margin: 0;
  padding-left: 1.15rem;
  font-size: 14px;
  line-height: 1.55;
  color: var(--b-muted);
  flex: 1;
}

.plan-limits {
  font-size: 12px;
  color: var(--b-muted);
  padding: 8px 10px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid var(--line, #e5e7eb);
}

.plan-cta {
  margin-top: auto;
  width: 100%;
  justify-content: center;
}

.btn-glow {
  box-shadow: 0 8px 28px rgba(245, 197, 24, 0.35);
  transition: box-shadow 0.25s ease, transform 0.2s ease;
}

.btn-glow:hover:not(:disabled) {
  box-shadow: 0 12px 36px rgba(245, 197, 24, 0.45);
  transform: translateY(-1px);
}

.active-plan {
  margin-top: 28px;
  border-color: #bbf7d0;
  background: rgba(236, 253, 245, 0.7);
  backdrop-filter: blur(6px);
}

.reveal {
  animation: reveal-up 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.reveal-delay {
  animation-delay: 0.12s;
}

.plan-card.reveal-stagger {
  animation: reveal-up 0.75s cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(0.08s * (var(--stagger, 0) + 1));
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes reveal-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes float-orb {
  from {
    transform: translate(0, 0) scale(1);
  }
  to {
    transform: translate(12px, -18px) scale(1.05);
  }
}

@keyframes border-shimmer {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .reveal,
  .reveal-delay,
  .plan-card.reveal-stagger,
  .orb,
  .plan-card--featured,
  .featured-glow {
    animation: none;
  }
  .plan-card:hover {
    transform: none;
  }
  .slider-viewport {
    scroll-behavior: auto;
  }
}
</style>