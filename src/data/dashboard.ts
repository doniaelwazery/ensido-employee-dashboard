// Employee dashboard sample data (from the "Ensido Dashboards" Claude canvas, restyled to the ensido DS).
// Four scenarios: typical, new employee (empty states), heavy use (overflow),
// first round (the system's only round is ongoing, no previous rounds so no results yet).

export type Scenario = 'typical' | 'new' | 'busy' | 'first'

export type DashRound = { title: string; covered: string; deadline: string; days: number; forms: number; submitted: number }
// Main status + optional sub status (Figma 25834:86493, My Goals table):
// Not Started → Pending Approval | Rejected · In Progress → Overdue · Completed → Pending Approval | Rejected
export type GoalStatus = 'not_started' | 'in_progress' | 'completed'
export type GoalSub = 'pending' | 'rejected' | 'overdue'
export type DashGoal = { title: string; status: GoalStatus; sub?: GoalSub; done: number; total: number; updated: string | null }
export type NoteType = 'eval' | 'goal' | 'people' | 'award' | 'policy'
export type DashNote = { id: string; type: NoteType; urgent?: boolean; read?: boolean; title: string; body: string; when: string; children?: { id: string; title: string; when: string }[] }
export type DashManager = { initials: string; name: string; job: string; relation: string; unit: string }
export type DashGroup = { initials: string; name: string; type: string; roles: string[] }
export type DashPolicy = { title: string; category: string; date: string; tag: 'New' | 'Updated' }

export type DashData = {
  summary: string
  rounds: DashRound[]
  notes: DashNote[]
  notesTotal: number
  unreadTotal?: number
  goals: DashGoal[]
  managers: DashManager[]
  groups: DashGroup[]
  kpis: [string, number][]
  history: number[]
  achievements: [string, string][]
  policies: DashPolicy[]
  overview?: { label: string; value: number }[]
}

const POLICIES: DashPolicy[] = [
  { title: 'Remote Work Policy', category: 'HR', date: 'Updated 1 Oct, 2026', tag: 'Updated' },
  { title: 'Travel Expense Policy', category: 'Finance', date: 'Added 24 Sep, 2026', tag: 'New' },
]

const MANY_KPIS: [string, number][] = [
  ['Technical Expertise', 4.6], ['Problem Solving', 4.5], ['Code Quality', 4.4], ['Ownership', 4.3], ['System Design', 4.2], ['Collaboration', 4.1],
  ['Reliability', 4.0], ['Mentoring', 4.0], ['Testing Discipline', 3.9], ['Customer Focus and Continuous Improvement of Delivery Practices', 3.9],
  ['Adaptability', 3.8], ['Communication', 3.7], ['Documentation', 3.6], ['Product Thinking', 3.6], ['Initiative', 3.5], ['Estimation', 3.4],
  ['Stakeholder Management', 3.3], ['Prioritization', 3.2], ['Presentation Skills', 3.1], ['Delegation', 3.0], ['Time Management', 2.9], ['Negotiation', 2.7],
]
export const MANY_KPI_LIST = MANY_KPIS

// Managers use the heavy data in the default (typical) scenario too: 4 direct managers + a skip manager (not counted)
const HEAVY_MANAGERS: DashManager[] = [
  { initials: 'AF', name: 'Ahmed Fathy', job: 'Engineering Manager', relation: 'Direct Manager', unit: 'Mobile Team' },
  { initials: 'DM', name: 'Dalia Mansour', job: 'Product Director', relation: 'Direct Manager', unit: 'Product' },
  { initials: 'NH', name: 'Nour Hassan', job: 'Design Lead', relation: 'Direct Manager', unit: 'Design' },
  { initials: 'KS', name: 'Karim Saleh', job: 'QA Manager', relation: 'Direct Manager', unit: 'Quality' },
  { initials: 'HA', name: 'Hesham Adel', job: 'Chief Technology Officer', relation: 'Skip Manager', unit: 'Technology' },
]

