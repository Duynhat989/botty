<template>
  <Teleport to="body">
    <div v-if="open" class="ck-root" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="ck-panel b-card">
        <header class="ck-head">
          <h2 class="b-title-sm">Thanh toán gói Botty AI</h2>
          <button type="button" class="ck-close" aria-label="Đóng" @click="emit('close')">×</button>
        </header>

        <p v-if="!order && loading" class="b-caption">Đang tạo đơn…</p>
        <p v-else-if="error" class="b-msg-err">{{ error }}</p>

        <template v-else-if="order">
          <p class="ck-pack">{{ pack?.name }}</p>
          <p class="ck-price">{{ formatVnd(order.amountVnd) }} <span class="b-micro">/ tháng</span></p>
          <p class="b-caption">{{ monthlyLabel }} hội thoại bot / tháng</p>

          <template v-if="order.status === 'pending' && order.payment">
            <div class="qr-wrap">
              <img :src="order.payment.qrUrl" alt="QR chuyển khoản" width="200" height="200" />
            </div>
            <dl class="bank-facts">
              <div><dt>Chủ TK</dt><dd>{{ order.payment.bank.holder }}</dd></div>
              <div><dt>STK</dt><dd class="mono">{{ order.payment.bank.accountNo }}</dd></div>
              <div><dt>Nội dung CK</dt><dd class="mono">{{ order.payment.memo }}</dd></div>
            </dl>
            <p class="b-caption ck-poll">
              <span class="pulse" aria-hidden="true" /> Đang chờ xác nhận chuyển khoản…
            </p>
          </template>
          <p v-else-if="order.status === 'paid'" class="b-msg-ok">Đã kích hoạt gói. Bạn có thể dùng AI Botty ngay.</p>
        </template>

        <footer class="ck-foot">
          <button type="button" class="b-btn b-btn--ghost" @click="emit('close')">Đóng</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { api } from '@/api'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  open: { type: Boolean, default: false },
  pack: { type: Object, default: null },
})

const emit = defineEmits(['close', 'paid'])

const auth = useAuthStore()

const monthlyLabel = computed(() => {
  const p = props.pack
  if (!p) return '—'
  const n = Number(p.monthlyConversations) || (Number(p.dailyConversations) || 0) * 30
  return n.toLocaleString('vi-VN')
})

const order = ref(null)
const loading = ref(false)
const error = ref('')
let pollTimer = null

function formatVnd(n) {
  const v = Number(n) || 0
  return `${v.toLocaleString('vi-VN')}đ`
}

function stopPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

async function refreshOrder() {
  if (!order.value?.uuid && !order.value?.id) return
  const key = order.value.uuid || order.value.id
  const row = await api.orders.get(key)
  order.value = row
  if (row.status === 'paid') {
    stopPoll()
    await auth.refreshUser()
    emit('paid')
  }
}

async function startCheckout() {
  if (!props.pack?.id) return
  loading.value = true
  error.value = ''
  order.value = null
  stopPoll()
  try {
    const row = await api.orders.create(props.pack.id, 'month')
    order.value = row
    pollTimer = setInterval(() => {
      refreshOrder().catch(() => {})
    }, 6000)
  } catch (e) {
    console.error(e)
    error.value = 'Không tạo được đơn thanh toán.'
  } finally {
    loading.value = false
  }
}

watch(
  () => [props.open, props.pack?.id],
  ([isOpen]) => {
    if (isOpen && props.pack) startCheckout()
    else {
      stopPoll()
      order.value = null
      error.value = ''
    }
  },
)

onUnmounted(stopPoll)
</script>

<style scoped>
.ck-root {
  position: fixed;
  inset: 0;
  z-index: 1350;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(4px);
}

.ck-panel {
  width: min(440px, 100%);
  max-height: min(92dvh, 720px);
  overflow-y: auto;
  padding: 20px 18px;
}

.ck-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 12px;
}

.ck-close {
  border: 0;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: var(--b-muted);
}

.ck-pack {
  margin: 0;
  font-weight: 600;
}

.ck-price {
  margin: 4px 0 0;
  font-size: 28px;
  font-weight: 750;
}

.qr-wrap {
  margin: 16px auto;
  display: grid;
  place-items: center;
}

.bank-facts {
  margin: 0;
  display: grid;
  gap: 8px;
  font-size: 13px;
}

.bank-facts dt {
  font-weight: 600;
  color: var(--b-muted);
}

.bank-facts dd {
  margin: 2px 0 0;
}

.mono {
  font-family: ui-monospace, monospace;
}

.ck-poll {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
}

.pulse {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--b-accent);
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 1;
  }
}

.ck-foot {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>