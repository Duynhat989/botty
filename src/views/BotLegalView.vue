<template>
  <div class="b-studio legal-page">
    <header class="head">
      <p class="b-kicker">{{ page.kicker }}</p>
      <h1 class="b-title">{{ page.title }}</h1>
      <p v-if="page.lede" class="b-lede b-lede--left">{{ page.lede }}</p>
      <p class="b-micro legal-updated">{{ page.updated }}</p>
    </header>

    <article class="legal-card b-card b-card-pad-lg">
      <ol class="legal-list">
        <li v-for="(paragraph, idx) in page.paragraphs" :key="idx">
          {{ paragraph }}
        </li>
      </ol>

      <footer class="legal-foot">
        <RouterLink to="/contact" class="b-btn b-btn--ghost b-btn--sm">
          {{ t('info.contactCta') }}
        </RouterLink>
        <RouterLink
          v-if="route.name === 'terms'"
          to="/privacy"
          class="legal-cross"
        >
          {{ t('info.toPrivacy') }}
        </RouterLink>
        <RouterLink v-else to="/terms" class="legal-cross">
          {{ t('info.toTerms') }}
        </RouterLink>
      </footer>
    </article>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { te, t, useI18n } from '@/i18n'

const route = useRoute()
const { locale } = useI18n()

function paragraphKeys(base) {
  const out = []
  for (let i = 1; i <= 8; i += 1) {
    const key = `info.${base}${i}`
    if (!te(key)) break
    out.push(t(key))
  }
  return out
}

const page = computed(() => {
  void locale.value
  if (route.name === 'privacy') {
    return {
      kicker: t('info.privacyKicker'),
      title: t('info.privacyTitle'),
      lede: t('info.privacyLede'),
      updated: t('info.legalUpdated'),
      paragraphs: paragraphKeys('privacy'),
    }
  }
  return {
    kicker: t('info.termsKicker'),
    title: t('info.termsTitle'),
    lede: t('info.termsLede'),
    updated: t('info.legalUpdated'),
    paragraphs: paragraphKeys('terms'),
  }
})
</script>

<style scoped>
.legal-page {
  max-width: 720px;
  margin: 0 auto;
  padding-bottom: 2.5rem;
}

.head {
  margin-bottom: 1.25rem;
}

.legal-updated {
  margin: 0.75rem 0 0;
  color: var(--b-muted);
}

.legal-card {
  margin-top: 0.5rem;
}

.legal-list {
  margin: 0;
  padding-left: 1.25rem;
  display: grid;
  gap: 14px;
  color: var(--b-ink-secondary);
  font-size: 15px;
  line-height: 1.65;
}

.legal-list li::marker {
  color: var(--b-accent);
  font-weight: 700;
}

.legal-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--b-border);
}

.legal-cross {
  font-size: 14px;
  font-weight: 600;
  color: var(--b-accent-hover);
  text-decoration: none;
}

.legal-cross:hover {
  text-decoration: underline;
}
</style>