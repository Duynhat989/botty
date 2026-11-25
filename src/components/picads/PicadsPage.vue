<template>
  <section class="page">
    <header v-if="title" class="page-head">
      <h1>{{ title }}</h1>
      <p v-if="lede" class="lede">{{ lede }}</p>
    </header>
    <slot />
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  lede: { type: String, default: '' },
})
</script>

<style scoped>
.page-head {
  margin-bottom: 18px;
}

.page-head h1 {
  margin: 0;
  font-size: 28px;
  color: #1e1b4b;
}

.lede {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 15px;
}
</style>