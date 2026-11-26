// Company Dashboard sample data (Super Admin = whole company, Manager = their teams only).
// Finalized from the PM draft "Ensido Dashboards › Company Dashboard" (Claude canvas), aligned with My Dashboard:
// same "today" (Mon 12 Oct 2026), same rounds, same company (Trianglz), same score categories.

export type Role = 'employee' | 'manager' | 'admin'
export type CompanyScenario = 'typical' | 'busy' | 'one' | 'none' | 'first' | 'new'

export const TODAY = new Date(2026, 9, 12)
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
/** Date `offset` days from today, e.g. "14 Oct 2026". */
export const dayStr = (offset: number, year = true) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset)
  return `${d.getDate()} ${MON[d.getMonth()]}${year ? ` ${d.getFullYear()}` : ''}`
}
export const isoToOffset = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round((new Date(y, m - 1, d).getTime() - TODAY.getTime()) / 86400000)
}
export const offsetToIso = (offset: number) => {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Scope numbers for one round: the whole company, or (team) only the manager's teams. */
export type RoundScope = { forms: number; submitted: number; participants: number; evaluators: number }
export type ActiveRound = {
  id: string
  title: string
  covered: string
  /** days from today: start is in the past (negative), due < 0 means the deadline has passed */
  start: number
  due: number
  reminded?: number
  company: RoundScope
  /** missing = the manager's teams are not part of this round, so a manager doesn't see it */
  team?: RoundScope
}

const R: Record<string, ActiveRound> = {
  sales: { id: 'sales', title: 'Sales Mid-Year Check-in', covered: '1 Jan 2026 – 30 Jun 2026', start: -24, due: -3, reminded: -4, company: { forms: 448, submitted: 371, participants: 56, evaluators: 19 } },
  eng360: { id: 'eng360', title: 'Engineering 360 Feedback', covered: '1 Jul 2026 – 30 Sep 2026', start: -10, due: 2, company: { forms: 234, submitted: 96, participants: 38, evaluators: 24 }, team: { forms: 72, submitted: 30, participants: 12, evaluators: 8 } },
  q3: { id: 'q3', title: 'Q3 2026 Performance Review', covered: '1 Jul 2026 – 30 Sep 2026', start: -6, due: 8, reminded: -3, company: { forms: 1269, submitted: 812, participants: 142, evaluators: 63 }, team: { forms: 156, submitted: 111, participants: 18, evaluators: 11 } },
  probation: { id: 'probation', title: 'Probation Review, September Joiners', covered: '1 Sep 2026 – 30 Sep 2026', start: -4, due: 13, company: { forms: 42, submitted: 9, participants: 14, evaluators: 8 }, team: { forms: 6, submitted: 2, participants: 2, evaluators: 2 } },
  hiring: { id: 'hiring', title: 'Hiring Panel Feedback', covered: '1 Sep 2026 – 30 Sep 2026', start: -12, due: 5, company: { forms: 27, submitted: 27, participants: 9, evaluators: 0 }, team: { forms: 9, submitted: 9, participants: 3, evaluators: 0 } },
  lead180: { id: 'lead180', title: 'Leadership 180', covered: '1 Jan 2026 – 30 Sep 2026', start: -8, due: 16, reminded: -2, company: { forms: 88, submitted: 51, participants: 22, evaluators: 12 } },
  cs: { id: 'cs', title: 'Customer Success Pulse', covered: '1 Jul 2026 – 30 Sep 2026', start: -2, due: 24, company: { forms: 124, submitted: 18, participants: 31, evaluators: 20 } },
  ops: { id: 'ops', title: 'Operations Quarterly Review and Development Conversations for Regional Leads', covered: '1 Jul 2026 – 30 Sep 2026', start: -9, due: 30, company: { forms: 512, submitted: 233, participants: 64, evaluators: 37 } },
}

/* ---------- score bands ----------
   Same bands, ranges and colours as the evaluation round results (Round Details v2, admin/v2/ui.tsx BANDS),
   lowest first like the round results chart. The employee "My Dashboard" keeps its own categories. */
export const BANDS = [
  { key: 'unsat', label: 'Unsatisfactory', range: '0–34%', from: 0, color: '#ed1d4e' },
  { key: 'dev', label: 'Developing', range: '35–49%', from: 35, color: '#d97706' },
  { key: 'solid', label: 'Solid Performance', range: '50–64%', from: 50, color: '#2563eb' },
  { key: 'strong', label: 'Strong', range: '65–79%', from: 65, color: '#00b2a1' },
  { key: 'out', label: 'Outstanding', range: '80–100%', from: 80, color: '#06a700' },
] as const
export type Band = (typeof BANDS)[number]
export const bandOf = (v: number): Band => [...BANDS].reverse().find((b) => v >= b.from) ?? BANDS[0]
/** "Need attention" = Developing or Unsatisfactory (below 50%) */
export const NEED_ATTENTION_BELOW = 50

/* ---------- completed rounds ---------- */

export type Person = { name: string; job: string; unit: string; score: number; evaluators: number }
/** cats: people per score band, in BANDS order (Unsatisfactory, Developing, Solid Performance, Strong, Outstanding) */
export type ResultScope = { participants: number; avg: number; median: number; high: number; low: number; cats: [number, number, number, number, number]; units: [string, number][]; top: Person[]; low5: Person[] }
export type CompletedRound = { id: string; title: string; short: string; covered: string; published: string; company: ResultScope; team: ResultScope }

const TOP: Person[] = [
  { name: 'Laila Gamal', job: 'Product Designer', unit: 'Product', score: 97, evaluators: 7 },
  { name: 'Omar Khaled', job: 'Backend Engineer', unit: 'Engineering', score: 95, evaluators: 6 },
  { name: 'Hana Tarek', job: 'Account Manager', unit: 'Customer Success', score: 94, evaluators: 5 },
  { name: 'Abdelrahman Mohamed El-Sayed Abdelaziz', job: 'Regional Operations Lead', unit: 'Operations', score: 93, evaluators: 8 },
  { name: 'Nour Ibrahim', job: 'Mobile Engineer', unit: 'Engineering', score: 92, evaluators: 5 },
]
const LOW: Person[] = [
  { name: 'Ziad Rashad', job: 'Support Specialist', unit: 'Customer Success', score: 31, evaluators: 4 },
  { name: 'Mariam Ali', job: 'Sales Associate', unit: 'Sales', score: 38, evaluators: 5 },
  { name: 'Tamer Saad', job: 'Data Analyst', unit: 'Operations', score: 42, evaluators: 4 },
  { name: 'Youssef Nabil', job: 'Frontend Engineer', unit: 'Engineering', score: 45, evaluators: 5 },
  { name: 'Salma Adel', job: 'QC Engineer', unit: 'Engineering', score: 48, evaluators: 4 },
]
const TEAM_TOP: Person[] = [
  { name: 'Omar Khaled', job: 'Backend Engineer', unit: 'Backend Team', score: 95, evaluators: 6 },
  { name: 'Nour Ibrahim', job: 'Mobile Engineer', unit: 'Mobile Team', score: 92, evaluators: 5 },
  { name: 'Karim Mostafa', job: 'Senior Mobile Engineer', unit: 'Mobile Team', score: 88, evaluators: 6 },
]
const TEAM_LOW: Person[] = [
  { name: 'Youssef Nabil', job: 'Frontend Engineer', unit: 'Mobile Team', score: 45, evaluators: 5 },
  { name: 'Salma Adel', job: 'QC Engineer', unit: 'QA Team', score: 48, evaluators: 4 },
]
const shift = (p: Person[], d: number) => p.map((x) => ({ ...x, score: x.score + d }))

export const COMPLETED: CompletedRound[] = [
  {
    id: 'q2', title: 'Q2 2026 Performance Review', short: 'Q2 2026', covered: '1 Apr 2026 – 30 Jun 2026', published: '18 Jul 2026',
    company: { participants: 137, avg: 76.4, median: 77, high: 97, low: 31, cats: [3, 6, 27, 55, 46], units: [['Engineering', 74], ['Product', 79], ['Sales', 69], ['Customer Success', 81], ['Operations', 77], ['HR', 83], ['Finance', 72]], top: TOP, low5: LOW },
    team: { participants: 18, avg: 78.2, median: 79, high: 95, low: 45, cats: [0, 2, 3, 7, 6], units: [['Mobile Team', 80], ['Backend Team', 76], ['QA Team', 78]], top: TEAM_TOP, low5: TEAM_LOW },
  },
  {
    id: 'q1', title: 'Q1 2026 Performance Review', short: 'Q1 2026', covered: '1 Jan 2026 – 31 Mar 2026', published: '16 Apr 2026',
    company: { participants: 129, avg: 74.1, median: 75, high: 96, low: 28, cats: [4, 8, 30, 52, 35], units: [['Engineering', 72], ['Product', 77], ['Sales', 66], ['Customer Success', 78], ['Operations', 75], ['HR', 80], ['Finance', 71]], top: shift(TOP, -1), low5: shift(LOW, 12) },
    team: { participants: 17, avg: 75.9, median: 76, high: 93, low: 39, cats: [1, 1, 4, 6, 5], units: [['Mobile Team', 77], ['Backend Team', 74], ['QA Team', 76]], top: shift(TEAM_TOP, -2), low5: shift(TEAM_LOW, 10) },
  },
  {
    id: 'q4', title: 'Q4 2025 Performance Review', short: 'Q4 2025', covered: '1 Oct 2025 – 31 Dec 2025', published: '20 Jan 2026',
    company: { participants: 121, avg: 73.0, median: 74, high: 95, low: 26, cats: [4, 9, 31, 48, 29], units: [['Engineering', 71], ['Product', 75], ['Sales', 66], ['Customer Success', 76], ['Operations', 74], ['HR', 79], ['Finance', 70]], top: shift(TOP, -2), low5: shift(LOW, 8) },
    team: { participants: 16, avg: 74.0, median: 75, high: 92, low: 38, cats: [1, 2, 4, 5, 4], units: [['Mobile Team', 75], ['Backend Team', 73], ['QA Team', 74]], top: shift(TEAM_TOP, -3), low5: shift(TEAM_LOW, 6) },
  },
]

/** Competency averages per completed round (PM "Radar" view, shown here as vertical bars). Index = COMPLETED order. */
export const COMPETENCIES = ['Communication', 'Teamwork and Collaboration', 'Problem Solving', 'Ownership and Accountability', 'Customer Focus', 'Leadership', 'Technical Excellence', 'Adaptability']
const COMP_CO = [[78, 82, 74, 71, 80, 68, 76, 65], [74, 79, 72, 70, 77, 66, 73, 63], [71, 76, 70, 69, 75, 64, 70, 61], [69, 74, 68, 67, 73, 62, 68, 60]]
const COMP_TEAM_D = [3, 1, 4, 5, -2, 2, 3, 1]
export const competencyScores = (idx: number, team: boolean) => {
  const row = (i: number) => (COMP_CO[i] ?? COMP_CO[COMP_CO.length - 1]).map((v, k) => (team ? v + COMP_TEAM_D[k] : v))
  return { cur: row(idx), prev: idx + 1 < COMPLETED.length ? row(idx + 1) : null }
}

/** People per 5-point score range (25–100), built from the round's average so the bars add up to everyone evaluated. */
export const scoreBins = (r: ResultScope) => {
  const lo = 25, w = 5, n = 15, sd = 12
  const dens = Array.from({ length: n }, (_, i) => {
    const x = lo + i * w + w / 2
    return Math.exp(-(((x - r.avg) / sd) ** 2) / 2)
  })
  const sum = dens.reduce((a, b) => a + b, 0)
  const wobble = [0, 1, -1, 0, 1, 0, -1, 1, 0, -1, 1, 0, 0, -1, 0]
  const counts = dens.map((d, i) => Math.max(0, Math.round((d / sum) * r.participants) + (d / sum > 0.04 ? wobble[i] : 0)))
  const diff = r.participants - counts.reduce((a, b) => a + b, 0)
  counts[counts.indexOf(Math.max(...counts))] += diff
  const expected = dens.map((d) => (d / sum) * r.participants)
  return counts.map((c, i) => ({ from: lo + i * w, to: lo + (i + 1) * w, count: c, expected: expected[i] }))
}

/* ---------- people ---------- */

export type Joiner = { name: string; job: string; joined: number }
export type OverdueEvaluator = { id: string; name: string; unit: string; manager: string; forms: number; rounds: string[]; since: number }

const JOINERS: Joiner[] = [
  { name: 'Dina Essam', job: 'HR Specialist', joined: -4 },
  { name: 'Amr Magdy', job: 'Backend Engineer', joined: -7 },
  { name: 'Reem Hany', job: 'Product Manager', joined: -14 },
  { name: 'Sherif Fouad', job: 'QC Engineer', joined: -18 },
  { name: 'Nada Elsayed', job: 'Account Manager', joined: -26 },
]
const OVERDUE: OverdueEvaluator[] = [
  { id: 'o1', name: 'Omar Khaled', unit: 'Engineering', manager: 'Ahmed Fathy', forms: 9, rounds: ['eng360', 'q3'], since: -10 },
  { id: 'o2', name: 'Mariam Ali', unit: 'Sales', manager: 'Dalia Mansour', forms: 8, rounds: ['sales'], since: -24 },
  { id: 'o3', name: 'Karim Mostafa', unit: 'Engineering', manager: 'Ahmed Fathy', forms: 7, rounds: ['eng360', 'q3'], since: -10 },
  { id: 'o4', name: 'Hana Tarek', unit: 'Customer Success', manager: 'Sara Nabil', forms: 6, rounds: ['q3'], since: -6 },
  { id: 'o5', name: 'Tamer Saad', unit: 'Operations', manager: 'Hesham Adel', forms: 5, rounds: ['q3'], since: -6 },
  { id: 'o6', name: 'Youssef Nabil', unit: 'Engineering', manager: 'Ahmed Fathy', forms: 5, rounds: ['eng360'], since: -10 },
]
/** Completion by department (company) / team (manager): base % per unit, nudged per round */
const UNITS_CO: [string, number][] = [['Engineering', 52], ['Product', 78], ['Sales', 41], ['Customer Success', 69], ['Operations', 88], ['HR', 95], ['Finance', 74]]
const UNITS_TEAM: [string, number][] = [['Mobile Team', 61], ['Backend Team', 48], ['QA Team', 83]]

/* ---------- setup ---------- */

export type SetupStep = { name: string; done: number; total: number }
const STEPS = ['Organization structure', 'Job titles and levels', 'Employees', 'Competencies', 'Relations and work groups']
const steps = (s: [number, number][]): SetupStep[] => s.map(([done, total], i) => ({ name: STEPS[i], done, total }))

/* ---------- trends, movers, setup gaps, insights (PM "proposed sections") ---------- */

/** last 6 completed rounds, oldest first: [label, average score, participation %] */
export const TRENDS: { company: [string, number, number][]; team: [string, number, number][] } = {
  company: [['Q1 2025', 70.2, 88], ['Q2 2025', 72.0, 91], ['Q3 2025', 71.1, 86], ['Q4 2025', 73.0, 93], ['Q1 2026', 74.1, 92], ['Q2 2026', 76.4, 95]],
  team: [['Q1 2025', 72.0, 90], ['Q2 2025', 74.0, 94], ['Q3 2025', 73.0, 89], ['Q4 2025', 74.0, 94], ['Q1 2026', 75.9, 94], ['Q2 2026', 78.2, 100]],
}
export type Mover = { name: string; unit: string; from: number; to: number }
export const MOVERS: { company: { up: Mover[]; down: Mover[] }; team: { up: Mover[]; down: Mover[] } } = {
  company: {
    up: [{ name: 'Sherif Fouad', unit: 'Engineering', from: 61, to: 74 }, { name: 'Reem Hany', unit: 'Product', from: 68, to: 79 }, { name: 'Karim Mostafa', unit: 'Engineering', from: 79, to: 88 }],
    down: [{ name: 'Ziad Rashad', unit: 'Customer Success', from: 43, to: 31 }, { name: 'Mariam Ali', unit: 'Sales', from: 50, to: 38 }, { name: 'Tamer Saad', unit: 'Operations', from: 54, to: 42 }],
  },
  team: {
    up: [{ name: 'Karim Mostafa', unit: 'Mobile Team', from: 79, to: 88 }, { name: 'Sherif Fouad', unit: 'QA Team', from: 61, to: 74 }],
    down: [{ name: 'Youssef Nabil', unit: 'Mobile Team', from: 55, to: 45 }, { name: 'Salma Adel', unit: 'QA Team', from: 58, to: 48 }],
  },
}
export type Gap = { label: string; count: string; sev: 'critical' | 'warning' | 'info'; action: string }
const GAPS: Gap[] = [
  { label: 'Job titles missing competencies', count: '5', sev: 'critical', action: 'Fix Job Titles' },
  { label: 'Evaluator matrices incomplete', count: '6 of 24', sev: 'critical', action: 'Open Matrices' },
  { label: 'Employees without a manager', count: '7', sev: 'warning', action: 'Assign Managers' },
  { label: 'On-demand groups missing competencies', count: '3', sev: 'warning', action: 'Fix Groups' },
  { label: 'Invitations not accepted yet', count: '12', sev: 'info', action: 'Resend Invites' },
]
const TEAM_JOINERS: Joiner[] = [
  { name: 'Amr Magdy', job: 'Backend Engineer', joined: -7 },
  { name: 'Sherif Fouad', job: 'QC Engineer', joined: -18 },
]

/* ---------- scenarios ---------- */

export type CompanyData = {
  rounds: ActiveRound[]
  completed: CompletedRound[]
  setup: SetupStep[]
  joiners: Joiner[]
  overdue: OverdueEvaluator[]
  employees: number
  employeesDelta: number
  completedCount: number
  newJoiners: number
  newJoinersDelta: number
  seats: [number, number]
  team: { members: number; delta: number; newJoiners: number }
  teamJoiners: Joiner[]
  gaps: Gap[]
}

const FULL_SETUP = steps([[3, 3], [3, 3], [2, 2], [4, 4], [4, 4]])
const MOST_SETUP = steps([[3, 3], [3, 3], [2, 2], [4, 4], [2, 4]])
const base = { completed: COMPLETED, setup: MOST_SETUP, joiners: JOINERS, overdue: OVERDUE, employees: 248, employeesDelta: 12, completedCount: 11, newJoiners: 14, newJoinersDelta: -3, seats: [248, 250] as [number, number], team: { members: 18, delta: 2, newJoiners: 2 }, teamJoiners: TEAM_JOINERS, gaps: GAPS }

export const COMPANY: Record<CompanyScenario, CompanyData> = {
  typical: { ...base, rounds: [R.sales, R.eng360, R.q3] },
  busy: { ...base, setup: FULL_SETUP, gaps: GAPS.slice(4), rounds: [R.sales, R.eng360, R.q3, R.probation, R.hiring, R.lead180, R.cs, R.ops] },
  one: { ...base, rounds: [R.q3], overdue: OVERDUE.filter((o) => o.rounds.includes('q3')).map((o) => ({ ...o, rounds: ['q3'], since: -6 })) },
  none: { ...base, rounds: [], overdue: [] },
  first: { ...base, rounds: [R.q3], completed: [], completedCount: 0, overdue: OVERDUE.filter((o) => o.rounds.includes('q3')).map((o) => ({ ...o, rounds: ['q3'], since: -6 })) },
  new: { ...base, rounds: [], completed: [], setup: steps([[3, 3], [1, 3], [0, 2], [0, 4], [0, 4]]), joiners: [], teamJoiners: [], gaps: [], overdue: [], employees: 1, employeesDelta: 0, completedCount: 0, newJoiners: 1, newJoinersDelta: 0, seats: [1, 50] },
}

export const unitCompletion = (roundId: string, team: boolean) => {
  const off: Record<string, number> = { sales: 6, eng360: -8, q3: 0, probation: -20, hiring: 30, lead180: 0, cs: -40, ops: -10 }
  const units = team ? UNITS_TEAM : UNITS_CO
  return units.map(([name, v], i) => [name, Math.max(6, Math.min(100, v + (off[roundId] ?? 0) + ((i * 7) % 9) - 4))] as [string, number])
}

export const USERS: Record<Role, { name: string; role: string; avatar?: string }> = {
  employee: { name: 'Ahmed Samy', role: 'Employee', avatar: '/assets/avatar-ahmed.png' },
  manager: { name: 'Ahmed Fathy', role: 'Engineering Manager' },
  admin: { name: 'Rania Samir', role: 'Super Admin' },
}
