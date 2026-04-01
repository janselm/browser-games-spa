<script setup>
/**
 * AdminLoginView — login form for the Word Manager admin panel.
 *
 * On successful login the server sets a PHP session cookie and this view
 * stores a localStorage flag ('admin_auth': '1') used by the router guard
 * as a fast-path check to avoid unnecessary API calls on every navigation.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../services/api.js'
import ReturnButton from '../components/common/ReturnButton.vue'

const router   = useRouter()
const username = ref('')
const password = ref('')
const error    = ref('')
const loading      = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  error.value   = ''
  loading.value = true
  try {
    await api.login(username.value, password.value)
    localStorage.setItem('admin_auth', '1')
    router.push('/admin')
  } catch {
    error.value = 'Invalid username or password.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 gap-6">
    <div class="w-full max-w-sm bg-brand-surface rounded-2xl p-8 shadow-xl">
      <h1 class="font-display text-3xl text-brand-pop mb-2 text-center">Admin Login</h1>
      <p class="text-brand-muted text-sm text-center mb-8">Word Manager access only</p>

      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <div>
          <label class="block text-brand-muted text-xs mb-1 uppercase tracking-wide">
            Username
          </label>
          <input
            v-model="username"
            type="text"
            autocomplete="username"
            required
            class="w-full bg-brand-accent text-brand-text rounded-lg px-4 py-2.5
                   focus:outline-none focus:ring-2 focus:ring-brand-pop"
          />
        </div>

        <div>
          <label class="block text-brand-muted text-xs mb-1 uppercase tracking-wide">
            Password
          </label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="current-password"
              required
              class="w-full bg-brand-accent text-brand-text rounded-lg px-4 py-2.5 pr-10
                     focus:outline-none focus:ring-2 focus:ring-brand-pop"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-text transition-colors"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
            >
              <!-- Eye open -->
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <!-- Eye slashed -->
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" />
              </svg>
            </button>
          </div>
        </div>

        <p v-if="error" class="text-brand-pop text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="mt-2 px-4 py-2.5 bg-brand-pop text-white rounded-lg font-semibold
                 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
    <ReturnButton />
  </div>
</template>
