<script setup>
defineProps({
  show:    { type: Boolean, required: true },
  title:   { type: String,  required: true },
  message: { type: String,  default: '' },
  primaryLabel:   { type: String, default: 'Play Again' },
  secondaryLabel: { type: String, default: 'Exit' },
})

const emit = defineEmits(['primary', 'secondary'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <div class="bg-brand-surface border-2 border-brand-pop rounded-2xl p-8 max-w-sm w-full mx-4
                    shadow-2xl text-center">
          <h2 class="font-display text-4xl text-brand-pop mb-3">{{ title }}</h2>
          <p v-if="message" class="text-brand-muted mb-6">{{ message }}</p>
          <div class="flex gap-3 justify-center">
            <button
              @click="emit('primary')"
              class="px-6 py-2 bg-brand-pop text-white rounded-lg font-semibold
                     hover:opacity-90 transition-opacity"
            >
              {{ primaryLabel }}
            </button>
            <button
              @click="emit('secondary')"
              class="px-6 py-2 bg-brand-accent text-brand-text rounded-lg font-semibold
                     hover:bg-brand-pop/60 transition-colors"
            >
              {{ secondaryLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
