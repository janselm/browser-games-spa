<script setup>
defineProps({
  words:      { type: Array,  required: true },
  foundWords: { type: Object, required: true }, // Set
})
</script>

<template>
  <div class="bg-brand-surface rounded-xl p-4 border border-brand-accent">
    <h3 class="font-display text-xl text-brand-pop mb-3 text-center">Find These Words</h3>
    <ul class="space-y-1">
      <li
        v-for="w in words"
        :key="w.word"
        class="font-semibold text-sm transition-colors"
        :class="foundWords.has(w.word)
          ? 'text-green-400 line-through opacity-60'
          : 'text-brand-text'"
      >
        {{ w.word }}
      </li>
    </ul>
  </div>
</template>
