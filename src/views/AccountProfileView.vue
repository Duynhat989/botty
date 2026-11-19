<template>
  <div class="b-studio account-page account-studio">
    <header class="page-head">
      <p class="b-kicker">Tài khoản</p>
      <h1 class="b-title">Trang cá nhân</h1>
      <p class="b-lede b-lede--left">Quản lý thông tin, bảo mật và API key Botty.</p>
    </header>

    <div class="account-layout">
      <aside class="account-side" aria-label="Mục tài khoản">
        <div class="user-chip">
          <img
            v-if="auth.user?.avatar"
            :src="auth.user.avatar"
            alt=""
            class="avatar"
            width="48"
            height="48"
          />
          <div v-else class="avatar placeholder">{{ initials }}</div>
          <div class="chip-text">
            <strong>{{ auth.user?.name || '—' }}</strong>
            <span class="b-micro">{{ auth.user?.email }}</span>
          </div>
        </div>

        <nav class="side-nav">
          <button
            v-for="item in navItems"
            :key="item.id"
            type="button"
            class="side-link"
            :class="{ on: section === item.id }"
            @click="goSection(item.id)"
          >
            {{ item.label }}
          </button>
        </nav>

        <RouterLink v-if="auth.isAdmin" to="/admin" class="b-btn b-btn--ghost b-btn--sm side-admin">
          Quản trị
        </RouterLink>
      </aside>

      <main class="account-main">
        <!-- Thông tin cá nhân -->
        <section v-show="section === 'profile'" id="account-profile" class="panel b-card b-card-pad-lg">
          <h2 class="b-title-sm panel-title">Thông tin cá nhân</h2>
          <p class="b-caption panel-lede">Cập nhật họ tên và số điện thoại liên hệ.</p>

          <form class="profile-form" @submit.prevent="saveProfile">
            <label class="b-field">
              <span>Email</span>
              <input class="b-input" type="email" :value="auth.user?.email || ''" disabled />
              <small class="b-micro">Email lấy từ đăng nhập Google/Facebook — không đổi tại đây.</small>
            </label>
            <label class="b-field">
              <span>Họ tên</span>
              <input v-model="profileForm.name" class="b-input" required maxlength="255" autocomplete="name" />
            </label>
            <label class="b-field">
              <span>Số điện thoại</span>
              <input
                v-model="profileForm.phone"
                class="b-input"
                type="tel"
                inputmode="tel"
                maxlength="20"
                placeholder="VD: 0901234567 hoặc +84901234567"
                autocomplete="tel"
              />
            </label>

            <dl class="meta-grid">
              <div>
                <dt>Vai trò</dt>
                <dd>{{ auth.user?.role === 'admin' ? 'Quản trị' : 'Người dùng' }}</dd>
              </div>
              <div>
                <dt>Đăng nhập qua</dt>
                <dd>{{ providerLabel }}</dd>
              </div>
              <div>
                <dt>Tham gia</dt>
                <dd>{{ joinedLabel }}</dd>
              </div>
              <div v-if="botQuotaText">
                <dt>Bot của bạn</dt>
                <dd>{{ botQuotaText }}</dd>
              </div>
            </dl>

            <p v-if="profileErr" class="b-msg-err">{{ profileErr }}</p>
            <p v-if="profileOk" class="ok-hint">{{ profileOk }}</p>
            <button type="submit" class="b-btn b-btn--primary b-btn--sm" :disabled="profileSaving">
              {{ profileSaving ? 'Đang lưu…' : 'Lưu thông tin' }}
            </button>
          </form>
        </section>

        <!-- Gói Botty -->
        <section v-show="section === 'plan'" id="account-plan" class="panel b-card b-card-pad-lg">
          <h2 class="b-title-sm panel-title">Gói Botty AI</h2>
          <p class="b-caption panel-lede">Gói đang áp dụng cho tài khoản và hạn mức bot.</p>

          <dl class="meta-grid plan-grid">
            <div>
              <dt>Gói hiện tại</dt>
              <dd>{{ planName }}</dd>
            </div>
            <div>
              <dt>Trạng thái</dt>
              <dd>{{ planStatus }}</dd>
            </div>
            <div v-if="planExpires">
              <dt>Hết hạn</dt>
              <dd>{{ planExpires }}</dd>
            </div>
          </dl>
          <RouterLink to="/pricing" class="b-btn b-btn--primary b-btn--sm">Xem gói cước</RouterLink>
        </section>

        <!-- PIN -->
        <section v-show="section === 'security'" id="account-security" class="panel b-card b-card-pad-lg">
          <h2 class="b-title-sm panel-title">Bảo mật — mã PIN</h2>
          <p class="b-caption panel-lede">
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

        <!-- API keys -->
        <section v-show="section === 'api-keys'" id="account-api-keys" class="panel b-card b-card-pad-lg">
          <h2 class="b-title-sm panel-title">API key Botty</h2>
          <p class="b-caption panel-lede">
            Dùng làm Bearer token gọi API (tối đa 10 key). Chỉ hiện key đầy đủ một lần khi tạo.
          </p>

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

        <!-- Liên hệ -->
        <section v-show="section === 'support'" id="account-support" class="panel b-card b-card-pad-lg">
          <h2 class="b-title-sm panel-title">Hỗ trợ</h2>
          <p class="b-caption panel-lede">Báo cáo sự cố hoặc liên hệ đội Botty.</p>
          <RouterLink to="/contact#incident-report" class="b-btn b-btn--primary b-btn--sm">
            Báo cáo sự cố
          </RouterLink>
          <RouterLink to="/contact" class="b-btn b-btn--ghost b-btn--sm">Trang liên hệ</RouterLink>
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api, ApiError, apiMessage } from '@/api'

