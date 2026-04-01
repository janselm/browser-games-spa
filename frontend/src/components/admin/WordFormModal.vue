<script setup>
/**
 * WordFormModal — add/edit modal for a single hangman or word search word.
 *
 * The form fields shown depend on the mode prop:
 *   hangman    — word, hint, difficulty (easy/medium/hard), active
 *   wordsearch — word, category, active
 *
 * Props:
 *   show — controls modal visibility
 *   mode — 'hangman' | 'wordsearch'
 *   word — null to add a new word, or an existing word object to edit
 *
 * Emits:
 *   save(formData) — user submitted the form with valid data
 *   close          — user dismissed the modal
 */
import { ref, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  mode: { type: String,  required: true }, // 'hangman' | 'wordsearch'
  word: { type: Object,  default: null },  // null = add, object = edit
})

const emit = defineEmits(['save', 'close'])

const form = ref({})
const error = ref('')

// Reset form whenever the modal opens or the word changes
watch(
  () => [props.show, props.word],
  () => {
    error.value = ''
    if (props.word) {
      form.value = { ...props.word }
      // Normalise boolean active from DB (may come as string "t"/"f" in some drivers)
      form.value.active = form.value.active === true || form.value.active === 't' || form.value.active === '1'
    } else {
      form.value = props.mode === 'hangman'
        ? { word: '', hint: '', difficulty: 'medium', active: true }
        : { word: '', category: '', active: true }
    }
  },
  { immediate: true },
)

function submit() {
  if (!form.value.word?.trim()) {
    error.value = 'Word is required.'
    return
  }
  emit('save', { ...form.value })
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="bg-brand-surface border border-brand-accent rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl">
          <h2 class="font-display text-2xl text-brand-pop mb-6">
            {{ word ? 'Edit' : 'Add' }} {{ mode === 'hangman' ? 'Hangman' : 'Word Search' }} Word
          </h2>

          <form @submit.prevent="submit" class="space-y-4">

            <!-- Word -->
            <div>
              <label class="block text-xs font-semibold text-brand-muted uppercase mb-1">Word</label>
              <input
                v-model="form.word"
                type="text"
                placeholder="EXAMPLE"
                class="w-full bg-brand-bg border border-brand-accent rounded-lg px-3 py-2
                       text-brand-text placeholder-brand-muted/50 focus:outline-none
                       focus:border-brand-pop transition-colors"
              />
            </div>

            <!-- Hint (hangman only) -->
            <div v-if="mode === 'hangman'">
              <label class="block text-xs font-semibold text-brand-muted uppercase mb-1">Hint</label>
              <input
                v-model="form.hint"
                type="text"
                placeholder="A clue about the word"
                class="w-full bg-brand-bg border border-brand-accent rounded-lg px-3 py-2
                       text-brand-text placeholder-brand-muted/50 focus:outline-none
                       focus:border-brand-pop transition-colors"
              />
            </div>

            <!-- Difficulty (hangman only) -->
            <div v-if="mode === 'hangman'">
              <label class="block text-xs font-semibold text-brand-muted uppercase mb-1">Difficulty</label>
              <select
                v-model="form.difficulty"
                class="w-full bg-brand-bg border border-brand-accent rounded-lg px-3 py-2
                       text-brand-text focus:outline-none focus:border-brand-pop transition-colors"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <!-- Category (wordsearch only) -->
            <div v-if="mode === 'wordsearch'">
              <label class="block text-xs font-semibold text-brand-muted uppercase mb-1">Category</label>
              <input
                v-model="form.category"
                type="text"
                placeholder="e.g. Animals"
                class="w-full bg-brand-bg border border-brand-accent rounded-lg px-3 py-2
                       text-brand-text placeholder-brand-muted/50 focus:outline-none
                       focus:border-brand-pop transition-colors"
              />
            </div>

            <!-- Active -->
            <div class="flex items-center gap-3">
              <input
                id="active-toggle"
                v-model="form.active"
                type="checkbox"
                class="w-4 h-4 accent-brand-pop"
              />
              <label for="active-toggle" class="text-sm text-brand-text cursor-pointer">Active</label>
            </div>

            <!-- Validation error -->
            <p v-if="error" class="text-brand-pop text-sm">{{ error }}</p>

            <!-- Buttons -->
            <div class="flex gap-3 justify-end pt-2">
              <button
                type="button"
                @click="emit('close')"
                class="px-5 py-2 bg-brand-accent text-brand-text rounded-lg text-sm font-semibold
                       hover:bg-brand-pop/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-5 py-2 bg-brand-pop text-white rounded-lg text-sm font-semibold
                       hover:opacity-90 transition-opacity"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to       { opacity: 0; }
</style>
