/** Offline demo dataset for GitHub Pages (no API required). */

export const DEMO_USER = {
  id: 'u_kian',
  name: 'Kian Zarandi',
  email: 'demo@forgedesk.dev',
  role: 'owner',
}

export const DEMO_TEAM = [
  DEMO_USER,
  { id: 'u_sara', name: 'Sara N.', email: 'sara@forgedesk.dev', role: 'member' },
  { id: 'u_reza', name: 'Reza M.', email: 'reza@forgedesk.dev', role: 'member' },
]

export const DEMO_PROJECTS = [
  {
    id: 'p_alpha',
    name: 'Alpha Launch',
    key: 'ALP',
    color: '#e8a838',
    description: 'Ship the public beta of Forge Desk',
    members: ['u_kian', 'u_sara'],
    createdAt: Date.now() - 86400000 * 12,
  },
  {
    id: 'p_ops',
    name: 'Ops Console',
    key: 'OPS',
    color: '#5b9fd4',
    description: 'Internal tooling & observability',
    members: ['u_kian', 'u_reza'],
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'p_web',
    name: 'Web Platform',
    key: 'WEB',
    color: '#6ecf8e',
    description: 'Vue surfaces & design system',
    members: ['u_kian', 'u_sara', 'u_reza'],
    createdAt: Date.now() - 86400000 * 20,
  },
]

let _n = 0
function issue(projectId, key, title, status, priority, assigneeId, body, labels = [], comments = []) {
  _n += 1
  return {
    id: 'i_' + _n,
    key,
    projectId,
    title,
    body,
    status,
    priority,
    assigneeId,
    labels,
    comments,
    createdAt: Date.now() - Math.random() * 86400000 * 14,
    updatedAt: Date.now() - Math.random() * 86400000 * 3,
  }
}

export function createDemoIssues() {
  return [
    issue(
      'p_alpha',
      'ALP-1',
      'Design workspace shell',
      'done',
      'high',
      'u_kian',
      'Sidebar, board, and issue drawer',
      ['design'],
      [
        {
          id: 'c_seed_1',
          author: 'Sara N.',
          body: 'Drawer layout feels good on 1440px — mobile next.',
          at: Date.now() - 86400000 * 2,
        },
      ],
    ),
    issue('p_alpha', 'ALP-2', 'Realtime presence dots', 'done', 'medium', 'u_kian', 'Socket.IO presence channel', ['realtime']),
    issue('p_alpha', 'ALP-3', 'Kanban drag & drop', 'in_progress', 'high', 'u_sara', 'Move cards across columns', ['ux']),
    issue('p_alpha', 'ALP-4', 'JWT auth + session story', 'in_progress', 'high', 'u_kian', 'Login, register, protected routes', ['auth']),
    issue('p_alpha', 'ALP-5', 'Activity timeline feed', 'todo', 'medium', 'u_sara', 'Show who changed what', ['product']),
    issue('p_alpha', 'ALP-6', 'Public demo Pages build', 'review', 'low', 'u_kian', 'Static client for GitHub Pages'),
    issue('p_alpha', 'ALP-7', 'Command palette (⌘K)', 'todo', 'medium', 'u_reza', 'Jump to issues & projects'),
    issue('p_ops', 'OPS-1', 'Health endpoint', 'done', 'low', 'u_kian', 'GET /api/health'),
    issue('p_ops', 'OPS-2', 'Rate-limit sketch', 'todo', 'medium', 'u_reza', 'Protect auth routes'),
    issue('p_ops', 'OPS-3', 'Structured request logs', 'in_progress', 'medium', 'u_kian', 'JSON logs with request ids'),
    issue('p_web', 'WEB-1', 'Token color system', 'done', 'high', 'u_sara', 'Amber forge palette + CSS variables', ['design']),
    issue('p_web', 'WEB-2', 'Motion: board card lift', 'review', 'low', 'u_sara', 'Subtle transitions only'),
    issue('p_web', 'WEB-3', 'Mobile drawer nav', 'todo', 'high', 'u_kian', 'Collapse sidebar under 900px', ['ux']),
  ]
}

export const COLUMNS = [
  { id: 'todo', label: 'Backlog', hint: 'Ready to pick up' },
  { id: 'in_progress', label: 'In progress', hint: 'Actively owned' },
  { id: 'review', label: 'Review', hint: 'Needs eyes' },
  { id: 'done', label: 'Done', hint: 'Shipped' },
]
