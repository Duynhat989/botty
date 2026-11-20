<template>
  <footer class="site-foot site-foot--botty">
    <div class="foot-inner">
      <div class="foot-brand">
        <RouterLink to="/" class="brand">
          <img class="brand-mark" :src="brandLogo" alt="" width="32" height="32" />
          <span class="brand-title">Botty</span>
        </RouterLink>
        <p class="foot-tagline">{{ t('footer.tagline') }}</p>
        <a :href="siteUrl" class="foot-site" target="_blank" rel="noopener noreferrer">{{ siteHost }}</a>
      </div>

      <nav class="foot-col" :aria-label="t('footer.product')">
        <strong>{{ t('footer.product') }}</strong>
        <RouterLink to="/">{{ t('footer.home') }}</RouterLink>
        <RouterLink to="/config">{{ t('footer.config') }}</RouterLink>
        <RouterLink to="/pricing">{{ t('footer.upgrade') }}</RouterLink>
      </nav>

      <nav class="foot-col" :aria-label="t('footer.support')">
        <strong>{{ t('footer.support') }}</strong>
        <RouterLink to="/contact">{{ t('footer.contact') }}</RouterLink>
        <RouterLink to="/contact#incident-report">{{ t('footer.report') }}</RouterLink>
        <RouterLink v-if="auth.isLoggedIn" to="/account">{{ t('footer.account') }}</RouterLink>
        <RouterLink v-else to="/login">{{ t('footer.signIn') }}</RouterLink>
      </nav>

      <nav class="foot-col" :aria-label="t('footer.legal')">
        <strong>{{ t('footer.legal') }}</strong>
        <RouterLink to="/terms">{{ t('footer.terms') }}</RouterLink>
        <RouterLink to="/privacy">{{ t('footer.privacy') }}</RouterLink>
      </nav>

      <p class="foot-copy">{{ t('footer.copy', { year, host: siteHost }) }}</p>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/i18n'
import { BRAND_LOGO_SRC } from '@/constants/brand'

const brandLogo = BRAND_LOGO_SRC

const auth = useAuthStore()
const { t } = useI18n()
const year = new Date().getFullYear()

const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://botty.live').replace(/\/$/, '')
const siteHost = computed(() => {
  try {
    return new URL(siteUrl).host
  } catch {
    return 'botty.live'
  }
})
</script>

<style scoped>
.site-foot--botty {
  display: block;
  border-top: 1px solid rgba(191, 219, 254, 0.7);
  background:
    linear-gradient(180deg, rgba(239, 246, 255, 0.85) 0%, #fff 38%),
    #fff;
  padding: 0;
  margin: 0;
  max-width: none;
}

.foot-inner {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 48px 24px 32px;
  display: grid;
  grid-template-columns: 1.35fr repeat(3, minmax(0, 1fr));
  gap: 32px 24px;
  box-sizing: border-box;
}

.foot-tagline {
  margin: 12px 0 0;
  max-width: 32ch;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
}

.foot-site {
  display: inline-block;
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--b-accent);
}

.foot-site:hover {
  color: var(--b-accent-hover);
}

.foot-brand .brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-weight: 750;
  letter-spacing: -0.03em;
  font-size: 19px;
  color: #0f172a;
  text-decoration: none;
}

.foot-brand .brand-mark {
  width: 32px;
  height: 32px;
  object-fit: cover;
  border-radius: 10px;
}

.foot-col {
  display: grid;
  align-content: start;
  gap: 10px;
}

.foot-col strong {
  margin-bottom: 4px;
  color: #0f172a;
  font-size: 11.5px;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  font-weight: 700;
}

.foot-col a {
  color: #475569;
  font-size: 14px;
  text-decoration: none;
  transition: color 0.15s ease;
}

.foot-col a:hover {
  color: var(--b-accent-hover);
}

.foot-copy {
  grid-column: 1 / -1;
  margin: 8px 0 0;
  padding-top: 18px;
  border-top: 1px solid #f1f5f9;
  color: #94a3b8;
  font-size: 13px;
  text-align: center;
}

@media (max-width: 800px) {
  .foot-inner {
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    padding: 36px 20px 28px;
  }

  .foot-brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 480px) {
  .foot-inner {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 28px 16px 24px;
  }
}
</style>