/**
 * Vue Router configuration for the Games SPA.
 *
 * Game views are lazy-loaded to keep the initial bundle small.
 *
 * The /admin route uses a beforeEnter guard with a two-step auth check:
 *   1. localStorage fast-path — avoids an unnecessary API call if the flag
 *      was never set (e.g. the user has never logged in on this device).
 *   2. Server-side verify via api.checkAuth() — confirms the PHP session is
 *      still valid, catching expired sessions or server-side logouts.
 */
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { api } from '../services/api.js'

const routes = [
  { path: '/',              component: HomeView },
  { path: '/hangman',       component: () => import('../views/HangmanView.vue') },
  { path: '/wordsearch',    component: () => import('../views/WordSearchView.vue') },
  { path: '/typegame',      component: () => import('../views/TypegameView.vue') },
  { path: '/pong',          component: () => import('../views/PongView.vue') },
  { path: '/admin/login',   component: () => import('../views/AdminLoginView.vue') },
  {
    path: '/admin',
    component: () => import('../views/AdminView.vue'),
    beforeEnter: async () => {
      if (localStorage.getItem('admin_auth') !== '1') return '/admin/login'
      try { await api.checkAuth(); return true }
      catch { localStorage.removeItem('admin_auth'); return '/admin/login' }
    },
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
