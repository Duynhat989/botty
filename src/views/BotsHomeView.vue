<template>
  <div class="landing">
    <div class="ambient" aria-hidden="true">
      <span class="blob blob-a" />
      <span class="blob blob-b" />
      <span class="blob blob-c" />
      <span class="grid-fade" />
    </div>

    <section class="hero">
      <div class="hero-inner">
        <div class="hero-copy reveal">
          <div class="badge-row">
            <span class="badge">Miễn phí nền tảng</span>
            <span class="badge badge--soft">Facebook Messenger</span>
          </div>
          <h1 class="hero-title">
            Bot phản hồi nhanh,
            <span class="hero-gradient">chốt đơn thông minh</span>
          </h1>
          <p class="hero-lede">
            Botty kết nối Page với AI — trả lời theo tài liệu, kho hàng và quy tắc bán của bạn.
            Thanh toán QR, nhắc hóa đơn, webhook riêng từng bot.
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

    <section class="marquee-wrap" aria-label="Ảnh minh họa">
      <div class="marquee">
        <div class="marquee-track">
          <img
            v-for="(src, i) in marqueeSlides"
            :key="'a-' + i"
            :src="src"
            alt=""
            loading="lazy"
            width="300"
            height="190"
          />
        </div>
        <div class="marquee-track" aria-hidden="true">
          <img
            v-for="(src, i) in marqueeSlides"
            :key="'b-' + i"
            :src="src"
            alt=""
            loading="lazy"
            width="300"
            height="190"
          />
        </div>
      </div>
    </section>

    <div class="page-container">
      <section class="section features reveal">
        <p class="b-kicker">Tính năng</p>
        <h2 class="b-section-title section-head">Mọi thứ shop cần trong một bảng điều khiển</h2>
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

      <section class="section showcase reveal">
        <div class="showcase-head">
          <div>
            <p class="b-kicker">Thực tế</p>
            <h2 class="b-section-title">Bot đọc kho — trả lời đúng giá & tồn</h2>
            <p class="b-muted showcase-lede">
              Minh họa với catalog demo: hình ảnh sản phẩm đồng bộ vào ngữ cảnh AI.
            </p>
          </div>
          <img class="showcase-brand" src="/logo.png" alt="Botty" width="52" height="52" />
        </div>
        <div class="product-grid">
          <figure
            v-for="item in products"
            :key="item.src"
            class="product-card"
          >
            <div class="product-img-wrap">
              <img :src="item.src" :alt="item.alt" loading="lazy" />
            </div>
            <figcaption>{{ item.caption }}</figcaption>
          </figure>
        </div>
      </section>

      <section class="section start-steps reveal">
        <p class="b-kicker">Bắt đầu</p>
        <h2 class="b-section-title section-head">Năm bước đưa bot lên Page</h2>
        <p class="steps-hint b-muted">Vuốt ngang trên điện thoại để xem đủ bước.</p>
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
        <div class="cta-glow" aria-hidden="true" />
        <div class="cta-card">
          <div class="cta-copy">
            <h2 class="b-section-title">Sẵn sàng nhận tin nhắn thay bạn?</h2>
            <p class="b-muted">
              Vào Cấu hình để xem bot hiện có hoặc mở wizard tạo bot mới trong vài phút.
            </p>
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
  { value: '1 token', label: 'Webhook / bot' },
  { value: 'QR + CK', label: 'Chốt đơn tự động' },
  { value: 'Gemini', label: 'Key của bạn' },
]

const heroSlides = [
  '/images/hero/slide-1.png',
  '/images/hero/slide-2.png',
  '/images/hero/slide-3.png',
  '/images/hero/slide-4.png',
]

const marqueeSlides = [...heroSlides, ...heroSlides]

const features = [
  {
    icon: Webhook,
    title: 'Webhook Meta',
    text: 'URL riêng, token bảo mật — dán vào Developer là chạy.',
  },
  {
    icon: Sparkles,
    title: 'Gemini / Botty AI',
    text: 'Dùng key riêng hoặc gói hosting — kiểm soát chi phí.',
  },
  {
    icon: ShoppingBag,
    title: 'Chốt đơn + thanh toán',
    text: 'Thu SĐT, địa chỉ, QR Pay2S và đối soát CK.',
    img: '/images/products/lotus-1.png',
  },
  {
    icon: FileText,
    title: 'Tài liệu & kho',
    text: 'Instruction, PDF, sản phẩm có biến thể và tồn.',
  },
  {
    icon: MessageCircle,
    title: 'Thử phản hồi',
    text: 'Tab thử trước khi bật live trên Page.',
  },
  {
    icon: Zap,
    title: 'Nhắc hóa đơn',
    text: 'Một hóa đơn / phiên — AI hiểu thanh toán hay hủy.',
    img: '/images/products/rose-1.png',
  },
]

const products = [
  { src: '/images/products/lotus-1.png', alt: 'Áo Lotus', caption: 'Lotus — tồn kho & size' },
  { src: '/images/products/lotus-2.png', alt: 'Lotus chi tiết', caption: 'Trả lời giá theo SKU' },
  { src: '/images/products/rose-1.png', alt: 'Rose collection', caption: 'Gợi ý combo' },
  { src: '/images/products/rose-2.png', alt: 'Rose', caption: 'Hình ảnh trong kho' },
  { src: '/images/products/morning-1.png', alt: 'Morning', caption: 'Tone sáng, copy tự nhiên' },
  { src: '/images/products/morning-2.png', alt: 'Morning 2', caption: 'Nhiều ảnh mỗi SP' },
  { src: '/images/products/night-1.png', alt: 'Night', caption: 'Catalog tối' },
  { src: '/images/products/night-2.png', alt: 'Night 2', caption: 'Đồng bộ Messenger' },
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
  overflow-x: clip;
  background: #ffffff;
}

