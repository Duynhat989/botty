<template>
  <div class="tpl-block" :class="{ 'style-block': kind === 'chat_style' }">
    <div class="head-row">
      <div class="head-text">
        <p class="tpl-label">{{ title }}</p>
        <p class="tpl-sub">Chọn mẫu để áp dụng nhanh — bấm thẻ để dùng.</p>
      </div>
      <button type="button" class="b-btn b-btn--ghost b-btn--sm add-btn" @click="emit('add')">
        + Thêm mẫu
      </button>
    </div>

    <p v-if="loading" class="b-caption load-hint">Đang tải mẫu…</p>

    <template v-else>
      <div v-if="global.length" class="scope-row">
        <p class="scope-label">Mẫu chung</p>
        <span class="scope-line" aria-hidden="true" />
      </div>
      <div
        v-if="global.length"
        class="tpl-grid"
        :class="kind === 'chat_style' ? 'style-grid' : ''"
      >
        <BotPromptTemplateCard
          v-for="tpl in global"
          :key="tpl.id"
          :tpl="tpl"
          :kind="kind"
          :selected="isSelected(tpl)"
          @use="onUse(tpl)"
          @edit="emit('edit', tpl)"
          @remove="emit('remove', tpl)"
        />
      </div>

      <div v-if="mine.length" class="scope-row">
        <p class="scope-label">Mẫu của bạn</p>
        <span class="scope-line" aria-hidden="true" />
      </div>
      <div
        v-if="mine.length"
        class="tpl-grid"
        :class="kind === 'chat_style' ? 'style-grid' : ''"
      >
        <BotPromptTemplateCard
          v-for="tpl in mine"
          :key="tpl.id"
          :tpl="tpl"
          :kind="kind"
          :selected="isSelected(tpl)"
          @use="onUse(tpl)"
          @edit="emit('edit', tpl)"
          @remove="emit('remove', tpl)"
        />
      </div>

      <p v-if="!global.length && !mine.length" class="empty-hint">Chưa có mẫu — thêm mẫu riêng hoặc dùng mẫu chung khi admin cấu hình.</p>
    </template>
  </div>
</template>

<script setup>
import BotPromptTemplateCard from './BotPromptTemplateCard.vue'

const props = defineProps({
  title: { type: String, required: true },
  kind: { type: String, required: true },
  global: { type: Array, default: () => [] },
  mine: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  selectedKey: { type: String, default: '' },
})

const emit = defineEmits(['add', 'edit', 'remove', 'select', 'apply'])

function isSelected(tpl) {
  const key = props.selectedKey
  return key === tpl.id || (tpl.slug && key === tpl.slug)
}

function onUse(tpl) {
  if (props.kind === 'chat_style') emit('select', tpl)
  else emit('apply', tpl)
}
</script>

<style scoped>
.tpl-block {
  margin: 22px 0;
  padding: 18px 18px 20px;
  border-radius: 16px;
  border: 1px solid color-mix(in srgb, var(--b-border) 90%, var(--b-accent));
  background:
    radial-gradient(120% 80% at 0% 0%, color-mix(in srgb, var(--b-accent) 7%, transparent), transparent 52%),
  var(--b-surface-2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.65);
}

.style-block {
  margin-top: 20px;
}

.head-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.head-text {
  min-width: 0;
}

.tpl-label {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--b-ink);
}

.tpl-sub {
  margin: 4px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--b-muted);
  max-width: 42ch;
}

.add-btn {
  flex-shrink: 0;
}

.load-hint {
  margin: 0;
}

.scope-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 18px 0 12px;
}

.scope-row:first-of-type {
  margin-top: 4px;
}

.scope-label {
  margin: 0;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--b-muted);
}

.scope-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(
    90deg,
    var(--b-border),
    color-mix(in srgb, var(--b-border) 35%, transparent)
  );
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 12px;
  align-items: stretch;
}

.style-grid {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 14px;
}

.empty-hint {
  margin: 8px 0 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px dashed var(--b-border-strong);
  font-size: 13px;
  line-height: 1.5;
  color: var(--b-muted);
  text-align: center;
  background: color-mix(in srgb, #fff 55%, var(--b-surface-2));
}

@media (max-width: 520px) {
  .head-row {
    flex-direction: column;
    align-items: stretch;
  }

  .add-btn {
    align-self: flex-start;
  }

  .tpl-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }
}
</style>