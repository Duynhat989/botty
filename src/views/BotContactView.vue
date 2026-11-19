<template>
  <div class="b-studio">
    <header class="head">
      <p class="b-kicker">Hỗ trợ</p>
      <h1 class="b-title">Liên hệ</h1>
      <p class="b-lede b-lede--left">
        Cần hỗ trợ webhook Facebook, Gemini hoặc tài khoản, hãy gửi email hoặc nhắn khi đã đăng nhập.
      </p>
    </header>

    <div class="b-card b-card-pad-lg contact-card">
      <div class="row">
        <span class="b-label">Email</span>
        <a href="mailto:support@botty.app" class="link">support@botty.app</a>
      </div>
      <div class="row">
        <span class="b-label">Giờ phản hồi</span>
        <span class="b-caption">Thứ 2 – Thứ 6, 9:00–17:00 (GMT+7)</span>
      </div>
      <div class="row">
        <span class="b-label">Facebook / webhook</span>
        <span class="b-caption">Gửi kèm mã bot (UUID) trên màn cấu hình để xử lý nhanh.</span>
      </div>
    </div>

    <RouterLink v-if="!auth.isLoggedIn" to="/login" class="b-btn b-btn--ghost">Đăng nhập</RouterLink>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
</script>

<style scoped>
.head {
  margin-bottom: 28px;
}

.contact-card {
  max-width: 520px;
  display: grid;
  gap: 0;
}

.row {
  display: grid;
  gap: 6px;
  padding: 14px 0;
  border-bottom: 1px solid var(--b-border);
}

.row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row:first-child {
  padding-top: 0;
}

.link {
  color: var(--b-accent);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>