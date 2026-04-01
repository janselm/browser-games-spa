/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg':      '#1a1a2e',
        'brand-surface': '#16213e',
        'brand-accent':  '#0f3460',
        'brand-pop':     '#e94560',
        'brand-text':    '#eaeaea',
        'brand-muted':   '#8892a4',
      },
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body:    ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
