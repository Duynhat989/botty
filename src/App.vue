<template>
  <RouterView />
  <ConfirmDialog />
  <GeminiPinDialog />
</template>

<script setup>
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import GeminiPinDialog from '@/components/GeminiPinDialog.vue'
</script>
