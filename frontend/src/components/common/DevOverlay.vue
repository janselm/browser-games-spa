<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(()  => document.addEventListener('keydown', onKey))
onUnmounted(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="dev">
      <div
        v-if="props.open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4 py-12"
        @click.self="emit('close')"
      >
        <div class="w-full max-w-2xl font-mono text-sm">
          <!-- Terminal window -->
          <div class="dev-terminal bg-brand-surface rounded-lg border border-brand-accent overflow-hidden">
            <!-- Terminal title bar -->
            <div class="flex items-center gap-2 px-4 py-3 bg-brand-accent border-b border-brand-accent">
              <button
                @click="emit('close')"
                class="w-3 h-3 rounded-full bg-red-500 hover:brightness-125 transition-all"
                title="Close"
              />
              <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
              <span class="w-3 h-3 rounded-full bg-green-500"></span>
              <span class="ml-4 text-brand-muted text-xs">terminal — janselm@games:~</span>
            </div>

            <!-- Terminal body -->
            <div class="p-6 space-y-6 leading-relaxed">

              <div>
                <span class="text-brand-pop">~/games</span>
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
    </Transition>
  </Teleport>
</template>

<style>
/* ── Backdrop ── */
.dev-enter-active { transition: opacity 0.3s ease; }
.dev-leave-active { transition: opacity 0.25s ease 0.12s; }
.dev-enter-from,
.dev-leave-to     { opacity: 0; }

/* ── Terminal: CRT power-on ── */
.dev-enter-active .dev-terminal {
  animation: crt-power-on 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.dev-leave-active .dev-terminal {
  animation: crt-power-off 0.32s ease-in forwards;
}

@keyframes crt-power-on {
  0%   { transform: scaleY(0);     filter: brightness(4) blur(3px); }
  10%  { transform: scaleY(0.015); filter: brightness(8) blur(2px); }
  20%  { transform: scaleY(0.015); filter: brightness(6) blur(1px); }
  60%  { transform: scaleY(1.03);  filter: brightness(1.3); }
  100% { transform: scaleY(1);     filter: brightness(1); }
}

@keyframes crt-power-off {
  0%   { transform: scaleY(1);     filter: brightness(1); }
  20%  { transform: scaleY(1);     filter: brightness(1.7); }
  55%  { transform: scaleY(0.015); filter: brightness(5) blur(1px); }
  78%  { transform: scaleY(0.015); filter: brightness(2.5) blur(2px); }
  100% { transform: scaleY(0);     filter: brightness(0) blur(4px); }
}

/* ── Scanlines overlay ── */
.dev-terminal {
  position: relative;
  transform-origin: center;
}
.dev-terminal::after {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    to bottom,
    transparent 0px,
    transparent 2px,
    rgba(0,0,0,0.06) 2px,
    rgba(0,0,0,0.06) 4px
  );
  pointer-events: none;
  border-radius: inherit;
  z-index: 1;
}
</style>
