import { bandOf, type Gap, type Mover } from '../../data/company'
import { Card, Chip, Empty, Icon, TextLink } from '../dashboard/shared'
import { Avatar } from './ResultsCard'

/* ---------- Trends Across Rounds (PM: Phase 2 — needs a trends endpoint for the last 6 rounds) ----------
   Calm vertical bars: average score per round (band colour, value on top), participation under each label. */
export function TrendsCard({ rows, team }: { rows: [string, number, number][]; team: boolean }) {
  const first = rows[0]
  const last = rows[rows.length - 1]
  return (
    <Card id="co-trends" title="Trends Across Rounds" sub={`Average score and participation, last ${rows.length} rounds${team ? ' · your teams only' : ''}`} gap="gap-4">
      {rows.length < 2 ? (
        <Empty icon="chart" title="Trends Appear After Two Rounds" text="Once two rounds have closed, you can compare average scores and participation over time here." />
      ) : (
        <>
          <div role="img" aria-label={`Average score per round: ${rows.map(([q, v, p]) => `${q} ${v}% with ${p}% participation`).join(', ')}`} className="flex flex-1 flex-col gap-2">
            <div data-chart className="relative max-h-96 min-h-40 flex-1">
              {[0, 25, 50, 75, 100].map((g) => <span key={g} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-grey-200" style={{ bottom: `${g}%` }} />)}
              <div className="absolute inset-0 flex items-end gap-3 px-1">
                {rows.map(([q, v], i) => (
                  <div key={q} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <span className="mb-1 text-xs leading-4 font-semibold text-heading">{v}%</span>
                    {/* bars start at 50% so differences between rounds stay visible */}
                    <span className="grow-y block w-full max-w-12 rounded-t-md" style={{ height: `${Math.max(4, ((v - 50) / 50) * 82)}%`, background: bandOf(v).color, opacity: i === rows.length - 1 ? 1 : 0.55, animationDelay: `${i * 60}ms` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 px-1">
              {rows.map(([q, , p]) => (
                <div key={q} className="flex min-w-0 flex-1 flex-col items-center text-center">
                  <span className="text-2xs leading-3.5 font-medium text-body-text">{q}</span>
                  <span className="text-3xs leading-3 text-light-text">{p}% took part</span>
                </div>
              ))}
            </div>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 border-t border-grey-200 pt-3 text-xs leading-4 text-light-text">
            <span className="inline-flex items-center gap-1 font-medium" style={{ color: last[1] >= first[1] ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
              <Icon name="up" size={12} sw={2.6} className={last[1] >= first[1] ? '' : 'rotate-180'} />
              {last[1] >= first[1] ? '+' : ''}{(last[1] - first[1]).toFixed(1)} pts
            </span>
            since {first[0]} · scale starts at 50%
          </p>
        </>
      )}
    </Card>
  )
}

/* ---------- Biggest Movers (latest vs previous round) ---------- */
export function MoversCard({ up, down, from, to }: { up: Mover[]; down: Mover[]; from: string; to: string }) {
  const col = (title: string, list: Mover[], good: boolean) => (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="flex items-center gap-2 text-sm leading-5 font-semibold text-heading">
        <span className="flex size-5 items-center justify-center rounded-full" style={{ background: good ? 'var(--color-success-bg)' : 'var(--color-danger-bg)' }}>
          <Icon name="up" size={12} sw={2.6} color={good ? 'var(--color-success-dark)' : 'var(--color-danger-dark)'} className={good ? '' : 'rotate-180'} />
        </span>
        {title}
      </span>
      {list.length === 0 ? (
        <p className="py-2 text-xs-plus leading-4.5 text-light-text">No big changes this round.</p>
      ) : (
        list.map((m) => (
          <div key={m.name} className="flex items-center gap-3 border-t border-grey-200 py-2 first-of-type:border-t-0">
            <Avatar name={m.name} size={32} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm leading-5 font-medium text-heading">{m.name}</span>
              <span className="truncate text-xs leading-4 text-light-text">{m.unit}</span>
            </span>
            <span className="flex flex-col items-end">
              <span className="text-xs leading-4 whitespace-nowrap text-light-text">
                {m.from}% → <b className="font-semibold" style={{ color: bandOf(m.to).color }}>{m.to}%</b>
              </span>
              <span className="text-xs leading-4 font-semibold" style={{ color: good ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                {good ? '+' : '−'}{Math.abs(m.to - m.from)} pts
              </span>
            </span>
          </div>
        ))
      )}
    </div>
  )
  return (
    <Card id="co-movers" title="Biggest Movers" sub={`${from} → ${to}`} gap="gap-4" className="@container">
      <div className="grid grid-cols-1 gap-5 @lg:grid-cols-2">
        {col('Most Improved', up, true)}
        {col('Biggest Declines', down, false)}
      </div>
    </Card>
  )
}

/* ---------- Setup Gaps (Super Admin, after the setup checklist is done or hidden) ---------- */
const GAP_TONE = {
  critical: { bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)' },
  warning: { bg: 'var(--color-warning-bg)', stroke: 'var(--color-warning-stroke)', fg: 'var(--color-warning-fg)' },
  info: { bg: 'var(--color-info-bg)', stroke: 'var(--color-info-stroke)', fg: 'var(--color-info-dark)' },
}
export function GapsCard({ gaps }: { gaps: Gap[] }) {
  return (
    <Card title="Setup Gaps" sub={gaps.length ? 'Fix these to keep rounds accurate' : undefined} gap="gap-1">
      {gaps.length === 0 ? (
        <Empty icon="check" title="No Setup Gaps" text="Every employee has a manager, job titles have competencies and all invitations are accepted." />
      ) : (
        gaps.map((g) => (
          <div key={g.label} className="flex items-center gap-3 border-t border-grey-200 py-2.5 first-of-type:border-t-0">
            <Chip tone={GAP_TONE[g.sev]}>{g.count}</Chip>
            <span className="min-w-0 flex-1 text-sm leading-5 text-heading">{g.label}</span>
            <TextLink className="text-xs-plus">{g.action}</TextLink>
          </div>
        ))
      )}
    </Card>
  )
}

/* ---------- ensidoMate Insights (PM: "Ensido AI Insights · Beta") ---------- */
export type Insight = { tone: 'critical' | 'good' | 'warning'; text: string; link: string; target: string }
export function AiInsightsCard({ insights, source, jump }: { insights: Insight[]; source: string; jump: (id: string) => void }) {
  const dot = { critical: 'var(--color-danger)', good: 'var(--color-success)', warning: 'var(--color-warning)' }
  return (
    <section aria-labelledby="co-ai" className="@container relative flex flex-col gap-4 overflow-hidden rounded-xl border-2 border-ai-accent/40 bg-card p-6">
      <span aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full opacity-25 blur-3xl" style={{ background: 'radial-gradient(closest-side, #ff2c2c, #8f00ff, transparent)' }} />
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary shadow-ai-glow">
            <img src="/assets/sparkle.svg" alt="" width={20} height={20} />
          </span>
          <span className="flex min-w-0 flex-col">
            <h3 id="co-ai" className="flex items-center gap-2 text-base leading-6 font-semibold text-heading">
              ensidoMate Insights
              <span className="rounded-full border border-purple-stroke bg-purple-bg px-2 py-0.5 text-2xs leading-3.5 font-medium text-purple">Beta</span>
            </h3>
            <span className="text-xs leading-4 text-light-text">{source}</span>
          </span>
        </div>
        <button type="button" className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary bg-white px-3.5 text-sm font-medium text-primary transition-colors hover:bg-body-bg">
          Ask a Follow-up
        </button>
      </div>
      <div className={`relative grid grid-cols-1 gap-3 ${insights.length >= 3 ? '@2xl:grid-cols-3' : insights.length === 2 ? '@lg:grid-cols-2' : ''}`}>
        {insights.map((x, i) => (
          <div key={i} className="rise flex flex-col justify-between gap-3 rounded-tile border border-grey-200 bg-grey-light p-4" style={{ animationDelay: `${120 + i * 80}ms` }}>
            <p className="flex gap-2.5 text-sm leading-5 text-heading">
              <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: dot[x.tone] }} />
              {x.text}
            </p>
            <TextLink arrow onClick={() => jump(x.target)} className="text-xs-plus">{x.link}</TextLink>
          </div>
        ))}
      </div>
      <p className="relative text-2xs leading-3.5 text-light-text">Generated by AI from your rounds and results. Check the details before acting on them.</p>
    </section>
  )
}

/* ---------- Quick Actions (small shortcuts under Trends; every target is an existing Ensido page) ---------- */
export type QuickAction = { icon: 'people' | 'clip' | 'target' | 'chart' | 'bell' | 'policy'; label: string; hint: string; onClick: () => void }
export function QuickActionsCard({ actions }: { actions: QuickAction[] }) {
  return (
    <Card title="Quick Actions" gap="gap-3">
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <button key={a.label} type="button" onClick={a.onClick} className="group flex min-w-0 cursor-pointer items-center gap-2.5 rounded-tile border border-grey-200 bg-card p-3 text-left transition-colors hover:border-primary-light hover:bg-row-hover">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-row-hover text-primary transition-colors group-hover:bg-primary-lighter">
              <Icon name={a.icon} size={16} color="var(--color-primary)" />
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm leading-5 font-medium text-heading">{a.label}</span>
              <span className="truncate text-2xs leading-3.5 text-light-text">{a.hint}</span>
            </span>
          </button>
        ))}
      </div>
    </Card>
  )
}