const SECTION_IDS = ['profile', 'plan', 'security', 'api-keys', 'support']

const navItems = [
  { id: 'profile', label: 'Thông tin' },
  { id: 'plan', label: 'Gói Botty' },
  { id: 'security', label: 'Bảo mật' },
  { id: 'api-keys', label: 'API key' },
  { id: 'support', label: 'Hỗ trợ' },
]

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const section = ref('profile')

const profileForm = reactive({ name: '', phone: '' })
const profileSaving = ref(false)
const profileErr = ref('')
const profileOk = ref('')

const pinBusy = ref(false)
const pinMsg = ref('')
const pinErr = ref('')

const keys = ref([])
const newKeyName = ref('')
const keyBusy = ref(false)
const keyErr = ref('')
const freshKey = ref('')

const botQuota = ref(null)

const initials = computed(() => {
  const n = String(auth.user?.name || '?').trim()
  return n.slice(0, 1).toUpperCase()
})

const providerLabel = computed(() => {
  const p = auth.user?.providers
  if (!p) return '—'
  const parts = []
  if (p.google) parts.push('Google')
  if (p.facebook) parts.push('Facebook')
  return parts.length ? parts.join(', ') : '—'
})

const joinedLabel = computed(() => {
  const raw = auth.user?.createdAt
  if (!raw) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(raw))
  } catch {
    return '—'
  }
})

const botQuotaText = computed(() => {
  const q = botQuota.value || auth.user?.botQuota
  if (!q) return ''
  if (q.unlimited) return 'Không giới hạn bot'
  if (q.limit != null) return `${q.current ?? 0} / ${q.limit} bot`
  return ''
})

const plan = computed(() => auth.user?.bottyPlan || {})

const planName = computed(() => plan.value.packageName || plan.value.packageCode || 'Chưa có gói trả phí')

const planStatus = computed(() => {
  if (plan.value.active) return 'Đang hoạt động'
  if (plan.value.packageCode) return 'Hết hạn hoặc chưa kích hoạt'
  return 'Dùng gói miễn phí'
})

const planExpires = computed(() => {
  const raw = plan.value.expiresAt
  if (!raw) return ''
  try {
    return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' }).format(new Date(raw))
  } catch {
    return ''
  }
})

