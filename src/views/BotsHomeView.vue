<template>
  <div class="landing">
    <div class="landing-bg" aria-hidden="true">
      <span class="landing-orb landing-orb--a" />
      <span class="landing-orb landing-orb--b" />
      <span class="landing-orb landing-orb--c" />
    </div>

    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy reveal">
          <ul class="hero-trust">
            <li v-for="pill in trustPills" :key="pill">
              <CircleCheck :size="16" class="hero-trust-icon" aria-hidden="true" />
              {{ pill }}
            </li>
          </ul>
          <h1 class="hero-title">
            Tăng hội thoại với nền tảng
            <span class="hero-highlight">Botty thông minh</span>
          </h1>
          <p class="hero-lede">
            Tạo chatbot giống người cho Facebook Messenger — trả lời khách, tra sản phẩm và hỗ trợ chốt đơn trong vài phút.
          </p>
          <div class="hero-actions">
            <RouterLink
              class="b-btn btn-primary-blue"
              :to="auth.isLoggedIn ? '/config?create=1' : '/login'"
            >
              Bắt đầu ngay
            </RouterLink>
            <RouterLink class="b-btn btn-demo" :to="auth.isLoggedIn ? '/config' : '/login'">
              Xem demo
            </RouterLink>
          </div>
        </div>

        <div class="hero-visual reveal reveal-delay">
          <div class="hero-scene" aria-hidden="true">
            <span class="hero-bubble hero-bubble--lg" />
            <span class="hero-bubble hero-bubble--sm" />
            <img
              class="hero-robot"
              src="/bot-default-avatar.jpg"
              alt=""
              width="420"
              height="420"
              loading="eager"
              decoding="async"
            />
            <div class="hero-chat-card hero-chat-card--top">
              <img class="hero-chat-ava" src="/bot-default-avatar.jpg" alt="" width="32" height="32" />
              <p>Chào shop, Botty có thể hỗ trợ gì ạ?</p>
            </div>
            <div class="hero-chat-card hero-chat-card--bottom">
              <img class="hero-chat-ava" :src="brandLogo" alt="" width="32" height="32" />
              <p>Giúp mình tạo bot chốt đơn Messenger nhé!</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="page-container">
      <section id="features" class="section features reveal">
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
            <RouterLink
              class="b-btn btn-primary-blue"
              :to="auth.isLoggedIn ? '/config?create=1' : '/login'"
            >
              {{ auth.isLoggedIn ? 'Tạo bot ngay' : 'Bắt đầu ngay' }}
            </RouterLink>
            <RouterLink class="b-btn btn-demo" to="/pricing">Xem gói cước</RouterLink>
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
  CircleCheck,
  FileText,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  Webhook,
  Zap,
} from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { BRAND_LOGO_SRC } from '@/constants/brand'

const brandLogo = BRAND_LOGO_SRC

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

const trustPills = ['Dùng thử miễn phí', 'Không cần thẻ tín dụng']

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
  --mk-blue: var(--b-accent);
  --mk-blue-hover: var(--b-accent-hover);
  --mk-sky: #38bdf8;
  --mk-blue-soft: var(--b-accent-soft);
  position: relative;
  overflow: hidden;
  isolation: isolate;
  background: transparent;
}

.landing-bg {
  pointer-events: none;
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.landing-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0.55;
}

.landing-orb--a {
  width: min(42vw, 360px);
  height: min(42vw, 360px);
  top: -8%;
  left: -6%;
  background: #93c5fd;
}

.landing-orb--b {
  width: min(36vw, 300px);
  height: min(36vw, 300px);
  top: 8%;
  right: -4%;
  background: #7dd3fc;
}

.landing-orb--c {
  width: min(50vw, 420px);
  height: min(50vw, 420px);
  bottom: -18%;
  left: 35%;
  background: #bfdbfe;
}

.hero {
  position: relative;
  z-index: 1;
  padding: clamp(2.75rem, 6.5vw, 5.5rem) clamp(1.25rem, 4vw, 2.5rem) clamp(2.5rem, 5vw, 4rem);
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
  .hero-copy {
    text-align: left;
  }
  .hero-trust,
  .hero-actions {
    justify-content: flex-start;
  }
  .hero-title {
    max-width: 12ch;
    font-size: clamp(2.65rem, 4.2vw, 3.55rem);
  }
  .hero-lede {
    margin-inline: 0;
  }
}

@media (min-width: 980px) {
  .hero-inner {
    grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  }
}

.hero-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin: 0 0 1.35rem;
  padding: 0;
  list-style: none;
}

