<template>
  <PicadsPage title="Tài liệu API" lede="Nội dung đồng bộ từ docs/picads.md trên server.">
    <p v-if="err" class="err">{{ err }}</p>
    <p v-if="loading" class="muted">Đang tải tài liệu…</p>
    <article v-if="html" class="md" v-html="html" />
  </PicadsPage>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { api, ApiError } from '@/api'
import { markdownToHtml } from '@/utils/simpleMarkdown'
import PicadsPage from '@/components/picads/PicadsPage.vue'

const markdown = ref('')
const loading = ref(false)
const err = ref('')

const html = computed(() => (markdown.value ? markdownToHtml(markdown.value) : ''))

async function load() {
  err.value = ''
  loading.value = true
  try {
    const data = await api.picads.docs()
    markdown.value = data.markdown || ''
  } catch (e) {
    err.value = e instanceof ApiError ? 'Không tải được tài liệu.' : 'Lỗi mạng.'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.err {
  color: #b91c1c;
}

.muted {
  color: #64748b;
}

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