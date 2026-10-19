<script setup>
import { computed, ref, watch } from 'vue'
import { COLUMNS } from '../demoData'

const props = defineProps({
  issue: { type: Object, required: true },
  project: { type: Object, default: null },
  assignee: { type: Object, default: null },
  team: { type: Array, default: () => [] },
})
const emit = defineEmits(['close', 'update'])

const title = ref(props.issue.title)
const body = ref(props.issue.body || '')
const status = ref(props.issue.status)
const priority = ref(props.issue.priority)
const assigneeId = ref(props.issue.assigneeId || '')

watch(
  () => props.issue.id,
  () => {
    title.value = props.issue.title
    body.value = props.issue.body || ''
    status.value = props.issue.status
    priority.value = props.issue.priority
    assigneeId.value = props.issue.assigneeId || ''
  },
)

const dirty = computed(
  () =>
    title.value !== props.issue.title ||
    body.value !== (props.issue.body || '') ||
    status.value !== props.issue.status ||
    priority.value !== props.issue.priority ||
    assigneeId.value !== (props.issue.assigneeId || ''),
)

function save() {
  emit('update', {
    title: title.value.trim() || props.issue.title,
    body: body.value,
    status: status.value,
    priority: priority.value,
    assigneeId: assigneeId.value || null,
  })
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <aside class="drawer" role="dialog" aria-label="Issue details">
      <header>
        <div>
          <code>{{ issue.key }}</code>
          <span v-if="project" class="proj">{{ project.name }}</span>
        </div>
        <button type="button" class="x" aria-label="Close" @click="emit('close')">×</button>
      </header>

      <input v-model="title" class="title" />
      <textarea v-model="body" class="body" rows="6" placeholder="Description…" />

      <div class="grid">
        <label>
          <span>Status</span>
          <select v-model="status">
            <option v-for="c in COLUMNS" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </label>
        <label>
          <span>Priority</span>
          <select v-model="priority">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label class="full">
          <span>Assignee</span>
          <select v-model="assigneeId">
            <option value="">Unassigned</option>
            <option v-for="u in team" :key="u.id" :value="u.id">{{ u.name }}</option>
          </select>
        </label>
      </div>

      <footer>
        <button type="button" class="ghost" @click="emit('close')">Close</button>
        <button type="button" class="primary" :disabled="!dirty" @click="save">Save changes</button>
      </footer>
    </aside>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(6, 5, 4, 0.55);
  z-index: 40;
  display: flex;
  justify-content: flex-end;
  animation: fade 0.2s ease;
}
@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.drawer {
  width: min(440px, 100%);
  height: 100%;
  background: var(--bg-panel);
  border-left: 1px solid var(--line);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: var(--shadow);
  animation: slide 0.28s ease;
}
@keyframes slide {
  from {
    transform: translateX(24px);
    opacity: 0.6;
  }
  to {
    transform: none;
    opacity: 1;
  }
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
code {
  color: var(--amber);
  font-size: 0.85rem;
}
.proj {
  margin-left: 10px;
  color: var(--faint);
  font-size: 0.8rem;
}
.x {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 1.4rem;
  color: var(--muted);
  background: var(--bg);
  border: 1px solid var(--line);
}
.title {
  width: 100%;
  padding: 10px 0;
  border: none;
  border-bottom: 1px solid var(--line);
  background: transparent;
  font-family: var(--display);
  font-size: 1.25rem;
  font-weight: 700;
  outline: none;
}
.body {
  width: 100%;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  resize: vertical;
  outline: none;
  line-height: 1.5;
  color: var(--muted);
}
.body:focus,
.title:focus {
  color: var(--text);
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.full {
  grid-column: 1 / -1;
}
label {
  display: grid;
  gap: 6px;
}
label span {
  font-size: 0.75rem;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
select {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg);
  outline: none;
}
footer {
  margin-top: auto;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.primary,
.ghost {
  padding: 11px 16px;
  border-radius: 10px;
  font-weight: 600;
}
.primary {
  background: linear-gradient(180deg, #f0b84a, var(--amber-dim));
  color: #1a1408;
}
.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.ghost {
  border: 1px solid var(--line);
  color: var(--muted);
}
</style>
