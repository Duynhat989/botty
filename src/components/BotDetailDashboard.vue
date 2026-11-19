<template>
  <div class="b-card b-card-pad-lg panel page-panel dash-panel">
    <div class="dash-head">
      <div>
        <h2 class="b-title-sm panel-title">Dashboard</h2>
        <p class="b-caption panel-intro">Thống kê, webhook đơn chốt và đơn gần đây.</p>
      </div>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm" :disabled="loading" @click="load">
        Làm mới
      </button>
    </div>

    <p v-if="loading" class="b-caption">Đang tải…</p>

    <template v-else-if="stats">
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-val">{{ stats.messagesTotal }}</span>
          <span class="stat-label">Tổng tin nhắn</span>
          <span class="stat-sub">7 ngày: {{ stats.messages7d }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ stats.peersTotal }}</span>
          <span class="stat-label">Khách (luồng)</span>
        </div>
        <div class="stat-card">
          <span class="stat-val">{{ stats.ordersTotal }}</span>
          <span class="stat-label">Đơn chốt</span>
          <span class="stat-sub">7 ngày: {{ stats.orders7d }}</span>
        </div>
        <div class="stat-card" :class="{ warn: stats.webhookFailed > 0 }">
          <span class="stat-val">{{ stats.webhookFailed }}</span>
          <span class="stat-label">Webhook lỗi</span>
        </div>
      </div>
    </template>

    <section class="dash-section">
      <h3 class="dash-section-title">Webhook đơn chốt</h3>
      <p class="b-micro dash-hint">
        Khi bot chốt đơn thành công, Botty POST JSON tới URL của bạn (header
        <code>X-Botty-Signature</code> nếu có secret).
      </p>
      <label class="b-switch order-toggle">
        <input v-model="webhookForm.enabled" type="checkbox" />
        <span class="b-switch-track" aria-hidden="true" />
        Bật webhook đơn chốt
      </label>
      <label class="b-field">
        <span>URL webhook</span>
        <input v-model="webhookForm.url" class="b-input" type="url" placeholder="https://your-app.com/hooks/botty-orders" />
      </label>
      <label class="b-field">
        <span>Secret (tuỳ chọn, HMAC SHA256)</span>
        <input
          v-model="webhookForm.secret"
          class="b-input"
          type="password"
          autocomplete="off"
          placeholder="Nhập mới để thay thế"
        />
        <small v-if="bot.hasOrderWebhookSecret" class="b-micro">Đã lưu secret (masked)</small>
      </label>
      <button type="button" class="b-btn b-btn--primary b-btn--sm" :disabled="webhookSaving" @click="saveWebhook">
        {{ webhookSaving ? 'Đang lưu…' : 'Lưu webhook' }}
      </button>
      <p v-if="webhookMsg" class="b-msg-ok">{{ webhookMsg }}</p>
      <p v-if="webhookErr" class="b-msg-err">{{ webhookErr }}</p>
    </section>

    <section class="dash-section">
      <h3 class="dash-section-title">Đơn chốt gần đây</h3>
      <p v-if="!recentOrders.length" class="b-caption">Chưa có đơn. Bật chốt đơn và để khách xác nhận trong chat.</p>
      <div v-else class="table-wrap">
        <table class="dash-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Kênh</th>
              <th>Tóm tắt</th>
              <th>Webhook</th>
              <th />
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in recentOrders" :key="o.id">
              <td class="mono">{{ formatTime(o.createdAt) }}</td>
              <td>{{ o.channel }}</td>
              <td>{{ o.summary || '—' }}</td>
              <td>
                <span class="wh-badge" :class="o.webhookStatus">{{ webhookLabel(o.webhookStatus) }}</span>
              </td>
              <td>
                <button
                  v-if="o.webhookStatus === 'failed'"
                  type="button"
                  class="link-btn"
                  @click="retryWebhook(o.id)"
                >
                  Gửi lại
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

  </div>
</template>

<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { api } from '@/api'

const props = defineProps({
  bot: { type: Object, required: true },
})

const emit = defineEmits(['reload'])

const loading = ref(true)
const stats = ref(null)
const recentOrders = ref([])
const webhookSaving = ref(false)
const webhookMsg = ref('')
const webhookErr = ref('')

const webhookForm = reactive({
  enabled: false,
  url: '',
  secret: '',
})

function syncWebhookFromBot() {
  webhookForm.enabled = Boolean(props.bot.orderWebhookEnabled)
  webhookForm.url = props.bot.orderWebhookUrl || ''
  webhookForm.secret = ''
}

watch(() => props.bot, syncWebhookFromBot, { immediate: true })

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN', { hour12: false })
  } catch {
    return String(iso)
  }
}

function webhookLabel(status) {
  const map = {
    sent: 'Đã gửi',
    failed: 'Lỗi',
    pending: 'Chờ',
    skipped: 'Tắt',
  }
  return map[status] || status
}

async function load() {
  loading.value = true
  try {
    const data = await api.bots.dashboard(props.bot.id)
    stats.value = data?.stats || null
    recentOrders.value = data?.recentOrders || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function saveWebhook() {
  webhookMsg.value = ''
  webhookErr.value = ''
  webhookSaving.value = true
  try {
    const body = {
      orderWebhookEnabled: webhookForm.enabled,
      orderWebhookUrl: webhookForm.url.trim(),
    }
    if (webhookForm.secret.trim()) {
      body.orderWebhookSecret = webhookForm.secret.trim()
    }
    await api.bots.update(props.bot.id, body)
    webhookForm.secret = ''
    webhookMsg.value = 'Đã lưu cấu hình webhook — đơn chốt mới sẽ gọi webhook'
    emit('reload')
  } catch (e) {
    webhookErr.value = 'Lưu webhook thất bại'
    console.error(e)
  } finally {
    webhookSaving.value = false
  }
}

async function retryWebhook(orderId) {
  try {
    await api.bots.retryOrderWebhook(props.bot.id, orderId)
    await load()
  } catch (e) {
    console.error(e)
  }
}

onMounted(load)
</script>

<style scoped>
.dash-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
}

.stat-card {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--b-border);
  background: var(--b-surface-2);
}

.stat-card.warn {
  border-color: #fecaca;
  background: var(--b-danger-soft);
}

.stat-val {
  display: block;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--b-ink);
}

.stat-label {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-muted);
}

.stat-sub {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: var(--b-muted);
}

.dash-section {
  margin-top: 28px;
  padding-top: 22px;
  border-top: 1px solid var(--b-border);
}

.dash-section-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
}

.dash-hint {
  margin-bottom: 14px;
}

.dash-hint code {
  font-size: 12px;
}

.table-wrap {
  overflow-x: auto;
}

.dash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.dash-table th,
.dash-table td {
  text-align: left;
  padding: 10px 8px;
  border-bottom: 1px solid var(--b-border);
}

.mono {
  font-size: 12px;
  white-space: nowrap;
}

.wh-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--b-surface-2);
}

.wh-badge.sent {
  background: var(--b-accent-soft);
  color: var(--b-accent-hover);
}

.wh-badge.failed {
  background: var(--b-danger-soft);
  color: var(--b-danger);
}

.link-btn {
  border: none;
  background: none;
  font: inherit;
  font-size: 12px;
  color: var(--b-accent);
  cursor: pointer;
}

</style>