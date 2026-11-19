<template>
  <section class="page">
    <div class="container page-head">
      <p class="eyebrow">{{ t('missing.code') }}</p>
      <h1>{{ t('missing.title') }}</h1>
      <RouterLink class="btn btn-accent" to="/" style="margin-top: 18px">{{ t('missing.cta') }}</RouterLink>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>
