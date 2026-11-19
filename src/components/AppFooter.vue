<template>
  <footer class="site-foot">
    <div class="foot-brand">
      <RouterLink to="/" class="brand">
        <img class="brand-mark" src="/logo.png" alt="" width="28" height="28" />
        <span class="brand-title">Botty</span>
      </RouterLink>
      <p>{{ t('footer.tagline') }}</p>
    </div>
    <nav class="foot-col" :aria-label="t('footer.product')">
      <strong>{{ t('footer.product') }}</strong>
      <RouterLink to="/">{{ t('footer.home') }}</RouterLink>
      <RouterLink to="/faq">{{ t('footer.faq') }}</RouterLink>
      <RouterLink to="/pricing">{{ t('footer.upgrade') }}</RouterLink>
    </nav>
    <nav class="foot-col" :aria-label="t('footer.partner')">
      <strong>{{ t('footer.partner') }}</strong>
      <RouterLink to="/affiliate">{{ t('footer.affiliate') }}</RouterLink>
      <RouterLink to="/contact">{{ t('footer.contact') }}</RouterLink>
    </nav>
    <nav class="foot-col" :aria-label="t('footer.legal')">
      <strong>{{ t('footer.legal') }}</strong>
      <RouterLink to="/terms">{{ t('footer.terms') }}</RouterLink>
      <RouterLink to="/privacy">{{ t('footer.privacy') }}</RouterLink>
    </nav>
    <p class="foot-copy">{{ t('footer.copy', { year }) }}</p>
  </footer>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>
