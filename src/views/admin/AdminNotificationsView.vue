<template>
  <section class="admin-page">
    <header class="head">
      <div>
        <h1>{{ t('admin.notificationsTitle') }}</h1>
        <p>{{ t('admin.notificationsLede') }}</p>
      </div>
    </header>

    <p v-if="error" class="alert">{{ error }}</p>
    <p v-if="notice" class="hint ok">{{ notice }}</p>

    <form class="form card" @submit.prevent="send">
      <label>
        {{ t('admin.notificationsFieldTitle') }}
        <input v-model="form.title" type="text" maxlength="255" required placeholder="VD: Bảo trì hệ thống" />
      </label>

      <label>
        {{ t('admin.notificationsFieldBody') }}
        <textarea v-model="form.body" rows="7" required :placeholder="t('admin.notificationsBodyPh')" />
      </label>

      <fieldset class="scope">
        <legend>{{ t('admin.notificationsScope') }}</legend>
        <label class="radio-line">
          <input v-model="scope" type="radio" value="all" />
          <span>{{ t('admin.notificationsAllUsers') }}</span>
        </label>
        <label class="radio-line">
          <input v-model="scope" type="radio" value="selected" />
          <span>{{ t('admin.notificationsPickUsers') }}</span>
        </label>
      </fieldset>

      <div v-if="scope === 'selected'" class="picker">
        <div class="picker-toolbar">
          <input
            v-model="userQ"
            type="search"
            :placeholder="t('admin.searchUser')"
            @keydown.enter.prevent="searchUsers"
          />
          <button type="button" class="primary" :disabled="userLoading" @click="searchUsers">
            {{ t('admin.apply') }}
          </button>
        </div>
        <p class="hint">{{ t('admin.notificationsPickHint') }}</p>
        <ul class="user-pick-list">
          <li v-for="u in userResults" :key="u.id">
            <label>
              <input v-model="pickedIds" type="checkbox" :value="u.id" />
              <span>
                <strong>{{ u.name }}</strong>
                <em>{{ u.email }}</em>
              </span>
            </label>
          </li>
        </ul>
        <p v-if="!userLoading && !userResults.length" class="hint">{{ t('admin.emptyUsers') }}</p>
        <p v-if="pickedIds.length" class="hint ok">
          {{ t('admin.notificationsSelected', { n: pickedIds.length }) }}
        </p>
      </div>

      <button type="submit" class="primary send" :disabled="sending">
        {{ sending ? t('admin.notificationsSending') : t('admin.notificationsSend') }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { api, ApiError, apiMessage } from '@/api'
import { useI18n } from '@/i18n'

const { t } = useI18n()

const form = ref({ title: '', body: '' })
const scope = ref('all')
const pickedIds = ref([])
const userQ = ref('')
const userResults = ref([])
const userLoading = ref(false)
const sending = ref(false)
const error = ref('')
const notice = ref('')

async function searchUsers() {
  userLoading.value = true
  error.value = ''
  try {
    const data = await api.admin.users({ q: userQ.value.trim(), limit: 30, page: 1 })
    userResults.value = Array.isArray(data?.items) ? data.items : []
  } catch (e) {
    error.value = e instanceof ApiError ? apiMessage(e) : e?.message || 'Không tải được danh sách user'
  } finally {
    userLoading.value = false
  }
}

async function send() {
  error.value = ''
  notice.value = ''
  if (scope.value === 'selected' && !pickedIds.value.length) {
    error.value = t('admin.notificationsNeedUsers')
    return
  }
  sending.value = true
  try {
    const body = {
      title: form.value.title.trim(),
      body: form.value.body.trim(),
      all: scope.value === 'all',
      userIds: scope.value === 'selected' ? pickedIds.value : [],
    }
    const data = await api.admin.broadcastNotification(body)
    notice.value = t('admin.notificationsSent', {
      sent: data?.sent ?? 0,
      total: data?.recipients ?? 0,
    })
  } catch (e) {
    error.value = e instanceof ApiError ? apiMessage(e) : e?.message || 'Gửi thất bại'
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.hint.ok {
  color: #166534;
}

.scope {
  margin: 0;
  padding: 0;
  border: none;
  display: grid;
  gap: 8px;
}

.scope legend {
  font-weight: 600;
  margin-bottom: 4px;
}

.radio-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.picker {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.picker-toolbar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.user-pick-list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 220px;
  overflow: auto;
  display: grid;
  gap: 6px;
}

.user-pick-list label {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 13px;
  cursor: pointer;
}

.user-pick-list strong {
  display: block;
}

.user-pick-list em {
  display: block;
  font-style: normal;
  font-size: 12px;
  color: #64748b;
}

.send {
  justify-self: start;
  margin-top: 4px;
}
</style>