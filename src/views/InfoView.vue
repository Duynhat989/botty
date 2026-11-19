<template>
  <section class="page">
    <div class="container page-head">
      <p class="eyebrow">{{ page.kicker }}</p>
      <h1>{{ page.title }}</h1>
      <p v-for="paragraph in page.paragraphs" :key="paragraph">{{ paragraph }}</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'

const route = useRoute()
const { t, locale } = useI18n()

const page = computed(() => {
  void locale.value
  const name = route.name
  if (name === 'privacy') {
    return {
      kicker: t('info.privacyKicker'),
      title: t('info.privacyTitle'),
      paragraphs: [t('info.privacy1'), t('info.privacy2'), t('info.privacy3')],
    }
  }
  if (name === 'affiliate') {
    return {
      kicker: t('info.affiliateKicker'),
      title: t('info.affiliateTitle'),
      paragraphs: [t('info.affiliate1'), t('info.affiliate2')],
    }
  }
  if (name === 'contact') {
    return {
      kicker: t('info.contactKicker'),
      title: t('info.contactTitle'),
      paragraphs: [t('info.contact1'), t('info.contact2')],
    }
  }
  return {
    kicker: t('info.termsKicker'),
    title: t('info.termsTitle'),
    paragraphs: [t('info.terms1'), t('info.terms2'), t('info.terms3')],
  }
})
</script>
