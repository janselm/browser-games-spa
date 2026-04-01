<script setup>
defineProps({
  hint:       { type: String, required: true },
  difficulty: { type: String, default: '' },
})

const difficultyColor = {
  easy:   'text-green-400',
  medium: 'text-yellow-400',
  hard:   'text-brand-pop',
}
</script>

<template>
  <div class="text-center">
    <p class="text-brand-muted text-sm mb-1">Hint:</p>
    <p class="text-brand-text font-semibold">{{ hint }}</p>
    <span
      v-if="difficulty"
      class="inline-block mt-2 text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded"
      :class="difficultyColor[difficulty] || 'text-brand-muted'"
    >{{ difficulty }}</span>
  </div>
</template>
