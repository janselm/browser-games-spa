<script setup>
import { ref } from 'vue'
import DevOverlay from './components/common/DevOverlay.vue'

const devOpen = ref(false)
</script>

<template>
  <div class="min-h-screen bg-brand-bg font-body">
    <button
      @click="devOpen = true"
      title="Developer Info"
      class="fixed top-4 left-4 z-40 w-10 h-10 flex items-center justify-center
             rounded-lg bg-brand-surface border border-brand-accent
             text-brand-pop hover:bg-brand-accent hover:scale-110
             transition-all duration-200 font-mono text-sm font-bold select-none"
    >&gt;_</button>

    <RouterView />

    <DevOverlay :open="devOpen" @close="devOpen = false" />
  </div>
</template>
