<template>
  <div class="b-studio contact-page">
    <header class="head">
      <p class="b-kicker">Hỗ trợ</p>
      <h1 class="b-title">Liên hệ</h1>
      <p class="b-lede b-lede--left">
        Gửi email hoặc báo cáo sự cố — thông tin liên hệ và form nằm cạnh nhau bên dưới.
      </p>
    </header>

    <div class="contact-grid">
      <div class="contact-col b-card b-card-pad-lg">
        <h2 class="b-title-sm contact-col-title">Liên hệ</h2>
        <div class="row">
          <span class="b-label">Website</span>
          <a :href="siteUrl" class="link" target="_blank" rel="noopener noreferrer">{{ siteHost }}</a>
        </div>
        <div class="row">
          <span class="b-label">Email</span>
          <a :href="`mailto:${supportEmail}`" class="link">{{ supportEmail }}</a>
        </div>
        <div class="row">
          <span class="b-label">Giờ phản hồi</span>
          <span class="b-caption">Thứ 2 – Thứ 6, 9:00–17:00 (GMT+7)</span>
        </div>
        <div class="row">
          <span class="b-label">Gửi yêu cầu nhanh</span>
          <span class="b-caption">
            Kèm mã bot trên màn cấu hình (hoặc email đăng ký) để được xử lý sớm hơn.
          </span>
        </div>
      </div>

      <section id="incident-report" class="report-col b-card b-card-pad-lg" aria-labelledby="incident-report-title">
        <header class="report-head">
          <h2 id="incident-report-title" class="b-title-sm">Báo cáo sự cố</h2>
          <p class="b-caption">
            Mô tả lỗi webhook, bot không trả lời, thanh toán… Có thể đính kèm tối đa 2 ảnh minh hoạ.
          </p>
        </header>

        <IncidentReportForm v-if="auth.isLoggedIn" embedded />
        <div v-else class="login-gate">
          <p class="b-caption">Đăng nhập để gửi báo cáo — hệ thống gắn báo cáo với tài khoản của bạn.</p>
          <RouterLink
            :to="{ path: '/login', query: { redirect: '/contact#incident-report' } }"
            class="b-btn b-btn--primary b-btn--sm"
          >
            Đăng nhập
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import IncidentReportForm from '@/components/IncidentReportForm.vue'

const auth = useAuthStore()

const siteUrl = (import.meta.env.VITE_SITE_URL || 'https://botty.live').replace(/\/$/, '')
const siteHost = computed(() => {
  try {
    return new URL(siteUrl).host
  } catch {
    return 'botty.live'
  }
})
const supportEmail = computed(() => `support@${siteHost.value}`)
</script>

<style scoped>
.contact-page {
  max-width: var(--b-max, 1440px);
}

.head {
  margin-bottom: 28px;
  max-width: 720px;
}

.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 20px;
  align-items: start;
}

.contact-col-title {
  margin: 0 0 8px;
}

.contact-card,
.contact-col {
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

.contact-col .row:first-of-type {
  padding-top: 4px;
}

.link {
  color: var(--b-accent);
  font-size: 15px;
  font-weight: 500;
  text-decoration: none;
  word-break: break-word;
}

.link:hover {
  text-decoration: underline;
}

.report-col {
  scroll-margin-top: 88px;
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}

.report-head {
  margin-bottom: 14px;
}

.report-head .b-title-sm {
  margin: 0 0 8px;
}

.report-head .b-caption {
  margin: 0;
  max-width: none;
}

.login-gate {
  display: grid;
  gap: 14px;
}

.login-gate .b-caption {
  margin: 0;
}

@media (max-width: 880px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}
</style>