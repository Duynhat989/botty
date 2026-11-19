<template>
  <div class="landing">
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy reveal">
          <div class="badge-row">
            <span class="badge">Trợ lý bán hàng AI</span>
            <span class="badge badge--soft">Dành cho Facebook Messenger</span>
          </div>
          <h1 class="hero-title">
            Chăm khách tự động.
            <span class="hero-highlight">Chốt đơn dễ dàng.</span>
          </h1>
          <p class="hero-lede">
            Botty tự động trả lời tin nhắn, tra cứu sản phẩm và hỗ trợ ghi nhận đơn hàng cho shop.
          </p>
          <div class="hero-actions">
            <RouterLink
              v-if="auth.isLoggedIn"
              class="b-btn b-btn--primary btn-glow"
              to="/config?create=1"
            >
              Tạo bot miễn phí
            </RouterLink>
            <RouterLink v-else class="b-btn b-btn--primary btn-glow" to="/login">
              Đăng nhập để bắt đầu
            </RouterLink>
            <RouterLink class="b-btn b-btn--ghost" to="/pricing">Xem gói cước</RouterLink>
          </div>
          <ul class="hero-stats">
            <li v-for="stat in stats" :key="stat.label">
              <strong>{{ stat.value }}</strong>
              <span>{{ stat.label }}</span>
            </li>
          </ul>
        </div>

        <div class="hero-visual reveal reveal-delay">
          <div class="visual-frame">
            <div class="hero-brand-panel" aria-hidden="true">
              <img class="hero-brand-logo" src="/logo.png" alt="" width="240" height="240" loading="eager" />
            </div>
            <div class="visual-float">
              <MacAppMockup />
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="page-container">
      <section class="section features reveal">
        <p class="b-kicker">Tính năng</p>
        <h2 class="b-section-title section-head">Tính năng chính</h2>
        <div
          class="feat-carousel"
          @mouseenter="pauseFeatAutoplay"
          @mouseleave="resumeFeatAutoplay"
          @focusin="pauseFeatAutoplay"
          @focusout="resumeFeatAutoplay"
        >
          <button
            type="button"
            class="feat-nav feat-nav--prev"
            aria-label="Tính năng trước"
            @click="featPrev"
          >
            <ChevronLeft :size="22" :stroke-width="2.25" aria-hidden="true" />
          </button>

          <div class="feat-stage" aria-live="polite">
            <article
              v-for="(feat, idx) in features"
              :key="feat.title"
              class="feat-slide"
              :class="'feat-slide--' + featSlideRole(idx)"
              :aria-hidden="featSlideRole(idx) === 'hidden'"
            >
              <div class="feat-slide-inner bento-card">
                <div class="bento-icon">
                  <component :is="feat.icon" :size="20" :stroke-width="2" aria-hidden="true" />
                </div>
                <h3>{{ feat.title }}</h3>
                <p>{{ feat.text }}</p>
                <img
                  v-if="feat.img"
                  :src="feat.img"
                  :alt="feat.title"
                  class="bento-img"
                  loading="lazy"
                />
              </div>
            </article>
          </div>

          <button
            type="button"
            class="feat-nav feat-nav--next"
            aria-label="Tính năng tiếp theo"
            @click="featNext"
          >
            <ChevronRight :size="22" :stroke-width="2.25" aria-hidden="true" />
          </button>
        </div>

        <div class="feat-dots" role="tablist" aria-label="Chọn tính năng">
          <button
            v-for="(feat, idx) in features"
            :key="'dot-' + feat.title"
            type="button"
            role="tab"
            class="feat-dot"
            :class="{ 'feat-dot--on': idx === featActive }"
            :aria-selected="idx === featActive"
            :aria-label="feat.title"
            @click="featGo(idx)"
          />
        </div>
      </section>

      <section class="section start-steps reveal">
        <p class="b-kicker">Bắt đầu</p>
        <h2 class="b-section-title section-head">Bắt đầu trong vài bước</h2>
        <p class="steps-hint b-muted">Trên điện thoại: vuốt ngang để xem đủ 4 bước.</p>
        <ol class="steps-rail">
          <li v-for="step in steps" :key="step.n" class="steps-item">
            <div class="steps-thumb">
              <img
                class="steps-thumb-img"
                :src="step.img"
                :alt="step.imgAlt"
                width="600"
                height="264"
                loading="lazy"
                decoding="async"
              />
              <span class="steps-num">{{ step.n }}</span>
            </div>
            <div class="steps-copy">
              <span class="steps-label">Bước {{ step.n }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.text }}</p>
            </div>
          </li>
        </ol>
      </section>

      <section class="cta reveal">
        <div class="cta-card">
          <div class="cta-copy">
            <h2 class="b-section-title">Sẵn sàng nhận tin nhắn thay bạn?</h2>
            <p class="b-muted">Tạo bot và bắt đầu trả lời khách tự động.</p>
          </div>
          <div class="cta-actions">
            <RouterLink class="b-btn b-btn--primary btn-glow" :to="auth.isLoggedIn ? '/config?create=1' : '/login'">
              {{ auth.isLoggedIn ? 'Tạo bot ngay' : 'Đăng nhập' }}
            </RouterLink>
            <RouterLink class="b-btn b-btn--ghost" to="/config">Danh sách bot</RouterLink>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Webhook,
  Zap,
} from '@lucide/vue'
import MacAppMockup from '@/components/MacAppMockup.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const FEAT_AUTO_MS = 5000