export const DASHBOARD: Record<Scenario, DashData> = {
  typical: {
    summary: 'Two evaluation rounds are waiting on you, and the nearest deadline is in 2 days.',
    rounds: [
      { title: 'Engineering 360 Feedback', covered: 'From 1 Jul, 2026 to 30 Sep, 2026', deadline: '14 Oct, 2026', days: 2, forms: 5, submitted: 1 },
      { title: 'Q3 2026 Performance Review', covered: 'From 1 Jul, 2026 to 30 Sep, 2026', deadline: '20 Oct, 2026', days: 8, forms: 8, submitted: 5 },
      { title: 'Probation Review, September Joiners', covered: 'From 1 Sep, 2026 to 30 Sep, 2026', deadline: '25 Oct, 2026', days: 13, forms: 2, submitted: 2 },
    ],
    notes: [
      { id: 't1', type: 'goal', urgent: true, title: 'Goal needs changes', body: 'Ahmed Fathy rejected “Document the mobile release process”.', when: 'Yesterday' },
      { id: 't2', type: 'goal', title: 'Goal approved', body: 'Ahmed Fathy approved “Reduce API p95 latency to under 300 ms”.', when: '2 hours ago' },
      { id: 't3', type: 'eval', read: true, title: 'New evaluation round', body: 'Q3 2026 Performance Review is open until 20 Oct.', when: '6 Oct, 2026' },
      { id: 't4', type: 'eval', read: true, title: 'Report shared', body: 'Your Q2 2026 report is ready to view.', when: '18 Jul, 2026' },
    ],
    notesTotal: 4,
    goals: [
      { title: 'Complete AWS Solutions Architect certification', status: 'in_progress', sub: 'overdue', done: 1, total: 3, updated: '14 Sep, 2026' },
      { title: 'Document the mobile release process', status: 'not_started', sub: 'rejected', done: 0, total: 3, updated: '28 Sep, 2026' },
      { title: 'Mentor two junior engineers', status: 'not_started', sub: 'pending', done: 0, total: 2, updated: null },
      { title: 'Ship the onboarding redesign', status: 'completed', sub: 'pending', done: 4, total: 4, updated: '2 Oct, 2026' },
      { title: 'Reduce API p95 latency to under 300 ms', status: 'in_progress', done: 3, total: 5, updated: '8 Oct, 2026' },
      { title: 'Migrate CI pipelines to GitHub Actions', status: 'not_started', done: 0, total: 4, updated: null },
    ],
    managers: HEAVY_MANAGERS,
    groups: [
      { initials: 'MS', name: 'Mobile Squad', type: 'Work group', roles: ['Member'] },
      { initials: 'RC', name: 'Release Committee', type: 'Work group', roles: ['Lead', 'Reviewer'] },
      { initials: 'HP', name: 'Hiring Panel Q4', type: 'On-demand group', roles: ['Interviewer'] },
    ],
    kpis: [['Technical Expertise', 4.5], ['Problem Solving', 4.4], ['Ownership', 4.2], ['Collaboration', 4.0], ['Communication and Stakeholder Management', 3.7], ['Time Management', 2.9]],
    history: [82, 74, 76, 72],
    achievements: [['H1 2026 Achievements', '2 Jul, 2026'], ['Q2 Release Highlights', '30 Jun, 2026'], ['Customer App Launch', '12 Mar, 2026']],
    policies: POLICIES,
  },
  new: {
    summary: 'Welcome to Ensido. Your forms, goals and results will appear here as you start.',
    rounds: [], notes: [], notesTotal: 0, goals: [], managers: [], groups: [], kpis: [], history: [], achievements: [],
    policies: POLICIES,
  },
  busy: {
    summary: 'Four evaluation rounds are waiting on you, and the nearest deadline is in 2 days.',
    rounds: [
      { title: 'Engineering 360 Feedback', covered: 'From 1 Jul, 2026 to 30 Sep, 2026', deadline: '14 Oct, 2026', days: 2, forms: 5, submitted: 1 },
      { title: 'Q3 2026 Performance Review', covered: 'From 1 Jul, 2026 to 30 Sep, 2026', deadline: '20 Oct, 2026', days: 8, forms: 8, submitted: 5 },
      { title: 'Hiring Panel Feedback Q4', covered: 'From 1 Oct, 2026 to 31 Oct, 2026', deadline: '24 Oct, 2026', days: 12, forms: 5, submitted: 0 },
      { title: 'Probation Review, September Joiners', covered: 'From 1 Sep, 2026 to 30 Sep, 2026', deadline: '25 Oct, 2026', days: 13, forms: 2, submitted: 2 },
      { title: 'Cross-team Peer Review', covered: 'From 1 Jul, 2026 to 30 Sep, 2026', deadline: '27 Oct, 2026', days: 15, forms: 6, submitted: 3 },
    ],
    notes: [
      { id: 'b1', type: 'eval', urgent: true, title: 'Deadline in 2 days', body: 'Engineering 360 Feedback closes on 14 Oct. 4 forms are pending.', when: '1 hour ago' },
      { id: 'b2', type: 'goal', urgent: true, title: 'Goal needs changes', body: 'Dalia Mansour rejected “Run a brown-bag session series”.', when: '5 hours ago' },
      { id: 'b3', type: 'goal', urgent: true, title: 'Goal overdue', body: '“Publish the offline mode RFC” passed its due date.', when: 'Yesterday' },
      { id: 'b4', type: 'goal', title: '3 goals approved', body: 'Ahmed Fathy approved 3 of your goals.', when: '2 hours ago', children: [
        { id: 'b4a', title: 'Reduce API p95 latency to under 300 ms', when: '2 hours ago' },
        { id: 'b4b', title: 'Lead the Q4 hiring loop', when: '3 hours ago' },
        { id: 'b4c', title: 'Improve crash-free sessions to 99.8%', when: 'Yesterday' },
      ] },
      { id: 'b5', type: 'people', title: 'Added to 2 groups', body: 'Accessibility Taskforce as Lead, Mentorship Circle as Mentor.', when: 'Yesterday', children: [
        { id: 'b5a', title: 'Accessibility Taskforce · Lead', when: 'Yesterday' },
        { id: 'b5b', title: 'Mentorship Circle · Mentor', when: 'Yesterday' },
      ] },
      { id: 'b6', type: 'award', title: 'Added to an achievement report', body: 'You are included in Payments Stability Push.', when: '2 days ago' },
      { id: 'b7', type: 'policy', read: true, title: 'Policy updated', body: 'Remote Work Policy has a new version.', when: '1 Oct, 2026' },
    ],
    notesTotal: 23,
    unreadTotal: 14,
    goals: [
      { title: 'Complete AWS Solutions Architect certification', status: 'in_progress', sub: 'overdue', done: 1, total: 3, updated: '14 Sep, 2026' },
      { title: 'Publish the offline mode RFC', status: 'in_progress', sub: 'overdue', done: 1, total: 2, updated: '30 Sep, 2026' },
      { title: 'Refactor the payments SDK', status: 'in_progress', sub: 'overdue', done: 2, total: 6, updated: '22 Sep, 2026' },
      { title: 'Document the mobile release process', status: 'not_started', sub: 'rejected', done: 0, total: 3, updated: '28 Sep, 2026' },
      { title: 'Run a brown-bag session series', status: 'completed', sub: 'rejected', done: 3, total: 4, updated: '11 Oct, 2026' },
      { title: 'Mentor two junior engineers', status: 'not_started', sub: 'pending', done: 0, total: 2, updated: null },
      { title: 'Ship the onboarding redesign', status: 'completed', sub: 'pending', done: 4, total: 4, updated: '12 Oct, 2026' },
      { title: 'Reduce API p95 latency to under 300 ms', status: 'in_progress', done: 3, total: 5, updated: '8 Oct, 2026' },
      { title: 'Improve crash-free sessions to 99.8%', status: 'in_progress', done: 2, total: 4, updated: '6 Oct, 2026' },
      { title: 'Add accessibility labels across the app', status: 'in_progress', done: 5, total: 8, updated: '10 Oct, 2026' },
      { title: 'Lead the Q4 hiring loop', status: 'in_progress', done: 1, total: 3, updated: '9 Oct, 2026' },
      { title: 'Migrate CI pipelines to GitHub Actions', status: 'not_started', done: 0, total: 4, updated: null },
      { title: 'Upgrade to React Native 0.76', status: 'completed', done: 3, total: 3, updated: '19 Sep, 2026' },
      { title: 'Set up the feature flag service', status: 'completed', done: 2, total: 2, updated: '3 Sep, 2026' },
    ],
    managers: HEAVY_MANAGERS,
    groups: [
      { initials: 'RC', name: 'Release Committee', type: 'Work group', roles: ['Lead', 'Reviewer'] },
      { initials: 'AG', name: 'Architecture Guild', type: 'Work group', roles: ['Member', 'Presenter'] },
      { initials: 'IR', name: 'Incident Response', type: 'Work group', roles: ['On-call', 'Member'] },
      { initials: 'AT', name: 'Accessibility Taskforce', type: 'On-demand group', roles: ['Lead'] },
      { initials: 'MS', name: 'Mobile Squad', type: 'Work group', roles: ['Member'] },
      { initials: 'HP', name: 'Hiring Panel Q4', type: 'On-demand group', roles: ['Interviewer'] },
      { initials: 'MC', name: 'Mentorship Circle', type: 'On-demand group', roles: ['Mentor'] },
    ],
    kpis: MANY_KPIS,
    history: [79, 74, 76, 72, 70, 66, 68, 58],
    achievements: [['H1 2026 Achievements', '2 Jul, 2026'], ['Q2 Release Highlights', '30 Jun, 2026'], ['Payments Stability Push', '22 Sep, 2026'], ['Customer App Launch', '12 Mar, 2026'], ['H2 2025 Achievements', '8 Jan, 2026'], ['Hackathon 2025 Winners', '14 Nov, 2025']],
    policies: [],
    // more organization levels: the title stays fixed and the figures scroll sideways
    overview: [
      { label: 'Active Employees', value: 1240 },
      { label: 'Business Units', value: 3 },
      { label: 'Divisions', value: 6 },
      { label: 'Active Departments', value: 18 },
      { label: 'Active Domains', value: 9 },
      { label: 'Active Teams', value: 64 },
      { label: 'Squads', value: 112 },
      { label: 'Locations', value: 7 },
    ],
  },
  first: {
    summary: 'Your first evaluation round is open, and it closes in 9 days.',
    rounds: [
      { title: 'Q3 2026 Performance Review', covered: 'From 1 Jul, 2026 to 30 Sep, 2026', deadline: '21 Oct, 2026', days: 9, forms: 6, submitted: 2 },
    ],
    notes: [
      { id: 'f1', type: 'eval', urgent: true, title: 'New evaluation round', body: 'Q3 2026 Performance Review is open until 21 Oct. 6 forms are assigned to you.', when: '2 hours ago' },
      { id: 'f2', type: 'goal', title: 'Goal approved', body: 'Ahmed Fathy approved “Reduce API p95 latency to under 300 ms”.', when: 'Yesterday' },
      { id: 'f3', type: 'people', read: true, title: 'Added to a work group', body: 'You were added to Mobile Squad as Member.', when: '5 Oct, 2026' },
      { id: 'f4', type: 'policy', read: true, title: 'New policy', body: 'Travel Expense Policy was added.', when: '24 Sep, 2026' },
    ],
    notesTotal: 4,
    goals: [
      { title: 'Reduce API p95 latency to under 300 ms', status: 'in_progress', done: 2, total: 5, updated: '8 Oct, 2026' },
      { title: 'Mentor two junior engineers', status: 'not_started', sub: 'pending', done: 0, total: 2, updated: null },
      { title: 'Migrate CI pipelines to GitHub Actions', status: 'not_started', done: 0, total: 4, updated: null },
    ],
    managers: HEAVY_MANAGERS,
    groups: [
      { initials: 'MS', name: 'Mobile Squad', type: 'Work group', roles: ['Member'] },
      { initials: 'RC', name: 'Release Committee', type: 'Work group', roles: ['Reviewer'] },
    ],
    kpis: [], history: [], achievements: [],
    policies: POLICIES,
  },
}

