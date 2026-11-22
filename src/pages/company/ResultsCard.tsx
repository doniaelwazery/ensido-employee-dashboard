import { useState } from 'react'
import { CATEGORIES, category } from '../../data/dashboard'
import { type CompletedRound, type Person } from '../../data/company'
import { Card, Empty, Icon, Skel, TextLink } from '../dashboard/shared'

const RANGES = ['90–100%', '75–89%', '60–74%', 'Below 60%']

export function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase()
}
const AV = [['var(--color-primary-lighter)', 'var(--color-primary-dark)'], ['var(--color-success-bg)', 'var(--color-success-dark)'], ['var(--color-warning-bg)', '#8a4b06'], ['var(--color-danger-bg)', 'var(--color-danger-dark)'], ['var(--color-info-bg)', 'var(--color-info-dark)']]
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const [bg, fg] = AV[h % AV.length]
  return (
    <span aria-hidden="true" className="flex shrink-0 items-center justify-center rounded-full text-xs font-semibold" style={{ width: size, height: size, background: bg, color: fg }}>
      {initials(name)}
    </span>
  )
}

/** Latest Round Results: round picker, one calm vertical bar chart (categories or departments), top and low scorers. */
export function ResultsCard({ rounds, team, loading, error, onRetry }: { rounds: CompletedRound[]; team: boolean; loading: boolean; error: boolean; onRetry: () => void }) {
  const [idx, setIdx] = useState(0)
  const [view, setView] = useState<'cats' | 'units'>('cats')
  const round = rounds[Math.min(idx, rounds.length - 1)]
  const prev = rounds[Math.min(idx, rounds.length - 1) + 1]
  const s = round ? (team ? round.team : round.company) : null
  const ps = prev ? (team ? prev.team : prev.company) : null
  const unitWord = team ? 'Team' : 'Department'

  const picker = !loading && !error && rounds.length > 0 && (
    <label className="flex items-center gap-2 text-xs leading-4 text-light-text">
      <span className="sr-only">Round</span>
      <select value={idx} onChange={(e) => setIdx(Number(e.target.value))} className="h-9 cursor-pointer rounded-lg border border-border bg-white px-3 pr-8 text-sm leading-5 font-medium text-heading">
        {rounds.map((r, i) => <option key={r.id} value={i}>{r.title}</option>)}
      </select>
    </label>
  )

  return (
    <Card
      id="co-results"
      busy={loading}
      title="Latest Round Results"
      sub={round && !loading && !error ? `Published ${round.published} · covered ${round.covered}${team ? ' · your teams only' : ''}` : undefined}
      aside={picker}
      gap="gap-5"
    >
      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Skel className="h-72 rounded-lg" />
          <div className="flex flex-col gap-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skel key={i} className="h-10" />)}</div>
        </div>
      ) : error ? (
        <div role="alert">
          <Empty icon="alert" tone="grey" title="Could Not Load Round Results" text="Something went wrong while loading the results. The rest of the dashboard is still up to date.">
            <button type="button" onClick={onRetry} className="mt-2 h-9 cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-body-bg">Try Again</button>
          </Empty>
        </div>
      ) : !round || !s ? (
        <Empty icon="chart" title="No Completed Rounds Yet" text="When your first round closes, its score categories, department averages and top performers appear here." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-4 self-start rounded-xl border border-grey-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm leading-5 font-semibold text-heading">{view === 'cats' ? 'Score Categories' : `Average Score by ${unitWord}`}</span>
              <div role="group" aria-label="Chart" className="flex gap-0.5 rounded-lg bg-grey-150 p-0.5">
                {([['cats', 'Categories'], ['units', `By ${unitWord}`]] as const).map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)} className={`h-7 cursor-pointer rounded-md px-3 text-xs font-medium transition-colors ${view === k ? 'bg-white text-primary shadow-card' : 'text-light-text hover:text-body-text'}`}>{l}</button>
                ))}
              </div>
            </div>
            {view === 'cats' ? (
              <Bars
                key={`c-${round.id}-${team}`}
                label={`People per score category in ${round.title}`}
                max={Math.max(...s.cats)}
                items={CATEGORIES.map((c, i) => ({ key: c.key, value: s.cats[i], top: String(s.cats[i]), name: c.label, range: RANGES[i], color: c.color }))}
              />
            ) : (
              <Bars
                key={`u-${round.id}-${team}`}
                label={`Average score by ${unitWord.toLowerCase()} in ${round.title}`}
                max={100}
                items={[...s.units].sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ key: n, value: v, top: `${v}%`, name: n, range: category(v).label, color: category(v).color }))}
              />
            )}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-grey-200 pt-3.5 text-xs leading-4 text-light-text">
              <span className="flex items-baseline gap-1.5">
                <span className="text-display-sm leading-7 font-bold text-heading">{s.avg}%</span>
                {team ? 'team average' : 'company average'}
              </span>
              {ps && (
                <span className="inline-flex items-center gap-1 font-medium" style={{ color: s.avg >= ps.avg ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                  <Icon name="up" size={12} sw={2.6} className={s.avg >= ps.avg ? '' : 'rotate-180'} />
                  {s.avg >= ps.avg ? '+' : ''}{(s.avg - ps.avg).toFixed(1)} pts vs {prev.short}
                </span>
              )}
              <span className="ml-auto">{s.participants} evaluated · median {s.median}% · highest {s.high}% · lowest {s.low}%</span>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-5">
            <PeopleList title="Top Performers" people={s.top} tone="good" total={s.top.length} />
            <PeopleList title="Needs Improvement" people={s.low5} tone="bad" total={s.cats[3]} />
            <TextLink arrow>Open Full Results</TextLink>
          </div>
        </div>
      )}
    </Card>
  )
}

