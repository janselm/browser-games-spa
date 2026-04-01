<script setup>
import { computed } from 'vue'

const props = defineProps({
  wordLetters:    { type: Array,  required: true },
  guessedLetters: { type: Object, required: true }, // Set
  isLost:         { type: Boolean, default: false },
})

const wordGroups = computed(() => {
  const groups = []
  let current = []
  for (const letter of props.wordLetters) {
    if (letter === ' ') {
      if (current.length) groups.push(current)
      current = []
    } else {
      current.push(letter)
    }
  }
  if (current.length) groups.push(current)
  return groups
})
</script>

<template>
  <div class="flex flex-wrap justify-center gap-x-6 gap-y-4">
    <div v-for="(word, wi) in wordGroups" :key="wi" class="flex gap-2">
      <div
        v-for="(letter, li) in word"
        :key="li"
        class="w-9 h-12 flex items-end justify-center pb-1 border-b-2 border-brand-muted"
      >
        <span
          v-if="guessedLetters.has(letter) || isLost"
          :class="[
            'font-display text-2xl leading-none',
            isLost && !guessedLetters.has(letter) ? 'text-brand-pop' : 'text-brand-text',
          ]"
        >{{ letter }}</span>
      </div>
    </div>
  </div>
</template>
