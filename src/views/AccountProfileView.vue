<template>
  <div class="b-studio account-page">
    <header class="head">
      <p class="b-kicker">Tài khoản</p>
      <h1 class="b-title">Trang cá nhân</h1>
      <p class="b-lede b-lede--left">{{ auth.user?.email || '—' }}</p>
    </header>

    <section class="b-card b-card-pad-lg block">
      <h2 class="b-title-sm">Mã PIN</h2>
      <p class="b-caption">
        PIN dùng mã hóa Gemini API key. Đặt lại qua email — mọi key cũ trên bot sẽ bị xóa.
      </p>
      <p v-if="pinMsg" class="ok-hint">{{ pinMsg }}</p>
      <p v-if="pinErr" class="b-msg-err">{{ pinErr }}</p>
      <button
        type="button"
        class="b-btn b-btn--primary b-btn--sm"
        :disabled="pinBusy || !auth.user?.hasGeminiPin"
        @click="requestPinReset"
      >
        {{ pinBusy ? 'Đang gửi…' : 'Gửi email đặt lại PIN' }}
      </button>
      <p v-if="!auth.user?.hasGeminiPin" class="b-micro">Chưa có PIN — popup sẽ hỏi khi cần lưu key.</p>
    </section>

    <section class="b-card b-card-pad-lg block">
      <h2 class="b-title-sm">API key Botty</h2>
      <p class="b-caption">Dùng làm Bearer token gọi API (tối đa 10 key). Chỉ hiện key đầy đủ một lần khi tạo.</p>

      <form class="create-row" @submit.prevent="createKey">
        <input v-model="newKeyName" class="b-input" placeholder="Tên key (vd: Zapier)" maxlength="120" />
        <button type="submit" class="b-btn b-btn--primary b-btn--sm" :disabled="keyBusy">
          {{ keyBusy ? 'Đang tạo…' : 'Tạo key' }}
        </button>
      </form>

      <div v-if="freshKey" class="fresh-key b-card b-card-pad">
        <p class="b-micro">Sao chép ngay — không xem lại được:</p>
        <code class="key-code">{{ freshKey }}</code>
        <button type="button" class="b-btn b-btn--ghost b-btn--sm" @click="copyFresh">Sao chép</button>
      </div>

      <p v-if="keyErr" class="b-msg-err">{{ keyErr }}</p>

      <ul v-if="keys.length" class="key-list">
        <li v-for="k in keys" :key="k.id" class="key-item">
          <div>
            <strong>{{ k.name }}</strong>
            <span class="b-micro">{{ k.keyPrefix }}…</span>
          </div>
          <button type="button" class="text-danger" :disabled="keyBusy" @click="removeKey(k.id)">Thu hồi</button>
        </li>
      </ul>
      <p v-else class="b-muted">Chưa có API key.</p>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/api'

const auth = useAuthStore()
const pinBusy = ref(false)
const pinMsg = ref('')
const pinErr = ref('')
const keys = ref([])
const newKeyName = ref('')
const keyBusy = ref(false)
const keyErr = ref('')
const freshKey = ref('')

async function requestPinReset() {
  pinMsg.value = ''
  pinErr.value = ''
  pinBusy.value = true
  try {
    const data = await api.auth.requestGeminiPinReset()
    pinMsg.value = data?.message || 'Đã gửi email đặt lại PIN.'
  } catch (e) {
    pinErr.value = e?.message || 'Không gửi được email'
  } finally {
    pinBusy.value = false
  }
}

async function loadKeys() {
  keys.value = await api.apiKeys.list()
}

async function createKey() {
  keyErr.value = ''
  freshKey.value = ''
  keyBusy.value = true
  try {
    const data = await api.apiKeys.create(newKeyName.value.trim() || 'Default')
    freshKey.value = data?.key || ''
    newKeyName.value = ''
    await loadKeys()
  } catch (e) {
    keyErr.value = e?.message || 'Không tạo được key'
  } finally {
    keyBusy.value = false
  }
}

async function removeKey(id) {
  keyBusy.value = true
  keyErr.value = ''
  try {
    await api.apiKeys.remove(id)
    await loadKeys()
  } catch (e) {
    keyErr.value = e?.message || 'Không xóa được'
  } finally {
    keyBusy.value = false
  }
}

function copyFresh() {
  if (freshKey.value) navigator.clipboard?.writeText(freshKey.value)
}

onMounted(() => {
  loadKeys().catch(() => {})
})
</script>

<style scoped>
.account-page {
  max-width: 640px;
}

.head {
  margin-bottom: 24px;
}

.block {
  margin-bottom: 20px;
  display: grid;
  gap: 12px;
}

.create-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.create-row .b-input {
  flex: 1;
  min-width: 180px;
}

.fresh-key {
  border: 1px solid var(--b-accent-border);
  background: var(--b-accent-soft);
}

.key-code {
  display: block;
  word-break: break-all;
  font-size: 13px;
  margin: 8px 0;
}

.key-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.key-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid var(--b-border);
}

.ok-hint {
  color: var(--b-accent-hover);
  margin: 0;
}
</style>