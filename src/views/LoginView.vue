<template>
  <div class="login-page">
    <div class="login-atmosphere" aria-hidden="true">
      <div class="orb orb-a" />
      <div class="orb orb-b" />
      <div class="grid-fade" />
    </div>

    <div class="login-shell">
      <aside class="login-aside">
        <RouterLink to="/" class="aside-brand">
          <img src="/logo.png" alt="" width="40" height="40" class="aside-logo" />
          <span>Botty</span>
        </RouterLink>

        <div class="aside-badges">
          <span class="pill pill--accent">{{ t('login.badgeProduct') }}</span>
          <span class="pill">{{ t('login.badgeMessenger') }}</span>
        </div>

        <h2 class="aside-title">
          {{ t('login.sideTitle') }}
          <span class="aside-highlight">{{ t('login.sideHighlight') }}</span>
        </h2>
        <p class="aside-lede">{{ t('login.sideLede') }}</p>

        <ul class="aside-features">
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

        <p class="aside-foot">
          <Sparkles :size="14" :stroke-width="2" aria-hidden="true" />
          {{ t('login.eyebrowCredits', { n: providers.signupCredits || 30 }) }}
        </p>
      </aside>

      <div class="login-panel">
        <div class="b-card login-card">
          <header class="login-header">
            <p class="b-kicker">
              <template v-if="redirect && redirect !== '/'">{{ t('login.eyebrowCreate') }}</template>
              <template v-else>Botty</template>
            </p>
            <h1 class="login-title">{{ t('login.title') }}</h1>
            <p class="login-lede">{{ t('login.lede') }}</p>
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
            <li>{{ t('login.perkNoCard') }}</li>
            <li>{{ t('login.perkCredits') }}</li>
          </ul>
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
import { Bot, Check, CircleAlert, MessageCircle, Package, Sparkles } from '@lucide/vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const message = ref('')
const agreed = ref(true)
const loggingIn = ref('')
const providers = ref({ google: true, facebook: false, signupCredits: 30, videoCost: 25 })

const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'

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
  width: min(1040px, 100%);
  margin: 0 auto;
  isolation: isolate;
}

.login-atmosphere {
  position: absolute;
  inset: -120px -40px -80px;
  z-index: -1;
  pointer-events: none;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(72px);
  opacity: 0.55;
}

.orb-a {
  width: 340px;
  height: 340px;
  top: -40px;
  left: -80px;
  background: radial-gradient(circle, rgb(254 215 199 / 90%), transparent 70%);
}

.orb-b {
  width: 280px;
  height: 280px;
  right: -60px;
  bottom: 20%;
  background: radial-gradient(circle, rgb(187 247 208 / 75%), transparent 70%);
}

.grid-fade {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(15 23 42 / 4%) 1px, transparent 1px),
    linear-gradient(90deg, rgb(15 23 42 / 4%) 1px, transparent 1px);
  background-size: 32px 32px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 40%, #000 20%, transparent 72%);
  opacity: 0.35;
}

.login-shell {
  display: grid;
  gap: clamp(28px, 5vw, 48px);
  align-items: center;
}

@media (min-width: 880px) {
  .login-shell {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    gap: clamp(32px, 4vw, 56px);
  }
}

.login-aside {
  display: grid;
  gap: 16px;
  padding: clamp(8px, 2vw, 12px) clamp(4px, 2vw, 8px);
}

.aside-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  text-decoration: none;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: -0.03em;
  color: #0b1b13;
}

.aside-logo {
  border-radius: 12px;
  box-shadow: 0 8px 24px -12px rgb(15 23 42 / 25%);
}

.aside-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.pill {
  display: inline-flex;
  align-items: center;
  padding: 6px 11px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #475569;
  background: rgb(255 255 255 / 72%);
  border: 1px solid #e2e8f0;
}

