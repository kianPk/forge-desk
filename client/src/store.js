import { reactive } from 'vue'
import { DEMO_USER, DEMO_TEAM, DEMO_PROJECTS, createDemoIssues } from './demoData'

const TOKEN_KEY = 'forge_desk_token'
const MODE_KEY = 'forge_desk_mode'
const COMMENTS_KEY = 'forge_desk_issue_comments'

function loadCommentMap() {
  try {
    return JSON.parse(localStorage.getItem(COMMENTS_KEY) || '{}')
  } catch {
    return {}
  }
}

function persistComments() {
  const map = {}
  for (const i of state.issues) {
    if (i.comments?.length) map[i.id] = i.comments
  }
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(map))
}

function hydrateIssueComments() {
  const map = loadCommentMap()
  for (const issue of state.issues) {
    if (map[issue.id]?.length) issue.comments = map[issue.id]
    else if (!issue.comments) issue.comments = []
  }
}

function detectLiveApi() {
  // Live API only when explicitly configured or same-origin proxy in dev
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (import.meta.env.DEV) return ''
  return null
}

export const state = reactive({
  mode: localStorage.getItem(MODE_KEY) || 'demo', // demo | live
  apiBase: detectLiveApi(),
  token: localStorage.getItem(TOKEN_KEY) || '',
  user: null,
  projects: [],
  issues: [],
  team: [],
  presence: [],
  activity: [],
  labelFilter: localStorage.getItem('forge_desk_label') || '',
  priorityFilter: localStorage.getItem('forge_desk_priority') || '',
  activeProjectId: null,
  selectedIssueId: null,
  loading: false,
  toast: null,
  socket: null,
})

function pushActivity(text) {
  state.activity.unshift({ id: 'a_' + Date.now(), text, at: Date.now() })
  if (state.activity.length > 40) state.activity.length = 40
}

export function toast(msg, type = 'info') {
  state.toast = { msg, type, id: Date.now() }
  setTimeout(() => {
    if (state.toast?.msg === msg) state.toast = null
  }, 2800)
}

export function setMode(mode) {
  state.mode = mode
  localStorage.setItem(MODE_KEY, mode)
}

export function setToken(token) {
  state.token = token || ''
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (state.token) headers.Authorization = `Bearer ${state.token}`
  const base = state.apiBase ?? ''
  const res = await fetch(`${base}${path}`, { ...opts, headers })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || res.statusText || 'Request failed')
  return data
}

export async function bootstrapDemo() {
  state.user = { ...DEMO_USER }
  state.projects = structuredClone(DEMO_PROJECTS)
  state.issues = createDemoIssues()
  state.team = structuredClone(DEMO_TEAM)
  state.presence = [
    { id: DEMO_USER.id, name: DEMO_USER.name, projectId: 'p_alpha', since: Date.now() },
    { id: 'u_sara', name: 'Sara N.', projectId: 'p_alpha', since: Date.now() - 60000 },
  ]
  state.activeProjectId = state.projects[0]?.id || null
  hydrateIssueComments()
  setMode('demo')
}

export async function login(email, password) {
  if (state.mode === 'demo' || state.apiBase === null) {
    await bootstrapDemo()
    toast('Demo workspace ready')
    return state.user
  }
  const data = await api('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setToken(data.token)
  state.user = data.user
  setMode('live')
  await loadWorkspace()
  return data.user
}

export async function enterDemo() {
  setToken('')
  await bootstrapDemo()
  toast('Exploring offline demo')
}

export async function loadWorkspace() {
  if (state.mode === 'demo' || !state.token) {
    if (!state.user) await bootstrapDemo()
    return
  }
  state.loading = true
  try {
    const [me, projects, issues, team] = await Promise.all([
      api('/api/me'),
      api('/api/projects'),
      api('/api/issues'),
      api('/api/team'),
    ])
    state.user = me.user
    state.projects = projects.projects
    state.issues = issues.issues
    state.team = team.users
    if (!state.activeProjectId) state.activeProjectId = state.projects[0]?.id || null
  } finally {
    state.loading = false
  }
}

export function issuesForProject(projectId) {
  return state.issues.filter((i) => i.projectId === projectId)
}

export function projectById(id) {
  return state.projects.find((p) => p.id === id)
}

export function userById(id) {
  return state.team.find((u) => u.id === id)
}

export async function updateIssue(id, patch) {
  const idx = state.issues.findIndex((i) => i.id === id)
  if (idx < 0) return
  if (state.mode === 'demo' || !state.token) {
    const before = state.issues[idx]
    state.issues[idx] = { ...before, ...patch, updatedAt: Date.now() }
    if (patch.status && patch.status !== before.status) {
      pushActivity(`${before.key} → ${patch.status}`)
    } else {
      pushActivity(`${before.key} updated`)
    }
    toast('Issue updated')
    return state.issues[idx]
  }
  const data = await api(`/api/issues/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })
  state.issues[idx] = data.issue
  pushActivity(`${data.issue.key} updated`)
  return data.issue
}

export async function createIssue(payload) {
  if (state.mode === 'demo' || !state.token) {
    const project = projectById(payload.projectId)
    const count = state.issues.filter((i) => i.projectId === payload.projectId).length + 1
    const issue = {
      id: 'i_' + Date.now(),
      key: `${project?.key || 'FD'}-${count}`,
      labels: [],
      comments: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      assigneeId: state.user?.id,
      ...payload,
    }
    state.issues.unshift(issue)
    pushActivity(`created ${issue.key}`)
    toast('Issue created')
    return issue
  }
  const data = await api('/api/issues', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  state.issues.unshift(data.issue)
  pushActivity(`created ${data.issue.key}`)
  return data.issue
}

export function setLabelFilter(label) {
  state.labelFilter = label || ''
  if (label) localStorage.setItem('forge_desk_label', label)
  else localStorage.removeItem('forge_desk_label')
}

export function addIssueComment(issueId, body) {
  const text = (body || '').trim()
  if (!text) return null
  const issue = state.issues.find((i) => i.id === issueId)
  if (!issue) return null
  if (!issue.comments) issue.comments = []
  const author = state.user?.name || 'You'
  const comment = {
    id: 'c_' + Date.now(),
    author,
    body: text,
    at: Date.now(),
  }
  issue.comments.push(comment)
  issue.updatedAt = Date.now()
  pushActivity(`comment on ${issue.key}`)
  if (state.mode === 'demo' || !state.token) persistComments()
  toast('Comment added')
  return comment
}

export function setPriorityFilter(priority) {
  state.priorityFilter = priority || ''
  if (priority) localStorage.setItem('forge_desk_priority', priority)
  else localStorage.removeItem('forge_desk_priority')
}

export function logout() {
  setToken('')
  state.user = null
  state.projects = []
  state.issues = []
  state.presence = []
  state.selectedIssueId = null
}

// Pages / first paint: seed demo immediately so the board is never empty.
if (state.mode === 'demo' && !state.user) {
  state.user = { ...DEMO_USER }
  state.projects = structuredClone(DEMO_PROJECTS)
  state.issues = createDemoIssues()
  state.team = structuredClone(DEMO_TEAM)
  state.presence = [
    { id: DEMO_USER.id, name: DEMO_USER.name, projectId: 'p_alpha', since: Date.now() },
    { id: 'u_sara', name: 'Sara N.', projectId: 'p_alpha', since: Date.now() - 60000 },
  ]
  state.activeProjectId = state.projects[0]?.id || null
  hydrateIssueComments()
}
