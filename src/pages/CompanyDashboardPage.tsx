import { createPortal } from 'react-dom'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { bandOf, COMPANY, dayStr, MOVERS, TRENDS, isoToOffset, offsetToIso, USERS, type CompanyScenario, type OverdueEvaluator, type Role } from '../data/company'
import { CountUp } from './dashboard/Hero'
import { Dot, Icon, Ring, Skel, TextLink } from './dashboard/shared'
import { Dialog, Toast } from './company/Dialog'
import { ResultsCard } from './company/ResultsCard'
import { dueText, RoundsCard, type RoundVM } from './company/RoundsCard'
import { AttentionCard, CompletionCard, JoinersCard, OverdueCard, SetupCard, type AttentionItem } from './company/SideCards'
import { AiInsightsCard, GapsCard, MoversCard, QuickActionsCard, TrendsCard, type Insight, type QuickAction } from './company/InsightCards'

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
  // UX review: "proposed" (lean, fixed layout) vs "current" (everything, self-balancing). ?layout=current shows the old one.
  const [lean, setLeanRaw] = useState(() => new URLSearchParams(location.search).get('layout') !== 'current')
  const setLean = (v: boolean) => {
    setLeanRaw(v)
    const u = new URL(location.href)
    if (v) u.searchParams.delete('layout')
    else u.searchParams.set('layout', 'current')
    history.replaceState(null, '', u)
  }

  return (
    <div className="flex flex-col gap-6">
      <CompanyControls role={role} rolePicker={rolePicker} scenario={sc} setScenario={setScenario} loading={loading} reload={() => load(1200)} fail={fail} setFail={setFail} trial={trial} setTrial={setTrial} lean={lean} setLean={setLean} />
      <Board key={`${sc}-${role}-${lean}`} scenario={sc} role={role} loading={loading} fail={fail} trial={trial && role === 'admin'} onTrialClose={() => setTrial(false)} lean={lean} />
    </div>
  )
}

type Modal = { type: 'remind' | 'edit' | 'end' | 'cancel'; r: RoundVM } | null