/** shadcn-style vertical bars: faint gridlines, no axis lines, rounded tops, value on top, label + range below. */
function Bars({ items, max, label }: { items: { key: string; value: number; top: string; name: string; range: string; color: string }[]; max: number; label: string }) {
  return (
    <div role="img" aria-label={`${label}: ${items.map((i) => `${i.name} ${i.top}`).join(', ')}`} className="flex flex-col gap-2">
      <div className="relative h-48">
        {[0, 25, 50, 75, 100].map((g) => <span key={g} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-grey-200" style={{ bottom: `${g}%` }} />)}
        <div className="absolute inset-0 flex items-end gap-3 px-1 sm:gap-4">
          {items.map((it, i) => (
            <div key={it.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs leading-4 font-semibold text-heading">{it.top}</span>
              <span className="grow-y block w-full max-w-14 rounded-t-md" style={{ height: `${Math.max(2, (it.value / max) * 82)}%`, background: it.color, animationDelay: `${i * 70}ms` }} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-3 px-1 sm:gap-4">
        {items.map((it) => (
          <div key={it.key} className="flex min-w-0 flex-1 flex-col items-center text-center">
            <span className="text-2xs leading-3.5 font-medium text-body-text">{it.name}</span>
            <span className="text-3xs leading-3 text-light-text">{it.range}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function PeopleList({ title, people, tone, total }: { title: string; people: Person[]; tone: 'good' | 'bad'; total: number }) {
  const c = tone === 'good' ? { dot: 'var(--color-success)', fg: 'var(--color-success-dark)' } : { dot: 'var(--color-danger)', fg: 'var(--color-danger-dark)' }
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm leading-5 font-semibold text-heading">
          <span className="size-2 rounded-full" style={{ background: c.dot }} />
          {title}
          <span className="text-xs leading-4 font-normal text-light-text">{total}</span>
        </span>
        {total > people.length && <TextLink>See All {total}</TextLink>}
      </div>
      {people.length === 0 ? (
        <p className="py-2 text-xs-plus leading-4.5 text-light-text">{tone === 'bad' ? 'Nobody scored below 60% in this round.' : 'No scores yet.'}</p>
      ) : (
        people.map((p) => (
          <div key={p.name} className="flex items-center gap-3 border-t border-grey-200 py-2 first:border-t-0">
            <Avatar name={p.name} size={32} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm leading-5 font-medium text-heading" title={p.name}>{p.name}</span>
              <span className="truncate text-xs leading-4 text-light-text">{p.job} · {p.unit}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-sm leading-5 font-semibold" style={{ color: c.fg }}>{p.score}%</span>
              <span className="text-3xs leading-3 text-light-text">{p.evaluators} evaluators</span>
            </span>
          </div>
        ))
      )}
    </div>
  )
}
