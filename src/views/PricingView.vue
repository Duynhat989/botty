<template>
  <section class="pricing-page-larka">
    <!-- Ambient glowing shapes -->
    <div class="pricing-glow-1" aria-hidden="true"></div>
    <div class="pricing-glow-2" aria-hidden="true"></div>

    <div class="container-larka">
      <div class="pricing-head-larka">
        <span class="pricing-badge-larka">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          {{ t('pricing.badge') }}
        </span>
        <h1 class="pricing-title-larka">{{ t('pricing.title') }}</h1>
        <p class="pricing-sub-larka">
          {{ t('pricing.subBefore') }} <strong>{{ t('pricing.subStrong') }}</strong>{{ t('pricing.subAfter') }}
        </p>

        <div class="billing-toggle" role="group" :aria-label="t('pricing.billingAria')">
          <button
            type="button"
            class="billing-opt"
            :class="{ on: billingPeriod === 'month' }"
            @click="billingPeriod = 'month'"
          >
            {{ t('pricing.billingMonth') }}
          </button>
          <button
            type="button"
            class="billing-opt"
            :class="{ on: billingPeriod === 'year' }"
            @click="billingPeriod = 'year'"
          >
            {{ t('pricing.billingYear') }}
            <em class="save-pill">{{ t('pricing.billingSave') }}</em>
          </button>
        </div>
      </div>

      <div v-if="error" class="pricing-alert-larka" role="alert">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
          <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
        </svg>
        <span>{{ error }}</span>
      </div>

      <!-- PRICE CARD GRID WITH RICH LARKA STYLING -->
      <div class="price-grid-larka">
        <article
          v-for="item in packages"
          :key="item.id"
          class="price-card-larka"
          :class="{ 'highlight-card': item.highlight }"
        >
          <!-- Shiny Animated Border Effect -->
          <div v-if="item.highlight" class="card-border-shiny" aria-hidden="true"></div>

          <!-- Highlight Badge -->
          <span v-if="item.highlight" class="card-tag-badge">
            <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 4px; margin-top: -2px;">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            {{ t('pricing.tag') }}
          </span>

          <div class="card-header-larka">
            <h3 class="card-name-larka">{{ item.name }}</h3>
            <p class="card-desc-larka">{{ item.description || t('pricing.descFallback') }}</p>
          </div>

          <div class="card-price-row">
            <span class="price-amount">{{ formatVnd(displayPrice(item)) }}</span>
            <span class="price-one-time">{{ billingPeriod === 'year' ? t('pricing.perYear') : t('pricing.perMonth') }}</span>
          </div>
          <p v-if="billingPeriod === 'year'" class="price-month-hint">
            {{ t('pricing.monthHint', { price: formatVnd(Math.round(displayPrice(item) / 12)) }) }}
          </p>

          <!-- Package breakdown details -->
          <div class="card-features-larka">
            <div class="feature-item-larka">
              <span class="feat-icon success">✓</span>
              <span>{{ t('pricing.featCreditsBefore') }} <strong>{{ t('pricing.featCreditsStrong', { n: displayCredits(item) }) }}</strong> {{ t('pricing.featCreditsAfter') }}</span>
            </div>
            <div class="feature-item-larka">
              <span class="feat-icon success">✓</span>
              <span>{{ t('pricing.featVideosBefore') }} <strong>{{ t('pricing.featVideosStrong', { n: displayVideos(item) }) }}</strong> {{ t('pricing.featVideosAfter') }}</span>
            </div>
            <div class="feature-item-larka">
              <span class="feat-icon">✓</span>
              <span>{{ t('pricing.featHd') }}</span>
            </div>
            <div class="feature-item-larka">
              <span class="feat-icon">✓</span>
              <span>{{ t('pricing.featStorage') }}</span>
            </div>
          </div>

          <button
            class="btn-pricing-submit"
            :class="{ 'btn-highlight': item.highlight }"
            type="button"
            :disabled="buyingId === item.id"
            @click="buy(item)"
          >
            <span v-if="buyingId === item.id" class="loader-pulse-larka"></span>
            <span style="display: inline-flex; align-items: center; gap: 6px;">
              {{ buyingId === item.id ? t('pricing.buying') : (billingPeriod === 'year' ? t('pricing.buyYear') : t('pricing.buyMonth')) }}
              <svg v-if="buyingId !== item.id" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
              </svg>
            </span>
          </button>
        </article>
      </div>

      <!-- Free Offer Information Footer -->
      <div class="pricing-free-note-larka">
        <div class="free-note-glow" aria-hidden="true"></div>
        <div class="free-note-content">
          <span class="free-sparkle-larka" aria-hidden="true" style="display: inline-flex; align-items: center;">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block;">
              <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
              <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"/>
              <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"/>
            </svg>
          </span>
          <p>
            <strong>{{ t('pricing.freeNoteBefore') }}</strong> {{ t('pricing.freeNoteMid') }} <strong>{{ t('pricing.freeNoteStrong') }}</strong> {{ t('pricing.freeNoteAfter') }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/api'
import { ApiError } from '@/api/client'
import { apiMessage } from '@/api/messages'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'
import { formatVnd } from '@/utils/format'

const { t } = useI18n()

const packages = ref([])
const error = ref('')
const buyingId = ref(0)
const billingPeriod = ref('month')
const auth = useAuthStore()
const router = useRouter()

function displayPrice(item) {
  if (billingPeriod.value === 'year') {
    return item.priceYearVnd ?? Math.round((item.priceMonthVnd || item.priceVnd || 0) * 10)
  }
  return item.priceMonthVnd ?? item.priceVnd ?? 0
}

function displayCredits(item) {
  if (billingPeriod.value === 'year') return item.creditsYear ?? (item.credits || 0) * 12
  return item.credits || 0
}

function displayVideos(item) {
  if (billingPeriod.value === 'year') return item.videosYear ?? Math.floor(displayCredits(item) / 25)
  return item.videos ?? Math.floor((item.credits || 0) / 25)
}

async function buy(item) {
  if (!auth.isLoggedIn) {
    auth.saveRedirect('/pricing')
    router.push({ name: 'login', query: { redirect: '/pricing' } })
    return
  }
  buyingId.value = item.id
  error.value = ''
  try {
    const order = await api.orders.create(item.id, billingPeriod.value)
    router.push({ name: 'checkout', params: { uuid: order.uuid } })
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'pricing.errCreate') : t('pricing.errCreate')
  } finally {
    buyingId.value = 0
  }
}