function Board({ scenario, role, loading, fail, trial, onTrialClose, lean }: { scenario: CompanyScenario; role: Exclude<Role, 'employee'>; loading: boolean; fail: boolean; trial: boolean; onTrialClose: () => void; lean: boolean }) {
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
  const lowN = ls ? ls.cats[0] + ls.cats[1] : 0
  if (ls && !resErr && lowN > 0)
    items.push({ id: 'low', sev: 'warning', text: `${lowN} ${team ? 'people in your teams' : 'employees'} scored below 50% (Developing or Unsatisfactory) in ${latest.title}.`, meta: 'Results published', action: 'Review Results', onAction: () => jump('co-results') })
  if (admin && d.seats[0] / d.seats[1] >= 0.9)
    items.push({ id: 'seats', sev: 'warning', text: `You are using ${fmt(d.seats[0])} of ${fmt(d.seats[1])} seats. New employees can't be added once you reach the limit.`, meta: 'Seat limit', action: 'Manage Seats', onAction: () => {} })
  if (scenario === 'new' && admin)
    items.push({ id: 'people', sev: 'info', text: 'Add or import your team so you can start your first evaluation round.', meta: 'Only you so far', action: 'Add Employees', onAction: () => {} })
  if (setupOpen)
    items.push({ id: 'setup', sev: 'info', text: 'Finish setting up your company so rounds run smoothly.', meta: `${setupDone} of ${d.setup.length} done`, action: 'Continue Setup', onAction: () => { setSetupHidden(false); window.setTimeout(() => jump('co-setup'), 50) } })
  // proposed layout: setup gaps are to-dos, so they live here instead of in their own card
  if (lean && admin && scenario !== 'new')
    for (const g of d.gaps)
      items.push({ id: `gap-${g.label}`, sev: g.sev, text: `${g.count} ${g.label.charAt(0).toLowerCase()}${g.label.slice(1)}.`, meta: 'Setup gap', action: g.action, onAction: () => {} })
  if (admin && rounds.length === 0 && d.completed.length > 0)
    items.push({ id: 'idle', sev: 'info', text: `No round is running. The last round closed and was published on ${latest.published}.`, meta: 'No active rounds', action: 'Start Evaluation Round', onAction: () => {} })
  const rank = { critical: 0, warning: 1, info: 2 }
  items.sort((a, b) => rank[a.sev] - rank[b.sev])

  /* ---------- two balanced columns ----------
   Main (wide) + side columns that stack cards without gaps and share the same widths on every row. Pinned cards keep
   their column; "float" cards (joiners, trends, movers, completion) go wherever the two columns end up most even —
   measured in the browser before paint. The last card of each column stretches, so both columns end on one line.
   Below xl the columns dissolve (display: contents) and cards follow the priority order of the list. */
type ColCard = { id: string; col: 'main' | 'side' | 'float'; node: ReactNode }
/** chart cards whose chart grows to absorb leftover height; they go last in their column */
const ELASTIC = ['trends', 'completion']
/** cards that can take a column's leftover height, in this order, each only up to what it can use:
    the attention list (until every item shows), then the charts (until their max height) */
const GROW = ['attention', ...ELASTIC, 'results']
/** how much taller a card can get without showing empty space inside it */
function capacity(n: HTMLElement): number {
  const id = n.dataset.card!
  if (id === 'attention') {
    const l = n.querySelector<HTMLElement>('[role=list]')
    return l ? Math.max(0, l.scrollHeight - l.clientHeight) : 0
  }
  const chart = n.querySelector<HTMLElement>('[data-chart]')
  if (!chart) return 0
  const max = parseFloat(getComputedStyle(chart).maxHeight)
  return Number.isFinite(max) ? Math.max(0, max - chart.getBoundingClientRect().height) : 160
}
/** small cards that always close their column, under the elastic chart */
const TAIL = ['quick']
const ORD = ['order-1', 'order-2', 'order-3', 'order-4', 'order-5', 'order-6', 'order-7', 'order-8', 'order-9', 'order-10', 'order-11', 'order-12']
function Columns({ cards, balanceKey }: { cards: ColCard[]; balanceKey: string }) {
  const live = cards.map((c, i) => ({ ...c, order: i })).filter((c) => c.node)
  const ref = useRef<HTMLDivElement>(null)
  const [place, setPlace] = useState<Record<string, 'main' | 'side'>>({})
  // measuring phases: floats rendered in the side column, then in the main column (heights differ by width), then placed
  const [phase, setPhase] = useState<'side' | 'main' | 'done'>('side')
  const measuring = phase !== 'done'
  const hSide = useRef<Record<string, number>>({})
  const cap = useRef<Record<string, number>>({})
  const [width, setWidth] = useState(() => window.innerWidth)
  useEffect(() => {
    let t = 0
    const on = () => {
      window.clearTimeout(t)
      t = window.setTimeout(() => setWidth(window.innerWidth), 150)
    }
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  useLayoutEffect(() => setPhase('side'), [balanceKey, width])
  useLayoutEffect(() => {
    if (phase === 'done') return
    const el = ref.current
    el?.querySelectorAll<HTMLElement>('[data-card]').forEach((n) => {
      n.style.height = ''
      n.style.flexGrow = ''
      delete n.dataset.grow
    })
    if (!el || !matchMedia('(min-width: 1280px)').matches) return setPhase('done')
    const h: Record<string, number> = {}
    el.querySelectorAll<HTMLElement>('[data-card]').forEach((n) => (h[n.dataset.card!] = n.getBoundingClientRect().height))
    if (phase === 'side') {
      hSide.current = h
      cap.current = {}
      el.querySelectorAll<HTMLElement>('[data-card]').forEach((n) => (cap.current[n.dataset.card!] = capacity(n)))
      return setPhase('main')
    }

    const hMain = h // floats measured at main width now; pinned cards are the same in both passes
    const GAP = 24
    const height = (id: string, col: 'main' | 'side') => (col === 'main' ? hMain[id] : hSide.current[id]) ?? 0
    const floats = live.filter((c) => c.col === 'float').map((c) => c.id)
    let best: Record<string, 'main' | 'side'> = {}
    let bestCost = Infinity
    for (let m = 0; m < 1 << floats.length; m++) {
      const pick: Record<string, 'main' | 'side'> = {}
      floats.forEach((id, i) => (pick[id] = m & (1 << i) ? 'main' : 'side'))
      const colOfId = (c: ColCard) => (c.col === 'float' ? pick[c.id] : c.col)
      const sum = (col: 'main' | 'side') => live.filter((c) => colOfId(c) === col).reduce((s, c) => s + height(c.id, col) + GAP, 0)
      const mainH = sum('main')
      const sideH = sum('side')
      const shorter = mainH < sideH ? 'main' : 'side'
      // the shorter column's growable cards absorb part of the difference; what is left shows as empty space
      const absorb = live.filter((c) => colOfId(c) === shorter && GROW.includes(c.id)).reduce((s, c) => s + (cap.current[c.id] ?? 0), 0)
      const cost = Math.max(0, Math.abs(mainH - sideH) - absorb) + (pick.insights === 'side' ? 200 : 0) + (pick.evaluators === 'side' ? 120 : 0)
      if (cost < bestCost - 1) {
        bestCost = cost
        best = pick
      }
    }
    setPlace(best)
    setPhase('done')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // once placed: hand each column's leftover height to its growable cards, each only as much as it can use;
  // anything still left goes to the last card so both columns end on one line
  useLayoutEffect(() => {
    const el = ref.current
    if (phase !== 'done' || !el || !matchMedia('(min-width: 1280px)').matches) return
    for (const colEl of Array.from(el.children) as HTMLElement[]) {
      const kids = Array.from(colEl.children) as HTMLElement[]
      if (!kids.length) continue
      const used = kids.reduce((s, k) => s + k.getBoundingClientRect().height, 0) + 24 * (kids.length - 1)
      let left = colEl.getBoundingClientRect().height - used
      for (const k of kids) {
        if (left < 1 || !GROW.includes(k.dataset.card!)) continue
        const extra = Math.min(left, capacity(k))
        if (extra < 1) continue
        k.style.height = `${k.getBoundingClientRect().height + extra}px`
        k.dataset.grow = ''
        left -= extra
      }
      if (left >= 1) {
        const last = kids[kids.length - 1]
        last.style.flexGrow = '1'
        last.dataset.grow = ''
      }
    }
  })

  const arrange = (list: typeof live) => [...list.filter((c) => !ELASTIC.includes(c.id) && !TAIL.includes(c.id)), ...list.filter((c) => ELASTIC.includes(c.id)), ...list.filter((c) => TAIL.includes(c.id))]
  const colOf = (c: (typeof live)[number]) => (c.col === 'float' ? (phase === 'side' ? 'side' : phase === 'main' ? 'main' : (place[c.id] ?? 'side')) : c.col)
  const wrap = (c: (typeof live)[number]) => (
    <div key={c.id} data-card={c.id} className={`${ORD[c.order]} flex min-w-0 flex-col *:flex-1 xl:order-none`}>
      {c.node}
    </div>
  )
  const col = 'contents xl:flex xl:min-w-0 xl:flex-col xl:gap-6'
  const render = (list: typeof live) => arrange(list).map(wrap)
  return (
    <div ref={ref} className={`flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1.79fr)_minmax(0,1fr)] ${measuring ? 'xl:items-start' : 'xl:items-stretch'}`}>
      <div className={col}>{render(live.filter((c) => colOf(c) === 'main'))}</div>
      <div className={col}>{render(live.filter((c) => colOf(c) === 'side'))}</div>
    </div>
  )
}

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
  const tiles: Tile[] = [
    { label: 'Active rounds', value: rounds.length, suffix: '', hint: !rounds.length ? 'No rounds running' : overdueN ? `${overdueN} overdue${nextOpen ? ` · next deadline in ${nextOpen.due} days` : ''}` : nextOpen ? `Next deadline in ${nextOpen.due} days` : 'All forms submitted', dot: !rounds.length ? 'var(--color-light-text)' : overdueN || (nextOpen && nextOpen.due <= 3) ? 'var(--color-danger)' : 'var(--color-primary-light)', target: 'co-rounds' },
    { label: 'Forms submitted', value: pctAll, suffix: rounds.length ? '%' : '', hint: rounds.length ? `${fmt(subTotal)} of ${fmt(formsTotal)} in active rounds` : 'Appears when a round starts', dot: !rounds.length ? 'var(--color-light-text)' : pctAll >= 80 ? 'var(--color-success)' : pctAll > 50 ? 'var(--color-warning)' : 'var(--color-danger)', target: 'co-rounds', empty: !rounds.length },
  ]
  tiles.push(
    { label: 'Needs your attention', value: items.length, suffix: '', hint: items.length ? (items.some((i) => i.sev === 'critical') ? `${items.filter((i) => i.sev === 'critical').length} critical` : 'Nothing critical') : 'All clear', dot: items.some((i) => i.sev === 'critical') ? 'var(--color-danger)' : items.some((i) => i.sev === 'warning') ? 'var(--color-warning)' : items.length ? 'var(--color-primary-light)' : 'var(--color-success)', target: 'co-attention' })

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
  /* ---------- ensidoMate insights (generated in production; sample sentences here) ---------- */
  const insights: Insight[] = []
  if (scenario !== 'new') {
    const hasQ3 = rounds.some((r) => r.id === 'q3')
    const has360 = rounds.some((r) => r.id === 'eng360')
    if (team) {
      if (has360) insights.push({ tone: 'critical', text: 'Backend Team has submitted the fewest forms in Engineering 360 Feedback, and it closes in 2 days.', link: 'See pending evaluators', target: 'co-evaluators' })
      if (latest) insights.push({ tone: 'good', text: `Mobile Team has the highest average of your teams (80%) in ${latest.short}.`, link: 'Open results by team', target: 'co-results' })
      if (d.completed.length >= 2) insights.push({ tone: 'warning', text: `Youssef Nabil and Salma Adel both dropped about 10 points since ${d.completed[1].short}.`, link: lean ? 'Open full results' : 'Review biggest movers', target: lean ? 'co-results' : 'co-movers' })
    } else {
      if (hasQ3) insights.push({ tone: 'critical', text: 'Engineering is 12 points behind the company in Q3 2026 Performance Review completion. 3 evaluators hold 21 of its pending forms.', link: 'See pending evaluators', target: 'co-evaluators' })
      else if (latest) insights.push({ tone: 'good', text: `${latest.short} closed with 95% participation, the highest in the last six rounds.`, link: 'Open trends', target: 'co-trends' })
      if (latest) insights.push({ tone: 'good', text: `Customer Success has the highest department average (81%) in ${latest.short}, up 3 points.`, link: 'Open results by department', target: 'co-results' })
      if (d.completed.length >= 2) insights.push({ tone: 'warning', text: '3 employees declined two rounds in a row, and all three report to the same manager.', link: lean ? 'Open full results' : 'Review biggest movers', target: lean ? 'co-results' : 'co-movers' })
      if (!latest && first) insights.push({ tone: 'warning', text: `Your first results arrive when ${first.title} closes on ${first.deadline}. ${first.pct}% of forms are in so far.`, link: 'Open the round', target: 'co-rounds' })
    }
  }

  const quick: QuickAction[] = team
    ? [
        { icon: 'bell', label: 'Remind Evaluators', hint: 'Pending forms in your teams', onClick: () => jump(rounds.length ? 'co-evaluators' : 'co-rounds') },
        { icon: 'target', label: 'Set a Team Goal', hint: 'Team Goals', onClick: () => {} },
        { icon: 'chart', label: 'Team Results', hint: 'Latest round by team', onClick: () => jump('co-results') },
        { icon: 'people', label: 'My Team', hint: `${d.team.members} members`, onClick: () => {} },
      ]
    : [
        { icon: 'people', label: 'Add Employees', hint: `${fmt(d.seats[1] - d.seats[0])} seats left`, onClick: () => {} },
        { icon: 'clip', label: 'Evaluator Matrices', hint: 'Who evaluates whom', onClick: () => {} },
        { icon: 'target', label: 'Team Goals', hint: 'Set and track goals', onClick: () => {} },
        { icon: 'policy', label: 'Policies', hint: 'Company policies', onClick: () => {} },
      ]

  const dateOff = date ? isoToOffset(date) : NaN
  const dateOk = Number.isFinite(dateOff) && dateOff >= 1

  return (
    <>
      {loading && <span role="status" className="sr-only">Loading the company dashboard</span>}

      {trial && !loading && (
        <div role="note" className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-warning-stroke bg-warning-bg px-5 py-3">
          <Icon name="info" size={18} color="var(--color-warning-fg)" />
          <p className="min-w-0 flex-1 text-sm leading-5 text-heading"><span className="font-semibold">Your trial ends in 9 days.</span> Upgrade to keep evaluating without interruption.</p>
          <TextLink arrow>Upgrade Plan</TextLink>
          <button type="button" aria-label="Dismiss" onClick={onTrialClose} className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-light-text hover:bg-white/60"><Icon name="close" /></button>
        </div>
      )}

      <CompanyHero
        team={team}
        title={team ? 'Your Teams' : 'Trianglz'}
        subtitle={team ? 'Engineering · Mobile, Backend and QA teams · 18 employees' : `Company overview · ${fmt(d.employees)} employee${d.employees === 1 ? '' : 's'}${lean ? ` · ${fmt(d.seats[0])} of ${fmt(d.seats[1])} seats used` : ''}`}
        summary={summary}
        urgent={items.some((i) => i.sev === 'critical')}
        tiles={tiles}
        kpis={lean ? [] : kpis}
        kpiErr={kpiErr}
        onRetryKpi={() => setFixed((f) => ({ ...f, kpi: true }))}
        loading={loading}
        jump={jump}
        latest={ls && !resErr ? { avg: ls.avg, short: latest.short, delta: ps ? ls.avg - ps.avg : null, prevShort: d.completed[1]?.short } : null}
      />

      {/* Two independent columns (main + side) with the same widths everywhere, so cards stack without gaps and the
          gutters line up; the last card of each column stretches so both columns end on one line. Below xl the
          column wrappers dissolve (display: contents) and every card falls into one column in priority order. */}
      {/* Proposed layout (UX review): every section has a fixed place, ordered by the job it does.
          Main: running rounds, ensidoMate insights right under them, who is late, then how it went (results).
          Side: what needs you (attention, setup) then context (insights, trends; recent joiners for managers). */}
      <Columns
        balanceKey={`${scenario}-${role}-${loading}-${rounds.length}-${insights.length}-${setupOpen}-${setupHidden}-${lean}`}
        cards={lean ? [
          { id: 'rounds', col: 'main', node: <RoundsCard rounds={rounds} loading={loading} admin={admin} team={team} actions={actions} /> },
          { id: 'attention', col: 'side', node: <AttentionCard items={items} loading={loading} /> },
          { id: 'insights', col: 'main', node: !loading && insights.length > 0 && <AiInsightsCard insights={insights} source={`From ${[first ? 'your active rounds' : '', latest ? `${latest.short} results` : ''].filter(Boolean).join(' and ')}${team ? ' · your teams only' : ''}`} jump={jump} /> },
          { id: 'setup', col: 'side', node: admin && !loading && setupOpen && !setupHidden && <SetupCard steps={d.setup} canHide={scenario !== 'new'} onHide={() => setSetupHidden(true)} /> },
          {
            id: 'setupLink', col: 'side', node: admin && !loading && setupOpen && setupHidden && (
              <button type="button" onClick={() => setSetupHidden(false)} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary-light bg-row-hover px-5 py-3.5 text-sm leading-5 font-medium text-primary hover:bg-primary-lighter">
                Continue Setup ({setupDone} of {d.setup.length}) <Icon name="arrow" size={14} />
              </button>
            ),
          },
          { id: 'evaluators', col: 'float', node: !loading && rounds.length > 0 && <OverdueCard people={team ? d.overdue.filter((o) => o.manager === 'Ahmed Fathy') : d.overdue} rounds={rounds} team={team} reminded={evReminded} onRemind={remindEv} onRemindAll={remindAll} /> },
          { id: 'results', col: 'main', node: <ResultsCard rounds={d.completed} team={team} loading={loading} error={resErr} onRetry={() => setFixed((f) => ({ ...f, res: true }))} /> },
          { id: 'joiners', col: 'float', node: <JoinersCard joiners={team ? d.teamJoiners : d.joiners} loading={loading} admin={admin} you={user} /> },
          { id: 'quick', col: 'side', node: !loading && scenario !== 'new' && <QuickActionsCard actions={quick} /> },
          { id: 'trends', col: 'side', node: !loading && scenario !== 'new' && <TrendsCard rows={d.completed.length >= 2 ? (team ? TRENDS.team : TRENDS.company) : []} team={team} /> },
        ] : [
          { id: 'rounds', col: 'main', node: <RoundsCard rounds={rounds} loading={loading} admin={admin} team={team} actions={actions} /> },
          { id: 'attention', col: 'side', node: <AttentionCard items={items} loading={loading} /> },
          { id: 'insights', col: 'float', node: !loading && insights.length > 0 && <AiInsightsCard insights={insights} source={`From ${[first ? 'your active rounds' : '', latest ? `${latest.short} results` : ''].filter(Boolean).join(' and ')}${team ? ' · your teams only' : ''}`} jump={jump} /> },
          { id: 'results', col: 'main', node: <ResultsCard rounds={d.completed} team={team} loading={loading} error={resErr} onRetry={() => setFixed((f) => ({ ...f, res: true }))} /> },
          { id: 'setup', col: 'side', node: admin && !loading && setupOpen && !setupHidden && <SetupCard steps={d.setup} canHide={scenario !== 'new'} onHide={() => setSetupHidden(true)} /> },
          {
            id: 'setupLink', col: 'side', node: admin && !loading && setupOpen && setupHidden && (
              <button type="button" onClick={() => setSetupHidden(false)} className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-primary-light bg-row-hover px-5 py-3.5 text-sm leading-5 font-medium text-primary hover:bg-primary-lighter">
                Continue Setup ({setupDone} of {d.setup.length}) <Icon name="arrow" size={14} />
              </button>
            ),
          },
          { id: 'joiners', col: 'float', node: <JoinersCard joiners={team ? d.teamJoiners : d.joiners} loading={loading} admin={admin} you={user} /> },
          { id: 'gaps', col: 'side', node: admin && !loading && scenario !== 'new' && <GapsCard gaps={d.gaps} /> },
          { id: 'trends', col: 'float', node: !loading && scenario !== 'new' && <TrendsCard rows={d.completed.length >= 2 ? (team ? TRENDS.team : TRENDS.company) : []} team={team} /> },
          { id: 'movers', col: 'float', node: !loading && d.completed.length >= 2 && <MoversCard up={(team ? MOVERS.team : MOVERS.company).up} down={(team ? MOVERS.team : MOVERS.company).down} from={d.completed[1].short} to={d.completed[0].short} /> },
          { id: 'evaluators', col: 'main', node: !loading && rounds.length > 0 && <OverdueCard people={team ? d.overdue.filter((o) => o.manager === 'Ahmed Fathy') : d.overdue} rounds={rounds} team={team} reminded={evReminded} onRemind={remindEv} onRemindAll={remindAll} /> },
          { id: 'completion', col: 'float', node: !loading && rounds.length > 0 && <CompletionCard key={rounds.map((r) => r.id).join()} rounds={rounds.filter((r) => r.pending > 0).length ? rounds.filter((r) => r.pending > 0) : rounds} team={team} /> },
        ]}
      />

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

/* ---------- hero ----------
   Deliberately different from My Dashboard's navy, personal hero: a light lavender "company header" with the
   organization's logo and name, a status line, and the numbers first, so users always know which view they are in. */

type Tile = { label: string; value: number; suffix: string; hint: string; dot: string; target: string; empty?: boolean }
type Kpi = { label: string; value: string; note: string; delta?: number }
function CompanyHero({ team, title, subtitle, summary, urgent, tiles, kpis, kpiErr, onRetryKpi, loading, jump, latest }: { team: boolean; title: string; subtitle: string; summary: string; urgent: boolean; tiles: Tile[]; kpis: Kpi[]; kpiErr: boolean; onRetryKpi: () => void; loading: boolean; jump: (id: string) => void; latest: { avg: number; short: string; delta: number | null; prevShort?: string } | null }) {
  const cat = latest ? bandOf(latest.avg) : null
  const tile = 'rise group relative flex cursor-pointer flex-col gap-1.5 rounded-xl border border-grey-200 bg-card px-4 py-3.5 text-left shadow-card transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-primary-light hover:shadow-focus-card'
  return (
    <section aria-labelledby="co-hero-title" className="relative overflow-hidden rounded-2xl border border-primary-light bg-card" style={{ backgroundImage: 'linear-gradient(120deg, var(--color-row-hover) 0%, var(--color-primary-lighter) 55%, var(--color-row-hover) 100%)' }}>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(var(--color-primary-light)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:linear-gradient(to_left,#000,transparent_55%)]" />
      <svg aria-hidden="true" width="420" height="420" viewBox="0 0 420 420" fill="none" className="pointer-events-none absolute -top-45 -right-30">
        <circle cx="210" cy="210" r="200" stroke="var(--color-primary-light)" strokeWidth="2" opacity="0.5" />
        <circle cx="210" cy="210" r="150" stroke="var(--color-primary-light)" strokeWidth="2" opacity="0.4" />
        <circle cx="210" cy="210" r="100" stroke="var(--color-primary-light)" strokeWidth="2" opacity="0.3" />
      </svg>

      <div className="relative flex flex-col gap-6 px-6 pt-6 pb-6 sm:px-8 sm:pt-7">
        <div className="flex flex-wrap items-center gap-4">
          <span className="rise flex size-14 shrink-0 items-center justify-center rounded-xl bg-secondary shadow-primary">
            {team ? <Icon name="people" size={26} color="var(--color-white)" sw={1.8} /> : <img src="/assets/org-icon.svg" alt="" width={26} height={25} />}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="rise flex flex-wrap items-center gap-2 text-xs leading-4 text-light-text">
              Monday, 12 October 2026
            </p>
            <h2 id="co-hero-title" className="rise text-display leading-9 font-bold text-heading" style={{ animationDelay: '60ms' }}>{title}</h2>
            <p className="rise text-sm leading-5 text-body-text" style={{ animationDelay: '100ms' }}>{subtitle}</p>
          </div>
        </div>

        {loading ? (
          <Skel className="h-11 w-full max-w-180 rounded-lg" />
        ) : (
          <button type="button" onClick={() => jump('co-attention')} className="rise group flex w-fit max-w-full cursor-pointer items-center gap-3 rounded-lg border border-grey-200 bg-card/80 px-4 py-2.5 text-left text-sm leading-5 text-heading backdrop-blur-sm transition-colors hover:border-primary-light" style={{ animationDelay: '140ms' }}>
            <span className="relative flex size-2 shrink-0">
              {urgent && <span className="absolute inset-0 animate-ping rounded-full bg-danger" />}
              <span className={`relative size-2 rounded-full ${urgent ? 'bg-danger' : 'bg-success'}`} />
            </span>
            <span className="min-w-0">{summary}</span>
            <Icon name="arrow" size={14} color="var(--color-primary)" className="transition-transform group-hover:translate-x-0.5" />
          </button>
        )}

        <div className={`grid grid-cols-1 gap-3 ${tiles.length === 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
          {tiles.map((t, i) => (
            <button key={t.label} type="button" onClick={() => jump(t.target)} className={tile} style={{ animationDelay: `${200 + i * 70}ms` }}>
              <span className="flex items-center gap-2 text-xs leading-4 font-medium text-light-text">
                <Dot color={loading ? 'var(--color-grey-200)' : t.dot} />
                {t.label}
              </span>
              {loading ? <Skel className="my-1 h-7 w-12" /> : <span className="text-3xl leading-9 font-bold text-heading">{t.empty ? '—' : <><CountUp value={t.value} />{t.suffix}</>}</span>}
              <span className="text-xs leading-4 text-light-text">{loading ? 'Loading' : t.hint}</span>
            </button>
          ))}
          <button type="button" onClick={() => jump('co-results')} className={tile} style={{ animationDelay: '480ms' }}>
            <span className="flex items-center gap-2 text-xs leading-4 font-medium text-light-text">
              <Dot color={loading || !cat ? 'var(--color-grey-200)' : cat.color} />
              {latest ? `Average score · ${latest.short}` : 'Average score'}
            </span>
            {loading ? (
              <Skel className="my-1 h-7 w-16" />
            ) : latest && cat ? (
              <span className="flex items-center gap-3">
                <span className="text-3xl leading-9 font-bold text-heading">{latest.avg}%</span>
                <Ring value={latest.avg} size={34} stroke={4.5} color={cat.color} track="var(--color-grey-150)" />
              </span>
            ) : (
              <span className="text-3xl leading-9 font-bold text-heading">—</span>
            )}
            <span className="text-xs leading-4 text-light-text">
              {loading ? 'Loading' : latest && cat ? (
                <>
                  {cat.label}
                  {latest.delta != null && <span className="font-medium" style={{ color: latest.delta >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}> · {latest.delta >= 0 ? '+' : ''}{latest.delta.toFixed(1)} pts</span>}
                </>
              ) : 'After your first round closes'}
            </span>
          </button>
        </div>
      </div>

      {/* key numbers band (left out of the proposed layout) */}
      {kpis.length > 0 && <div aria-label={team ? 'Your teams in numbers' : 'Key numbers'} role="group" className="relative border-t border-primary-light/60 bg-card/70 px-6 py-4 backdrop-blur-sm sm:px-8">
        {kpiErr && !loading ? (
          <div role="alert" className="flex flex-wrap items-center gap-3 text-sm leading-5 text-body-text">
            <Icon name="alert" size={18} color="var(--color-danger)" />
            <span className="flex-1">Could not load the key numbers. The rest of the dashboard is up to date.</span>
            <button type="button" onClick={onRetryKpi} className="h-9 cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-body-bg">Try Again</button>
          </div>
        ) : (
          <div className={`grid grid-cols-2 gap-x-6 gap-y-3 ${kpis.length === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col gap-0.5">
                <span className="text-2xs leading-3.5 font-medium tracking-wide text-light-text uppercase">{k.label}</span>
                {loading ? (
                  <Skel className="my-0.5 h-5 w-14" />
                ) : (
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-lg leading-6.5 font-semibold text-heading">{k.value}</span>
                    {k.delta != null && (
                      <span className="inline-flex items-center gap-0.5 text-xs leading-4 font-medium" style={{ color: k.delta >= 0 ? 'var(--color-success-dark)' : 'var(--color-danger-dark)' }}>
                        <Icon name="up" size={11} sw={2.6} className={k.delta >= 0 ? '' : 'rotate-180'} />
                        {k.delta >= 0 ? '+' : '−'}{Math.abs(k.delta)}
                      </span>
                    )}
                    <span className="text-2xs leading-3.5 text-light-text">{k.note}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>}
    </section>
  )
}

/* ---------- prototype controls ---------- */

function CompanyControls({ role, rolePicker, scenario, setScenario, loading, reload, fail, setFail, trial, setTrial, lean, setLean }: { role: Exclude<Role, 'employee'>; rolePicker: ReactNode; scenario: CompanyScenario; setScenario: (s: CompanyScenario) => void; loading: boolean; reload: () => void; fail: boolean; setFail: (v: boolean) => void; trial: boolean; setTrial: (v: boolean) => void; lean: boolean; setLean: (v: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const opts = SCENARIOS.filter(([s]) => role === 'admin' || s !== 'new')
  return (
    createPortal(
    <div role="region" aria-label="Prototype controls" className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
        <div className="menu-in flex w-92 max-w-full flex-col items-start gap-3 rounded-lg bg-secondary p-4 text-sm leading-5 text-white shadow-tooltip">
          <span className="font-medium">Layout (UX review)</span>
          <div role="group" aria-label="Layout" className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">
            {([[true, 'Proposed'], [false, 'Current']] as const).map(([v, l]) => (
              <button key={l} type="button" aria-pressed={lean === v} onClick={() => setLean(v)} className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors ${lean === v ? 'bg-primary text-white' : 'text-primary-light hover:text-white'}`}>{l}</button>
            ))}
          </div>
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
    </div>,
    document.body,
    )
  )
}

