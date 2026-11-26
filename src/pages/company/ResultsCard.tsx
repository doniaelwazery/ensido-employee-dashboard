import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BANDS, bandOf, COMPETENCIES, competencyScores, scoreBins, type CompletedRound, type Person, type ResultScope } from '../../data/company'
import { Card, Empty, Icon, Skel, TextLink } from '../dashboard/shared'


export function initials(name: string) {
  const p = name.trim().split(/\s+/)
  return (p[0][0] + (p[1]?.[0] ?? '')).toUpperCase()
}
const AV = [['var(--color-primary-lighter)', 'var(--color-primary-dark)'], ['var(--color-success-bg)', 'var(--color-success-dark)'], ['var(--color-warning-bg)', 'var(--color-warning-fg)'], ['var(--color-danger-bg)', 'var(--color-danger-dark)'], ['var(--color-info-bg)', 'var(--color-info-dark)']]
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
  const [view, setView] = useState<'cats' | 'units' | 'dist' | 'comp'>('cats')
  const [snap, setSnap] = useState<'top' | 'low' | null>(null)
  const [readySeen, setReadySeen] = useState(false)
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
        <div className="flex flex-col gap-5">
          <Skel className="h-72 rounded-lg" />
          <div className="grid gap-4 md:grid-cols-2">{[0, 1].map((i) => <Skel key={i} className="h-72 rounded-xl" />)}</div>
        </div>
      ) : error ? (
        <div role="alert">
          <Empty icon="alert" tone="grey" title="Could Not Load Round Results" text="Something went wrong while loading the results. The rest of the dashboard is still up to date.">
            <button type="button" onClick={onRetry} className="mt-2 h-9 cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-body-bg">Try Again</button>
          </Empty>
        </div>
      ) : !round || !s ? (
        <Empty icon="chart" title="No Completed Rounds Yet" text="When your first round closes, its score bands, department averages and top performers appear here." />
      ) : (
        <div className="flex flex-1 flex-col gap-5">
          {idx === 0 && !readySeen && (
            <div role="status" className="flex items-center gap-3 rounded-lg border border-success-stroke bg-success-bg px-4 py-2.5 text-sm leading-5 text-success-dark">
              <Icon name="check" size={16} sw={2.6} color="var(--color-success)" />
              <span className="flex-1">Results for {round.title} are published and shared with employees.</span>
              <button type="button" aria-label="Dismiss" onClick={() => setReadySeen(true)} className="flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-white/60"><Icon name="close" size={14} /></button>
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl border border-grey-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm leading-5 font-semibold text-heading">{{ cats: 'Score Bands', units: `Average Score by ${unitWord}`, dist: 'Score Distribution', comp: 'Competency Averages' }[view]}</span>
              <div role="group" aria-label="Chart" className="flex gap-0.5 rounded-lg bg-grey-150 p-0.5">
                {([['cats', 'Bands'], ['units', `By ${unitWord}`], ['dist', 'Distribution'], ['comp', 'Competencies']] as const).map(([k, l]) => (
                  <button key={k} type="button" aria-pressed={view === k} onClick={() => setView(k)} className={`h-7 cursor-pointer rounded-md px-3 text-xs font-medium transition-colors ${view === k ? 'bg-white text-primary shadow-card' : 'text-light-text hover:text-body-text'}`}>{l}</button>
                ))}
              </div>
            </div>
            {view === 'dist' ? (
              <DistChart key={`d-${round.id}-${team}`} s={s} title={round.title} />
            ) : view === 'comp' ? (
              <CompChart key={`k-${round.id}-${team}`} idx={Math.min(idx, rounds.length - 1)} team={team} prevShort={prev?.short} />
            ) : view === 'cats' ? (
              <Bars
                key={`c-${round.id}-${team}`}
                label={`People per score band in ${round.title}`}
                max={Math.max(...s.cats)}
                items={BANDS.map((b, i) => ({ key: b.key, value: s.cats[i], top: String(s.cats[i]), name: b.label, range: b.range, color: b.color }))}
              />
            ) : (
              <Bars
                key={`u-${round.id}-${team}`}
                label={`Average score by ${unitWord.toLowerCase()} in ${round.title}`}
                max={100}
                items={[...s.units].sort((a, b) => b[1] - a[1]).map(([n, v]) => ({ key: n, value: v, top: `${v}%`, name: n, range: bandOf(v).label, color: bandOf(v).color }))}
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

          {/* PM proposal: two tinted lists side by side under the chart */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PeopleList title="Top Performers" people={s.top} tone="good" onSeeAll={() => setSnap('top')} />
            <PeopleList title="Need Attention" people={s.low5} tone="bad" onSeeAll={() => setSnap('low')} />
          </div>
          <TextLink arrow>Open Full Results</TextLink>
          {snap && <SnapshotDrawer s={s} roundTitle={round.title} tab={snap} setTab={setSnap} onClose={() => setSnap(null)} />}
        </div>
      )}
    </Card>
  )
}

/** shadcn-style vertical bars: faint gridlines, no axis lines, rounded tops, value on top, label + range below. */
function Bars({ items, max, label }: { items: { key: string; value: number; top: string; name: string; range: string; color: string }[]; max: number; label: string }) {
  return (
    <div role="img" aria-label={`${label}: ${items.map((i) => `${i.name} ${i.top}`).join(', ')}`} className="flex flex-1 flex-col gap-2">
      <div data-chart className="relative max-h-88 min-h-48 flex-1">
        {[0, 25, 50, 75, 100].map((g) => <span key={g} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-grey-200" style={{ bottom: `${g}%` }} />)}
        <div className="absolute inset-0 flex items-end gap-3 px-1 sm:gap-4">
          {items.map((it, i) => (
            <div key={it.key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs leading-4 font-semibold text-heading">{it.top}</span>
              <span className="grow-y block w-full max-w-20 rounded-t-md" style={{ height: `${Math.max(2, (it.value / max) * 82)}%`, background: it.color, animationDelay: `${i * 70}ms` }} />
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

function PeopleList({ title, people, tone, onSeeAll }: { title: string; people: Person[]; tone: 'good' | 'bad'; onSeeAll: () => void }) {
  const c =
    tone === 'good'
      ? { dot: 'var(--color-success)', fg: 'var(--color-success-dark)', bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)' }
      : { dot: 'var(--color-danger)', fg: 'var(--color-danger-dark)', bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)' }
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl border p-3.5" style={{ background: c.bg, borderColor: c.stroke }}>
      <div className="flex items-center justify-between gap-2 px-2 pb-1.5">
        <h4 className="flex items-center gap-2 text-[15px] leading-5.5 font-semibold text-heading">
          <span className="size-2 rounded-full" style={{ background: c.dot }} />
          {title}
        </h4>
        {people.length > 0 && <TextLink className="text-xs-plus" onClick={onSeeAll}>See All</TextLink>}
      </div>
      {people.length === 0 ? (
        <p className="px-2 py-3 text-xs-plus leading-4.5 text-light-text">{tone === 'bad' ? 'Nobody scored below 50% in this round.' : 'No scores yet.'}</p>
      ) : (
        people.slice(0, 5).map((p, i) => (
          <a key={p.name} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-card">
            <span className="w-4.5 shrink-0 text-center text-xs leading-4 font-semibold text-light-text">{i + 1}</span>
            <span className="rounded-full border border-black/10"><Avatar name={p.name} size={34} /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm leading-5 font-medium text-heading" title={p.name}>{p.name}</span>
              <span className="truncate text-xs leading-4 text-light-text">{p.job} · {p.evaluators} evaluators</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-sm leading-5 font-bold tabular-nums" style={{ color: bandOf(p.score).color }}>{p.score}%</span>
              <span className="text-3xs leading-3 font-medium whitespace-nowrap" style={{ color: bandOf(p.score).color }}>{bandOf(p.score).label}</span>
            </span>
          </a>
        ))
      )}
    </div>
  )
}

/* ---------- Distribution: bars per 5-point range + actual line and dots + expected normal curve (business requirement) ---------- */
function DistChart({ s, title }: { s: ResultScope; title: string }) {
  const bins = scoreBins(s)
  const max = Math.max(...bins.map((b) => Math.max(b.count, b.expected))) * 1.12
  const n = bins.length
  const xAt = (i: number) => ((i + 0.5) / n) * 100
  const yAt = (v: number) => 100 - (v / max) * 100
  const actual = bins.map((b, i) => `${i ? 'L' : 'M'}${xAt(i).toFixed(2)} ${yAt(b.count).toFixed(2)}`).join(' ')
  const curve = Array.from({ length: 61 }, (_, k) => {
    const t = (k / 60) * (n - 1)
    const i = Math.floor(t), f = t - i
    const a = bins[i].expected, b = bins[Math.min(n - 1, i + 1)].expected
    const v = a + (b - a) * (f * f * (3 - 2 * f))
    return `${k ? 'L' : 'M'}${(((t + 0.5) / n) * 100).toFixed(2)} ${yAt(v).toFixed(2)}`
  }).join(' ')
  return (
    <div role="img" aria-label={`Score distribution in ${title}: ${bins.filter((b) => b.count).map((b) => `${b.from}–${b.to}%: ${b.count}`).join(', ')}`} className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs leading-4 text-body-text">
        <span className="flex items-center gap-2"><span className="relative h-0.5 w-5 rounded bg-primary"><span className="absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-primary" /></span>Actual distribution</span>
        <span className="flex items-center gap-2"><span className="h-0 w-5 border-t-2 border-dashed border-heading/60" />Normal distribution</span>
      </div>
      <div data-chart className="relative max-h-88 min-h-52 flex-1">
        {[0, 25, 50, 75, 100].map((g) => <span key={g} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-grey-200" style={{ bottom: `${g}%` }} />)}
        <div className="absolute inset-0 flex items-end gap-1 px-1">
          {bins.map((b, i) => {
            const c = bandOf(b.from).color
            return (
              <div key={b.from} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                {b.count > 0 && <span className="mb-1 text-2xs leading-3.5 font-semibold text-heading">{b.count}</span>}
                <span className="grow-y block w-full rounded-t-sm border-t-2" title={`${b.from}–${b.to}%: ${b.count} people`} style={{ height: `${Math.max(b.count ? 2 : 0, (b.count / max) * 100)}%`, borderColor: c, background: `linear-gradient(to bottom, color-mix(in srgb, ${c} 32%, transparent), color-mix(in srgb, ${c} 8%, transparent))`, animationDelay: `${i * 40}ms` }} />
              </div>
            )
          })}
        </div>
        <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 size-full overflow-visible px-1">
          <path d={curve} fill="none" stroke="var(--color-heading)" strokeOpacity="0.55" strokeWidth="1.5" strokeDasharray="5 4" vectorEffect="non-scaling-stroke" />
          <path d={actual} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 px-1">
          <div className="relative size-full">
            {bins.map((b, i) => <span key={b.from} className="absolute size-2 -translate-1/2 rounded-full border-2 border-card bg-primary" style={{ left: `${xAt(i)}%`, top: `${yAt(b.count)}%` }} />)}
          </div>
        </div>
      </div>
      <div className="flex gap-1 px-1">
        {bins.map((b, i) => <span key={b.from} className="min-w-0 flex-1 text-center text-3xs leading-3 text-light-text">{i % 2 === 0 ? b.from : ''}</span>)}
      </div>
      <p className="text-2xs leading-3.5 text-light-text">Bars show how many people scored in each 5-point range. The dashed line is the expected normal curve.</p>
    </div>
  )
}

/* ---------- Competency averages: this round vs the previous one (PM radar, as calm vertical bars) ---------- */
function CompChart({ idx, team, prevShort }: { idx: number; team: boolean; prevShort?: string }) {
  const { cur, prev } = competencyScores(idx, team)
  return (
    <div role="img" aria-label={`Competency averages: ${COMPETENCIES.map((c, i) => `${c} ${cur[i]}%${prev ? ` (was ${prev[i]}%)` : ''}`).join(', ')}`} className="flex flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs leading-4 text-body-text">
        <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-primary" />This round</span>
        {prev && <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-primary-light/60" />{prevShort ?? 'Previous round'}</span>}
      </div>
      <div data-chart className="relative max-h-88 min-h-48 flex-1">
        {[0, 25, 50, 75, 100].map((g) => <span key={g} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-grey-200" style={{ bottom: `${g}%` }} />)}
        <div className="absolute inset-0 flex items-end gap-2 px-1 sm:gap-3">
          {COMPETENCIES.map((c, i) => (
            <div key={c} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
              <span className="mb-1 text-xs leading-4 font-semibold text-heading">{cur[i]}%</span>
              <div className="flex h-full max-h-[82%] w-full max-w-16 items-end justify-center gap-0.5" style={{ height: '82%' }}>
                {prev && <span className="grow-y block w-full rounded-t-md bg-primary-light/60" title={`${prevShort}: ${prev[i]}%`} style={{ height: `${prev[i]}%`, animationDelay: `${i * 50}ms` }} />}
                <span className="grow-y block w-full rounded-t-md bg-primary" title={`This round: ${cur[i]}%`} style={{ height: `${cur[i]}%`, animationDelay: `${i * 50 + 30}ms` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-2 px-1 sm:gap-3">
        {COMPETENCIES.map((c, i) => {
          const d = prev ? cur[i] - prev[i] : null
          return (
            <div key={c} className="flex min-w-0 flex-1 flex-col items-center text-center">
              <span className="line-clamp-2 text-2xs leading-3.5 font-medium text-body-text" title={c}>{c}</span>
              {d != null && <span className="text-3xs leading-3 font-medium" style={{ color: d >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>{d >= 0 ? '+' : ''}{d} pts</span>}
            </div>
          )
        })}
      </div>
      <p className="text-2xs leading-3.5 text-light-text">Average score per competency across everyone evaluated, compared with the previous round.</p>
    </div>
  )
}

/* ---------- Performance Snapshot drawer (See All): Top Performers / Need Attention tabs ---------- */
function SnapshotDrawer({ s, roundTitle, tab, setTab, onClose }: { s: ResultScope; roundTitle: string; tab: 'top' | 'low'; setTab: (t: 'top' | 'low') => void; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      prev?.focus()
    }
  }, [onClose])
  const tabs = [
    { k: 'top' as const, label: 'Top Performers', people: s.top, tip: 'The highest consolidated scores in this round.' },
    { k: 'low' as const, label: 'Need Attention', people: s.low5, tip: 'Scored below 50% (Developing or Unsatisfactory). Worth a check-in with their manager.' },
  ]
  const cur = tabs.find((t) => t.k === tab)!
  // portal: card wrappers animate with transforms, which would trap a fixed-position drawer inside the card
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-secondary/50" />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="snap-title" className="drawer-in relative flex h-full w-120 max-w-full flex-col bg-card shadow-tooltip outline-none">
        <div className="flex items-start justify-between gap-4 border-b border-grey-200 px-6 pt-6 pb-4">
          <div className="flex min-w-0 flex-col gap-1">
            <h2 id="snap-title" className="text-lg leading-6.5 font-semibold text-heading">Performance Snapshot</h2>
            <p className="text-xs leading-4 text-light-text">{roundTitle} · {s.participants} participants</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-light-text hover:bg-grey-light"><Icon name="close" /></button>
        </div>
        <div role="tablist" aria-label="Snapshot lists" className="flex gap-6 border-b border-grey-200 px-6">
          {tabs.map((t) => (
            <button key={t.k} type="button" role="tab" aria-selected={t.k === tab} onClick={() => setTab(t.k)} className={`-mb-px cursor-pointer border-b-2 py-3 text-sm leading-5 font-medium transition-colors ${t.k === tab ? 'border-primary text-primary' : 'border-transparent text-light-text hover:text-body-text'}`}>
              {t.label} ({t.people.length})
            </button>
          ))}
        </div>
        <div role="tabpanel" className="thin-scroll flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
          <p className="px-2 pb-2 text-xs leading-4 text-light-text">{cur.tip}</p>
          {cur.people.length === 0 ? (
            <Empty icon="check" title={cur.k === 'low' ? 'Nobody Needs Attention' : 'No Scores Yet'} text={cur.k === 'low' ? 'Nobody scored below 50% in this round.' : 'Scores appear once the round is consolidated.'} />
          ) : (
            cur.people.map((p, i) => (
              <a key={p.name} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-row-hover">
                <span className="w-5 shrink-0 text-center text-xs leading-4 font-semibold text-light-text">{i + 1}</span>
                <Avatar name={p.name} size={38} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm leading-5 font-medium text-heading" title={p.name}>{p.name}</span>
                  <span className="truncate text-xs leading-4 text-light-text">{p.job} · {p.unit} · {p.evaluators} evaluators</span>
                </span>
                <span className="flex flex-col items-end">
                  <span className="text-base leading-6 font-bold tabular-nums" style={{ color: bandOf(p.score).color }}>{p.score}%</span>
                  <span className="text-3xs leading-3 font-medium whitespace-nowrap" style={{ color: bandOf(p.score).color }}>{bandOf(p.score).label}</span>
                </span>
              </a>
            ))
          )}
        </div>
        <div className="border-t border-grey-200 px-6 py-4"><TextLink arrow>Open Full Results</TextLink></div>
      </div>
    </div>,
    document.body,
  )
}
