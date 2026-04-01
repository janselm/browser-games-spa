<script setup>
import ReturnButton from '../components/common/ReturnButton.vue'
</script>

<template>
  <div class="min-h-screen bg-brand-bg font-mono px-4 py-12 flex flex-col items-center">
    <div class="w-full max-w-2xl">
      <!-- Back button -->
      <div class="mb-8">
        <ReturnButton />
      </div>

      <!-- Terminal window -->
      <div class="bg-brand-surface rounded-lg border border-brand-accent overflow-hidden">
        <!-- Terminal title bar -->
        <div class="flex items-center gap-2 px-4 py-3 bg-brand-accent border-b border-brand-accent">
          <span class="w-3 h-3 rounded-full bg-red-500"></span>
          <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
          <span class="w-3 h-3 rounded-full bg-green-500"></span>
          <span class="ml-4 text-brand-muted text-xs">terminal — janselm@hangman:~</span>
        </div>

        <!-- Terminal body -->
        <div class="p-6 space-y-6 text-sm leading-relaxed">

          <!-- Prompt header -->
          <div>
            <span class="text-brand-pop">~/hangman</span>
            <span class="text-brand-muted"> $</span>
          </div>

          <!-- whoami -->
          <div class="space-y-1">
            <div>
              <span class="text-brand-pop">$</span>
              <span class="text-brand-text ml-2">whoami</span>
            </div>
            <div class="pl-4 text-brand-text">janselm</div>
            <div class="pl-4">
              <a
                href="https://github.com/janselm/"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-pop underline hover:opacity-80 transition-opacity"
              >github.com/janselm/</a>
            </div>
          </div>

          <!-- cat stack.json -->
          <div class="space-y-1">
            <div>
              <span class="text-brand-pop">$</span>
              <span class="text-brand-text ml-2">cat stack.json</span>
            </div>
            <div class="pl-4 text-brand-text">{</div>
            <div class="pl-8">
              <span class="text-blue-400">"frontend"</span>
              <span class="text-brand-text">: [</span>
              <span class="text-green-400">"Vue 3"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"Vite"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"Tailwind CSS"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"Vue Router"</span>
              <span class="text-brand-text">],</span>
            </div>
            <div class="pl-8">
              <span class="text-blue-400">"backend"</span>
              <span class="text-brand-text">: [</span>
              <span class="text-green-400">"PHP"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"PostgreSQL"</span>
              <span class="text-brand-text">],</span>
            </div>
            <div class="pl-8">
              <span class="text-blue-400">"build"</span>
              <span class="text-brand-text">: [</span>
              <span class="text-green-400">"Vite"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"PostCSS"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"Autoprefixer"</span>
              <span class="text-brand-text">],</span>
            </div>
            <div class="pl-8">
              <span class="text-blue-400">"fonts"</span>
              <span class="text-brand-text">: [</span>
              <span class="text-green-400">"Fredoka One"</span>
              <span class="text-brand-text">, </span>
              <span class="text-green-400">"Nunito"</span>
              <span class="text-brand-text">]</span>
            </div>
            <div class="pl-4 text-brand-text">}</div>
          </div>

          <!-- git log -->
          <div class="space-y-1">
            <div>
              <span class="text-brand-pop">$</span>
              <span class="text-brand-text ml-2">git log --oneline</span>
            </div>
            <div class="pl-4">
              <span class="text-yellow-400">a1b2c3d</span>
              <span class="text-brand-muted ml-2"># feat: words that haunt you</span>
            </div>
            <div class="pl-4">
              <span class="text-yellow-400">e4f5g6h</span>
              <span class="text-brand-muted ml-2"># feat: word search for the patient</span>
            </div>
            <div class="pl-4">
              <span class="text-yellow-400">i7j8k9l</span>
              <span class="text-brand-muted ml-2"># chore: ship it</span>
            </div>
          </div>

          <!-- Blinking cursor -->
          <div>
            <span class="text-brand-pop animate-pulse">▋</span>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>
