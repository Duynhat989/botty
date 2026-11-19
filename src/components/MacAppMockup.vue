<template>
  <div class="mac" aria-hidden="true">
    <div class="mac-chrome">
      <div class="lights">
        <span class="light red" />
        <span class="light yellow" />
        <span class="light green" />
      </div>
      <span class="mac-title">Botty — Thử phản hồi</span>
      <span class="mac-spacer" />
    </div>
    <div class="mac-body">
      <aside class="mac-sidebar">
        <div class="sb-brand">
          <img src="/logo.png" alt="" width="22" height="22" />
          <span>Botty</span>
        </div>
        <div class="sb-item on">Thử phản hồi</div>
        <div class="sb-item">Facebook</div>
        <div class="sb-item">Gemini</div>
        <div class="sb-item">Chốt đơn</div>
      </aside>
      <div class="mac-main">
        <div class="chat">
          <div class="bubble user">
            <small>Khách</small>
            Shop còn áo lotus size M không ạ?
          </div>
          <div class="bubble bot">
            <small>Bot Shop Lan</small>
            Còn 4 chiếc Lotus — 289.000đ. Bạn muốn chốt đơn không?
          </div>
          <div class="bubble user">
            <small>Khách</small>
            0901 xxx xxx, Q1
          </div>
          <div class="bubble bot">
            <small>Bot Shop Lan</small>
            Đã ghi nhận đơn. Nhân viên xác nhận trong ít phút.
          </div>
        </div>
        <div class="mac-input">
          <span>Nhập tin nhắn thử…</span>
          <span class="send">Gửi</span>
        </div>
      </div>
    </div>
    <div class="mac-dock">
      <img v-for="(src, i) in dockIcons" :key="i" :src="src" alt="" loading="lazy" />
    </div>
  </div>
</template>

<script setup>
const dockIcons = [
  '/logo.png',
  '/images/hero/slide-1.png',
  '/images/hero/slide-2.png',
]
</script>

<style scoped>
.mac {
  width: min(100%, 520px);
  margin: 0 auto;
  border-radius: 14px;
  border: 1px solid #d1d5db;
  background: #f5f5f7;
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.14), 0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}

.mac-chrome {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 38px;
  padding: 0 14px;
  background: #ececef;
  border-bottom: 1px solid #d4d4d8;
}

.lights {
  display: flex;
  gap: 7px;
}

.light {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.light.red { background: #ff5f57; border: 1px solid #e0443e; }
.light.yellow { background: #febc2e; border: 1px solid #d89e24; }
.light.green { background: #28c840; border: 1px solid #1aab29; }

.mac-title {
  flex: 1;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #52525b;
}

.mac-spacer { width: 52px; }

.mac-body {
  display: grid;
  grid-template-columns: 118px 1fr;
  min-height: 280px;
  background: #fff;
}

.mac-sidebar {
  padding: 12px 10px;
  border-right: 1px solid #e4e4e7;
  background: #f9fafb;
}

.sb-brand {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #14532d;
  margin-bottom: 12px;
}

.sb-item {
  font-size: 11px;
  padding: 7px 8px;
  border-radius: 8px;
  color: #71717a;
}

.sb-item.on {
  background: #ecfdf3;
  color: #166534;
  font-weight: 600;
}

.mac-main {
  display: flex;
  flex-direction: column;
  padding: 12px;
  gap: 10px;
}

.chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble {
  max-width: 92%;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 1.45;
}

.bubble small {
  display: block;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  color: #71717a;
  margin-bottom: 3px;
}

.bubble.user {
  align-self: flex-end;
  background: #ecfdf3;
  border: 1px solid #bbf7d0;
}

.bubble.bot {
  align-self: flex-start;
  background: #fff;
  border: 1px solid #e4e4e7;
}

.mac-input {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  font-size: 11px;
  color: #a1a1aa;
}

.send {
  font-size: 10px;
  font-weight: 700;
  color: #fff;
  background: #16a34a;
  padding: 4px 10px;
  border-radius: 999px;
}

.mac-dock {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px 14px;
  background: rgba(255, 255, 255, 0.85);
  border-top: 1px solid #e4e4e7;
}

.mac-dock img {
  width: 36px;
  height: 36px;
  object-fit: cover;
  border-radius: 9px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}
</style>