.hero-trust li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.hero-trust-icon {
  color: var(--mk-blue);
}

.hero-title {
  max-width: 16ch;
  margin: 0;
  font-size: clamp(2.35rem, 4.8vw, 3.45rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: #0f172a;
}

.hero-highlight {
  display: block;
  margin-top: 0.08em;
  color: var(--mk-sky);
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
  padding-inline: 24px;
  border-radius: 10px;
  font-weight: 600;
}

.btn-primary-blue {
  border: 1px solid var(--mk-blue);
  background: var(--mk-blue);
  color: #fff;
  box-shadow: 0 12px 28px -14px rgba(37, 99, 235, 0.75);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}

.btn-primary-blue:hover {
  background: var(--mk-blue-hover);
  border-color: var(--mk-blue-hover);
  transform: translateY(-2px);
}

.btn-demo {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  transition:
    border-color 0.2s ease,
    background 0.2s ease,
    transform 0.2s ease;
}

.btn-demo:hover {
  border-color: #94a3b8;
  transform: translateY(-1px);
}

.hero-visual {
  display: grid;
  justify-items: center;
  min-width: 0;
}

.hero-scene {
  position: relative;
  width: min(100%, 520px);
  margin-inline: auto;
  min-height: clamp(300px, 42vw, 440px);
}

.hero-robot {
  position: relative;
  z-index: 2;
  display: block;
  width: min(78%, 380px);
  margin: 0 auto;
  border-radius: 28px;
  object-fit: cover;
  box-shadow: 0 28px 60px -28px rgba(37, 99, 235, 0.45);
  animation: float-y 5.5s ease-in-out infinite;
}

.hero-bubble {
  position: absolute;
  z-index: 1;
  border-radius: 50%;
  background: linear-gradient(145deg, #3b82f6, #2563eb);
  box-shadow: 0 16px 32px -18px rgba(37, 99, 235, 0.55);
}

.hero-bubble--lg {
  width: 54px;
  height: 54px;
  top: 16%;
  right: 14%;
  animation: float-y 4s ease-in-out infinite;
}

.hero-bubble--sm {
  width: 36px;
  height: 36px;
  bottom: 22%;
  left: 10%;
  animation: float-y 4.8s ease-in-out 0.4s infinite;
}

.hero-chat-card {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  max-width: min(240px, 62%);
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 18px 40px -24px rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(10px);
}

.hero-chat-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: #334155;
  font-weight: 500;
}

.hero-chat-ava {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.hero-chat-card--top {
  top: 4%;
  left: 0;
  animation: float-y 6s ease-in-out 0.2s infinite;
}

.hero-chat-card--bottom {
  right: 0;
  bottom: 6%;
  animation: float-y 5.2s ease-in-out 0.6s infinite;
}

@keyframes float-y {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@media (max-width: 979px) {
  .hero-copy {
    max-width: 680px;
    margin-inline: auto;
    text-align: center;
  }
  .hero-trust,
  .hero-actions {
    justify-content: center;
  }
  .hero-title {
    max-width: 18ch;
    margin-inline: auto;
  }
  .hero-lede {
    margin-inline: auto;
  }
  .hero-chat-card--top {
    left: 2%;
  }
  .hero-chat-card--bottom {
    right: 2%;
  }
}

@media (max-width: 620px) {
  .hero {
    padding-top: 2.2rem;
  }
  .hero-title {
    font-size: clamp(2.1rem, 9.5vw, 2.85rem);
  }
  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .hero-actions .b-btn {
    width: 100%;
  }
  .hero-chat-card {
    max-width: 78%;
  }
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
  border-color: #bfdbfe;
  box-shadow:
    0 24px 48px -28px rgba(37, 99, 235, 0.4),
    0 0 0 1px rgba(37, 99, 235, 0.08);
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
  border-color: #bfdbfe;
  color: var(--mk-blue-hover);
  transform: translateY(-1px);
  box-shadow: 0 10px 22px -12px rgba(37, 99, 235, 0.35);
}

.feat-nav:focus-visible {
  outline: 2px solid var(--mk-blue);
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
  background: var(--mk-blue);
}

.feat-dot:focus-visible {
  outline: 2px solid var(--mk-blue);
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
  border-color: #bfdbfe;
  box-shadow: 0 22px 44px -28px rgba(37, 99, 235, 0.35);
}

.bento-icon {
  display: inline-flex;
  padding: 10px;
  border-radius: 12px;
  background: var(--mk-blue-soft);
  color: var(--mk-blue);
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
  color: var(--mk-blue);
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
  border: 1px solid #bfdbfe;
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
