<script setup>
defineProps({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  to:          { type: String, required: true },
})
</script>

<template>
  <RouterLink
    :to="to"
    class="block bg-brand-surface border-2 border-brand-accent rounded-2xl p-8 text-center
           hover:border-brand-pop hover:scale-105 transition-all duration-200 cursor-pointer
           shadow-lg hover:shadow-brand-pop/20"
  >
    <h2 class="font-display text-4xl text-brand-text mb-3">{{ title }}</h2>
    <p v-if="description" class="text-brand-muted text-sm">{{ description }}</p>
  </RouterLink>
</template>
