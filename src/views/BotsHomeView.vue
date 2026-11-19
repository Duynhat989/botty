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
            <img
              class="visual-shot"
              src="/og-image.png"
              alt="Botty trên điện thoại và máy tính"
              width="520"
              height="340"
              loading="eager"
            />
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
        <div class="bento">
          <article
            v-for="(feat, idx) in features"
            :key="feat.title"
            class="bento-card"
            :class="'bento-card--' + (idx + 1)"
          >
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
          </article>
        </div>
      </section>

      <section class="section start-steps reveal">
        <p class="b-kicker">Bắt đầu</p>
        <h2 class="b-section-title section-head">Bắt đầu trong vài bước</h2>
        <p class="steps-hint b-muted">Vuốt ngang để xem các bước tiếp theo.</p>
        <ol class="steps-rail">
          <li v-for="step in steps" :key="step.n" class="steps-item">
            <div class="steps-thumb">
              <img :src="step.img" :alt="step.title" loading="lazy" />
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
import { RouterLink } from 'vue-router'
import { FileText, MessageCircle, ShoppingBag, Sparkles, Webhook, Zap } from '@lucide/vue'
import MacAppMockup from '@/components/MacAppMockup.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

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
    img: '/images/guide/step-1-link.jpg',
    title: 'Tạo bot & đặt tên',
    text: 'Mở wizard từ Cấu hình, đặt tên hiển thị cho team và khách.',
  },
  {
    n: 2,
    img: '/images/guide/step-2-voice.jpg',
    title: 'Kết nối Facebook',
    text: 'Dán Page ID, token và webhook URL vào Meta Developer.',
  },
  {
    n: 3,
    img: '/images/guide/step-3-music.jpg',
    title: 'Thêm Gemini key',
    text: 'API key lưu riêng cho bot; không chia sẻ với người khác.',
  },
  {
    n: 4,
    img: '/images/guide/step-4-adjust.jpg',
    title: 'Tài liệu & kho',
    text: 'Upload hướng dẫn bán, nhập sản phẩm hoặc nối API list.',
  },
  {
    n: 5,
    img: '/images/guide/step-5-export.jpg',
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
  color: #166534;
  background: rgba(240, 253, 244, 0.86);
  border: 1px solid #bbf7d0;
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
  color: #15803d;
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
  box-shadow: 0 8px 24px -8px rgba(21, 128, 61, 0.45);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-glow:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 30px -9px rgba(21, 128, 61, 0.5);
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

.visual-shot {
  position: relative;
  width: 100%;
  height: auto;
  aspect-ratio: 1.53;
  object-fit: cover;
  border-radius: 26px;
  border: 7px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 28px 70px -32px rgba(15, 23, 42, 0.42);
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
  .visual-shot { border-width: 5px; border-radius: 20px; }
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

.bento {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

@media (min-width: 900px) {
  .bento {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: minmax(140px, auto);
  }

  .bento-card--1 {
    grid-column: span 2;
  }

  .bento-card--3 {
    grid-row: span 2;
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

.bento-card:hover {
  transform: translateY(-4px);
  border-color: #a7dbba;
  box-shadow: 0 22px 44px -28px rgba(21, 128, 61, 0.42);
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

.steps-hint {
  margin: -0.5rem 0 1.25rem;
  font-size: 14px;
}

@media (min-width: 900px) {
  .steps-hint {
    display: none;
  }
}

.steps-rail {
  list-style: none;
  margin: 0;
  padding: 4px 2px 12px;
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #bbf7d0 transparent;
}

.steps-rail::-webkit-scrollbar {
  height: 6px;
}

.steps-rail::-webkit-scrollbar-thumb {
  background: #bbf7d0;
  border-radius: 999px;
}

@media (min-width: 1180px) {
  .steps-rail {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    overflow: visible;
    gap: 14px;
    padding: 0;
  }
}

.steps-item {
  flex: 0 0 min(300px, 88vw);
  scroll-snap-align: start;
  display: flex;
  flex-direction: column;
  min-width: 0;
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

.steps-item:hover {
  border-color: #bbf7d0;
  box-shadow: 0 16px 36px -22px rgba(21, 128, 61, 0.28);
  transform: translateY(-2px);
}

@media (min-width: 1180px) {
  .steps-item {
    flex: initial;
  }
}

.steps-thumb {
  position: relative;
  height: 132px;
  overflow: hidden;
}

.steps-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
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
  background: rgba(21, 128, 61, 0.94);
  box-shadow: 0 4px 12px rgba(21, 128, 61, 0.35);
}

.steps-copy {
  padding: 14px 16px 18px;
  min-width: 0;
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
  border: 1px solid #bbf7d0;
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

  .bento-card:hover,
  .product-card:hover,
  .btn-glow:hover {
    transform: none;
  }
}
</style>
