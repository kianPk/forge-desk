<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  state,
  projectById,
  userById,
  issuesForProject,
  updateIssue,
  createIssue,
  logout,
  setLabelFilter,
  setPriorityFilter,
} from '../store'
import { COLUMNS } from '../demoData'
import BoardColumn from '../components/BoardColumn.vue'
import IssueDrawer from '../components/IssueDrawer.vue'

const router = useRouter()
const query = ref('')
const composing = ref(false)
const newTitle = ref('')
const mobileNav = ref(false)

const project = computed(() => projectById(state.activeProjectId))
const allLabels = computed(() => {
  const set = new Set()
  for (const i of issuesForProject(state.activeProjectId)) {
    for (const l of i.labels || []) set.add(l)
  }
  return [...set].sort()
})

const issues = computed(() => {
  let list = issuesForProject(state.activeProjectId)
  const q = query.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q) ||
        (i.body || '').toLowerCase().includes(q) ||
        (i.labels || []).some((l) => l.toLowerCase().includes(q)),
    )
  }
  if (state.labelFilter) {
    list = list.filter((i) => (i.labels || []).includes(state.labelFilter))
  }
  if (state.priorityFilter) {
    list = list.filter((i) => i.priority === state.priorityFilter)
  }
  return list
})

const byStatus = computed(() => {
  const map = Object.fromEntries(COLUMNS.map((c) => [c.id, []]))
  for (const issue of issues.value) {
    ;(map[issue.status] || map.todo).push(issue)
  }
  return map
})

const selected = computed(() => state.issues.find((i) => i.id === state.selectedIssueId) || null)

const stats = computed(() => ({
  open: issues.value.filter((i) => i.status !== 'done').length,
  high: issues.value.filter((i) => i.priority === 'high' && i.status !== 'done').length,
  done: issues.value.filter((i) => i.status === 'done').length,
}))

const onlineHere = computed(() =>
  state.presence.filter((p) => !p.projectId || p.projectId === state.activeProjectId),
)

watch(
  () => state.user,
  (u) => {
    if (!u) router.replace('/login')
  },
)

function selectProject(id) {
  state.activeProjectId = id
  state.selectedIssueId = null
  mobileNav.value = false
}

async function onDrop(status, issueId) {
  await updateIssue(issueId, { status })
}

async function addIssue() {
  const title = newTitle.value.trim()
  if (!title || !state.activeProjectId) return
  const issue = await createIssue({
    projectId: state.activeProjectId,
    title,
    status: 'todo',
    priority: 'medium',
    body: '',
  })
  newTitle.value = ''
  composing.value = false
  state.selectedIssueId = issue.id
}

function onLogout() {
  logout()
  router.push('/login')
}
</script>

