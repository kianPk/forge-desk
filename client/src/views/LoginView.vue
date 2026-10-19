<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login, enterDemo, state } from '../store'

const router = useRouter()
const email = ref('demo@forgedesk.dev')
const password = ref('demo1234')
const busy = ref(false)
const error = ref('')

async function onSubmit() {
  busy.value = true
  error.value = ''
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (e) {
    error.value = e.message || 'Login failed'
  } finally {
    busy.value = false
  }
}

async function onDemo() {
  busy.value = true
  await enterDemo()
  busy.value = false
  router.push('/')
}
</script>

<template>
  <div class="login">
    <div class="aurora" aria-hidden="true" />
    <main class="card">
      <div class="brand">
        <div class="mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M10 34 L24 10 L38 34 Z" stroke="currentColor" stroke-width="2.8" />
            <path d="M16 34 L24 20 L32 34" stroke="currentColor" stroke-width="2" opacity=".7" />
            <rect x="14" y="36" width="20" height="3.2" rx=".8" fill="currentColor" />
          </svg>
        </div>
        <div>
          <h1>Forge Desk</h1>
          <p>Product workspace for teams that ship.</p>
        </div>
      </div>

      <form class="form" @submit.prevent="onSubmit">
        <label>
          <span>Email</span>
          <input v-model="email" type="email" autocomplete="username" required />
        </label>
        <label>
          <span>Password</span>
          <input v-model="password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="error" class="err">{{ error }}</p>
        <button class="primary" type="submit" :disabled="busy">
          {{ busy ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <div class="divider"><span>or</span></div>

      <button class="ghost" type="button" :disabled="busy" @click="onDemo">
        Open interactive demo
      </button>

      <p class="hint">
        Demo runs fully offline on GitHub Pages. Live API: run the Node server locally.
        <template v-if="state.apiBase !== null"> · API linked</template>
      </p>
    </main>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.aurora {
  position: absolute;
  inset: -20%;
  background:
    radial-gradient(circle at 30% 40%, rgba(232, 168, 56, 0.16), transparent 35%),
    radial-gradient(circle at 70% 60%, rgba(91, 159, 212, 0.1), transparent 30%);
  animation: drift 14s ease-in-out infinite alternate;
  pointer-events: none;
}
@keyframes drift {
  from {
    transform: translate(-2%, -1%) scale(1);
  }
  to {
    transform: translate(2%, 2%) scale(1.05);
  }
}
.card {
  position: relative;
  width: min(420px, 100%);
  padding: 32px 28px 28px;
  background: color-mix(in srgb, var(--bg-panel) 92%, transparent);
  border: 1px solid var(--line);
  border-radius: 18px;
  box-shadow: var(--shadow);
  backdrop-filter: blur(10px);
  animation: rise 0.5s ease;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.brand {
  display: flex;
  gap: 14px;
  align-items: center;
  margin-bottom: 28px;
}
.mark {
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  color: var(--amber);
  background: var(--amber-glow);
  border: 1px solid color-mix(in srgb, var(--amber) 35%, var(--line));
}
.mark svg {
  width: 34px;
  height: 34px;
}
h1 {
  margin: 0;
  font-family: var(--display);
  font-size: 1.55rem;
  letter-spacing: -0.02em;
}
.brand p {
  margin: 4px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}
.form {
  display: grid;
  gap: 14px;
}
label {
  display: grid;
  gap: 6px;
}
label span {
  font-size: 0.8rem;
  color: var(--muted);
  letter-spacing: 0.02em;
}
input {
  width: 100%;
  padding: 11px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}
input:focus {
  border-color: color-mix(in srgb, var(--amber) 55%, var(--line));
  box-shadow: 0 0 0 3px var(--amber-glow);
}
.primary,
.ghost {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  font-weight: 600;
  transition: transform 0.15s, background 0.15s, border-color 0.15s;
}
.primary {
  background: linear-gradient(180deg, #f0b84a, var(--amber-dim));
  color: #1a1408;
  margin-top: 4px;
}
.primary:hover:not(:disabled) {
  transform: translateY(-1px);
}
.ghost {
  border: 1px solid var(--line);
  background: var(--bg-elev);
  color: var(--text);
}
.ghost:hover:not(:disabled) {
  border-color: color-mix(in srgb, var(--amber) 40%, var(--line));
  background: var(--bg-hover);
}
.divider {
  display: grid;
  place-items: center;
  margin: 18px 0 14px;
  color: var(--faint);
  font-size: 0.78rem;
  position: relative;
}
.divider::before {
  content: '';
  position: absolute;
  inset-inline: 0;
  height: 1px;
  background: var(--line-soft);
}
.divider span {
  position: relative;
  background: var(--bg-panel);
  padding: 0 10px;
}
.err {
  margin: 0;
  color: var(--danger);
  font-size: 0.85rem;
}
.hint {
  margin: 16px 0 0;
  color: var(--faint);
  font-size: 0.78rem;
  line-height: 1.45;
}
</style>
