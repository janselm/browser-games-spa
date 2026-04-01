<script setup>
defineProps({
  wrongCount: { type: Number, required: true },
})
</script>

<template>
  <svg viewBox="0 0 200 220" class="w-full max-w-xs mx-auto" xmlns="http://www.w3.org/2000/svg">
    <!-- Gallows structure -->
    <line x1="10"  y1="210" x2="190" y2="210" stroke="#e94560" stroke-width="4" stroke-linecap="round"/>
    <line x1="60"  y1="210" x2="60"  y2="10"  stroke="#e94560" stroke-width="4" stroke-linecap="round"/>
    <line x1="60"  y1="10"  x2="130" y2="10"  stroke="#e94560" stroke-width="4" stroke-linecap="round"/>
    <line x1="130" y1="10"  x2="130" y2="40"  stroke="#e94560" stroke-width="4" stroke-linecap="round"/>

    <!-- Head -->
    <circle v-if="wrongCount >= 1" cx="130" cy="55" r="15" stroke="#eaeaea" stroke-width="3" fill="none"/>
    <!-- Body -->
    <line   v-if="wrongCount >= 2" x1="130" y1="70"  x2="130" y2="130" stroke="#eaeaea" stroke-width="3" stroke-linecap="round"/>
    <!-- Left arm -->
    <line   v-if="wrongCount >= 3" x1="130" y1="85"  x2="105" y2="110" stroke="#eaeaea" stroke-width="3" stroke-linecap="round"/>
    <!-- Right arm -->
    <line   v-if="wrongCount >= 4" x1="130" y1="85"  x2="155" y2="110" stroke="#eaeaea" stroke-width="3" stroke-linecap="round"/>
    <!-- Left leg -->
    <line   v-if="wrongCount >= 5" x1="130" y1="130" x2="105" y2="160" stroke="#eaeaea" stroke-width="3" stroke-linecap="round"/>
    <!-- Right leg -->
    <line   v-if="wrongCount >= 6" x1="130" y1="130" x2="155" y2="160" stroke="#eaeaea" stroke-width="3" stroke-linecap="round"/>
  </svg>
</template>