export const HISTORY_META = [
  ['Q2 2026', '1 Apr to 30 Jun 2026', '18 Jul, 2026'],
  ['Q1 2026', '1 Jan to 31 Mar 2026', '16 Apr, 2026'],
  ['Q4 2025', '1 Oct to 31 Dec 2025', '20 Jan, 2026'],
  ['Q3 2025', '1 Jul to 30 Sep 2025', '15 Oct, 2025'],
  ['Q2 2025', '1 Apr to 30 Jun 2025', '17 Jul, 2025'],
  ['Q1 2025', '1 Jan to 31 Mar 2025', '14 Apr, 2025'],
  ['Q4 2024', '1 Oct to 31 Dec 2024', '22 Jan, 2025'],
  ['Q3 2024', '1 Jul to 30 Sep 2024', '16 Oct, 2024'],
] as const

export const COMPANY_OVERVIEW = [
  { label: 'Active Employees', value: 248 },
  { label: 'Active Departments', value: 9 },
  { label: 'Active Domains', value: 4 },
  { label: 'Active Teams', value: 31 },
]

// Score categories used by the employee dashboard (Figma 29211:17626)
export const CATEGORIES = [
  { key: 'exceptional', label: 'Exceptional', from: 90, color: 'var(--color-success)', bg: 'var(--color-success-bg)', fg: 'var(--color-success-dark)' },
  { key: 'exceeds', label: 'Exceeds Expectations', from: 75, color: 'var(--color-primary)', bg: 'var(--color-row-hover)', fg: 'var(--color-primary-dark)' },
  { key: 'meets', label: 'Meets Expectations', from: 60, color: 'var(--color-info)', bg: 'var(--color-info-bg)', fg: 'var(--color-info-dark)' },
  { key: 'below', label: 'Needs Improvement', from: 0, color: 'var(--color-danger)', bg: 'var(--color-danger-bg)', fg: 'var(--color-danger-dark)' },
] as const
export const category = (pct: number) => CATEGORIES.find((c) => pct >= c.from) ?? CATEGORIES[CATEGORIES.length - 1]
