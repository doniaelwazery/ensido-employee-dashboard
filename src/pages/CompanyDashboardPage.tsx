import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from 'react'
import { category } from '../data/dashboard'
import { COMPANY, dayStr, isoToOffset, offsetToIso, USERS, type CompanyScenario, type OverdueEvaluator, type Role } from '../data/company'
import { CountUp, TiltCard } from './dashboard/Hero'
import { Dot, Icon, Ring, Skel } from './dashboard/shared'
import { Dialog, Toast } from './company/Dialog'
import { ResultsCard } from './company/ResultsCard'
import { dueText, RoundsCard, type RoundVM } from './company/RoundsCard'
import { AttentionCard, CompletionCard, JoinersCard, OverdueCard, SetupCard, type AttentionItem } from './company/SideCards'

// Company Dashboard for Super Admins (whole company) and Managers (their teams only).
// Finalized from the PM draft (Claude canvas "Ensido Dashboards › Company Dashboard"), in the My Dashboard style.

const SCENARIOS: [CompanyScenario, string][] = [['typical', 'Typical'], ['busy', 'Heavy Use'], ['one', 'One Round'], ['none', 'No Active Rounds'], ['first', 'First Round'], ['new', 'New Company']]

export function CompanyDashboardPage({ role, rolePicker }: { role: Exclude<Role, 'employee'>; rolePicker: ReactNode }) {
  const [scenario, setScenarioRaw] = useState<CompanyScenario>(() => {
    const q = new URLSearchParams(location.search).get('scenario') as CompanyScenario | null
    return q && SCENARIOS.some(([s]) => s === q) ? q : 'typical'
  })
  // A manager only exists once the company is set up, so "New Company" is a Super Admin case.
  const sc: CompanyScenario = role === 'manager' && scenario === 'new' ? 'typical' : scenario
  const [loading, setLoading] = useState(true)
  const [fail, setFail] = useState(false)
  const [trial, setTrial] = useState(sc === 'new')
  const timer = useRef<number | undefined>(undefined)
  const load = useCallback((ms: number) => {
    window.clearTimeout(timer.current)
    setLoading(true)
    timer.current = window.setTimeout(() => setLoading(false), ms)
  }, [])
  useEffect(() => {
    load(900)
    return () => window.clearTimeout(timer.current)
  }, [load, role])
  const setScenario = (s: CompanyScenario) => {
    setScenarioRaw(s)
    setTrial(s === 'new')
    load(700)
  }

  return (
    <div className="flex flex-col gap-6">
      <CompanyControls role={role} rolePicker={rolePicker} scenario={sc} setScenario={setScenario} loading={loading} reload={() => load(1200)} fail={fail} setFail={setFail} trial={trial} setTrial={setTrial} />
      <Board key={`${sc}-${role}`} scenario={sc} role={role} loading={loading} fail={fail} trial={trial && role === 'admin'} onTrialClose={() => setTrial(false)} />
    </div>
  )
}

type Modal = { type: 'remind' | 'edit' | 'end' | 'cancel'; r: RoundVM } | null

