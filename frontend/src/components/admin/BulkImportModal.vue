<script setup>
/**
 * BulkImportModal — paste-and-import interface for adding many words at once.
 *
 * Accepts pipe-delimited text (one entry per line) and live-parses it into
 * a preview count before submission. Lines starting with '#' are ignored.
 *
 * Hangman format:   word | hint | difficulty   (difficulty defaults to medium)
 * Word search format: word | category          (category defaults to general)
 *
 * Props:
 *   show — controls modal visibility
 *   mode — 'hangman' | 'wordsearch'
 *
 * Emits:
 *   bulk-save(items[]) — array of parsed word objects ready to POST
 *   close              — user dismissed the modal
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  show: { type: Boolean, required: true },
  mode: { type: String,  required: true }, // 'hangman' | 'wordsearch'
})

const emit = defineEmits(['bulk-save', 'close'])

const bulkText = ref('')
const error    = ref('')

watch(() => props.show, (v) => {
  if (v) { bulkText.value = ''; error.value = '' }
})

const parsed = computed(() => {
  const lines = bulkText.value.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'))
  if (props.mode === 'hangman') {
    return lines.map(line => {
      const [w = '', h = '', d = ''] = line.split('|').map(p => p.trim())
      const difficulty = ['easy', 'medium', 'hard'].includes(d.toLowerCase()) ? d.toLowerCase() : 'medium'
      return { word: w, hint: h, difficulty, active: true }
    }).filter(item => item.word && item.hint)
  } else {
    return lines.map(line => {
      const [w = '', c = ''] = line.split('|').map(p => p.trim())
      return { word: w, category: c || 'general', active: true }
    }).filter(item => item.word)
  }
})

const placeholder = computed(() => props.mode === 'hangman'
  ? `word | hint | difficulty\nloch ness monster | A famous Scottish lake creature | hard\nquixotic | Unrealistically idealistic | hard\npandemic | A disease outbreak affecting many countries | medium`
  : `word | category\nelephant | animals\nphotosynthesis | science\nsymphony | music`)

function submit() {
  if (parsed.value.length === 0) {
    error.value = 'No valid entries found. Check the format below.'
    return
  }
  emit('bulk-save', parsed.value)
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
        <div class="bg-brand-surface border border-brand-accent rounded-2xl p-8 w-full max-w-2xl mx-4 shadow-2xl flex flex-col gap-5">
          <h2 class="font-display text-2xl text-brand-pop">
            Bulk Import — {{ mode === 'hangman' ? 'Hangman' : 'Word Search' }} Words
          </h2>

          <!-- Format instructions -->
          <div class="bg-brand-bg rounded-lg px-4 py-3 text-xs text-brand-muted space-y-1">
            <p class="font-semibold text-brand-text uppercase tracking-wide mb-2">Format (one per line)</p>
            <template v-if="mode === 'hangman'">
              <p><span class="text-brand-pop">word</span> | <span class="text-brand-pop">hint</span> | <span class="text-brand-pop">difficulty</span></p>
              <p>• Difficulty is <em>easy</em>, <em>medium</em>, or <em>hard</em> — defaults to <em>medium</em> if omitted</p>
              <p>• Both word and hint are required; lines missing either are skipped</p>
            </template>
            <template v-else>
              <p><span class="text-brand-pop">word</span> | <span class="text-brand-pop">category</span></p>
              <p>• Category defaults to <em>general</em> if omitted</p>
            </template>
            <p>• Lines starting with <code>#</code> are ignored (comments)</p>
          </div>

          <!-- Textarea -->
          <div>
            <label class="block text-xs font-semibold text-brand-muted uppercase mb-1">Paste words here</label>
            <textarea
              v-model="bulkText"
              rows="10"
              :placeholder="placeholder"
              class="w-full bg-brand-bg border border-brand-accent rounded-lg px-3 py-2
                     text-brand-text placeholder-brand-muted/40 focus:outline-none
                     focus:border-brand-pop transition-colors font-mono text-sm resize-y"
            />
          </div>

          <!-- Live preview count -->
          <p class="text-sm">
            <span v-if="parsed.length > 0" class="text-green-400 font-semibold">
              {{ parsed.length }} valid {{ parsed.length === 1 ? 'word' : 'words' }} ready to import
            </span>
            <span v-else-if="bulkText.trim()" class="text-brand-pop">
              No valid entries found — check the format
            </span>
            <span v-else class="text-brand-muted">
              Start typing or paste words above
            </span>
          </p>

          <p v-if="error" class="text-brand-pop text-sm -mt-2">{{ error }}</p>

          <!-- Buttons -->
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="emit('close')"
              class="px-5 py-2 bg-brand-accent text-brand-text rounded-lg text-sm font-semibold
                     hover:bg-brand-pop/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="submit"
              :disabled="parsed.length === 0"
              class="px-5 py-2 bg-brand-pop text-white rounded-lg text-sm font-semibold
                     hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import {{ parsed.length > 0 ? parsed.length : '' }} Word{{ parsed.length !== 1 ? 's' : '' }}
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
