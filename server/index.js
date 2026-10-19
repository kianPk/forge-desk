import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const PORT = process.env.PORT || 8787
const JWT_SECRET = process.env.JWT_SECRET || 'forge-desk-dev-secret'
const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

app.use(cors())
app.use(express.json())

const users = new Map()
const projects = new Map()
const issues = new Map()
const presence = new Map()

function seed() {
  const pass = bcrypt.hashSync('demo1234', 8)
  const u1 = { id: 'u_kian', name: 'Kian Zarandi', email: 'demo@forgedesk.dev', password: pass, role: 'owner' }
  const u2 = { id: 'u_sara', name: 'Sara N.', email: 'sara@forgedesk.dev', password: pass, role: 'member' }
  users.set(u1.email, u1)
  users.set(u2.email, u2)

  const p1 = {
    id: 'p_alpha',
    name: 'Alpha Launch',
    key: 'ALP',
    color: '#e8a838',
    description: 'Ship the public beta of Forge Desk',
    members: [u1.id, u2.id],
    createdAt: Date.now() - 86400000 * 12,
  }
  const p2 = {
    id: 'p_ops',
    name: 'Ops Console',
    key: 'OPS',
    color: '#5b9fd4',
    description: 'Internal tooling & observability',
    members: [u1.id],
    createdAt: Date.now() - 86400000 * 5,
  }
  projects.set(p1.id, p1)
  projects.set(p2.id, p2)

  const sample = [
    ['ALP-1', 'p_alpha', 'Design workspace shell', 'done', 'high', u1.id, 'Sidebar, board, and issue drawer'],
    ['ALP-2', 'p_alpha', 'Realtime presence dots', 'done', 'medium', u1.id, 'Socket.IO presence channel'],
    ['ALP-3', 'p_alpha', 'Kanban drag & drop', 'in_progress', 'high', u2.id, 'Move cards across columns'],
    ['ALP-4', 'p_alpha', 'JWT auth + refresh story', 'in_progress', 'high', u1.id, 'Login, register, protected routes'],
    ['ALP-5', 'p_alpha', 'Activity timeline feed', 'todo', 'medium', u2.id, 'Show who changed what'],
    ['ALP-6', 'p_alpha', 'Public demo Pages build', 'todo', 'low', u1.id, 'Static client for GitHub Pages'],
    ['OPS-1', 'p_ops', 'Health endpoint', 'done', 'low', u1.id, 'GET /api/health'],
    ['OPS-2', 'p_ops', 'Rate-limit sketch', 'todo', 'medium', u1.id, 'Protect auth routes'],
  ]
  for (const [key, projectId, title, status, priority, assigneeId, body] of sample) {
    const id = randomUUID()
    issues.set(id, {
      id,
      key,
      projectId,
      title,
      body,
      status,
      priority,
      assigneeId,
      labels: priority === 'high' ? ['critical'] : [],
      createdAt: Date.now() - Math.random() * 86400000 * 10,
      updatedAt: Date.now() - Math.random() * 86400000 * 2,
    })
  }
}
seed()

function auth(req, res, next) {
  const h = req.headers.authorization || ''
  const token = h.startsWith('Bearer ') ? h.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid token' })
  }
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role }
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'forge-desk', ts: Date.now() })
})

app.post('/api/auth/register', async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  if (users.has(parsed.data.email)) return res.status(409).json({ error: 'Email already registered' })
  const user = {
    id: 'u_' + randomUUID().slice(0, 8),
    name: parsed.data.name,
    email: parsed.data.email,
    password: await bcrypt.hash(parsed.data.password, 8),
    role: 'member',
  }
  users.set(user.email, user)
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
  res.status(201).json({ token, user: publicUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const schema = z.object({ email: z.string().email(), password: z.string() })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid payload' })
  const user = users.get(parsed.data.email)
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
  res.json({ token, user: publicUser(user) })
})

app.get('/api/me', auth, (req, res) => {
  const user = [...users.values()].find((u) => u.id === req.user.sub)
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json({ user: publicUser(user) })
})

app.get('/api/projects', auth, (_req, res) => {
  res.json({ projects: [...projects.values()] })
})

app.get('/api/projects/:id/issues', auth, (req, res) => {
  const list = [...issues.values()]
    .filter((i) => i.projectId === req.params.id)
    .sort((a, b) => b.updatedAt - a.updatedAt)
  res.json({ issues: list })
})

app.get('/api/issues', auth, (req, res) => {
  let list = [...issues.values()]
  if (req.query.projectId) list = list.filter((i) => i.projectId === req.query.projectId)
  if (req.query.status) list = list.filter((i) => i.status === req.query.status)
  res.json({ issues: list.sort((a, b) => b.updatedAt - a.updatedAt) })
})

app.post('/api/issues', auth, (req, res) => {
  const schema = z.object({
    projectId: z.string(),
    title: z.string().min(2),
    body: z.string().optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).default('todo'),
    priority: z.enum(['low', 'medium', 'high']).default('medium'),
    assigneeId: z.string().optional(),
  })
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const project = projects.get(parsed.data.projectId)
  if (!project) return res.status(404).json({ error: 'Project not found' })
  const count = [...issues.values()].filter((i) => i.projectId === project.id).length + 1
  const id = randomUUID()
  const issue = {
    id,
    key: `${project.key}-${count}`,
    ...parsed.data,
    labels: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  issues.set(id, issue)
  io.emit('issue:created', issue)
  res.status(201).json({ issue })
})

app.patch('/api/issues/:id', auth, (req, res) => {
  const issue = issues.get(req.params.id)
  if (!issue) return res.status(404).json({ error: 'Not found' })
  const allowed = ['title', 'body', 'status', 'priority', 'assigneeId', 'labels']
  for (const k of allowed) {
    if (req.body[k] !== undefined) issue[k] = req.body[k]
  }
  issue.updatedAt = Date.now()
  issues.set(issue.id, issue)
  io.emit('issue:updated', issue)
  res.json({ issue })
})

app.get('/api/team', auth, (_req, res) => {
  res.json({ users: [...users.values()].map(publicUser) })
})

app.get('/api/presence', auth, (_req, res) => {
  res.json({ online: [...presence.values()] })
})

io.use((socket, next) => {
  const token = socket.handshake.auth?.token
  if (!token) return next(new Error('auth required'))
  try {
    socket.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    next(new Error('invalid token'))
  }
})

io.on('connection', (socket) => {
  const entry = {
    id: socket.user.sub,
    name: socket.user.name,
    socketId: socket.id,
    projectId: null,
    since: Date.now(),
  }
  presence.set(socket.id, entry)
  io.emit('presence:sync', [...presence.values()])

  socket.on('presence:project', (projectId) => {
    const p = presence.get(socket.id)
    if (p) {
      p.projectId = projectId
      presence.set(socket.id, p)
      io.emit('presence:sync', [...presence.values()])
    }
  })

  socket.on('disconnect', () => {
    presence.delete(socket.id)
    io.emit('presence:sync', [...presence.values()])
  })
})

httpServer.listen(PORT, () => {
  console.log(`forge-desk api on :${PORT}`)
})