function Board({ scenario, role, loading, fail, trial, onTrialClose }: { scenario: CompanyScenario; role: Exclude<Role, 'employee'>; loading: boolean; fail: boolean; trial: boolean; onTrialClose: () => void }) {
  const d = COMPANY[scenario]
  const admin = role === 'admin'
  const team = role === 'manager'
  const user = USERS[role]

  /* local changes made through the dashboard actions */
  const [ended, setEnded] = useState<Record<string, boolean>>({})
  const [deadlines, setDeadlines] = useState<Record<string, number>>({})
  const [reminded, setReminded] = useState<Record<string, number>>({})
  const [evReminded, setEvReminded] = useState<Record<string, boolean>>({})
  const [setupHidden, setSetupHidden] = useState(false)
  const [fixed, setFixed] = useState({ kpi: false, res: false })
  const [modal, setModal] = useState<Modal>(null)
  const [date, setDate] = useState('')
  const [toast, setToastRaw] = useState<string | null>(null)
  const tt = useRef<number | undefined>(undefined)
  const showToast = (t: string) => {
    window.clearTimeout(tt.current)
    setToastRaw(t)
    tt.current = window.setTimeout(() => setToastRaw(null), 3800)
  }
  useEffect(() => () => window.clearTimeout(tt.current), [])
  const closeModal = useCallback(() => setModal(null), [])

  const rounds: RoundVM[] = useMemo(
    () =>
      d.rounds
        .filter((r) => !ended[r.id] && (!team || r.team))
        .map((r) => {
          const s = team ? r.team! : r.company
          const due = deadlines[r.id] ?? r.due
          const rem = reminded[r.id] ?? r.reminded
          return {
            id: r.id, title: r.title, covered: r.covered, started: dayStr(r.start), deadline: dayStr(due), due,
            forms: s.forms, submitted: s.submitted, pending: s.forms - s.submitted, pct: Math.round((s.submitted / s.forms) * 100),
            participants: s.participants, evaluators: s.evaluators, reminded: rem == null ? null : rem === 0 ? 'today' : dayStr(rem),
          }
        })
        // overdue and nearest deadline first; rounds with every form in go after the ones still collecting
        .sort((a, b) => Number(a.pending === 0) - Number(b.pending === 0) || a.due - b.due),
    [d.rounds, ended, deadlines, reminded, team],
  )

  const kpiErr = fail && !fixed.kpi
  const resErr = fail && !fixed.res
  const latest = d.completed[0]
  const ls = latest ? (team ? latest.team : latest.company) : null
  const ps = d.completed[1] ? (team ? d.completed[1].team : d.completed[1].company) : null
  const setupDone = d.setup.filter((s) => s.done >= s.total).length
  const setupOpen = admin && setupDone < d.setup.length
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const fmt = (n: number) => n.toLocaleString('en-US')

  /* ---------- Needs Your Attention: rules ---------- */
  const items: AttentionItem[] = []
  for (const r of rounds) {
    if (r.pending > 0 && r.due < 0)
      items.push(admin
        ? { id: `od-${r.id}`, sev: 'critical', text: `${r.title} passed its deadline and is still open, with ${r.pct}% of forms submitted.`, meta: dueText(r.due), action: 'End Round', primary: true, onAction: () => setModal({ type: 'end', r }) }
        : { id: `od-${r.id}`, sev: 'critical', text: `${r.title} passed its deadline. Your teams still have ${r.pending} forms pending.`, meta: dueText(r.due), action: 'Remind Evaluators', primary: true, onAction: () => setModal({ type: 'remind', r }) })
    else if (r.pending > 0 && r.due <= 3 && r.pct < 80)
      items.push({ id: `soon-${r.id}`, sev: 'critical', text: `${r.title} closes in ${r.due} day${r.due === 1 ? '' : 's'} with only ${r.pct}% of forms submitted.`, meta: dueText(r.due), action: 'Remind Evaluators', primary: true, onAction: () => setModal({ type: 'remind', r }) })
    else if (r.pending === 0 && admin)
      items.push({ id: `done-${r.id}`, sev: 'info', text: `Every form in ${r.title} is submitted. End the round to publish results.`, meta: 'Ready to close', action: 'End Round', onAction: () => setModal({ type: 'end', r }) })
  }
  if (ls && !resErr && ls.cats[3] > 0)
    items.push({ id: 'low', sev: 'warning', text: `${ls.cats[3]} ${team ? 'people in your teams' : 'employees'} scored below 60% in ${latest.title}.`, meta: 'Results published', action: 'Review Results', onAction: () => jump('co-results') })
  if (admin && d.seats[0] / d.seats[1] >= 0.9)
    items.push({ id: 'seats', sev: 'warning', text: `You are using ${fmt(d.seats[0])} of ${fmt(d.seats[1])} seats. New employees can't be added once you reach the limit.`, meta: 'Seat limit', action: 'Manage Seats', onAction: () => {} })
  if (scenario === 'new' && admin)
    items.push({ id: 'people', sev: 'info', text: 'Add or import your team so you can start your first evaluation round.', meta: 'Only you so far', action: 'Add Employees', onAction: () => {} })
  if (setupOpen)
    items.push({ id: 'setup', sev: 'info', text: 'Finish setting up your company so rounds run smoothly.', meta: `${setupDone} of ${d.setup.length} done`, action: 'Continue Setup', onAction: () => { setSetupHidden(false); window.setTimeout(() => jump('co-setup'), 50) } })
  if (admin && rounds.length === 0 && d.completed.length > 0)
    items.push({ id: 'idle', sev: 'info', text: `No round is running. The last round closed and was published on ${latest.published}.`, meta: 'No active rounds', action: 'Start Evaluation Round', onAction: () => {} })
  const rank = { critical: 0, warning: 1, info: 2 }
  items.sort((a, b) => rank[a.sev] - rank[b.sev])

  /* ---------- hero ---------- */
  const formsTotal = rounds.reduce((s, r) => s + r.forms, 0)
  const subTotal = rounds.reduce((s, r) => s + r.submitted, 0)
  const pctAll = formsTotal ? Math.round((subTotal / formsTotal) * 100) : 0
  const overdueN = rounds.filter((r) => r.due < 0 && r.pending > 0).length
  const nextOpen = rounds.find((r) => r.due >= 0 && r.pending > 0)
  const first = rounds[0]
  const summary =
    scenario === 'new'
      ? 'Welcome to Ensido. Finish setting up your company, then start your first evaluation round.'
      : !first
        ? latest
          ? `No rounds are running${team ? ' for your teams' : ''}. Results for ${latest.title} are ready to review.`
          : 'No rounds are running yet.'
        : (first.due < 0
            ? `${first.title} is ${-first.due} days past its deadline${rounds.length > 1 ? `, and ${rounds.length - 1} more round${rounds.length > 2 ? 's are' : ' is'} running` : ''}.`
            : `${first.title} closes in ${first.due} days with ${first.pct}% of forms submitted.`) + (d.completed.length === 0 ? ' Results show here once it closes.' : '')
  const tiles = [
    { label: 'Active rounds', value: rounds.length, suffix: '', hint: !rounds.length ? 'No rounds running' : overdueN ? `${overdueN} overdue${nextOpen ? ` · next deadline in ${nextOpen.due} days` : ''}` : nextOpen ? `Next deadline in ${nextOpen.due} days` : 'All forms submitted', dot: !rounds.length ? 'var(--color-light-text)' : overdueN || (nextOpen && nextOpen.due <= 3) ? 'var(--color-danger)' : 'var(--color-primary-light)', target: 'co-rounds' },
    { label: 'Forms submitted', value: pctAll, suffix: rounds.length ? '%' : '', hint: rounds.length ? `${fmt(subTotal)} of ${fmt(formsTotal)} in active rounds` : 'Appears when a round starts', dot: !rounds.length ? 'var(--color-light-text)' : pctAll >= 80 ? 'var(--color-success)' : pctAll > 50 ? 'var(--color-warning)' : 'var(--color-danger)', target: 'co-rounds', empty: !rounds.length },
    { label: 'Needs your attention', value: items.length, suffix: '', hint: items.length ? (items.some((i) => i.sev === 'critical') ? `${items.filter((i) => i.sev === 'critical').length} critical` : 'Nothing critical') : 'All clear', dot: items.some((i) => i.sev === 'critical') ? 'var(--color-danger)' : items.some((i) => i.sev === 'warning') ? 'var(--color-warning)' : items.length ? 'var(--color-primary-light)' : 'var(--color-success)', target: 'co-attention' },
  ]

  /* ---------- key numbers ---------- */
  const kpis: { label: string; value: string; note: string; delta?: number }[] = team
    ? [
        { label: 'Team members', value: fmt(d.team.members), note: 'vs last month', delta: d.team.delta },
        { label: 'Completed rounds', value: fmt(d.completedCount), note: 'with your teams in them' },
        { label: 'New joiners · 30 days', value: fmt(d.team.newJoiners), note: 'in your teams' },
      ]
    : [
        { label: 'Active employees', value: fmt(d.employees), note: scenario === 'new' ? 'You are the first one here' : 'vs last month', delta: d.employeesDelta || undefined },
        { label: 'Completed rounds', value: fmt(d.completedCount), note: d.completedCount ? 'all time' : 'None yet' },
        { label: 'New joiners · 30 days', value: fmt(d.newJoiners), note: scenario === 'new' ? 'Including you' : 'vs previous 30 days', delta: d.newJoinersDelta || undefined },
        { label: 'Seats used', value: `${fmt(d.seats[0])} / ${fmt(d.seats[1])}`, note: d.seats[0] / d.seats[1] >= 0.9 ? 'Close to your plan limit' : 'On your current plan' },
      ]

  /* ---------- actions ---------- */
  const remindEv = (p: OverdueEvaluator) => {
    setEvReminded((m) => ({ ...m, [p.id]: true }))
    showToast(`Reminder sent to ${p.name}.`)
  }
  const remindAll = (ps: OverdueEvaluator[]) => {
    setEvReminded((m) => ({ ...m, ...Object.fromEntries(ps.map((p) => [p.id, true])) }))
    showToast(`Reminder sent to ${ps.length} evaluators.`)
  }
  const actions = {
    remind: (r: RoundVM) => setModal({ type: 'remind', r }),
    edit: (r: RoundVM) => {
      setDate(offsetToIso(Math.max(r.due, 0) + 7))
      setModal({ type: 'edit', r })
    },
    end: (r: RoundVM) => setModal({ type: 'end', r }),
    cancel: (r: RoundVM) => setModal({ type: 'cancel', r }),
  }
  const dateOff = date ? isoToOffset(date) : NaN
  const dateOk = Number.isFinite(dateOff) && dateOff >= 1

  return (
    <>
      {loading && <span role="status" className="sr-only">Loading the company dashboard</span>}

      {trial && !loading && (
        <div role="note" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-warning-stroke bg-warning-bg px-5 py-3">
          <Icon name="info" size={18} color="#b45309" />
          <p className="min-w-0 flex-1 text-sm leading-5 text-heading"><span className="font-semibold">Your trial ends in 9 days.</span> Upgrade to keep evaluating without interruption.</p>
          <button type="button" className="h-9 cursor-pointer rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-dark">Upgrade Plan</button>
          <button type="button" aria-label="Dismiss" onClick={onTrialClose} className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-light-text hover:bg-white/60"><Icon name="close" /></button>
        </div>
      )}

      <CompanyHero
        name={user.name.split(' ')[0]}
        scope={team ? 'Your teams · 18 employees' : `Acme Corporation · ${fmt(d.employees)} employee${d.employees === 1 ? '' : 's'}`}
        summary={summary}
        tiles={tiles}
        loading={loading}
        jump={jump}
        latest={ls && !resErr ? { avg: ls.avg, short: latest.short, delta: ps ? ls.avg - ps.avg : null, prevShort: d.completed[1]?.short, team } : null}
      />

      {/* key numbers */}
      <section aria-labelledby="co-kpis" className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-grey-200 bg-card px-6 py-5">
        <h2 id="co-kpis" className="shrink-0 text-base leading-6 font-semibold text-heading">{team ? 'Your Teams' : 'Key Numbers'}</h2>
        {kpiErr && !loading ? (
          <div role="alert" className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-sm leading-5 text-body-text">
            <Icon name="alert" size={18} color="var(--color-danger)" />
            <span className="flex-1">Could not load the key numbers. The rest of the dashboard is up to date.</span>
            <button type="button" onClick={() => setFixed((f) => ({ ...f, kpi: true }))} className="h-9 cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-body-bg">Try Again</button>
          </div>
        ) : (
          <div className={`grid min-w-0 flex-1 basis-120 grid-cols-2 gap-4 ${kpis.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col gap-0.5 border-l border-grey-200 pl-4">
                <span className="text-xs leading-4 text-light-text">{k.label}</span>
                {loading ? (
                  <Skel className="my-1 h-5.5 w-14" />
                ) : (
                  <span className="flex items-baseline gap-2">
                    <span className="text-display-sm leading-7.5 font-semibold text-heading">{k.value}</span>
                    {k.delta != null && (
                      <span className="inline-flex items-center gap-0.5 text-xs leading-4 font-medium" style={{ color: k.delta >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                        <Icon name="up" size={11} sw={2.6} className={k.delta >= 0 ? '' : 'rotate-180'} />
                        {k.delta >= 0 ? '+' : '−'}{Math.abs(k.delta)}
                      </span>
                    )}
                  </span>
                )}
                <span className="text-2xs leading-3.5 text-light-text">{loading ? 'Loading' : k.note}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.79fr)_minmax(0,1fr)]">
        <RoundsCard rounds={rounds} loading={loading} admin={admin} team={team} actions={actions} />
        <AttentionCard items={items} loading={loading} />
      </div>

      <div className={`grid grid-cols-1 items-start gap-6 ${admin ? 'xl:grid-cols-[minmax(0,1.79fr)_minmax(0,1fr)]' : ''}`}>
        <ResultsCard rounds={d.completed} team={team} loading={loading} error={resErr} onRetry={() => setFixed((f) => ({ ...f, res: true }))} />
        {admin && (
          <div className="flex min-w-0 flex-col gap-6">
            {!loading && setupOpen && !setupHidden && <SetupCard steps={d.setup} canHide={scenario !== 'new'} onHide={() => setSetupHidden(true)} />}
            {!loading && setupOpen && setupHidden && (
              <button type="button" onClick={() => setSetupHidden(false)} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary-light bg-row-hover px-5 py-3.5 text-sm leading-5 font-medium text-primary hover:bg-primary-lighter">
                Continue Setup ({setupDone} of {d.setup.length}) <Icon name="arrow" size={14} />
              </button>
            )}
            <JoinersCard joiners={d.joiners} loading={loading} admin={admin} you={user} />
          </div>
        )}
      </div>

      {!loading && rounds.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
          <OverdueCard people={team ? d.overdue.filter((o) => o.manager === 'Ahmed Fathy') : d.overdue} rounds={rounds} team={team} reminded={evReminded} onRemind={remindEv} onRemindAll={remindAll} />
          <CompletionCard key={rounds.map((r) => r.id).join()} rounds={rounds.filter((r) => r.pending > 0).length ? rounds.filter((r) => r.pending > 0) : rounds} team={team} />
        </div>
      )}

      {/* ---------- dialogs ---------- */}
      {modal?.type === 'remind' && (
        <Dialog icon="bell" title="Remind Evaluators?" confirm="Send Reminder" onClose={closeModal} onConfirm={() => { setReminded((m) => ({ ...m, [modal.r.id]: 0 })); setModal(null); showToast(`Reminder sent to ${modal.r.evaluators} evaluators.`) }}>
          We will send a reminder to <b className="font-semibold text-heading">{modal.r.evaluators} evaluators</b>{team ? ' in your teams' : ''} who still have pending forms in {modal.r.title}.
          {modal.r.reminded && <span className="mt-1.5 block text-xs leading-4 text-light-text">Last reminder was sent {modal.r.reminded}.</span>}
        </Dialog>
      )}
      {modal?.type === 'edit' && (
        <Dialog icon="clip" title="Edit Deadline" confirm="Save Deadline" disabled={!dateOk} onClose={closeModal} onConfirm={() => { setDeadlines((m) => ({ ...m, [modal.r.id]: dateOff })); setModal(null); showToast(`Deadline updated to ${dayStr(dateOff)}.`) }}>
          The current deadline for {modal.r.title} is {modal.r.deadline}. Evaluators with pending forms are notified of the new date.
          <label className="mt-3 flex flex-col gap-1.5">
            <span className="text-xs leading-4 font-medium text-heading">New deadline</span>
            <input type="date" value={date} min={offsetToIso(1)} onChange={(e) => setDate(e.target.value)} aria-invalid={!dateOk} className="h-10 rounded-lg border border-border px-3 text-sm text-heading focus:border-primary focus:shadow-focus-ring focus:outline-none" />
            {!dateOk && <span className="text-xs leading-4 text-danger-dark">Pick a date after today.</span>}
          </label>
        </Dialog>
      )}
      {modal?.type === 'end' && (
        <Dialog icon="alert" tone="warning" title={`End ${modal.r.title} now?`} confirm="End Round" onClose={closeModal} onConfirm={() => { setEnded((m) => ({ ...m, [modal.r.id]: true })); setModal(null); showToast(`${modal.r.title} has ended. Results are being calculated.`) }}>
          {modal.r.pending > 0
            ? <>{fmt(modal.r.pending)} forms are still pending. Evaluators can no longer submit, and results are calculated from the {fmt(modal.r.submitted)} submitted forms. This can’t be undone.</>
            : <>All forms are in. Results are calculated and published to employees. This can’t be undone.</>}
        </Dialog>
      )}
      {modal?.type === 'cancel' && (
        <Dialog icon="alert" tone="danger" title={`Cancel ${modal.r.title}?`} confirm="Cancel Round" onClose={closeModal} onConfirm={() => { setEnded((m) => ({ ...m, [modal.r.id]: true })); setModal(null); showToast(`${modal.r.title} was cancelled.`) }}>
          The round is removed and all {fmt(modal.r.submitted)} submitted forms are discarded. Nobody gets results from it. This can’t be undone.
        </Dialog>
      )}
      <Toast text={toast} />
    </>
  )
}

/* ---------- hero ---------- */

type Tile = { label: string; value: number; suffix: string; hint: string; dot: string; target: string; empty?: boolean }
function CompanyHero({ name, scope, summary, tiles, loading, jump, latest }: { name: string; scope: string; summary: string; tiles: Tile[]; loading: boolean; jump: (id: string) => void; latest: { avg: number; short: string; delta: number | null; prevShort?: string; team: boolean } | null }) {
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return
    const { clientX: x, clientY: y } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${x - r.left}px`)
      el.style.setProperty('--my', `${y - r.top}px`)
      el.querySelectorAll<HTMLElement>('.glow-tile').forEach((t) => {
        const b = t.getBoundingClientRect()
        t.style.setProperty('--x', `${x - b.left}px`)
        t.style.setProperty('--y', `${y - b.top}px`)
      })
      el.dataset.lit = ''
    })
  }
  const leave = () => {
    cancelAnimationFrame(frame.current)
    if (ref.current) delete ref.current.dataset.lit
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])
  const cat = latest ? category(latest.avg) : null
  const ringColor = cat?.key === 'exceeds' ? 'var(--color-primary-light)' : cat?.color

  return (
    <section ref={ref} onPointerMove={move} onPointerLeave={leave} aria-labelledby="co-hero-title" className="hero relative flex flex-col gap-7 overflow-hidden rounded-2xl bg-secondary px-8 py-7 text-white lg:flex-row lg:items-center lg:gap-10">
      <span aria-hidden="true" className="hero-aurora" />
      <span aria-hidden="true" className="hero-spot" />
      <span aria-hidden="true" className="hero-grid" />
      <svg aria-hidden="true" width="420" height="420" viewBox="0 0 420 420" fill="none" className="pointer-events-none absolute -top-37.5 -right-27.5">
        <circle cx="210" cy="210" r="200" stroke="var(--color-primary-dark)" strokeWidth="2" opacity="0.25" />
        <circle cx="210" cy="210" r="150" stroke="var(--color-primary-dark)" strokeWidth="2" opacity="0.18" />
        <circle cx="210" cy="210" r="100" stroke="var(--color-primary)" strokeWidth="2" opacity="0.14" />
        <circle cx="210" cy="210" r="50" stroke="var(--color-primary)" strokeWidth="2" opacity="0.1" />
      </svg>
      <div className="relative flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="rise flex flex-wrap items-center gap-2 text-xs leading-4 text-primary-light">
            Monday, 12 October 2026
            <span className="rounded-full border border-white/20 bg-white/[0.07] px-2 py-0.5 text-2xs leading-3.5 font-medium text-white">{scope}</span>
          </p>
          <h2 id="co-hero-title" className="rise text-display leading-9 font-bold" style={{ animationDelay: '80ms' }}>Good morning, {name}</h2>
          {loading ? <Skel className="my-1 h-3 w-96 max-w-full bg-white/15" /> : <p className="rise max-w-140 text-sm leading-5 text-grey-200" style={{ animationDelay: '160ms' }}>{summary}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tiles.map((t, i) => (
            <button key={t.label} type="button" onClick={() => jump(t.target)} style={{ animationDelay: `${240 + i * 90}ms` }} className="glow-tile rise relative flex cursor-pointer flex-col gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:border-primary-light hover:bg-white/[0.12]">
              <span className="flex items-center gap-2 text-xs leading-4 font-medium text-primary-light">
                <Dot color={loading ? 'color-mix(in srgb, var(--color-white) 25%, transparent)' : t.dot} />
                {t.label}
              </span>
              {loading ? <Skel className="my-1 h-7 w-11 rounded-md bg-white/15" /> : <span className="text-3xl leading-9 font-bold">{t.empty ? '—' : <><CountUp value={t.value} />{t.suffix}</>}</span>}
              <span className="text-xs leading-4 text-grey-200">{loading ? 'Loading' : t.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <TiltCard className="relative flex shrink-0 flex-col items-center justify-center gap-3.5 self-stretch rounded-panel border border-white/20 bg-white/[0.07] px-6 py-5 text-center lg:w-65">
        {loading ? (
          <span className="size-33 animate-pulse rounded-full border-12 border-white/10" />
        ) : latest && cat ? (
          <>
            <p className="text-xs leading-4 font-medium text-primary-light">Last Round · {latest.short}</p>
            <span className="tilt-pop block">
              <Ring value={latest.avg} size={140} stroke={10.6} color={ringColor!} track="color-mix(in srgb, var(--color-white) 12%, transparent)" label={`${latest.team ? 'Team' : 'Company'} average ${latest.avg}% in ${latest.short}, ${cat.label}`}>
                <span className="text-display-lg leading-9.5 font-bold">{latest.avg}%</span>
                <span className="text-2xs leading-3.5 text-primary-light">{latest.team ? 'Team average' : 'Company average'}</span>
              </Ring>
            </span>
            <div className="tilt-pop-sm flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs leading-4 font-semibold" style={{ color: cat.fg }}>
                <Dot color={ringColor!} size={6} />
                {cat.label}
              </span>
              {latest.delta != null && (
                <span className="inline-flex items-center gap-1 text-xs leading-4 font-medium" style={{ color: latest.delta >= 0 ? 'var(--color-success-stroke)' : 'var(--color-danger-stroke)' }}>
                  <Icon name="up" size={12} sw={2.6} className={latest.delta >= 0 ? '' : 'rotate-180'} />
                  {latest.delta >= 0 ? '+' : ''}{latest.delta.toFixed(1)} pts since {latest.prevShort}
                </span>
              )}
            </div>
            <button type="button" onClick={() => jump('co-results')} className="group flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-white/10 pt-3 text-sm leading-5 font-medium">
              See Results <Icon name="arrow" size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        ) : (
          <>
            <p className="text-xs leading-4 font-medium text-primary-light">Last Round</p>
            <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" className="empty-spin"><circle cx="48" cy="48" r="38" fill="none" stroke="color-mix(in srgb, var(--color-white) 25%, transparent)" strokeWidth="8" strokeDasharray="6 8" /></svg>
            <p className="max-w-50 text-xs-plus leading-4.5 text-grey-200">The company average shows here once your first round closes.</p>
          </>
        )}
      </TiltCard>
    </section>
  )
}

/* ---------- prototype controls ---------- */

function CompanyControls({ role, rolePicker, scenario, setScenario, loading, reload, fail, setFail, trial, setTrial }: { role: Exclude<Role, 'employee'>; rolePicker: ReactNode; scenario: CompanyScenario; setScenario: (s: CompanyScenario) => void; loading: boolean; reload: () => void; fail: boolean; setFail: (v: boolean) => void; trial: boolean; setTrial: (v: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const opts = SCENARIOS.filter(([s]) => role === 'admin' || s !== 'new')
  return (
    <div role="region" aria-label="Prototype controls" className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
        <div className="menu-in flex w-92 max-w-full flex-col items-start gap-3 rounded-lg bg-secondary p-4 text-sm leading-5 text-white shadow-tooltip">
          {rolePicker}
          <span className="font-medium">Data scenario</span>
          <div role="group" aria-label="Data scenario" className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">
            {opts.map(([id, label]) => (
              <button key={id} type="button" aria-pressed={scenario === id} onClick={() => setScenario(id)} className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors ${scenario === id ? 'bg-primary text-white' : 'text-primary-light hover:text-white'}`}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={reload} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary-light px-4 font-medium hover:bg-white/10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
            Reload Dashboard
          </button>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} className="size-4 accent-primary" /> Key numbers and results fail to load
          </label>
          {role === 'admin' && (
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={trial} onChange={(e) => setTrial(e.target.checked)} className="size-4 accent-primary" /> Trial ending banner
            </label>
          )}
          <span role="status" className="text-xs leading-4 text-primary-light">{loading ? 'Loading data…' : 'Try Remind, the ⋯ menu (Edit Deadline, End, Cancel), the results round picker and chart toggle.'}</span>
        </div>
      )}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-white shadow-tooltip hover:bg-primary-dark">
        <span className="rounded bg-primary-dark px-2 py-0.5 text-xs leading-4">Prototype</span>
        {open ? 'Hide' : 'Scenarios'}
      </button>
    </div>
  )
}

