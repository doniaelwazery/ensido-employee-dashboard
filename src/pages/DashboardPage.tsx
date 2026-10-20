import { useEffect, useMemo, useRef, useState } from 'react'
import { PageTitle } from '../components/PageTitle'
import { COMPANY_OVERVIEW, DASHBOARD, HISTORY_META, MANY_KPI_LIST, type Scenario } from '../data/dashboard'
import { CompetencyCard } from './dashboard/CompetencyCard'
import { DistributionCard } from './dashboard/DistributionCard'
import { FormsCard } from './dashboard/FormsCard'
import { GoalsCard } from './dashboard/GoalsCard'
import { Hero } from './dashboard/Hero'
import { HistoryCard } from './dashboard/HistoryCard'
import { NotificationsCard } from './dashboard/NotificationsCard'
import { ManagersCard, PoliciesCard } from './dashboard/PeopleCards'
import { Controls } from './dashboard/PrototypeControls'
import { Card, Chip, Empty, Icon, Skel, TextLink, goalFlag, goalRank } from './dashboard/shared'

// Employee dashboard — the original "Ensido Dashboards" Claude canvas look inside the ensido shell
// (Figma: Dashboard Research › "Employee Dashboard — Ensido Style", Typical 29211:17626 / New Employee 29220:21367).

/* ---------- page ---------- */

export function DashboardPage() {
  // ?scenario=new|busy opens a data scenario directly (shareable prototype links)
  const [scenario, setScenarioRaw] = useState<Scenario>(() => {
    const q = new URLSearchParams(location.search).get('scenario')
    return q === 'new' || q === 'busy' ? q : 'typical'
  })
  const [loading, setLoading] = useState(true)
  const [fail, setFail] = useState(false)
  const [many, setMany] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  const load = (ms: number) => {
    window.clearTimeout(timer.current)
    setLoading(true)
    timer.current = window.setTimeout(() => setLoading(false), ms)
  }
  useEffect(() => {
    load(900)
    return () => window.clearTimeout(timer.current)
  }, [])
  const setScenario = (s: Scenario) => {
    setScenarioRaw(s)
    load(700)
  }

  const base = DASHBOARD[scenario]
  const d = many && base.kpis.length ? { ...base, kpis: MANY_KPI_LIST } : base

  return (
    <div className="flex flex-col">
      {/* Figma: the hero sits directly under the 60px page title (no extra gap) */}
      <PageTitle title="Dashboard" />
      <Controls scenario={scenario} setScenario={setScenario} loading={loading} reload={() => load(1200)} fail={fail} setFail={setFail} many={many} setMany={setMany} />
      <div className="flex flex-col gap-6">
        <Board key={scenario} data={d} loading={loading} notesFail={fail && !loading} onRetry={() => { setFail(false); load(700) }} />
      </div>
    </div>
  )
}

