<template>
  <div class="login-page">
    <div class="login-atmosphere" aria-hidden="true">
      <span class="orb orb-a" />
      <span class="orb orb-b" />
      <span class="orb orb-c" />
    </div>

    <div class="login-shell">
      <aside class="login-aside">
        <RouterLink to="/" class="aside-brand">
          <span class="brand-mark" aria-hidden="true">
            <img :src="brandLogo" alt="" width="46" height="46" class="brand-mark-img" />
          </span>
          <span class="brand-name">Botty</span>
        </RouterLink>

        <ul class="aside-trust">
          <li v-for="pill in trustPills" :key="pill">
            <CircleCheck :size="16" aria-hidden="true" />
            {{ pill }}
          </li>
        </ul>

        <h2 class="aside-title">
          {{ t('login.sideTitle') }}
          <span class="aside-highlight">{{ t('login.sideHighlight') }}</span>
        </h2>
        <p class="aside-lede">{{ t('login.sideLede') }}</p>

        <ul class="aside-features aside-features--desktop">
          <li v-for="feat in sideFeatures" :key="feat.label">
            <span class="feat-icon" aria-hidden="true">
              <component :is="feat.icon" :size="18" :stroke-width="2.2" />
            </span>
            <span>
              <strong>{{ feat.label }}</strong>
              <em>{{ feat.text }}</em>
            </span>
          </li>
        </ul>
      </aside>

      <div class="login-panel">
        <div class="login-card">
          <div class="form-visual" aria-hidden="true">
            <div class="visual-panel">
              <div class="visual-glow" />
              <img :src="brandLogo" alt="" width="64" height="64" class="visual-logo" />
              <p class="visual-name">Botty</p>
              <div class="visual-chat">
                <img :src="brandLogo" alt="" width="28" height="28" class="visual-chat-logo" />
                <p>Chào shop — sẵn sàng trả lời &amp; chốt đơn cho bạn.</p>
              </div>
            </div>
          </div>

          <div class="login-form-body">
            <header class="login-header">
              <p v-if="redirectHint" class="login-redirect" role="status">{{ redirectHint }}</p>
              <div class="login-brand-text">
                <h1 class="login-title">{{ t('login.title') }}</h1>
                <p class="login-lede">{{ t('login.lede') }}</p>
              </div>
            </header>

          <div v-if="message" class="login-alert" role="alert">
            <CircleAlert :size="16" :stroke-width="2.2" aria-hidden="true" />
            <span>{{ message }}</span>
            <button type="button" class="alert-close" :aria-label="t('login.closeAria')" @click="message = ''">×</button>
          </div>

          <div class="oauth-stack">
            <button
              class="oauth google"
              type="button"
              :disabled="!providers.google || loggingIn === 'google'"
              @click="continueWith('google')"
            >
              <span v-if="loggingIn === 'google'" class="spinner" aria-hidden="true" />
              <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.55-5.17 3.55-8.65z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.09A12 12 0 0 0 12 24z" />
                <path fill="#FBBC05" d="M5.29 14.3A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.57.38-2.3V6.61H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.39l4-3.09z" />
                <path fill="#EA4335" d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.95 1.14 15.24 0 12 0 7.31 0 3.19 2.69 1.29 6.61l4 3.09C6.23 6.87 8.88 4.77 12 4.77z" />
              </svg>
              <span>{{ loggingIn === 'google' ? t('login.redirecting') : t('login.google') }}</span>
            </button>

            <button
              v-if="providers.facebook"
              class="oauth facebook"
              type="button"
              :disabled="loggingIn === 'facebook'"
              @click="continueWith('facebook')"
            >
              <span v-if="loggingIn === 'facebook'" class="spinner light" aria-hidden="true" />
              <svg v-else viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
                <path fill="currentColor" d="M14.5 8.5V6.8c0-.7.5-1.1 1.2-1.1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.8h2V21h3.5v-9.7h2.3l.4-2.8h-2.7z" />
              </svg>
              <span>{{ loggingIn === 'facebook' ? t('login.redirecting') : t('login.facebook') }}</span>
            </button>
          </div>

          <label class="terms">
            <input v-model="agreed" type="checkbox" class="terms-input" />
            <span class="terms-box" aria-hidden="true">
              <Check v-if="agreed" :size="11" :stroke-width="3.2" />
            </span>
            <span class="terms-text">
              {{ t('login.terms') }}
              <RouterLink to="/terms">{{ t('login.termsLink') }}</RouterLink>
              &
              <RouterLink to="/privacy">{{ t('login.privacyLink') }}</RouterLink>
            </span>
          </label>

          <ul class="perks">
            <li>
              <CircleCheck :size="14" aria-hidden="true" />
              {{ t('login.perkNoCard') }}
            </li>
            <li>
              <CircleCheck :size="14" aria-hidden="true" />
              {{ t('login.perkCredits') }}
            </li>
          </ul>
          </div>
        </div>

        <p class="login-foot">
          {{ t('login.foot') }}
          <RouterLink to="/">{{ t('login.footLink') }}</RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Bot, Check, CircleAlert, CircleCheck, MessageCircle, Package } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'