<template>
  <div class="ws" :class="{ 'nav-open': mobileNav }">
    <aside class="side">
      <div class="side-brand">
        <div class="mark" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M10 34 L24 10 L38 34 Z" stroke="currentColor" stroke-width="2.8" />
            <path d="M16 34 L24 20 L32 34" stroke="currentColor" stroke-width="2" opacity=".7" />
            <rect x="14" y="36" width="20" height="3.2" rx=".8" fill="currentColor" />
          </svg>
        </div>
        <div>
          <strong>Forge Desk</strong>
          <span>{{ state.mode === 'demo' ? 'Demo workspace' : 'Live API' }}</span>
        </div>
      </div>

      <div class="side-section">
        <div class="label">Projects</div>
        <button
          v-for="p in state.projects"
          :key="p.id"
          class="proj"
          :class="{ active: p.id === state.activeProjectId }"
          type="button"
          @click="selectProject(p.id)"
        >
          <i :style="{ background: p.color }" />
          <span>{{ p.name }}</span>
          <em>{{ issuesForProject(p.id).filter((x) => x.status !== 'done').length }}</em>
        </button>
      </div>

      <div class="side-section grow">
        <div class="label">Online</div>
        <div class="presence">
          <div v-for="p in onlineHere" :key="p.id + (p.socketId || '')" class="person">
            <span class="dot" />
            <span>{{ p.name }}</span>
          </div>
          <p v-if="!onlineHere.length" class="empty">Nobody here yet</p>
        </div>
      </div>

      <div class="side-foot">
        <div class="me">
          <div class="avatar">{{ (state.user?.name || '?').slice(0, 1) }}</div>
          <div>
            <strong>{{ state.user?.name }}</strong>
            <span>{{ state.user?.email }}</span>
          </div>
        </div>
        <button class="logout" type="button" @click="onLogout">Sign out</button>
      </div>
    </aside>

    <div class="main">
      <header class="top">
        <button class="menu" type="button" aria-label="Menu" @click="mobileNav = !mobileNav">
          <span /><span /><span />
        </button>
        <div class="title-block">
          <h1>
            <i v-if="project" :style="{ background: project.color }" />
            {{ project?.name || 'Workspace' }}
          </h1>
          <p>{{ project?.description }}</p>
        </div>
        <div class="metrics">
          <div><b>{{ stats.open }}</b><span>Open</span></div>
          <div><b>{{ stats.high }}</b><span>High</span></div>
          <div><b>{{ stats.done }}</b><span>Done</span></div>
        </div>
      </header>

      <div class="toolbar">
        <input v-model="query" class="search" type="search" placeholder="Search issues…" />
        <select class="search" :value="state.labelFilter" @change="setLabelFilter($event.target.value)">
          <option value="">All labels</option>
          <option v-for="l in allLabels" :key="l" :value="l">{{ l }}</option>
        </select>
        <select class="search" :value="state.priorityFilter" @change="setPriorityFilter($event.target.value)">
          <option value="">All priorities</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
        <button class="primary" type="button" @click="composing = !composing">
          {{ composing ? 'Cancel' : 'New issue' }}
        </button>
      </div>
      <div v-if="state.activity.length" class="activity">
        <strong>Activity</strong>
        <span v-for="a in state.activity.slice(0, 5)" :key="a.id">{{ a.text }}</span>
      </div>

      <form v-if="composing" class="compose" @submit.prevent="addIssue">
        <input v-model="newTitle" placeholder="Issue title" autofocus />
        <button class="primary" type="submit">Create</button>
      </form>

      <div class="board">
        <BoardColumn
          v-for="col in COLUMNS"
          :key="col.id"
          :column="col"
          :issues="byStatus[col.id]"
          :team="state.team"
          @select="(id) => (state.selectedIssueId = id)"
          @drop-issue="onDrop(col.id, $event)"
        />
      </div>
    </div>

    <IssueDrawer
      v-if="selected"
      :issue="selected"
      :project="project"
      :assignee="userById(selected.assigneeId)"
      :team="state.team"
      @close="state.selectedIssueId = null"
      @update="(patch) => updateIssue(selected.id, patch)"
    />

    <div v-if="mobileNav" class="scrim" @click="mobileNav = false" />
  </div>
</template>

