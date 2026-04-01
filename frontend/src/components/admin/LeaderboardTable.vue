<script setup>
/**
 * LeaderboardTable — admin table for viewing and deleting typegame scores.
 *
 * Displays scores sorted by the backend (highest first) with difficulty shown
 * as a colour-coded badge: 1 = Easy (green), 2 = Medium (yellow), 3 = Hard (red).
 *
 * Props:
 *   entries — array of score objects { id, name, score, difficulty, created_at }
 *
 * Emits:
 *   delete(id)         — user clicked Delete on a row
 *   bulk-delete(ids[]) — user confirmed bulk delete of selected rows
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  entries: { type: Array, required: true },
})

const emit = defineEmits(['delete', 'bulk-delete'])

const selectedIds = ref(new Set())

watch(() => props.entries, () => { selectedIds.value = new Set() }, { deep: false })

const allSelected = computed(() =>
  props.entries.length > 0 && props.entries.every(e => selectedIds.value.has(e.id))
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(props.entries.map(e => e.id))
  }
}

function toggleRow(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function emitBulkDelete() {
  emit('bulk-delete', [...selectedIds.value])
  selectedIds.value = new Set()
}

const difficultyLabel = { 1: 'Easy', 2: 'Medium', 3: 'Hard' }
const difficultyClass = {
  1: 'bg-green-700/40 text-green-300',
  2: 'bg-yellow-700/40 text-yellow-300',
  3: 'bg-red-700/40 text-red-300',
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>

<template>
  <div>
    <!-- Bulk-delete action bar -->
    <div
      v-if="selectedIds.size > 0"
      class="flex items-center gap-3 mb-3 px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg"
    >
      <span class="text-sm text-red-300 flex-1">{{ selectedIds.size }} selected</span>
      <button
        @click="emitBulkDelete"
        class="px-4 py-1.5 bg-red-700 hover:bg-brand-pop text-white rounded-lg text-xs font-semibold transition-colors"
      >
        Delete {{ selectedIds.size }} Selected
      </button>
    </div>

    <div class="overflow-x-auto rounded-xl border border-brand-accent">
      <table class="w-full text-sm text-brand-text">
        <thead>
          <tr class="bg-brand-accent text-left">
            <th class="px-3 py-3 w-8">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="selectedIds.size > 0 && !allSelected"
                @change="toggleAll"
                class="w-4 h-4 accent-brand-pop cursor-pointer"
              />
            </th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted">ID</th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted">Name</th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted">Score</th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted">Difficulty</th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted">Date</th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in entries"
            :key="entry.id"
            :class="selectedIds.has(entry.id) ? 'bg-brand-pop/10' : 'hover:bg-brand-accent/30'"
            class="border-t border-brand-accent transition-colors"
          >
            <td class="px-3 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.has(entry.id)"
                @change="toggleRow(entry.id)"
                class="w-4 h-4 accent-brand-pop cursor-pointer"
              />
            </td>
            <td class="px-4 py-3 text-brand-muted">{{ entry.id }}</td>
            <td class="px-4 py-3 font-medium">{{ entry.name }}</td>
            <td class="px-4 py-3 font-mono">{{ entry.score }}</td>
            <td class="px-4 py-3">
              <span
                :class="difficultyClass[entry.difficulty]"
                class="px-2 py-0.5 rounded-full text-xs font-semibold"
              >
                {{ difficultyLabel[entry.difficulty] ?? entry.difficulty }}
              </span>
            </td>
            <td class="px-4 py-3 text-brand-muted">{{ formatDate(entry.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <button
                @click="emit('delete', entry.id)"
                class="px-3 py-1 text-xs rounded bg-red-800/50 hover:bg-brand-pop transition-colors"
              >
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="entries.length === 0">
            <td colspan="7" class="px-4 py-8 text-center text-brand-muted">
              No scores found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