import { BRAND_LOGO_SRC } from '@/constants/brand'

const brandLogo = BRAND_LOGO_SRC

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const message = ref('')
const agreed = ref(true)
const loggingIn = ref('')
const providers = ref({ google: true, facebook: false, signupCredits: 30, videoCost: 25 })

const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'

const trustPills = ['Miễn phí bắt đầu', 'Không cần thẻ tín dụng']

const redirectHint = computed(() => {
  if (!redirect || redirect === '/') return ''
  if (redirect.includes('incident-report')) return 'Đăng nhập để gửi báo cáo sự cố.'
  if (redirect.startsWith('/contact')) return 'Đăng nhập để tiếp tục tới Liên hệ.'
  if (redirect.startsWith('/config')) return 'Đăng nhập để quản lý bot của bạn.'
  return 'Đăng nhập để tiếp tục.'
})

const sideFeatures = computed(() => [
  { icon: MessageCircle, label: t('login.featureReply'), text: t('login.featureReplyHint') },
  { icon: Package, label: t('login.featureStock'), text: t('login.featureStockHint') },
  { icon: Bot, label: t('login.featureWebhook'), text: t('login.featureWebhookHint') },
])

function loginErrorMessage(code) {
  if (code === 'google') return t('login.errGoogle')
  if (code === 'facebook') return t('login.errFacebook')
  if (code === 'locked') return t('login.errLocked')
  return t('login.errGeneric')
}

function continueWith(provider) {
  if (!agreed.value) {
    message.value = t('login.errAgree')
    return
  }
  message.value = ''
  loggingIn.value = provider
  auth.startLogin(provider, redirect)
}

onMounted(async () => {
  try {
    providers.value = await api.auth.providers()
  } catch {
    providers.value = { google: true, facebook: false, signupCredits: 30, videoCost: 25 }
  }

  if (typeof route.query.error === 'string') {
    message.value = loginErrorMessage(route.query.error)
  }

  if (typeof route.query.token === 'string' && route.query.token) {
    try {
      await auth.loginWithToken(route.query.token)
      router.replace(auth.consumeRedirect(redirect))
    } catch {
      message.value = t('login.errToken')
    }
  }
})
</script>

<style scoped>
.login-page {
  position: relative;
  width: min(1080px, 100%);
  margin: 0 auto;
  isolation: isolate;
}

.login-atmosphere {
  position: absolute;
  inset: -100px -48px -64px;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(64px);
  opacity: 0.5;
}

.orb-a {
  width: 320px;
  height: 320px;
  top: -60px;
  left: -100px;
  background: #93c5fd;
}

.orb-b {
  width: 260px;
  height: 260px;
  right: -80px;
  top: 18%;
  background: #7dd3fc;
}

.orb-c {
  width: 200px;
  height: 200px;
  left: 42%;
  bottom: 0;
  background: #bfdbfe;
}

.login-shell {
  display: grid;
  gap: clamp(28px, 5vw, 48px);
  align-items: center;
}

@media (min-width: 900px) {
  .login-shell {
    grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
    gap: clamp(36px, 4vw, 56px);
  }
}

.login-aside {
  display: grid;
  gap: 14px;
  padding: clamp(4px, 2vw, 8px);
}

.aside-brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  width: fit-content;
  text-decoration: none;
  color: #0f172a;
}

.brand-mark {
  display: block;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 12px 28px -14px rgba(37, 99, 235, 0.45);
}

.brand-mark-img {
  display: block;
  width: 46px;
  height: 46px;
  object-fit: cover;
}