.pill--accent {
  color: var(--b-accent-hover, #c2410c);
  background: var(--b-accent-soft, #fff7ed);
  border-color: var(--accent-border, #fed7aa);
  text-transform: none;
  letter-spacing: 0.02em;
}

.aside-title {
  margin: 4px 0 0;
  font-size: clamp(1.85rem, 3.8vw, 2.35rem);
  font-weight: 750;
  letter-spacing: -0.04em;
  line-height: 1.15;
  color: #0b1b13;
}

.aside-highlight {
  display: block;
  color: var(--b-accent, #ea580c);
}

.aside-lede {
  margin: 0;
  max-width: 42ch;
  font-size: 1rem;
  line-height: 1.7;
  color: #475569;
}

.aside-features {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 12px;
}

.aside-features li {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid rgb(254 215 199 / 55%);
  background: rgb(255 255 255 / 78%);
  box-shadow: 0 10px 28px -22px rgb(234 88 12 / 35%);
}

.feat-icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  color: var(--b-accent-hover, #c2410c);
  background: var(--b-accent-soft, #fff7ed);
  border: 1px solid var(--accent-border, #fed7aa);
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

.aside-foot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-accent-hover, #c2410c);
}

.login-panel {
  display: grid;
  gap: 14px;
  width: 100%;
  max-width: 440px;
  justify-self: center;
}

@media (min-width: 880px) {
  .login-panel {
    justify-self: stretch;
    max-width: none;
  }
}

.login-card {
  padding: clamp(22px, 4vw, 28px) clamp(20px, 4vw, 26px);
  display: grid;
  gap: 18px;
  border-radius: 22px;
  border: 1px solid rgb(254 215 199 / 70%);
  background:
    radial-gradient(120% 80% at 50% 0%, rgb(255 247 237 / 90%), #fff 55%),
    #fff;
  box-shadow:
    0 1px 2px rgb(15 23 42 / 4%),
    0 24px 48px -28px rgb(234 88 12 / 22%);
}

.login-header {
  text-align: left;
}

.login-title {
  margin: 6px 0 0;
  font-size: clamp(1.65rem, 3vw, 1.9rem);
  font-weight: 750;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.login-lede {
  margin: 10px 0 0;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--b-muted, #64748b);
}

.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: 12px;
  border: 1px solid #fecdca;
  background: var(--b-danger-soft, #fef2f2);
  font-size: 0.875rem;
  color: var(--b-danger, #dc2626);
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
  min-height: 48px;
  padding: 0.75rem 1rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: #fff;
  font-family: inherit;
  font-size: 0.92rem;
  font-weight: 600;
  color: #0f172a;
  cursor: pointer;
  box-shadow: 0 1px 2px rgb(15 23 42 / 5%);
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.oauth:hover:not(:disabled) {
  transform: translateY(-1px);
  background: #fafafa;
  border-color: #cbd5e1;
  box-shadow: 0 8px 20px -14px rgb(15 23 42 / 35%);
}

.oauth:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.oauth.google:focus-visible {
  outline: 2px solid var(--b-accent, #ea580c);
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
  border: 2px solid var(--b-border, #e2e8f0);
  border-top-color: var(--b-accent, #ea580c);
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
  color: var(--b-muted, #64748b);
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
  color: var(--b-accent, #ea580c);
}

.terms-input:checked + .terms-box {
  border-color: var(--b-accent, #ea580c);
  background: var(--b-accent-soft, #fff7ed);
}

.terms-text a {
  color: var(--b-accent, #ea580c);
  font-weight: 600;
}

.perks {
  margin: 0;
  padding: 12px 14px 12px 2.2rem;
  font-size: 0.8125rem;
  color: #64748b;
  line-height: 1.55;
  border-radius: 12px;
  background: rgb(248 250 252 / 85%);
  border: 1px solid #f1f5f9;
}

.login-foot {
  margin: 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--b-muted, #64748b);
}

.login-foot a {
  color: var(--b-accent, #ea580c);
  font-weight: 600;
}

@media (max-width: 879px) {
  .login-aside {
    text-align: center;
    justify-items: center;
  }

  .aside-lede {
    margin-inline: auto;
  }

  .aside-badges {
    justify-content: center;
  }

  .aside-features {
    width: min(100%, 480px);
  }
}
</style>