.ambient {
  position: absolute;
  inset: 0;
  height: min(920px, 120vh);
  pointer-events: none;
  overflow: hidden;
}

.grid-fade {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(21, 128, 61, 0.04) 1px, transparent 1px),
  linear-gradient(90deg, rgba(21, 128, 61, 0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  opacity: 0.55;
  animation: blob-drift 18s ease-in-out infinite alternate;
}

.blob-a {
  width: 420px;
  height: 420px;
  top: -120px;
  left: -80px;
  background: radial-gradient(circle, #bbf7d0 0%, transparent 70%);
}

.blob-b {
  width: 360px;
  height: 360px;
  top: 80px;
  right: -60px;
  background: radial-gradient(circle, #d1fae5 0%, transparent 70%);
  animation-delay: -6s;
}

.blob-c {
  width: 280px;
  height: 280px;
  bottom: 40%;
  left: 35%;
  background: radial-gradient(circle, #fef3c7 0%, transparent 72%);
  opacity: 0.35;
  animation-delay: -10s;
}

@keyframes blob-drift {
  0% {
    transform: translate(0, 0) scale(1);
  }
  100% {
    transform: translate(24px, 18px) scale(1.08);
  }
}

.hero {
  position: relative;
  padding: clamp(2.5rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 2.5rem) 2rem;
}

.hero-inner {
  max-width: var(--b-layout);
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
  align-items: center;
}

@media (min-width: 980px) {
  .hero-inner {
    grid-template-columns: 1.05fr 0.95fr;
    gap: 3rem;
  }
}

.badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 1rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 650;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--b-accent);
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #bbf7d0;
  backdrop-filter: blur(8px);
}

.badge--soft {
  color: var(--b-muted);
  border-color: var(--b-border);
  text-transform: none;
  letter-spacing: 0.02em;
  font-weight: 600;
}

.hero-title {
  margin: 0;
  font-size: clamp(2.25rem, 5.2vw, 3.5rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.08;
  color: var(--b-ink);
}

.hero-gradient {
  display: block;
  background: linear-gradient(120deg, #15803d 0%, #22c55e 45%, #0d9488 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-lede {
  margin: 1.125rem 0 0;
  max-width: 48ch;
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--b-muted);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 1.75rem;
}

.btn-glow {
  box-shadow:
    0 0 0 1px rgba(21, 128, 61, 0.12),
    0 12px 32px -8px rgba(21, 128, 61, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-glow:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px rgba(21, 128, 61, 0.18),
    0 16px 40px -10px rgba(21, 128, 61, 0.42);
}

.hero-stats {
  list-style: none;
  margin: 2rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 1.75rem;
}

.hero-stats li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.hero-stats strong {
  font-size: 1.05rem;
  font-weight: 750;
  color: var(--b-ink);
  letter-spacing: -0.02em;
}

.hero-stats span {
  font-size: 13px;
  color: var(--b-muted);
}

.hero-visual {
  display: grid;
  justify-items: center;
}

.visual-frame {
  position: relative;
  width: min(100%, 540px);
}

.visual-shot {
  width: 100%;
  height: auto;
  border-radius: 20px;
  border: 1px solid var(--b-border);
  box-shadow: 0 32px 64px -28px rgba(15, 23, 42, 0.18);
  opacity: 0.92;
}

.visual-float {
  position: absolute;
  right: -4%;
  bottom: -12%;
  width: min(88%, 420px);
  animation: float-y 5s ease-in-out infinite;
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
  .visual-float {
    position: relative;
    right: auto;
    bottom: auto;
    margin-top: -3rem;
    width: 100%;
  }

  .visual-shot {
    display: none;
  }
}

.marquee-wrap {
  margin: 0.5rem 0 0;
  padding: 1.25rem 0;
  border-block: 1px solid var(--b-border);
  background: linear-gradient(180deg, #fafdfb 0%, #ffffff 100%);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}

.marquee {
  display: flex;
  width: max-content;
  animation: marquee 42s linear infinite;
}

.marquee-track {
  display: flex;
  gap: 1rem;
  padding: 0 0.5rem;
}

.marquee-track img {
  width: 280px;
  height: 172px;
  object-fit: cover;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  box-shadow: 0 8px 24px -12px rgba(15, 23, 42, 0.12);
  transition: transform 0.35s ease;
}

.marquee:hover {
  animation-play-state: paused;
}

.marquee-track img:hover {
  transform: scale(1.03);
}

@keyframes marquee {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.page-container {
  max-width: var(--b-layout);
  margin: 0 auto;
  padding: clamp(3rem, 6vw, 4.5rem) clamp(1.25rem, 4vw, 2.5rem) 3rem;
  display: grid;
  gap: clamp(3.5rem, 7vw, 5rem);
}

.section-head {
  margin-bottom: 1.75rem;
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
  padding: 1.25rem 1.35rem 1.35rem;
  border-radius: 18px;
  border: 1px solid var(--b-border);
  background: #fff;
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;
}

.bento-card:hover {
  transform: translateY(-4px);
  border-color: #bbf7d0;
  box-shadow: 0 20px 40px -24px rgba(21, 128, 61, 0.35);
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

.cta-glow {
  position: absolute;
  inset: 0;
  border-radius: 22px;
  background: linear-gradient(120deg, #22c55e, #0d9488, #15803d);
  opacity: 0.55;
  filter: blur(20px);
  z-index: 0;
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
  background: linear-gradient(145deg, #ffffff 0%, #f0fdf4 100%);
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
  .blob,
  .visual-float,
  .marquee,
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