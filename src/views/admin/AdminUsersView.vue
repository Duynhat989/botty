<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.usersTitle') }}</h1>
        <p>{{ t('admin.usersLede') }}</p>
      </div>
    </header>

    <div class="toolbar">
      <input v-model="q" type="search" :placeholder="t('admin.searchUser')" @keydown.enter="reload(1)" />
      <select v-model="status">
        <option value="">{{ t('admin.filterAllStatus') }}</option>
        <option value="active">{{ t('admin.statusActive') }}</option>
        <option value="locked">{{ t('admin.statusLocked') }}</option>
      </select>
      <select v-model="role">
        <option value="">{{ t('admin.filterAllRole') }}</option>
        <option value="user">user</option>
        <option value="admin">admin</option>
      </select>
      <button type="button" class="primary" :disabled="loading" @click="reload(1)">{{ t('admin.apply') }}</button>
    </div>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="notice" class="hint ok">{{ notice }}</p>
    <p v-if="loading" class="hint">{{ t('admin.loading') }}</p>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>{{ t('admin.colUser') }}</th>
            <th>{{ t('admin.colRole') }}</th>
            <th>{{ t('admin.colStatus') }}</th>
            <th>{{ t('admin.colCredits') }}</th>
            <th>{{ t('admin.colCreated') }}</th>
            <th>{{ t('admin.colActions') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <td>{{ item.id }}</td>
            <td>
              <strong>{{ item.name }}</strong>
              <span>{{ item.email }}</span>
            </td>
            <td>{{ item.role }}</td>
            <td>
              <span :class="item.status === 'locked' ? 'pill locked' : 'pill'">
                {{ item.status === 'locked' ? t('admin.statusLocked') : t('admin.statusActive') }}
              </span>
            </td>
            <td>{{ item.credits }}</td>
            <td>{{ formatWhen(item.createdAt) }}</td>
            <td>
              <div class="user-menu">
                <button
                  type="button"
                  class="menu-trigger"
                  :aria-label="t('admin.userActionsAria')"
                  :aria-expanded="menuId === item.id"
                  @click.stop="toggleMenu(item, $event)"
                >
                  ⋮
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!loading && !items.length" class="hint">{{ t('admin.emptyUsers') }}</p>
    </div>

    <AdminPager :meta="meta" :loading="loading" @change="reload" />

    <Teleport to="body">
      <div
        v-if="menuItem"
        class="admin-menu-pop"
        role="menu"
        :style="menuStyle"
        @click.stop
      >
        <button type="button" role="menuitem" @click="openDetail(menuItem)">
          {{ t('admin.viewUserDetail') }}
        </button>
        <button type="button" role="menuitem" @click="openEdit(menuItem)">
          {{ t('admin.editUser') }}
        </button>
        <button
          type="button"
          role="menuitem"
          :disabled="!menuItem.email || saving"
          @click="openEmail(menuItem)"
        >
          {{ t('admin.sendEmailUser') }}
        </button>
        <button
          type="button"
          role="menuitem"
          :disabled="!menuItem.email || saving"
          @click="onRenew(menuItem)"
        >
          {{ t('admin.sendRenewEmail') }}
        </button>
        <button
          type="button"
          role="menuitem"
          :disabled="!menuItem.email || saving"
          @click="onWarn(menuItem)"
        >
          {{ t('admin.sendWarnEmailUser') }}
        </button>
        <button
          type="button"
          role="menuitem"
          :disabled="saving"
          @click="onToggleLock(menuItem)"
        >
          {{ menuItem.status === 'locked' ? t('admin.unlock') : t('admin.lockForever') }}
        </button>
        <button
          type="button"
          role="menuitem"
          class="danger"
          :disabled="saving"
          @click="onDelete(menuItem)"
        >
          {{ t('admin.deleteForever') }}
        </button>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="detailUser"
        class="admin-modal-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t('admin.userDetailTitle')"
      >
        <button class="admin-modal-backdrop" type="button" :aria-label="t('common.close')" @click="closeDetail" />
        <div class="admin-modal-panel">
          <header class="admin-modal-head">
            <div>
              <strong>{{ t('admin.userDetailTitle') }}</strong>
              <span>{{ detailUser.name }} · {{ detailUser.email }}</span>
            </div>
            <button type="button" class="admin-modal-close" :aria-label="t('common.close')" @click="closeDetail">×</button>
          </header>
          <dl class="admin-detail-grid">
            <div>
              <dt>{{ t('admin.colRole') }}</dt>
              <dd>{{ detailUser.role }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.colStatus') }}</dt>
              <dd>{{ detailUser.status === 'locked' ? t('admin.statusLocked') : t('admin.statusActive') }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.colCredits') }}</dt>
              <dd>{{ detailUser.credits }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.userWarnEmails') }}</dt>
              <dd>{{ detailUser.warnEmailCount ?? 0 }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.userViolationVideos') }}</dt>
              <dd>{{ detailUser.violationCount ?? 0 }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.userVideoCount') }}</dt>
              <dd>{{ detailUser.videoCount ?? 0 }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.userLastPackage') }}</dt>
              <dd>{{ detailUser.lastPackageName || '—' }}</dd>
            </div>
            <div>
              <dt>{{ t('admin.colCreated') }}</dt>
              <dd>{{ formatWhen(detailUser.createdAt) }}</dd>
            </div>
          </dl>
          <div class="admin-modal-actions">
            <button type="button" class="primary" @click="closeDetail">{{ t('common.close') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="editItem"
        class="admin-modal-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t('admin.editUserTitle')"
      >
        <button class="admin-modal-backdrop" type="button" :aria-label="t('common.close')" @click="closeEdit" />
        <div class="admin-modal-panel">
          <header class="admin-modal-head">
            <strong>{{ t('admin.editUserTitle') }}</strong>
            <button type="button" class="admin-modal-close" :aria-label="t('common.close')" @click="closeEdit">×</button>
          </header>
          <label>
            <span>{{ t('admin.userName') }}</span>
            <input v-model="editForm.name" type="text" maxlength="255" />
          </label>
          <label>
            <span>{{ t('admin.colRole') }}</span>
            <select v-model="editForm.role">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            <span>{{ t('admin.colStatus') }}</span>
            <select v-model="editForm.status">
              <option value="active">{{ t('admin.statusActive') }}</option>
              <option value="locked">{{ t('admin.statusLocked') }}</option>
            </select>
          </label>
          <label>
            <span>{{ t('admin.colCredits') }}</span>
            <input v-model.number="editForm.credits" type="number" min="0" />
          </label>
          <div class="admin-modal-actions">
            <button type="button" class="ghost" @click="closeEdit">{{ t('common.cancel') }}</button>
            <button type="button" class="primary" :disabled="saving" @click="saveEdit">
              {{ t('admin.saveUser') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="emailItem"
        class="admin-modal-root"
        role="dialog"
        aria-modal="true"
        :aria-label="t('admin.sendEmailUser')"
      >
        <button class="admin-modal-backdrop" type="button" :aria-label="t('common.close')" @click="closeEmail" />
        <div class="admin-modal-panel">
          <header class="admin-modal-head">
            <div>
              <strong>{{ t('admin.sendEmailUser') }}</strong>
              <span>{{ emailItem.email }}</span>
            </div>
            <button type="button" class="admin-modal-close" :aria-label="t('common.close')" @click="closeEmail">×</button>
          </header>
          <label>
            <span>{{ t('admin.emailSubject') }}</span>
            <input v-model="emailForm.subject" type="text" maxlength="200" :placeholder="t('admin.emailSubjectPh')" />
          </label>
          <label>
            <span>{{ t('admin.emailBody') }}</span>
            <textarea
              v-model="emailForm.body"
              rows="7"
              maxlength="5000"
              :placeholder="t('admin.emailBodyPh')"
            />
          </label>
          <div class="admin-modal-actions">
            <button type="button" class="ghost" @click="closeEmail">{{ t('common.cancel') }}</button>
            <button type="button" class="primary" :disabled="saving" @click="sendEmail">
              {{ t('admin.sendEmail') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/api'
import { ApiError } from '@/api/client'
import { apiMessage } from '@/api/messages'
import { useI18n } from '@/i18n'
import { useConfirm } from '@/composables/useConfirm'
import { formatWhen } from '@/utils/format'
import AdminPager from '@/components/AdminPager.vue'
import './admin-shared.css'

const { t } = useI18n()
const { confirm } = useConfirm()
const items = ref([])
const meta = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const notice = ref('')
const q = ref('')
const status = ref('')
const role = ref('')
const menuId = ref(null)
const menuItem = ref(null)
const menuStyle = ref({})
const editItem = ref(null)
const editForm = ref({ name: '', role: 'user', status: 'active', credits: 0 })
const emailItem = ref(null)
const emailForm = ref({ subject: '', body: '' })
const detailUser = ref(null)

function toggleMenu(item, event) {
  if (menuId.value === item.id) {
    closeMenu()
    return
  }
  const rect = event.currentTarget.getBoundingClientRect()
  const menuWidth = 220
  const estimatedHeight = 260
  const spaceBelow = window.innerHeight - rect.bottom
  const openUp = spaceBelow < estimatedHeight && rect.top > spaceBelow
  const left = Math.min(
    Math.max(8, rect.right - menuWidth),
    window.innerWidth - menuWidth - 8,
  )
  menuStyle.value = openUp
    ? { top: `${Math.max(8, rect.top - 4)}px`, left: `${left}px`, transform: 'translateY(-100%)' }
    : { top: `${rect.bottom + 4}px`, left: `${left}px`, transform: 'none' }
  menuId.value = item.id
  menuItem.value = item
}

function closeMenu() {
  menuId.value = null
  menuItem.value = null
}

function onDocClick(e) {
  if (e.target?.closest?.('.user-menu') || e.target?.closest?.('.admin-menu-pop')) return
  closeMenu()
}

function onScrollOrResize() {
  closeMenu()
}

function onKeydown(e) {
  if (e.key !== 'Escape') return
  closeMenu()
  closeEdit()
  closeEmail()
  closeDetail()
}

async function openDetail(item) {
  closeMenu()
  saving.value = true
  error.value = ''
  try {
    detailUser.value = await api.admin.getUser(item.id)
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    saving.value = false
  }
}

function closeDetail() {
  detailUser.value = null
}

async function reload(page = 1) {
  loading.value = true
  error.value = ''
  closeMenu()
  try {
    const data = await api.admin.users({
      page,
      limit: 20,
      q: q.value || undefined,
      status: status.value || undefined,
      role: role.value || undefined,
    })
    items.value = data.items || []
    meta.value = data.meta || null
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errLoad') : t('admin.errLoad')
  } finally {
    loading.value = false
  }
}

function openEdit(item) {
  closeMenu()
  editItem.value = item
  editForm.value = {
    name: item.name || '',
    role: item.role || 'user',
    status: item.status || 'active',
    credits: Number(item.credits) || 0,
  }
}

function closeEdit() {
  editItem.value = null
}

async function saveEdit() {
  if (!editItem.value) return
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const updated = await api.admin.updateUser(editItem.value.id, {
      name: editForm.value.name,
      role: editForm.value.role,
      status: editForm.value.status,
      credits: Number(editForm.value.credits),
    })
    items.value = items.value.map((row) => (row.id === updated.id ? updated : row))
    notice.value = t('admin.userSavedOk')
    closeEdit()
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

function openEmail(item) {
  closeMenu()
  emailItem.value = item
  emailForm.value = { subject: '', body: '' }
}

function closeEmail() {
  emailItem.value = null
}

async function sendEmail() {
  if (!emailItem.value) return
  const subject = emailForm.value.subject.trim()
  const body = emailForm.value.body.trim()
  if (!subject || !body) {
    error.value = t('admin.emailFieldsRequired')
    return
  }
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await api.admin.emailUser(emailItem.value.id, { subject, body })
    notice.value = result?.simulated
      ? t('admin.emailSentSimulated', { email: emailItem.value.email })
      : t('admin.emailSentOk', { email: emailItem.value.email })
    closeEmail()
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

async function onRenew(item) {
  closeMenu()
  if (!item.email) return
  const ok = await confirm({
    title: t('admin.sendRenewEmail'),
    message: t('admin.confirmRenewAccount', { email: item.email }),
    confirmLabel: t('admin.sendEmail'),
    danger: false,
  })
  if (!ok) return
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await api.admin.renewReminderUser(item.id)
    notice.value = result?.simulated
      ? t('admin.renewSentSimulated', { email: item.email })
      : t('admin.renewSentOk', { email: item.email })
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

async function onWarn(item) {
  closeMenu()
  if (!item.email) return
  const ok = await confirm({
    title: t('admin.sendWarnEmailUser'),
    message: t('admin.confirmWarnAccount', { email: item.email }),
    confirmLabel: t('admin.sendEmail'),
    danger: false,
  })
  if (!ok) return
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const result = await api.admin.warnUser(item.id)
    notice.value = result?.simulated
      ? t('admin.emailSentSimulated', { email: item.email })
      : t('admin.warnUserOk', { email: item.email })
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

async function onToggleLock(item) {
  closeMenu()
  const locking = item.status !== 'locked'
  const ok = await confirm({
    title: locking ? t('admin.lockForever') : t('admin.unlock'),
    message: locking
      ? t('admin.confirmLockAccount', { name: item.name, email: item.email })
      : t('admin.confirmUnlockAccount', { name: item.name, email: item.email }),
    confirmLabel: locking ? t('admin.lockForever') : t('admin.unlock'),
  })
  if (!ok) return
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    const updated = await api.admin.updateUser(item.id, {
      status: locking ? 'locked' : 'active',
    })
    items.value = items.value.map((row) => (row.id === updated.id ? updated : row))
    notice.value = locking ? t('admin.lockUserOk') : t('admin.unlockUserOk')
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

async function onDelete(item) {
  closeMenu()
  const ok = await confirm({
    title: t('admin.deleteForever'),
    message: t('admin.confirmDeleteAccount', { name: item.name || item.email }),
    confirmLabel: t('admin.deleteForever'),
  })
  if (!ok) return
  saving.value = true
  error.value = ''
  notice.value = ''
  try {
    await api.admin.deleteUser(item.id)
    notice.value = t('admin.deleteUserOk')
    await reload(meta.value?.page || 1)
  } catch (err) {
    error.value = err instanceof ApiError ? apiMessage(err, 'admin.errSave') : t('admin.errSave')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', onScrollOrResize)
  window.addEventListener('scroll', onScrollOrResize, true)
  reload(1)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', onScrollOrResize)
  window.removeEventListener('scroll', onScrollOrResize, true)
})
</script>

<style scoped>
.hint.ok {
  color: #166534;
}
.pill {
  display: inline-flex;
  min-height: 24px;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: #f1f5f9;
  font-size: 12px;
  font-weight: 450;
}
.pill.locked {
  background: #fee2e2;
  color: #991b1b;
}
.user-menu {
  position: relative;
  display: inline-flex;
}
.menu-trigger {
  width: 30px;
  height: 30px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #fff;
  color: #334155;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
}
</style>
