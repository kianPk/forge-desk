<script setup>
import { onMounted } from 'vue'
import { state, bootstrapDemo, loadWorkspace } from './store'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(async () => {
  if (state.token && state.apiBase !== null) {
    try {
      await loadWorkspace()
      router.replace('/')
      return
    } catch {
      /* fall through to demo */
    }
  }
  if (!state.user) {
    await bootstrapDemo()
  }
})
</script>

<template>
  <div class="app-shell">
    <Transition name="fade">
      <div v-if="state.toast" class="toast" :data-type="state.toast.type">
        {{ state.toast.msg }}
      </div>
    </Transition>
    <RouterView />
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
}
.toast {
  position: fixed;
  top: 18px;
  right: 18px;
  z-index: 100;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--bg-panel);
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  font-size: 0.92rem;
  animation: slideIn 0.28s ease;
}
.toast[data-type='info'] {
  border-color: color-mix(in srgb, var(--amber) 40%, var(--line));
}
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
</style>