function resolveSectionFromRoute() {
  const h = String(route.hash || '').replace(/^#/, '')
  if (SECTION_IDS.includes(h)) return h
  return 'profile'
}

function goSection(id) {
  section.value = id
  router.replace({ hash: `#${id}` })
}

function syncProfileForm() {
  profileForm.name = auth.user?.name || ''
  profileForm.phone = auth.user?.phone || ''
}

watch(
  () => auth.user,
  () => {
    syncProfileForm()
  },
  { immediate: true, deep: true },
)

watch(
  () => route.hash,
  () => {
    section.value = resolveSectionFromRoute()
  },
)

async function saveProfile() {
  profileErr.value = ''
  profileOk.value = ''
  profileSaving.value = true
  try {
    await api.auth.updateProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
    })
    const data = await auth.refreshUser()
    botQuota.value = data?.botQuota ?? null
    profileOk.value = 'Đã lưu thông tin.'
    syncProfileForm()
  } catch (e) {
    profileErr.value = e instanceof ApiError ? apiMessage(e) : e?.message || 'Không lưu được'
  } finally {
    profileSaving.value = false
  }
}

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

onMounted(async () => {
  section.value = resolveSectionFromRoute()
  syncProfileForm()
  try {
    const me = await auth.refreshUser()
    botQuota.value = me?.botQuota ?? null
    syncProfileForm()
  } catch {
    /* ignore */
  }
  loadKeys().catch(() => {})
})
</script>

<style scoped>
.account-page {
  max-width: 1040px;
}

.account-studio .page-head :is(.b-kicker, .b-title, .b-lede) {
  text-align: left;
}

.page-head {
  margin-bottom: 24px;
}

.account-layout {
  display: grid;
  grid-template-columns: minmax(200px, 260px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.account-side {
  position: sticky;
  top: 80px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--b-border);
  background: var(--color-surface);
  box-shadow: var(--b-shadow);
  overflow: hidden;
}

.user-chip {
  display: flex;
  gap: 12px;
  align-items: center;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  object-fit: cover;
  flex-shrink: 0;
}

.avatar.placeholder {
  display: grid;
  place-items: center;
  background: var(--b-accent-soft);
  color: var(--b-accent);
  font-weight: 700;
  font-size: 18px;
}

.chip-text {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.chip-text strong {
  font-size: 14px;
  line-height: 1.3;
  word-break: break-word;
}

.chip-text .b-micro {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.side-link {
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  border-radius: 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--b-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.side-link:hover {
  background: var(--b-surface-2);
  color: var(--b-ink);
}

.side-link.on {
  background: var(--b-accent-soft);
  color: var(--b-accent);
  font-weight: 600;
}

.side-admin {
  display: flex;
  box-sizing: border-box;
  width: 100%;
  justify-content: center;
  text-decoration: none;
  margin-top: auto;
}

.account-main {
  min-width: 0;
}

.panel {
  display: grid;
  gap: 14px;
}

.panel-title {
  margin: 0;
}

.panel-lede {
  margin: -6px 0 4px;
}

.profile-form {
  display: grid;
  gap: 14px;
}

.meta-grid {
  display: grid;
  gap: 12px 20px;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  margin: 4px 0 0;
  padding: 14px 16px;
  border-radius: 12px;
  background: var(--b-surface-2);
  border: 1px solid var(--b-border);
}

.meta-grid dt {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--b-muted);
}

.meta-grid dd {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--b-ink);
}

.plan-grid {
  margin-bottom: 8px;
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

.text-danger {
  border: none;
  background: none;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--b-danger);
  cursor: pointer;
}

.ok-hint {
  color: var(--b-accent-hover);
  margin: 0;
}

#account-support .b-btn {
  width: fit-content;
}

@media (max-width: 800px) {
  .account-layout {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .account-side {
    position: static;
    padding: 12px 14px;
    gap: 12px;
  }

  .user-chip {
    padding-bottom: 10px;
    border-bottom: 1px solid var(--b-border);
  }

  .side-nav {
    flex-direction: row;
    flex-wrap: nowrap;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 2px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .side-link {
    flex: 0 0 auto;
    white-space: nowrap;
    padding: 8px 14px;
    border: 1px solid var(--b-border);
    background: var(--b-surface-2);
  }

  .side-link.on {
    border-color: color-mix(in srgb, var(--b-accent) 35%, var(--b-border));
  }

  .side-admin {
    margin-top: 0;
  }
}
</style>