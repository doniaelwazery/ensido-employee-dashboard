import { useState } from 'react'
import { type DashGoal } from '../../data/dashboard'
import { Card, Dot, Empty, GOAL, GOAL_SUB, Icon, Pill, Ring, Skel, TextLink, goalFlag, goalLabel } from './shared'

/* ---------- Goals ---------- */

export type GoalFilter = 'all' | 'attention' | 'not_started' | 'in_progress' | 'completed'
export const FILTERS: { id: GoalFilter; label: string; dot: string; test: (g: DashGoal) => boolean; empty: [string, string] }[] = [
  { id: 'all', label: 'All', dot: 'var(--color-primary)', test: () => true, empty: ['No Goals', ''] },
  { id: 'attention', label: 'Needs Attention', dot: 'var(--color-danger)', test: goalFlag, empty: ['Nothing Needs Attention', 'No overdue or rejected goals. Everything is on track.'] },
  { id: 'not_started', label: 'Not Started', dot: 'var(--color-border-darker)', test: (g) => g.status === 'not_started', empty: ['No Goals Waiting to Start', 'Every goal has been started.'] },
  { id: 'in_progress', label: 'In Progress', dot: 'var(--color-info)', test: (g) => g.status === 'in_progress', empty: ['No Goals in Progress', 'Start a goal by logging progress on its first milestone.'] },
  { id: 'completed', label: 'Completed', dot: 'var(--color-success)', test: (g) => g.status === 'completed', empty: ['No Completed Goals Yet', 'Goals you finish will show here.'] },
]

export function GoalsCard({ goals, loading }: { goals: DashGoal[]; loading: boolean }) {
  const [filter, setFilter] = useState<GoalFilter>('all')
  const cur = FILTERS.find((f) => f.id === filter)!
  const list = goals.filter(cur.test)
  const msDone = goals.reduce((s, g) => s + g.done, 0)
  const msTotal = goals.reduce((s, g) => s + g.total, 0)
  const msPct = msTotal ? Math.round((msDone / msTotal) * 100) : 0
  const nextUp = goals.filter((g) => g.status === 'in_progress').sort((a, b) => b.done / b.total - a.done / a.total)[0]
  return (
    <Card
      id="dash-goals"
      className="h-full"
      gap="gap-5"
      busy={loading}
      title="My Goals"
      aside={!loading && goals.length > 0 && <TextLink>View All {goals.length} Goals</TextLink>}
    >
      {loading ? (
        <>
          <div className="flex items-center gap-5"><span className="size-26 shrink-0 animate-pulse rounded-full border-10 border-grey-150" /><div className="grid flex-1 grid-cols-4 gap-2.5">{[0, 1, 2, 3].map((i) => <Skel key={i} className="h-18 rounded-xl" />)}</div></div>
          {[0, 1, 2, 3].map((i) => <Skel key={i} className="h-17.5 rounded-xl" />)}
        </>
      ) : goals.length === 0 ? (
        <Empty icon="target" title="No Goals Yet" text="Goals you create, or that your manager assigns to you, will appear here with their milestones.">
          <button type="button" className="mt-2 flex h-9 cursor-pointer items-center gap-3 rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">
            <Icon name="plus" />
            Create Goal
          </button>
        </Empty>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-5">
            <Ring value={msPct} size={104} stroke={10.4} color="var(--color-success)" track="var(--color-success-bg)" label={`${msDone} of ${msTotal} milestones completed across your goals`}>
              <span className="text-xl leading-6 font-bold text-heading">{msPct}%</span>
              <span className="text-3xs leading-3 text-light-text">milestones</span>
            </Ring>
            <div role="group" aria-label="Filter goals by status" className="grid min-w-0 flex-1 basis-80 grid-cols-2 gap-2.5 sm:grid-cols-5">
              {FILTERS.map((f) => {
                const n = goals.filter(f.test).length
                const on = f.id === filter
                const zero = n === 0
                return (
                  <button key={f.id} type="button" aria-pressed={on} onClick={() => setFilter(f.id)} className={`${f.id === 'all' ? 'col-span-2 sm:col-span-1 ' : ''}flex cursor-pointer flex-col justify-between gap-1.5 rounded-xl border px-3.5 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-primary-light ${on ? 'border-primary bg-row-hover shadow-focus-ring' : zero ? 'border-dashed border-grey-200 bg-grey-light' : 'border-grey-200 bg-white'}`}>
                    <span className={`flex items-start gap-1.5 text-xs leading-4 font-medium ${on ? 'text-primary-dark' : 'text-light-text'}`}>
                      <span className="mt-1 flex"><Dot color={f.dot} hollow={zero} /></span>
                      {f.label}
                    </span>
                    <span className="flex items-baseline gap-1.5">
                      <span className={`text-2xl leading-7.5 font-bold ${on ? 'text-primary-dark' : zero ? 'text-light-text' : 'text-heading'}`}>{n}</span>
                      {zero && !on && <span className="text-2xs leading-3.5 text-light-text">{f.id === 'attention' ? 'All on track' : 'None yet'}</span>}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {list.length === 0 ? (
              <div className="menu-in flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-grey-light px-4 py-7 text-center">
                <p className="text-sm leading-5 font-semibold text-heading">{cur.empty[0]}</p>
                <p className="max-w-90 text-sm leading-5 text-light-text">{filter === 'completed' && nextUp ? `Closest to done: “${nextUp.title}” at ${Math.round((nextUp.done / nextUp.total) * 100)}%.` : cur.empty[1]}</p>
                <button type="button" onClick={() => setFilter('all')} className="mt-1 h-8 cursor-pointer rounded-lg border border-primary bg-white px-3.5 text-xs-plus font-medium text-primary hover:bg-row-hover">Show All Goals</button>
              </div>
            ) : (
              list.slice(0, 4).map((g, i) => {
                const m = GOAL[g.status]
                const sub = g.sub && GOAL_SUB[g.sub]
                const flag = goalFlag(g)
                const pct = Math.round((g.done / g.total) * 100)
                return (
                  <a key={g.title} href="#" onClick={(e) => e.preventDefault()} className={`group menu-in flex items-center gap-3.5 rounded-xl border px-4 py-3 transition-colors hover:border-primary-light ${flag ? 'border-danger-stroke bg-danger-surface' : 'border-grey-200 bg-white'}`} style={{ animationDelay: `${i * 50}ms` }}>
                    <Ring value={pct} size={44} stroke={4.9} color={flag ? 'var(--color-danger)' : m.bar} track="var(--color-grey-150)">
                      <span className="text-3xs leading-3 font-bold text-heading">{pct}%</span>
                    </Ring>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm leading-5 font-semibold text-heading">{g.title}</span>
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs leading-4 text-light-text">
                        <Pill tone={m.tone} dot>
                          <span className="sr-only">{goalLabel(g)}</span>
                          <span aria-hidden="true">
                            {m.label}
                            {sub && <span style={{ color: sub.fg }}> - {sub.label}</span>}
                          </span>
                        </Pill>
                        <span>{g.done} of {g.total} milestones</span>
                        <span aria-hidden="true">·</span>
                        <span>{g.updated ? `Updated ${g.updated.replace(',', '')}` : 'No updates yet'}</span>
                      </span>
                    </span>
                    <Icon name="chev" size={18} color="var(--color-border-darker)" className="transition-transform group-hover:translate-x-1 group-hover:stroke-primary" />
                  </a>
                )
              })
            )}
          </div>
          {list.length > 0 && (
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs leading-4 text-light-text">Showing {Math.min(4, list.length)} of {list.length} · most urgent first</span>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
