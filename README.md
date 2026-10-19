# Forge Desk

**Product workspace for teams that ship** — Vue 3 board, JWT auth, and Socket.IO presence.

Live demo: **https://kianpk.github.io/forge-desk/**

![stack](https://img.shields.io/badge/Vue_3-Vite-42b883?style=flat-square)
![stack](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square)
![stack](https://img.shields.io/badge/Realtime-Socket.IO-010101?style=flat-square)
![stack](https://img.shields.io/badge/Auth-JWT-000000?style=flat-square)

## What it is

Forge Desk is a Linear-style issue workspace:

- Multi-project sidebar with open-issue counts
- Kanban board (Backlog → In progress → Review → Done) with HTML5 drag & drop
- Issue drawer (title, description, status, priority, assignee)
- Online presence strip (Socket.IO when API is running)
- Full **offline demo** on GitHub Pages (no backend required)
- Express API: register/login, projects, issues CRUD, team, presence

## Stack

| Layer | Tech |
|-------|------|
| Client | Vue 3 · Vite · Vue Router · Socket.IO client |
| Server | Node.js · Express · JWT · bcrypt · Zod · Socket.IO |
| Hosting | GitHub Pages (`/docs`) for the static demo |

## Quick start

```bash
# API
cd server && npm install && node index.js
# → http://localhost:8787

# Client (proxies /api + /socket.io)
cd client && npm install && npm run dev
# → http://localhost:5173
```

Demo credentials (seeded on the server):

```text
email:    demo@forgedesk.dev
password: demo1234
```

On GitHub Pages, open **Interactive demo** — the board runs entirely in the browser.

## Build Pages demo

```bash
cd client && npm run build
# outputs to ../docs
```

## API map

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/health` | Liveness |
| POST | `/api/auth/register` | Create user |
| POST | `/api/auth/login` | JWT |
| GET | `/api/me` | Current user |
| GET | `/api/projects` | Project list |
| GET | `/api/issues` | Filter by `projectId`, `status` |
| POST | `/api/issues` | Create |
| PATCH | `/api/issues/:id` | Update |
| GET | `/api/team` | Members |
| GET | `/api/presence` | Who's online |

Realtime events: `presence:sync`, `issue:created`, `issue:updated`.

## Author

[kianPk](https://github.com/kianPk) · Vue & Node backends
