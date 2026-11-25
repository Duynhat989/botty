<template>
  <PicadsPage title="Tài liệu API" :lede="lede">
    <article class="md" v-html="html" />
  </PicadsPage>
</template>

<script setup>
import { computed } from 'vue'
import { markdownToHtml } from '@/utils/simpleMarkdown'
import PicadsPage from '@/components/picads/PicadsPage.vue'
import picadsMarkdown from '@botty-docs/picads.md?raw'

const lede =
  'Tài liệu đóng gói trong frontend (import từ docs/picads.md khi build — không phụ thuộc API server).'

const html = computed(() => markdownToHtml(picadsMarkdown))
</script>

<style scoped>
.md :deep(h1) {
  font-size: 24px;
  margin: 20px 0 10px;
}

.md :deep(h2) {
  font-size: 20px;
  margin: 18px 0 8px;
}

.md :deep(h3) {
  font-size: 16px;
  margin: 14px 0 6px;
}

.md :deep(p),
.md :deep(li) {
  line-height: 1.6;
  color: #334155;
}

.md :deep(pre) {
  background: #0f172a;
  color: #e2e8f0;
  padding: 14px;
  border-radius: 10px;
  overflow: auto;
  font-size: 13px;
}

.md :deep(code) {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 6px;
  font-size: 13px;
}

.md :deep(pre code) {
  background: none;
  padding: 0;
}

.md :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
  font-size: 14px;
}

.md :deep(th),
.md :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 8px 10px;
  text-align: left;
}
</style>