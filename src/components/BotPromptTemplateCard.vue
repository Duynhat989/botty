<template>
  <div class="card-wrap" :class="{ picked: selected, editable: tpl.canEdit }">
    <button
      type="button"
      class="tpl-card"
      :class="kind === 'chat_style' ? 'style-card' : ''"
      @click="emit('use')"
    >
      <span v-if="tpl.scope === 'global'" class="badge">Mọi người</span>
      <span class="tpl-name">{{ tpl.label }}</span>
      <span class="tpl-hint">{{ tpl.hint }}</span>
      <span v-if="kind === 'chat_style' && tpl.sample" class="style-sample">«{{ tpl.sample }}»</span>
    </button>
    <div v-if="tpl.canEdit" class="card-actions">
      <button type="button" class="link-btn" @click.stop="emit('edit')">Sửa</button>
      <span class="act-dot" aria-hidden="true">·</span>
      <button type="button" class="link-btn danger" @click.stop="emit('remove')">Xóa</button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tpl: { type: Object, required: true },
  kind: { type: String, required: true },
  selected: { type: Boolean, default: false },
})

const emit = defineEmits(['use', 'edit', 'remove'])
</script>

<style scoped>
.card-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--b-border) 88%, var(--b-ink));
  background: #fff;
  overflow: hidden;
  box-shadow:
    0 1px 0 rgba(15, 23, 42, 0.04),
    0 1px 2px rgba(15, 23, 42, 0.03);
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    transform 0.18s ease;
}

.card-wrap:hover {
  border-color: color-mix(in srgb, var(--b-accent) 45%, var(--b-border));
  box-shadow:
    0 8px 22px -10px rgba(21, 128, 61, 0.22),
    0 2px 6px rgba(15, 23, 42, 0.05);
  transform: translateY(-2px);
}

.card-wrap.picked {
  border-color: var(--b-accent);
  box-shadow:
    0 0 0 2px color-mix(in srgb, var(--b-accent) 22%, transparent),
    0 10px 24px -12px rgba(21, 128, 61, 0.28);
}

.tpl-card,
.style-card {
  width: 100%;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  text-align: left;
  padding: 14px 16px 16px;
  border: none;
  border-radius: 0;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.tpl-card:focus-visible {
  outline: 2px solid var(--b-accent);
  outline-offset: -2px;
}

.badge {
  display: inline-flex;
  align-items: center;
  margin-bottom: 10px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: var(--b-accent);
  background: var(--b-accent-soft);
  border: 1px solid color-mix(in srgb, var(--b-accent) 18%, transparent);
}

.tpl-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: var(--b-ink);
}

.tpl-hint {
  display: -webkit-box;
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: var(--b-muted);
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.style-sample {
  display: block;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--b-border);
  font-size: 11.5px;
  line-height: 1.45;
  color: var(--b-muted);
  font-style: italic;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 12px;
  border-top: 1px solid var(--b-border);
  background: color-mix(in srgb, var(--b-surface-2) 65%, #fff);
}

.act-dot {
  color: var(--b-border-strong, var(--b-border));
  font-size: 14px;
  line-height: 1;
  user-select: none;
}

.link-btn {
  border: none;
  background: none;
  padding: 4px 8px;
  border-radius: 8px;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  color: var(--b-accent);
  cursor: pointer;
  transition: background 0.15s ease;
}

.link-btn:hover {
  background: var(--b-accent-soft);
}

.link-btn.danger {
  color: var(--b-danger);
}

.link-btn.danger:hover {
  background: color-mix(in srgb, var(--b-danger) 12%, transparent);
}
</style>