<style scoped>
.ws {
  display: grid;
  grid-template-columns: 280px 1fr;
  min-height: 100vh;
  position: relative;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 14px;
  border-right: 1px solid var(--line-soft);
  background: color-mix(in srgb, var(--bg-elev) 88%, transparent);
  backdrop-filter: blur(12px);
  z-index: 20;
}
.side-brand {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 6px 8px 18px;
}
.mark {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  color: var(--amber);
  background: var(--amber-glow);
  border: 1px solid color-mix(in srgb, var(--amber) 30%, var(--line));
}
.mark svg {
  width: 28px;
  height: 28px;
}
.side-brand strong {
  display: block;
  font-family: var(--display);
  font-size: 1.05rem;
}
.side-brand span {
  color: var(--faint);
  font-size: 0.75rem;
}
.side-section {
  padding: 4px 4px 12px;
}
.side-section.grow {
  flex: 1;
}
.label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--faint);
  padding: 0 8px 8px;
}
.proj {
  width: 100%;
  display: grid;
  grid-template-columns: 10px 1fr auto;
  gap: 10px;
  align-items: center;
  padding: 10px 10px;
  border-radius: 10px;
  text-align: left;
  color: var(--muted);
  transition: background 0.15s, color 0.15s;
}
.proj i {
  width: 10px;
  height: 10px;
  border-radius: 99px;
}
.proj em {
  font-style: normal;
  font-size: 0.75rem;
  color: var(--faint);
  background: var(--bg);
  padding: 2px 7px;
  border-radius: 99px;
}
.proj:hover,
.proj.active {
  background: var(--bg-hover);
  color: var(--text);
}
.presence {
  display: grid;
  gap: 8px;
  padding: 0 8px;
}
.person {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.88rem;
  color: var(--muted);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 99px;
  background: var(--ok);
  box-shadow: 0 0 0 3px rgba(110, 207, 142, 0.15);
  animation: pulse 2.2s ease infinite;
}
@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 3px rgba(110, 207, 142, 0.12);
  }
  50% {
    box-shadow: 0 0 0 5px rgba(110, 207, 142, 0.05);
  }
}
.empty {
  margin: 0;
  color: var(--faint);
  font-size: 0.82rem;
}
.side-foot {
  border-top: 1px solid var(--line-soft);
  padding-top: 14px;
  display: grid;
  gap: 10px;
}
.me {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 0 6px;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, #3a2e18, #1a160f);
  border: 1px solid var(--line);
  color: var(--amber);
  font-weight: 700;
}
.me strong {
  display: block;
  font-size: 0.9rem;
}
.me span {
  display: block;
  font-size: 0.72rem;
  color: var(--faint);
}
.logout {
  padding: 8px 10px;
  border-radius: 8px;
  color: var(--muted);
  text-align: left;
}
.logout:hover {
  background: var(--bg-hover);
  color: var(--text);
}
.main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 18px 20px 24px;
  gap: 14px;
}
.top {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  animation: rise 0.45s ease;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.title-block h1 {
  margin: 0;
  display: flex;
  gap: 10px;
  align-items: center;
  font-family: var(--display);
  font-size: clamp(1.35rem, 2vw, 1.7rem);
  letter-spacing: -0.02em;
}
.title-block h1 i {
  width: 12px;
  height: 12px;
  border-radius: 99px;
}
.title-block p {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 0.92rem;
}
.metrics {
  display: flex;
  gap: 10px;
}
.metrics div {
  min-width: 72px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--bg-panel);
  border: 1px solid var(--line-soft);
  display: grid;
  gap: 2px;
}
.metrics b {
  font-size: 1.15rem;
  font-family: var(--display);
}
.metrics span {
  font-size: 0.72rem;
  color: var(--faint);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.toolbar {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.search {
  flex: 1;
  min-width: 140px;
  padding: 11px 14px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg-panel);
  outline: none;
}
.activity {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  align-items: center;
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: color-mix(in srgb, var(--bg-panel) 88%, transparent);
  font-size: 0.82rem;
  color: var(--muted);
}
.activity strong { color: var(--ink); margin-right: 4px; }
.search:focus {
  border-color: color-mix(in srgb, var(--amber) 45%, var(--line));
  box-shadow: 0 0 0 3px var(--amber-glow);
}
.primary {
  padding: 11px 16px;
  border-radius: 10px;
  font-weight: 600;
  background: linear-gradient(180deg, #f0b84a, var(--amber-dim));
  color: #1a1408;
}
.compose {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-panel);
  border: 1px solid color-mix(in srgb, var(--amber) 30%, var(--line));
  animation: rise 0.25s ease;
}
.compose input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--bg);
  outline: none;
}
.board {
  display: grid;
  grid-template-columns: repeat(4, minmax(220px, 1fr));
  gap: 12px;
  align-items: start;
  overflow-x: auto;
  padding-bottom: 8px;
  min-height: 420px;
}
.menu {
  display: none;
  width: 42px;
  height: 42px;
  border-radius: 10px;
  border: 1px solid var(--line);
  background: var(--bg-panel);
  place-items: center;
  gap: 4px;
  flex-direction: column;
  padding: 10px;
}
.menu span {
  display: block;
  width: 18px;
  height: 2px;
  background: var(--text);
  border-radius: 2px;
}
.scrim {
  display: none;
}
@media (max-width: 1100px) {
  .board {
    grid-template-columns: repeat(4, minmax(240px, 1fr));
  }
}
@media (max-width: 900px) {
  .ws {
    grid-template-columns: 1fr;
  }
  .side {
    position: fixed;
    inset: 0 auto 0 0;
    width: min(300px, 86vw);
    transform: translateX(-105%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow);
  }
  .ws.nav-open .side {
    transform: none;
  }
  .menu {
    display: grid;
  }
  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 15;
  }
  .metrics {
    width: 100%;
  }
  .metrics div {
    flex: 1;
  }
}
</style>
