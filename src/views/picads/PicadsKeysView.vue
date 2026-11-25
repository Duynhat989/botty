<template>
  <PicadsPage title="API keys" lede="Key tiền tố picads_ — lọc theo nhãn hiển thị.">
    <section class="card">
      <form class="filter" @submit.prevent="load">
        <input v-model="filter" type="search" placeholder="Lọc theo apiKey (VD: picads_a1)" />
        <button type="submit" class="btn">Lọc</button>
        <button v-if="filter" type="button" class="btn-ghost" @click="clearFilter">Xóa lọc</button>
      </form>
      <p v-if="err" class="err">{{ err }}</p>
      <ul v-if="keys.length" class="list">
        <li v-for="k in keys" :key="k.id">
          <strong>{{ k.name }}</strong>
          <code>{{ k.apiKey }}…</code>
          <span class="muted">{{ k.active ? 'Hoạt động' : 'Thu hồi' }}</span>
        </li>
      </ul>
      <p v-else-if="!loading" class="muted">Không có key.</p>
    </section>
  </PicadsPage>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { api, ApiError } from '@/api'
import PicadsPage from '@/components/picads/PicadsPage.vue'

const filter = ref('')
const keys = ref([])
const loading = ref(false)
const err = ref('')

async function load() {
  err.value = ''
  loading.value = true
  try {
    const data = await api.picads.keys(filter.value ? { apiKey: filter.value.trim() } : {})
    keys.value = data.keys || []
  } catch (e) {
    err.value = e instanceof ApiError ? e.messageCode : 'Không tải được keys.'
  } finally {
    loading.value = false
  }
}

function clearFilter() {
  filter.value = ''
  load()
}

onMounted(load)
</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 20px;
}

.filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.filter input {
  flex: 1;
  min-width: 200px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
}

.btn {
  border: 0;
  border-radius: 10px;
  padding: 10px 14px;
  background: #4f46e5;
  color: #fff;
  cursor: pointer;
}

.btn-ghost {
  border: 1px solid #e2e8f0;
  background: #fff;
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.list li {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
}

code {
  background: #f1f5f9;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
}

.muted {
  color: #64748b;
  font-size: 13px;
}

.err {
  color: #b91c1c;
}
</style>