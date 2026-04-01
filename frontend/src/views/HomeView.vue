<script setup>
import GameCard from '../components/common/GameCard.vue'
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center px-4 py-12">
    <h1 class="font-display text-7xl text-brand-pop mb-4 tracking-wide">GAMES</h1>
    <p class="text-brand-muted mb-12 text-lg">Pick a game and have fun!</p>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
      <GameCard
        title="Hangman"
        description="Guess the word before the man is hanged!"
        to="/hangman"
      />
      <GameCard
        title="Word Search"
        description="Find all the hidden words in the grid!"
        to="/wordsearch"
      />
      <GameCard
        title="Type Game"
        description="Type fast to shoot down falling letters!"
        to="/typegame"
      />
      <GameCard
        title="Pong"
        description="First-person 3D Pong against an AI opponent!"
        to="/pong"
      />
    </div>

    <RouterLink
      to="/admin"
      class="mt-10 text-brand-muted text-sm hover:text-brand-text transition-colors"
    >
      Manage Games
    </RouterLink>
  </div>
</template>