const featActive = ref(0)
let featTimer = null
let featAutoplayPaused = false

function featWrap(i) {
  const n = features.length
  return ((i % n) + n) % n
}

function featSlideRole(idx) {
  const n = features.length
  const active = featActive.value
  const prev = featWrap(active - 1)
  const next = featWrap(active + 1)
  if (idx === active) return 'center'
  if (idx === prev) return 'left'
  if (idx === next) return 'right'
  return 'hidden'
}

function featNext() {
  featActive.value = featWrap(featActive.value + 1)
  restartFeatAutoplay()
}

function featPrev() {
  featActive.value = featWrap(featActive.value - 1)
  restartFeatAutoplay()
}

function featGo(idx) {
  featActive.value = idx
  restartFeatAutoplay()
}

function startFeatAutoplay() {
  if (featAutoplayPaused) return
  clearFeatAutoplay()
  featTimer = setInterval(featNext, FEAT_AUTO_MS)
}

function clearFeatAutoplay() {
  if (featTimer) {
    clearInterval(featTimer)
    featTimer = null
  }
}

function restartFeatAutoplay() {
  clearFeatAutoplay()
  startFeatAutoplay()
}

function pauseFeatAutoplay() {
  featAutoplayPaused = true
  clearFeatAutoplay()
}

function resumeFeatAutoplay() {
  featAutoplayPaused = false
  startFeatAutoplay()
}

onMounted(() => {
  startFeatAutoplay()
})

onUnmounted(() => {
  clearFeatAutoplay()
})

const stats = [
  { value: 'Tự động', label: 'Trả lời tin nhắn' },
  { value: 'Chính xác', label: 'Tra cứu sản phẩm' },
  { value: 'Dễ quản lý', label: 'Theo dõi đơn hàng' },
]

const features = [
  {
    icon: Webhook,
    title: 'Kết nối Facebook',
    text: 'Kết nối Page để Botty trả lời tin nhắn.',
  },
  {
    icon: Sparkles,
    title: 'Trả lời tự động',
    text: 'Câu trả lời dựa trên thông tin shop cung cấp.',
  },
  {
    icon: ShoppingBag,
    title: 'Hỗ trợ chốt đơn',
    text: 'Ghi nhận thông tin khách và đơn hàng.',
  },
  {
    icon: FileText,
    title: 'Quản lý sản phẩm',
    text: 'Thêm tài liệu, sản phẩm và tồn kho.',
  },
  {
    icon: MessageCircle,
    title: 'Dùng thử trước',
    text: 'Kiểm tra câu trả lời trước khi bật bot.',
  },
  {
    icon: Zap,
    title: 'Theo dõi đơn hàng',
    text: 'Xem trạng thái đơn và thông tin thanh toán.',
  },
]

const steps = [
  {
    n: 1,
    img: '/steps/step-1.svg',
    imgAlt: 'Tạo bot mới trong Botty',
    title: 'Tạo bot & đặt tên',
    text: 'Mở wizard từ Cấu hình, đặt tên hiển thị cho team và khách.',
  },
  {
    n: 2,
    img: '/steps/step-2.svg',
    imgAlt: 'Kết nối Facebook Page và webhook',
    title: 'Kết nối Facebook',
    text: 'Dán Page ID, token và webhook URL vào Meta Developer.',
  },
  {
    n: 3,
    img: '/steps/step-3.svg',
    imgAlt: 'Quản lý tài liệu và kho hàng',
    title: 'Tài liệu & kho',
    text: 'Upload hướng dẫn bán, nhập sản phẩm hoặc dán bảng giá — AI điền kho.',
  },
  {
    n: 4,
    img: '/steps/step-4.svg',
    imgAlt: 'Bật bot live và theo dõi đơn',
    title: 'Bật live & theo dõi',
    text: 'Thử phản hồi, bật chốt đơn nếu cần, kích hoạt trên Page.',
  },
]
</script>