.brand-name {
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.aside-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.aside-trust li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

.aside-trust svg {
  color: var(--b-accent);
  flex-shrink: 0;
}

.aside-title {
  margin: 2px 0 0;
  font-size: clamp(1.75rem, 3.6vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.12;
  color: #0f172a;
}

.aside-highlight {
  display: block;
  color: #38bdf8;
}

.aside-lede {
  margin: 0;
  max-width: 42ch;
  font-size: 1rem;
  line-height: 1.65;
  color: #64748b;
}

.form-visual {
  width: 100%;
  flex-shrink: 0;
  order: 0;
}

.visual-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 4px;
  padding: 14px 16px 12px;
  border-radius: 21px 21px 0 0;
  background: linear-gradient(165deg, #dbeafe 0%, #eff6ff 48%, #f8fafc 100%);
  border: none;
  border-bottom: 1px solid var(--color-accent-border);
  overflow: hidden;
}

.visual-glow {
  position: absolute;
  top: -55%;
  left: 50%;
  width: 120%;
  height: 55%;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, rgba(59, 130, 246, 0.28), transparent 72%);
  pointer-events: none;
}

.visual-logo {
  position: relative;
  z-index: 1;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow:
    0 10px 24px -16px rgba(37, 99, 235, 0.5),
    0 0 0 3px rgba(255, 255, 255, 0.85);
}

.visual-name {
  position: relative;
  z-index: 1;
  margin: 4px 0 0;
  font-size: 1.05rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.visual-chat {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 10px;
  width: 100%;
  max-width: 100%;
  border-radius: 10px;
  text-align: left;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 20px -18px rgba(15, 23, 42, 0.2);
}

.visual-chat-logo {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  object-fit: cover;
}

.visual-chat p {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  font-weight: 500;
  color: #334155;
}

@media (min-width: 640px) {
  .visual-panel {
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 10px 14px;
    padding: 16px 18px 14px;
    text-align: left;
  }

  .visual-logo {
    width: 60px;
    height: 60px;
    margin: 0;
  }

  .visual-name {
    text-align: left;
    flex: 1 1 140px;
    max-width: calc(100% - 76px);
    margin-top: 0;
    font-size: 1.08rem;
  }

  .visual-chat {
    flex: 1 1 100%;
    margin-top: 2px;
    max-width: none;
  }
}

.aside-features--desktop {
  display: none;
}

@media (min-width: 900px) {
  .aside-features--desktop {
    display: grid;
  }
}

.aside-features {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 10px;
}

.aside-features li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--color-accent-border);
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 12px 32px -26px rgba(37, 99, 235, 0.35);
}

.feat-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--b-accent-hover);
  background: var(--b-accent-soft);
  border: 1px solid var(--color-accent-border);
}

.aside-features strong {
  display: block;
  font-size: 14px;
  font-weight: 650;
  color: #0f172a;
}

.aside-features em {
  display: block;
  margin-top: 2px;
  font-style: normal;
  font-size: 13px;
  line-height: 1.45;
  color: #64748b;
}

.login-form-body {
  order: 1;
  display: grid;
  gap: 18px;
  min-width: 0;
  padding: clamp(20px, 4vw, 28px) clamp(18px, 4vw, 26px) clamp(22px, 4vw, 30px);
}

.login-panel {
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: min(100%, 520px);
  justify-self: center;
}

@media (min-width: 900px) {
  .login-panel {
    justify-self: center;
    max-width: min(100%, 480px);
  }
}

.login-card {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid var(--color-accent-border);
  background: #fff;
  box-shadow:
    0 1px 2px rgba(15, 23, 42, 0.04),
    0 32px 64px -36px rgba(37, 99, 235, 0.35);
}

.login-redirect {
  margin: 0 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--b-accent-deep);
  background: var(--b-accent-soft);
  border: 1px solid var(--color-accent-border);
}

.login-header {
  margin: 0;
}

.login-brand-text {
  min-width: 0;
}

.login-title {
  margin: 0;
  font-size: clamp(1.45rem, 2.8vw, 1.65rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: #0f172a;
}

.login-lede {
  margin: 6px 0 0;
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--b-muted);
}

.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid #fecaca;
  background: var(--b-danger-soft);
  font-size: 0.875rem;
  color: var(--b-danger);
}

.alert-close {
  margin-left: auto;
  border: none;
  background: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  color: inherit;
}

.login-form-body > .oauth-stack {
  margin-top: 4px;
}

.oauth-stack {
  display: grid;
  gap: 10px;
}

.oauth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  min-height: 50px;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.oauth:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #f8fafc;
  border-color: #cbd5e1;
  box-shadow: 0 10px 24px -16px rgba(15, 23, 42, 0.2);
}

.oauth:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.oauth.google:focus-visible {
  outline: 2px solid var(--b-accent);
  outline-offset: 2px;
}

.oauth.facebook {
  background: #1877f2;
  border-color: #1877f2;
  color: #fff;
}

.oauth.facebook:hover:not(:disabled) {
  background: #166fe5;
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--b-border);
  border-top-color: var(--b-accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.spinner.light {
  border-color: rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.terms {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: var(--b-muted);
  cursor: pointer;
}

.terms-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.terms-box {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 1px;
  display: grid;
  place-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 5px;
  background: #fff;
  color: var(--b-accent);
}

.terms-input:checked + .terms-box {
  border-color: var(--b-accent);
  background: var(--b-accent-soft);
}

.terms-text a {
  color: var(--b-accent);
  font-weight: 600;
}

.perks {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 8px;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.45;
}

.perks li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--b-accent-soft);
  border: 1px solid var(--color-accent-border);
}

.perks svg {
  flex-shrink: 0;
  color: var(--b-accent);
}


.login-foot {
  margin: 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--b-muted);
}

.login-foot a {
  color: var(--b-accent);
  font-weight: 600;
}

@media (max-width: 899px) {
  .login-shell {
    gap: 20px;
  }

  .login-aside {
    text-align: center;
    justify-items: center;
    gap: 12px;
  }

  .aside-lede {
    display: none;
  }

  .aside-trust {
    justify-content: center;
  }
}
</style>