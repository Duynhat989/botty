<template>
  <div class="login-wrap">
    <div class="b-card b-card-pad-lg login-card">
      <header class="login-header">
        <img class="login-logo" src="/logo.png" alt="Botty" width="72" height="72" />
        <p class="b-kicker">
          <template v-if="redirect && redirect !== '/'">{{ t('login.eyebrowCreate') }}</template>
          <template v-else>Botty</template>
        </p>
        <h1 class="b-title login-title">{{ t('login.title') }}</h1>
        <p class="b-lede login-lede">{{ t('login.lede') }}</p>
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
        <li>{{ t('login.perkCredits', { n: providers.signupCredits || 30 }) }}</li>
      </ul>
    </div>

    <p class="login-foot">
      {{ t('login.foot') }}
      <RouterLink to="/">{{ t('login.footLink') }}</RouterLink>
    </p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { Check, CircleAlert } from '@lucide/vue'
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
.login-wrap {
  width: min(420px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 1.25rem;
}

.login-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.login-logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  margin: 0 auto 4px;
}

.login-header {
  text-align: center;
}

.login-title {
  font-size: clamp(30px, 4vw, 40px);
}

.login-lede {
  margin-top: 10px;
  font-size: 15px;
}

.login-alert {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--b-radius-sm);
  border: 1px solid #fecdca;
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

.oauth-stack {
  display: grid;
  gap: 0.65rem;
}

.oauth {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.7rem 1rem;
  border-radius: var(--b-radius-sm);
  border: 1px solid var(--b-border-strong);
  background: var(--b-surface);
  font-family: inherit;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--b-ink);
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.oauth:hover:not(:disabled) {
  background: var(--b-surface-2);
  border-color: #b8c4be;
}

.oauth:disabled {
  opacity: 0.55;
  cursor: not-allowed;
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
  border: 1px solid var(--b-border-strong);
  border-radius: 4px;
  background: var(--b-surface);
  color: var(--b-accent);
}

.terms-input:checked + .terms-box {
  border-color: var(--b-accent);
  background: var(--b-accent-soft);
}

.terms-text a {
  color: var(--b-accent);
}

.perks {
  margin: 0;
  padding-left: 1.1rem;
  font-size: 0.8125rem;
  color: var(--b-muted);
  line-height: 1.55;
}

.login-foot {
  margin: 0;
  text-align: center;
  font-size: 0.875rem;
  color: var(--b-muted);
}

.login-foot a {
  color: var(--b-accent);
  font-weight: 500;
}
</style>