onMounted(async () => {
  try {
    packages.value = await api.packages.list()
  } catch {
    error.value = t('pricing.errLoad')
  }
})
</script>

<style scoped>
/* ==========================================================================
   PRICING PAGE LARKA DESIGN & STUNNING ANIMATIONS
   ========================================================================== */
.pricing-page-larka {
  position: relative;
  width: 100%;
  padding: 80px 24px 100px;
  background: transparent;
  overflow: hidden;
  min-height: calc(100vh - 68px);
}

/* Beautiful Larka Soft Ambient Blurs */
.pricing-glow-1 {
  position: absolute;
  width: 500px;
  height: 500px;
  top: -100px;
  left: -150px;
  background: radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(134, 239, 172, 0.06) 60%, transparent 100%);
  filter: blur(120px);
  pointer-events: none;
}

.pricing-glow-2 {
  position: absolute;
  width: 600px;
  height: 600px;
  bottom: -150px;
  right: -150px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.04) 50%, transparent 100%);
  filter: blur(140px);
  pointer-events: none;
}

.container-larka {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

/* Head typography */
.pricing-head-larka {
  text-align: center;
  max-width: 760px;
  margin: 0 auto 64px;
}

.pricing-badge-larka {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.12em;
  color: var(--accent);
  background: rgba(var(--accent-rgb, 202, 138, 4), 0.06);
  padding: 6px 14px;
  border-radius: 999px;
  margin-bottom: 18px;
}

.pricing-title-larka {
  font-size: clamp(32px, 5vw, 54px);
  font-weight: 900;
  letter-spacing: -0.045em;
  color: #0f172a;
  line-height: 1.15;
  margin-bottom: 20px;
}

.pricing-sub-larka {
  font-size: clamp(15.5px, 1.8vw, 17px);
  line-height: 1.6;
  color: #64748b;
}

.pricing-sub-larka strong {
  color: #0f172a;
  font-weight: 650;
}

.billing-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 28px;
  padding: 4px;
  background: #f8fafc;
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
}

.billing-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  padding: 10px 18px;
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.billing-opt.on {
  background: #fff;
  color: var(--ink);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.save-pill {
  font-style: normal;
  font-size: 11px;
  font-weight: 700;
  color: var(--accent-deep);
  background: var(--accent-light);
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  padding: 2px 8px;
}

.price-month-hint {
  margin: 6px 0 0;
  font-size: 13px;
  font-weight: 450;
  color: #64748b;
}

/* Alert styling */
.pricing-alert-larka {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 14px 20px;
  border-radius: 16px;
  font-size: 14.5px;
  font-weight: 550;
  max-width: 600px;
  margin: 0 auto 32px;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.03);
  animation: shakeAlert 0.4s ease;
}

@keyframes shakeAlert {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

/* ==========================================================================
   LARKA PRICE CARD GRID & LAYOUT
   ========================================================================== */
.price-grid-larka {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-bottom: 64px;
}

/* Base Price Card Styles */
.price-card-larka {
  position: relative;
  background: #ffffff;
  border: 0;
  border-radius: 28px;
  padding: 40px 36px;
  box-shadow: 0 10px 30px -10px rgba(15, 23, 42, 0.04);
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  cursor: pointer;
}

.price-card-larka:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px -8px rgba(15, 23, 42, 0.08);
}

