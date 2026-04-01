<script setup>
/**
 * WordTable — reusable admin table for hangman and word search words.
 *
 * Props:
 *   words      — array of word objects to display
 *   columns    — [{ key, label }] defines which fields are shown as columns
 *   selectable — enables row checkboxes and bulk-delete action bar
 *
 * Emits:
 *   edit(word)          — user clicked Edit on a row
 *   delete(id)          — user clicked Delete on a row
 *   toggle(id, active)  — user clicked the Active/Inactive status badge
 *   bulk-delete(ids[])  — user confirmed bulk delete of selected rows
 */
import { ref, computed, watch } from 'vue'

const props = defineProps({
  words:      { type: Array,   required: true },
  columns:    { type: Array,   required: true }, // [{ key, label }]
  selectable: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'delete', 'toggle', 'bulk-delete'])

const selectedIds = ref(new Set())

// Clear selection when word list changes (e.g. after a bulk delete)
watch(() => props.words, () => { selectedIds.value = new Set() }, { deep: false })

const allSelected = computed(() =>
  props.words.length > 0 && props.words.every(w => selectedIds.value.has(w.id))
)

function toggleAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(props.words.map(w => w.id))
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
</script>

<template>
  <div>
    <!-- Bulk-delete action bar -->
    <div
      v-if="selectable && selectedIds.size > 0"
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
            <!-- Select-all checkbox -->
            <th v-if="selectable" class="px-3 py-3 w-8">
              <input
                type="checkbox"
                :checked="allSelected"
                :indeterminate="selectedIds.size > 0 && !allSelected"
                @change="toggleAll"
                class="w-4 h-4 accent-brand-pop cursor-pointer"
              />
            </th>
            <th
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted"
            >
              {{ col.label }}
            </th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted">
              Status
            </th>
            <th class="px-4 py-3 font-semibold uppercase tracking-wide text-xs text-brand-muted text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="word in words"
            :key="word.id"
            :class="selectable && selectedIds.has(word.id) ? 'bg-brand-pop/10' : 'hover:bg-brand-accent/30'"
            class="border-t border-brand-accent transition-colors"
          >
            <!-- Row checkbox -->
            <td v-if="selectable" class="px-3 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.has(word.id)"
                @change="toggleRow(word.id)"
                class="w-4 h-4 accent-brand-pop cursor-pointer"
              />
            </td>

            <td
              v-for="col in columns"
              :key="col.key"
              class="px-4 py-3"
            >
              {{ word[col.key] }}
            </td>

            <!-- Active badge / toggle -->
            <td class="px-4 py-3">
              <button
                @click="emit('toggle', word.id, word.active)"
                :class="word.active
                  ? 'bg-green-700/40 text-green-300 hover:bg-red-700/40 hover:text-red-300'
                  : 'bg-red-700/40 text-red-300 hover:bg-green-700/40 hover:text-green-300'"
                class="px-2 py-0.5 rounded-full text-xs font-semibold transition-colors"
                :title="word.active ? 'Click to deactivate' : 'Click to activate'"
              >
                {{ word.active ? 'Active' : 'Inactive' }}
              </button>
            </td>

            <!-- Edit / Delete -->
            <td class="px-4 py-3 text-right whitespace-nowrap">
              <button
                @click="emit('edit', word)"
                class="px-3 py-1 text-xs rounded bg-brand-accent hover:bg-brand-pop transition-colors mr-2"
              >
                Edit
              </button>
              <button
                @click="emit('delete', word.id)"
                class="px-3 py-1 text-xs rounded bg-red-800/50 hover:bg-brand-pop transition-colors"
              >
                Delete
              </button>
            </td>
          </tr>

          <tr v-if="words.length === 0">
            <td
              :colspan="columns.length + 2 + (selectable ? 1 : 0)"
              class="px-4 py-8 text-center text-brand-muted"
            >
              No words found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
