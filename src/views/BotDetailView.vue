<template>
  <div v-if="loading" class="b-studio detail-loading">
    <div class="load-card b-card b-card-pad">
      <div class="load-shimmer title" />
      <div class="load-shimmer line" />
      <div class="load-shimmer line short" />
    </div>
  </div>

  <div v-else-if="!bot" class="b-studio">
    <div class="b-card b-card-pad empty-state">
    <p class="b-muted">Không tìm thấy bot.</p>
    <RouterLink to="/" class="b-btn b-btn--ghost">Về trang chủ</RouterLink>
    </div>
  </div>

  <BotDetailPanel v-else :bot="bot" :documents="documents" @reload="load" />
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { api } from '@/api'
import BotDetailPanel from './BotDetailPanel.vue'

const route = useRoute()
const router = useRouter()
const bot = ref(null)
const documents = ref([])
const loading = ref(true)

const botId = computed(() => route.params.id)

async function load() {
  loading.value = true
  try {
    const data = await api.bots.get(botId.value)
    bot.value = data.bot
    documents.value = data.documents || []
    if (data.bot?.id && route.params.id !== data.bot.id) {
      const tab = route.params.tab || 'test'
      router.replace({ name: 'bot-detail', params: { id: data.bot.id, tab } })
    }
  } catch (e) {
    bot.value = null
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<style scoped>
.empty-state {
  display: grid;
  gap: 1rem;
}

.detail-loading .load-card {
  display: grid;
  gap: 12px;
}

.load-shimmer {
  height: 14px;
  border-radius: 8px;
  background: linear-gradient(90deg, #eef2f0 0%, #f8faf9 50%, #eef2f0 100%);
  background-size: 200% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.load-shimmer.title {
  height: 28px;
  width: 55%;
}

.load-shimmer.line.short {
  width: 40%;
}

@keyframes shimmer {
  0% { background-position: 100% 0; }
  100% { background-position: -100% 0; }
}
</style>