/* Featured / Highlighted Card Styling */
.price-card-larka.highlight-card {
  box-shadow: 0 25px 50px -12px rgba(var(--accent-rgb, 202, 138, 4), 0.22);
}

/* Shiny Border Effect on Highlight Card */
.card-border-shiny {
  position: absolute;
  inset: -1.5px;
  border-radius: 29.5px;
  background: linear-gradient(135deg, var(--accent), var(--gold), var(--accent-border), var(--accent));
  background-size: 300% 300%;
  z-index: -1;
  animation: shineBorder 6s linear infinite;
}

@keyframes shineBorder {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Highlight Card tag badge */
.card-tag-badge {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%);
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  padding: 6px 16px;
  border-radius: 999px;
  box-shadow: 0 4px 14px rgba(202, 138, 4, 0.4);
  white-space: nowrap;
}

/* Card layout details */
.card-header-larka {
  margin-bottom: 24px;
}

.card-name-larka {
  font-size: 24px;
  font-weight: 850;
  color: #0f172a;
  letter-spacing: -0.03em;
  margin-bottom: 10px;
}

.card-desc-larka {
  font-size: 14px;
  line-height: 1.5;
  color: #64748b;
  font-weight: 500;
}

.card-price-row {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 32px;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 24px;
}

.price-amount {
  font-size: 40px;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: #0f172a;
}

.price-one-time {
  font-size: 12px;
  font-weight: 650;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Features checklist style */
.card-features-larka {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 36px;
}

.feature-item-larka {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.feature-item-larka strong {
  color: #0f172a;
  font-weight: 700;
}

.feat-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f1f5f9;
  color: #64748b;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
}

.feat-icon.success {
  background: rgba(var(--accent-rgb, 202, 138, 4), 0.08);
  color: var(--accent);
}

/* Submit Button Style */
.btn-pricing-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 15px 24px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #0f172a;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s ease;
  margin-top: auto;
}

.btn-pricing-submit:hover:not(:disabled) {
  background: #ffffffb0;
  border-color: #cbd5e1;
  transform: translateY(-1px);
}

.btn-pricing-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Highlight Card submit button */
.btn-pricing-submit.btn-highlight {
  background: var(--accent);
  border-color: transparent;
  color: #ffffff;
  box-shadow: 0 8px 24px -4px rgba(var(--accent-rgb, 202, 138, 4), 0.35);
}

.btn-pricing-submit.btn-highlight:hover:not(:disabled) {
  background: var(--accent-hover);
  box-shadow: 0 12px 28px -2px rgba(var(--accent-rgb, 202, 138, 4), 0.45);
}

/* Loader style */
.loader-pulse-larka {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  animation: scalePulse 1.2s infinite ease-in-out;
}

@keyframes scalePulse {
  0%, 100% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.4); opacity: 1; }
}

/* ==========================================================================
   FREE STARTER OFFER BAR (PRICING FOOTER)
   ========================================================================== */
.pricing-free-note-larka {
  position: relative;
  max-width: 820px;
  margin: 16px auto 0;
  background: #ffffffb0;
  border: 0;
  border-radius: 24px;
  padding: 24px 32px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.01);
  transition: all 0.3s ease;
}

.pricing-free-note-larka:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
}

.free-note-glow {
  position: absolute;
  top: -30%;
  left: -20%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(202, 138, 4, 0.06) 0%, transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.free-note-content {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  text-align: left;
}

.free-sparkle-larka {
  font-size: 20px;
  display: flex;
  align-items: center;
  color: var(--accent);
  animation: floatSparkle 3s ease-in-out infinite alternate;
}

@keyframes floatSparkle {
  0% { transform: translateY(0) scale(1); }
  100% { transform: translateY(-4px) scale(1.1); }
}

.free-note-content p {
  font-size: 14.5px;
  line-height: 1.6;
  color: #475569;
  margin: 0;
}

.free-note-content p strong {
  color: #0f172a;
  font-weight: 700;
}

/* ==========================================================================
   RESPONSIVE BREAKPOINTS
   ========================================================================== */
@media (max-width: 960px) {
  .price-grid-larka {
    grid-template-columns: 1fr;
    gap: 36px;
    max-width: 480px;
    margin: 0 auto 64px;
  }
}

@media (max-width: 600px) {
  .pricing-page-larka { padding: 32px 14px 64px; }
  .pricing-head-larka { margin-bottom: 36px; }
  .price-card-larka { padding: 28px 18px; }
  .pricing-free-note-larka { padding: 16px 18px; }
}
</style>