<style scoped>
.landing {
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: #fff;
}

.hero {
  position: relative;
  padding: clamp(3.25rem, 7.5vw, 6.5rem) clamp(1.25rem, 4vw, 2.5rem) clamp(3rem, 6vw, 5rem);
}

.hero-inner {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(2.5rem, 6vw, 5rem);
  align-items: center;
}

@media (min-width: 980px) {
  .hero-copy { text-align: left; }
  .badge-row, .hero-actions { justify-content: flex-start; }
  .hero-title { max-width: 20ch; font-size: clamp(2.8rem, 4.4vw, 3.5rem); }
  .hero-lede { margin-inline: 0; }
  .hero-stats { justify-content: flex-start; }
}

@media (min-width: 980px) {
  .hero-inner {
    grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  }
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-bottom: 1.4rem;
}

.badge-row .badge {
  position: static;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.055em;
  text-transform: uppercase;
  color: var(--b-accent-hover);
  background: var(--b-accent-soft);
  border: 1px solid var(--accent-border, #bbf7d0);
  backdrop-filter: blur(8px);
}

.badge--soft {
  color: #475569;
  border-color: #e2e8f0;
  background: rgba(255, 255, 255, 0.76);
  text-transform: none;
  letter-spacing: 0;
  font-weight: 600;
}

.hero-title {
  max-width: 15ch;
  margin: 0;
  font-size: clamp(2.55rem, 4vw, 3.15rem);
  font-weight: 750;
  letter-spacing: -0.045em;
  line-height: 1.12;
  color: #0b1b13;
}

.hero-highlight {
  display: block;
  padding-bottom: 0.06em;
  color: var(--b-accent);
}

.hero-lede {
  margin: 1.35rem 0 0;
  max-width: 49ch;
  font-size: clamp(1rem, 1.4vw, 1.1rem);
  line-height: 1.75;
  color: #475569;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 1.8rem;
}

.hero-actions .b-btn {
  min-height: 48px;
  padding-inline: 22px;
}

.btn-glow {
  box-shadow: 0 8px 24px -8px rgba(34, 197, 94, 0.4);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -9px rgba(34, 197, 94, 0.48);
}

.hero-stats {
  list-style: none;
  margin: 2.1rem 0 0;
  padding: 1.25rem 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.8rem;
  border-top: 1px solid rgba(148, 163, 184, 0.25);
}

.hero-stats li {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.hero-stats strong {
  font-size: 1rem;
  font-weight: 750;
  color: #17251c;
  letter-spacing: -0.025em;
}

.hero-stats span {
  font-size: 12px;
  color: #64756b;
}

.hero-visual {
  display: grid;
  justify-items: center;
  min-width: 0;
}

.visual-frame {
  position: relative;
  width: min(100%, 590px);
  padding: 0 1rem 2.2rem 0;
}

.hero-brand-panel {
  display: grid;
  place-items: center;
  width: 100%;
  aspect-ratio: 1.1;
  border-radius: 26px;
  border: 1px solid #bbf7d0;
  background: radial-gradient(120% 100% at 50% 0%, #ecfdf5 0%, #ffffff 55%, #f8fafc 100%);
  box-shadow: 0 28px 70px -32px rgba(34, 197, 94, 0.22);
}

.hero-brand-logo {
  width: min(58%, 240px);
  height: auto;
  object-fit: contain;
}

.visual-float {
  position: absolute;
  z-index: 2;
  right: -1%;
  bottom: 0;
  width: min(84%, 430px);
  filter: drop-shadow(0 18px 28px rgba(15, 23, 42, 0.18));
  animation: float-y 5s ease-in-out infinite;
}

@keyframes float-y {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@media (max-width: 979px) {
  .hero-copy { max-width: 680px; margin-inline: auto; text-align: center; }
  .badge-row, .hero-actions, .hero-stats { justify-content: center; }
  .hero-title { max-width: 13ch; margin-inline: auto; }
  .hero-lede { margin-inline: auto; }
  .visual-frame { width: min(100%, 640px); }
  .visual-float { right: 2%; width: min(88%, 480px); }
}

@media (max-width: 620px) {
  .hero { padding-top: 2.8rem; }
  .hero-title { font-size: clamp(2.45rem, 11vw, 3.6rem); }
  .hero-actions { flex-direction: column; align-items: stretch; }
  .hero-actions .b-btn { width: 100%; }
  .hero-stats { gap: 1rem 1.25rem; }
  .hero-stats li { min-width: 27%; }
  .visual-frame { padding: 0 0.35rem 1.2rem 0; }
  .hero-brand-panel { border-radius: 20px; }
  .visual-float { position: relative; right: auto; bottom: auto; width: 100%; margin-top: -1.5rem; }
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: clamp(3.5rem, 7vw, 6rem) clamp(1.25rem, 4vw, 2.5rem) 4rem;
  display: grid;
  gap: clamp(3rem, 6vw, 4.5rem);
}

.section-head {
  max-width: 19ch;
  margin-bottom: 1.9rem;
}

.section .b-kicker {
  margin-bottom: 0.7rem;
}

.section .b-section-title {
  letter-spacing: -0.045em;
}

.feat-carousel {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: clamp(8px, 2vw, 16px);
  margin-top: 0.25rem;
}

.feat-stage {
  position: relative;
  display: grid;
  grid-template-columns: 1fr minmax(0, 1.12fr) 1fr;
  align-items: center;
  gap: clamp(10px, 2.5vw, 18px);
  min-height: clamp(200px, 28vw, 240px);
  overflow: hidden;
  padding: 12px 4px 8px;
}

.feat-slide {
  grid-row: 1;
  min-width: 0;
  transition:
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    opacity 0.45s ease,
    filter 0.45s ease;
  will-change: transform, opacity, filter;
}

.feat-slide--left {
  grid-column: 1;
  transform: scale(0.88) translateX(6%);
  opacity: 0.55;
  filter: blur(3px);
  pointer-events: none;
  z-index: 0;
}

.feat-slide--center {
  grid-column: 2;
  transform: scale(1.04);
  opacity: 1;
  filter: none;
  z-index: 2;
}

.feat-slide--right {
  grid-column: 3;
  transform: scale(0.88) translateX(-6%);
  opacity: 0.55;
  filter: blur(3px);
  pointer-events: none;
  z-index: 0;
}

.feat-slide--hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
}

.feat-slide-inner {
  height: 100%;
}

.feat-slide--center .feat-slide-inner {
  border-color: var(--accent-border, #bbf7d0);
  box-shadow:
    0 24px 48px -28px rgba(34, 197, 94, 0.4),
    0 0 0 1px rgba(34, 197, 94, 0.08);
}

.feat-nav {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #334155;
  cursor: pointer;
  box-shadow: 0 6px 18px -10px rgba(15, 23, 42, 0.25);
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.feat-nav:hover {
  border-color: var(--accent-border, #bbf7d0);
  color: var(--b-accent-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -12px rgba(34, 197, 94, 0.35);
}

.feat-nav:focus-visible {
  outline: 2px solid var(--b-accent);
  outline-offset: 2px;
}

.feat-dots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 1.25rem;
}

.feat-dot {
  width: 8px;
  height: 8px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
  transition:
    width 0.25s ease,
    background 0.25s ease;
}

.feat-dot--on {
  width: 22px;
  background: var(--b-accent);
}

.feat-dot:focus-visible {
  outline: 2px solid var(--b-accent);
  outline-offset: 2px;
}

@media (max-width: 720px) {
  .feat-carousel {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    justify-items: center;
  }

  .feat-nav--prev {
    grid-row: 2;
    grid-column: 1;
    justify-self: start;
  }

  .feat-nav--next {
    grid-row: 2;
    grid-column: 1;
    justify-self: end;
  }

  .feat-stage {
    grid-row: 1;
    grid-column: 1;
    width: 100%;
    grid-template-columns: minmax(0, 0.78fr) minmax(0, 1fr) minmax(0, 0.78fr);
    min-height: 210px;
    padding-bottom: 4px;
  }

  .feat-slide--left,
  .feat-slide--right {
    filter: blur(2.5px);
    opacity: 0.5;
  }
}

.bento-card {
  position: relative;
  min-height: 190px;
  padding: 1.45rem 1.5rem 1.55rem;
  border-radius: 22px;
  border: 1px solid #e7ede9;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 8px 24px -22px rgba(15, 23, 42, 0.3);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
}

.feat-slide--center .bento-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-border, #bbf7d0);
  box-shadow: 0 22px 44px -28px rgba(34, 197, 94, 0.35);
}

.bento-icon {
  display: inline-flex;
  padding: 10px;
  border-radius: 12px;
  background: var(--b-accent-soft);
  color: var(--b-accent);
  margin-bottom: 12px;
}

.bento-card h3 {
  margin: 0 0 8px;
  font-size: 1.05rem;
  letter-spacing: -0.02em;
}

.bento-card p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--b-muted);
  max-width: 36ch;
}

.bento-img {
  position: absolute;
  right: -8%;
  bottom: -12%;
  width: 46%;
  max-width: 160px;
  border-radius: 12px;
  border: 1px solid var(--b-border);
  opacity: 0.9;
  pointer-events: none;
}

.showcase-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 1.5rem;
}

.showcase-lede {
  margin-top: 10px;
  max-width: 52ch;
}

.showcase-brand {
  border-radius: 14px;
  border: 1px solid var(--b-border);
  padding: 8px;
  background: #fff;
  box-shadow: 0 8px 20px -12px rgba(15, 23, 42, 0.1);
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.product-card {
  margin: 0;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid var(--b-border);
  background: #fff;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.product-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 36px -20px rgba(15, 23, 42, 0.2);
}

.product-img-wrap {
  overflow: hidden;
}

.product-card img {
  width: 100%;
  aspect-ratio: 4/3;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
}

.product-card:hover img {
  transform: scale(1.06);
}

.product-card figcaption {
  padding: 10px 12px;
  font-size: 13px;
  color: var(--b-muted);
}

/* Không dùng class global `.steps` — sẽ vỡ layout trang chủ */
.start-steps {
  display: block;
}

.start-steps .section-head {
  max-width: none;
}

.steps-hint {
  margin: -0.5rem 0 1.25rem;
  font-size: 14px;
}

@media (min-width: 720px) {
  .steps-hint {
    display: none;
  }
}

.steps-rail {
  list-style: none;
  margin: 0;
  padding: 4px 2px 12px;
  width: 100%;
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #fed7aa transparent;
}

.steps-rail::-webkit-scrollbar {
  height: 6px;
}

.steps-rail::-webkit-scrollbar-thumb {
  background: #fed7aa;
  border-radius: 999px;
}

@media (min-width: 720px) {
  .steps-rail {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
    gap: clamp(14px, 2vw, 20px);
    padding: 0;
  }
}

@media (min-width: 960px) {
  .steps-rail {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

.steps-item {
  flex: 0 0 min(280px, 86vw);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  border: 1px solid var(--b-border);
  border-radius: 18px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 8px 24px -18px rgba(15, 23, 42, 0.12);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

@media (min-width: 720px) {
  .steps-item {
    flex: initial;
  }
}

.steps-item:hover {
  border-color: var(--accent-border, #fed7aa);
  box-shadow: 0 16px 36px -22px rgba(234, 88, 12, 0.18);
  transform: translateY(-2px);
}

.steps-thumb {
  position: relative;
  flex-shrink: 0;
  aspect-ratio: 600 / 264;
  width: 100%;
  overflow: hidden;
  background: linear-gradient(165deg, #fff7ed 0%, #f8fafc 55%, #fff 100%);
}

.steps-thumb-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  padding: 0;
  vertical-align: middle;
}

.steps-num {
  position: absolute;
  top: 10px;
  left: 10px;
  min-width: 36px;
  height: 36px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 800;
  color: #fff;
  background: rgba(234, 88, 12, 0.94);
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.28);
}

.steps-copy {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 14px 16px 18px;
  min-width: 0;
}

.steps-copy p {
  flex: 1;
}

.steps-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--b-accent);
  margin-bottom: 4px;
}

.steps-copy h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.35;
  color: var(--b-ink);
  word-break: normal;
  overflow-wrap: anywhere;
}

.steps-copy p {
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: var(--b-muted);
  word-break: normal;
  overflow-wrap: break-word;
}

.cta {
  position: relative;
  padding: 4px;
}

.cta-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: clamp(1.5rem, 3vw, 2rem) clamp(1.25rem, 3vw, 2rem);
  border-radius: 20px;
  border: 1px solid var(--accent-border, #bbf7d0);
  background: #fff;
}

.cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.reveal {
  animation: reveal-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.reveal-delay {
  animation-delay: 0.12s;
}

@keyframes reveal-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .visual-float,
  .reveal,
  .reveal-delay {
    animation: none;
  }

  .feat-slide--center .bento-card:hover,
  .product-card:hover,
  .btn-glow:hover {
    transform: none;
  }
}
</style>
