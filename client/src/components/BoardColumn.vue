<script setup>
defineProps({
  column: { type: Object, required: true },
  issues: { type: Array, required: true },
  team: { type: Array, default: () => [] },
})
const emit = defineEmits(['select', 'drop-issue'])

function onDragStart(e, id) {
  e.dataTransfer.setData('text/issue-id', id)
  e.dataTransfer.effectAllowed = 'move'
}
function onDrop(e) {
  e.preventDefault()
  const id = e.dataTransfer.getData('text/issue-id')
  if (id) emit('drop-issue', id)
}
function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
function findUser(team, id) {
  return team.find((u) => u.id === id)
}
</script>

<template>
  <section class="col" @dragover.prevent @drop="onDrop">
    <header>
      <h2>{{ column.label }}</h2>
      <span>{{ issues.length }}</span>
    </header>
    <p class="hint">{{ column.hint }}</p>
    <div class="list">
      <article
        v-for="issue in issues"
        :key="issue.id"
        class="card"
        draggable="true"
        @dragstart="onDragStart($event, issue.id)"
        @click="emit('select', issue.id)"
      >
        <div class="meta">
          <code>{{ issue.key }}</code>
          <em :data-p="issue.priority">{{ issue.priority }}</em>
        </div>
        <h3>{{ issue.title }}</h3>
        <div class="foot">
          <div class="tags">
            <span v-for="l in issue.labels || []" :key="l">{{ l }}</span>
          </div>
          <div
            v-if="findUser(team, issue.assigneeId)"
            class="who"
            :title="findUser(team, issue.assigneeId).name"
          >
            {{ initials(findUser(team, issue.assigneeId).name) }}
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.col {
  background: color-mix(in srgb, var(--bg-panel) 80%, transparent);
  border: 1px solid var(--line-soft);
  border-radius: 14px;
  padding: 12px;
  min-height: 360px;
  transition: border-color 0.2s, background 0.2s;
}
.col:hover {
  border-color: var(--line);
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
h2 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
}
header span {
  font-size: 0.75rem;
  color: var(--faint);
  background: var(--bg);
  padding: 2px 8px;
  border-radius: 99px;
}
.hint {
  margin: 4px 0 12px;
  font-size: 0.75rem;
  color: var(--faint);
}
.list {
  display: grid;
  gap: 8px;
}
.card {
  padding: 12px;
  border-radius: 12px;
  background: var(--bg-elev);
  border: 1px solid var(--line-soft);
  cursor: grab;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.card:hover {
  transform: translateY(-2px);
  border-color: color-mix(in srgb, var(--amber) 35%, var(--line));
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.28);
}
.card:active {
  cursor: grabbing;
}
.meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
code {
  font-size: 0.72rem;
  color: var(--amber);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
em {
  font-style: normal;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 2px 7px;
  border-radius: 99px;
  background: var(--bg);
  color: var(--muted);
}
em[data-p='high'] {
  color: #f0b0a4;
  background: rgba(224, 107, 92, 0.15);
}
em[data-p='medium'] {
  color: #efc98a;
  background: rgba(224, 162, 74, 0.12);
}
h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 550;
  line-height: 1.35;
}
.foot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  gap: 8px;
}
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tags span {
  font-size: 0.68rem;
  color: var(--muted);
  border: 1px solid var(--line);
  padding: 2px 6px;
  border-radius: 6px;
}
.who {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 0.65rem;
  font-weight: 700;
  background: #2a2418;
  color: var(--amber);
  border: 1px solid var(--line);
}
</style>