function Board({ data: d, loading, notesFail, onRetry }: { data: (typeof DASHBOARD)[Scenario]; loading: boolean; notesFail: boolean; onRetry: () => void }) {
  /* rounds: pending first, then nearest deadline */
  const rounds = useMemo(() => [...d.rounds].sort((a, b) => Number(a.forms === a.submitted) - Number(b.forms === b.submitted) || a.days - b.days), [d.rounds])
  const pendingTotal = rounds.reduce((s, r) => s + r.forms - r.submitted, 0)
  const open = rounds.filter((r) => r.forms > r.submitted)
  const nextDays = open.length ? Math.min(...open.map((r) => r.days)) : 0

  /* notifications read state */
  const [read, setRead] = useState<Record<string, boolean>>({})
  const unreadIds = d.notes.flatMap((n) => (n.read ? [] : (n.children ?? [n]).map((c) => c.id)))
  const locallyRead = unreadIds.filter((id) => read[id]).length
  const totalUnread = notesFail ? 0 : Math.max(0, (d.unreadTotal ?? unreadIds.length) - locallyRead)

  const goals = useMemo(() => [...d.goals].sort((a, b) => goalRank(a) - goalRank(b)), [d.goals])
  const attention = goals.filter(goalFlag).length
  const history = d.history.map((v, i) => ({ v, q: HISTORY_META[i][0], range: HISTORY_META[i][1], published: HISTORY_META[i][2].replace(',', '') }))

  const tiles = [
    { label: 'Forms to fill', value: pendingTotal, hint: pendingTotal ? `Next deadline in ${nextDays} days` : 'Nothing due right now', dot: pendingTotal ? (nextDays <= 3 ? 'var(--color-danger)' : 'var(--color-primary-light)') : 'var(--color-success)', target: 'dash-forms' },
    { label: 'Goals needing attention', value: attention, hint: attention ? 'Overdue or rejected' : goals.length ? 'All goals on track' : 'No goals yet', dot: attention ? 'var(--color-danger)' : 'var(--color-success)', target: 'dash-goals' },
    { label: 'Unread latest updates', value: totalUnread, hint: totalUnread ? 'New since your last visit' : 'You are all caught up', dot: totalUnread ? 'var(--color-primary-light)' : 'var(--color-success)', target: 'dash-notes' },
  ]
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <>
      {loading && <span role="status" className="sr-only">Loading your dashboard</span>}

      <Hero summary={d.summary} tiles={tiles} history={history} loading={loading} jump={jump} />

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1.79fr)_minmax(0,1fr)]">
        <FormsCard rounds={rounds} loading={loading} pendingTotal={pendingTotal} />
        <NotificationsCard notes={d.notes} total={d.notesTotal} loading={loading} fail={notesFail} onRetry={onRetry} read={read} setRead={setRead} totalUnread={totalUnread} />
      </div>

      <div className="grid grid-cols-1 items-stretch gap-6 xl:grid-cols-[minmax(0,1.79fr)_minmax(0,1fr)]">
        <GoalsCard goals={goals} loading={loading} />
        <div className="flex min-w-0 flex-col gap-6">
          <ManagersCard managers={d.managers} loading={loading} />
          <PoliciesCard policies={d.policies} loading={loading} />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="flex h-90 flex-col gap-5 rounded-xl border border-grey-200 bg-card p-6">
              <Skel className="h-4 w-1/2" />
              {[0, 1, 2, 3].map((j) => <Skel key={j} className="h-2 w-full rounded-full" />)}
              <Skel className="flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <section className="rounded-xl border border-grey-200 bg-card px-6 py-4">
          <Empty icon="chart" title="No Results Yet" text="Your competency scores, score history and score categories appear here after the first evaluation round is shared with you." />
        </section>
      ) : (
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
          <CompetencyCard kpis={d.kpis} />
          <HistoryCard history={history} />
        </div>
      )}

      <div className={`grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 ${!loading && history.length > 0 ? 'xl:grid-cols-3' : ''}`}>
        {!loading && history.length > 0 && <DistributionCard history={history} />}
        <Card title="My Achievement Reports" aside={<TextLink>View All</TextLink>} gap="gap-2" busy={loading}>
          {loading ? (
            [0, 1, 2].map((i) => <Skel key={i} className="my-2 h-8" />)
          ) : d.achievements.length === 0 ? (
            <p className="pt-2 text-sm leading-5 text-light-text">No achievement reports include you yet. When your manager or admin adds you to one, it will appear here.</p>
          ) : (
            <div className="flex flex-col pt-2">
              {d.achievements.slice(0, 3).map(([t, date]) => (
                <a key={t} href="#" onClick={(e) => e.preventDefault()} className="flex items-center gap-3 border-t border-grey-200 py-2.5 transition-colors hover:bg-grey-light">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-success-stroke bg-success-bg"><Icon name="award" color="var(--color-success-dark)" /></span>
                  <span className="min-w-0 flex-1 text-sm leading-5 font-medium text-heading">{t}</span>
                  <span className="text-xs leading-4 whitespace-nowrap text-light-text">{date.replace(',', '')}</span>
                </a>
              ))}
              {d.achievements.length > 3 && <div className="border-t border-grey-200 pt-2.5"><TextLink>View All {d.achievements.length} Reports</TextLink></div>}
            </div>
          )}
        </Card>
        <Card title="My Work Groups" aside={d.groups.length > 0 && !loading && <span className="text-xs leading-4 text-light-text">{d.groups.length} groups</span>} gap="gap-3.5" busy={loading}>
          {loading ? (
            [0, 1, 2].map((i) => <Skel key={i} className="h-9" />)
          ) : d.groups.length === 0 ? (
            <p className="text-sm leading-5 text-light-text">You are not in any work group or on-demand group yet. Groups you join will appear here with your role.</p>
          ) : (
            <>
              {d.groups.slice(0, 4).map((g) => {
                const od = g.type !== 'Work group'
                return (
                  <div key={g.name} className="flex items-start gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg border text-xs font-semibold text-primary-dark ${od ? 'border-purple-stroke bg-purple-bg' : 'border-primary-light bg-row-hover'}`}>{g.initials}</span>
                    <div className="flex min-w-0 flex-col gap-1">
                      <p className="flex flex-wrap items-baseline gap-x-2 text-sm leading-5 font-medium text-heading">
                        {g.name}
                        <span className="text-xs leading-4 font-normal text-light-text">{g.type}</span>
                      </p>
                      <div className="flex flex-wrap gap-1">{g.roles.map((r) => <Chip key={r} tone={{ bg: 'var(--color-grey-150)', stroke: 'var(--color-grey-200)', fg: 'var(--color-body-text)' }}>{r}</Chip>)}</div>
                    </div>
                  </div>
                )
              })}
              {d.groups.length > 4 && <TextLink>View All {d.groups.length} Groups</TextLink>}
            </>
          )}
        </Card>
      </div>

      <section aria-labelledby="dash-overview" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-grey-200 bg-card px-6 py-5">
        <h2 id="dash-overview" className="text-base leading-6 font-semibold text-heading">Company Overview</h2>
        <div className="grid min-w-0 flex-1 basis-120 grid-cols-2 gap-4 md:grid-cols-4">
          {COMPANY_OVERVIEW.map((o) => (
            <div key={o.label} className="flex flex-col gap-0.5 border-l border-grey-200 pl-4">
              <span className="text-xs leading-4 text-light-text">{o.label}</span>
              {loading ? <Skel className="my-1 h-5.5 w-12" /> : <span className="text-display-sm leading-7.5 font-semibold text-heading">{o.value}</span>}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
