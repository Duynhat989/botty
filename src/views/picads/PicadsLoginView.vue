<template>
  <div class="login-card">
    <header class="head">
      <p class="kicker">PicAds</p>
      <h1>{{ mode === 'login' ? 'Đăng nhập' : 'Đăng ký' }}</h1>
      <p class="lede">Quản lý extension, phiên bản và tài liệu API.</p>
    </header>

    <form class="form" @submit.prevent="submit">
      <label v-if="mode === 'register'" class="field">
        <span>Tên</span>
        <input v-model="name" type="text" autocomplete="name" placeholder="Tên hiển thị" />
      </label>
      <label class="field">
        <span>Email</span>
        <input v-model="email" type="email" required autocomplete="email" placeholder="you@company.com" />
      </label>
      <label class="field">
        <span>Mật khẩu</span>
        <input
          v-model="password"
          type="password"
          required
          :autocomplete="mode === 'login' ? 'current-password' : 'new-password'"
          placeholder="Tối thiểu 8 ký tự"
          minlength="8"
        />
      </label>

      <p v-if="err" class="err">{{ err }}</p>

      <button type="submit" class="btn" :disabled="busy">
        {{ busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản' }}
      </button>
    </form>

    <p class="switch">
      <button type="button" class="link" @click="toggleMode">
        {{ mode === 'login' ? 'Chưa có tài khoản? Đăng ký' : 'Đã có tài khoản? Đăng nhập' }}
      </button>
    </p>

    <p v-if="freshKey" class="fresh">
      <strong>Lưu API key ngay</strong> (chỉ hiện một lần):
      <code>{{ freshKey }}</code>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePicadsAuthStore } from '@/stores/picadsAuth'
import { ApiError } from '@/api'

const router = useRouter()
const route = useRoute()
const picads = usePicadsAuthStore()

const mode = ref('login')
const email = ref('')
const password = ref('')
const name = ref('')
const busy = ref(false)
const err = ref('')
const freshKey = ref('')

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  err.value = ''
  freshKey.value = ''
}

function friendlyMessage(code) {
  const map = {
    PICADS_INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
    PICADS_EMAIL_EXISTS: 'Email đã được đăng ký.',
    PICADS_EMAIL_INVALID: 'Email không hợp lệ.',
    PICADS_PASSWORD_TOO_SHORT: 'Mật khẩu phải từ 8 ký tự.',
  }
  return map[code] || 'Không thể đăng nhập. Thử lại sau.'
}

async function submit() {
  err.value = ''
  freshKey.value = ''
  busy.value = true
  try {
    if (mode.value === 'login') {
      await picads.login(email.value.trim(), password.value)
    } else {
      const data = await picads.register({
        email: email.value.trim(),
        password: password.value,
        name: name.value.trim() || undefined,
      })
      if (data.key) freshKey.value = data.key
    }
    const back = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    if (back.startsWith('/picads')) router.replace(back)
    else router.replace({ name: 'picads-extensions' })
  } catch (e) {
    err.value = e instanceof ApiError ? friendlyMessage(e.messageCode) : 'Lỗi không xác định.'
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 28px 24px;
  box-shadow: 0 18px 40px rgba(79, 70, 229, 0.08);
}

.kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6366f1;
  margin: 0 0 6px;
}

.head h1 {
  margin: 0;
  font-size: 26px;
}

.lede {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.form {
  margin-top: 22px;
  display: grid;
  gap: 14px;
}

.field span {
  display: block;
  font-size: 13px;
  margin-bottom: 6px;
  color: #334155;
}

.field input {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 16px;
}

.btn {
  margin-top: 4px;
  border: 0;
  border-radius: 10px;
  padding: 11px 14px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.65;
}

.err {
  margin: 0;
  color: #b91c1c;
  font-size: 13px;
}

.switch {
  margin: 16px 0 0;
  text-align: center;
}

.link {
  border: 0;
  background: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 14px;
}

.fresh {
  margin-top: 16px;
  padding: 12px;
  border-radius: 10px;
  background: #fef3c7;
  font-size: 13px;
}

.fresh code {
  display: block;
  margin-top: 8px;
  word-break: break-all;
  font-size: 12px;
}
</style>