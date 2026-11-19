<template>
  <section class="page">
    <div class="container">
      <div class="page-head" style="text-align: center; margin-bottom: 48px;">
        <p class="eyebrow">{{ t('faq.eyebrow') }}</p>
        <h1 style="font-size: clamp(32px, 5vw, 48px); font-weight: 800; color: #0f172a; margin-top: 8px;">{{ t('faq.title') }}</h1>
        <p style="font-size: 16px; color: #64748b; margin-top: 12px; max-width: 600px; margin-left: auto; margin-right: auto;">
          {{ t('faq.sub') }}
        </p>
      </div>

      <div class="faq-list" style="max-width: 780px; margin: 0 auto; display: flex; flex-direction: column; gap: 16px; text-align: left;">
        <div
          v-for="(faq, index) in faqs"
          :key="index"
          class="faq-item"
          :class="{ open: openFaqIndex === index }"
          style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 18px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03); transition: all 0.25s ease;"
        >
          <button
            type="button"
            class="faq-question"
            :aria-expanded="openFaqIndex === index"
            @click="toggleFaq(index)"
            style="width: 100%; padding: 20px 24px; background: transparent; border: 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-size: 16px; font-weight: 650; color: #0f172a; text-align: left; cursor: pointer; transition: all 0.2s ease;"
          >
            <span style="font-weight: 650;">{{ faq.q }}</span>
            <span class="faq-toggle-icon" aria-hidden="true" style="font-size: 22px; line-height: 1; color: var(--accent); font-weight: 400; transition: transform 0.2s ease;">{{ openFaqIndex === index ? '−' : '+' }}</span>
          </button>
          <div v-show="openFaqIndex === index" class="faq-answer" style="padding: 0 24px 22px; border-top: 1px solid #f1f5f9;">
            <p style="font-size: 14.5px; line-height: 1.65; color: #475569; margin-top: 14px;">{{ faq.a }}</p>
          </div>
        </div>
      </div>

      <div class="cta-box-simple" style="max-width: 780px; margin: 64px auto 0; padding: 40px; background: #ffffffb0; border: 1px solid #e2e8f0; border-radius: 24px; text-align: center; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.02);">
        <h3 style="font-size: 20px; font-weight: 750; color: #0f172a; margin-bottom: 8px;">{{ t('faq.ctaTitle') }}</h3>
        <p style="font-size: 14px; color: #64748b; margin-bottom: 24px;">{{ t('faq.ctaBody') }}</p>
        <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
          <RouterLink to="/login" class="btn btn-accent" style="padding: 10px 24px; display: inline-flex; align-items: center; gap: 6px;">
            {{ t('faq.ctaStart') }}
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </RouterLink>
          <RouterLink to="/contact" class="btn btn-ghost" style="padding: 10px 24px; border: 1px solid #cbd5e1;">{{ t('faq.ctaContact') }}</RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '@/i18n'

const { t, locale } = useI18n()
const openFaqIndex = ref(0)

const faqs = computed(() => {
  void locale.value
  return [1, 2, 3, 4, 5].map((n) => ({
    q: t(`faq.q${n}`),
    a: t(`faq.a${n}`),
  }))
})

function toggleFaq(index) {
  openFaqIndex.value = openFaqIndex.value === index ? -1 : index
}
</script>

<style scoped>
.faq-item.open {
  border-color: var(--accent) !important;
  box-shadow: 0 10px 25px -5px rgba(var(--accent-rgb, 202, 138, 4), 0.08) !important;
}
.faq-item:hover {
  border-color: #cbd5e1;
}
.faq-item.open:hover {
  border-color: var(--accent);
}
.faq-question:hover {
  color: var(--accent) !important;
}
</style>
