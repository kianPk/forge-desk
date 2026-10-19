import { createRouter, createWebHashHistory } from 'vue-router'
import { state } from './store'
import LoginView from './views/LoginView.vue'
import WorkspaceView from './views/WorkspaceView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/', name: 'workspace', component: WorkspaceView },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (!to.meta.public && !state.user && !state.token && state.mode !== 'demo') {
    // allow landing into demo without forced login — LoginView offers demo CTA
    if (to.name !== 'login') return { name: 'login' }
  }
  if (to.name === 'login' && state.user) return { name: 'workspace' }
  return true
})

export default router
