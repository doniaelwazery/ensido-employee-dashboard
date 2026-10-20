import { type ReactNode } from 'react'
import { type DashGoal, type GoalStatus, type GoalSub, type NoteType } from '../../data/dashboard'

export type Tone = { bg: string; stroke: string; fg: string; dot: string }
export const TONE: Record<'danger' | 'purple' | 'info' | 'neutral' | 'success', Tone> = {
  danger: { bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)', dot: 'var(--color-danger)' },
  purple: { bg: 'var(--color-purple-bg)', stroke: 'var(--color-purple-stroke)', fg: 'var(--color-primary-dark)', dot: 'var(--color-purple)' },
  info: { bg: 'var(--color-info-bg)', stroke: 'var(--color-info-stroke)', fg: 'var(--color-info-dark)', dot: 'var(--color-info)' },
  neutral: { bg: 'var(--color-grey-150)', stroke: 'var(--color-border)', fg: 'var(--color-body-text)', dot: 'var(--color-light-text)' },
  success: { bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)', fg: 'var(--color-success-dark)', dot: 'var(--color-success)' },
}

/** Main goal status: drives the pill tone (badge colors from Figma 25834:86493). */
export const GOAL: Record<GoalStatus, { label: string; tone: Tone; bar: string; rank: number }> = {
  in_progress: { label: 'In Progress', tone: { bg: 'var(--color-info-bg)', stroke: 'var(--color-info-lighter)', fg: 'var(--color-info)', dot: 'var(--color-info)' }, bar: 'var(--color-primary)', rank: 0 },
  not_started: { label: 'Not Started', tone: { bg: 'var(--color-grey-100)', stroke: 'var(--color-border-darker)', fg: 'var(--color-body-text)', dot: 'var(--color-body-text)' }, bar: 'var(--color-border-darker)', rank: 1 },
  completed: { label: 'Completed', tone: { bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)', fg: 'var(--color-success)', dot: 'var(--color-success)' }, bar: 'var(--color-success)', rank: 2 },
}
/** Sub status: appended to the main label in its own color ("Not Started - Rejected"). */
export const GOAL_SUB: Record<GoalSub, { label: string; fg: string; rank: number; flag?: boolean }> = {
  overdue: { label: 'Overdue', fg: 'var(--color-danger)', rank: 0, flag: true },
  rejected: { label: 'Rejected', fg: 'var(--color-danger)', rank: 1, flag: true },
  pending: { label: 'Pending Approval', fg: '#d97706', rank: 2 },
}
export const goalFlag = (g: DashGoal) => !!(g.sub && GOAL_SUB[g.sub].flag)
/** Most urgent first: overdue, rejected, pending approval, then by main status. */
export const goalRank = (g: DashGoal) => (g.sub ? GOAL_SUB[g.sub].rank : 3) * 10 + GOAL[g.status].rank
export const goalLabel = (g: DashGoal) => GOAL[g.status].label + (g.sub ? ` - ${GOAL_SUB[g.sub].label}` : '')

/* ---------- icons ---------- */

export const PATHS = {
  clip: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 13l2 2 4-4" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  people: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.6.8 2.6 2.5 3 5.2" /></>,
  award: <><circle cx="12" cy="9" r="5" /><path d="M9 13.5L8 21l4-2 4 2-1-7.5" /></>,
  policy: <><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  chart: <path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chev: <path d="M9 6l6 6-6 6" />,
  down: <path d="M6 9l6 6 6-6" />,
  up: <path d="M12 19V5M6 11l6-6 6 6" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>,
  check: <path d="M5 12l5 5 9-10" />,
  alert: <><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></>,
}
export function Icon({ name, size = 16, color = 'currentColor', sw = 2, className }: { name: keyof typeof PATHS; size?: number; color?: string; sw?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 ${className ?? ''}`}>
      {PATHS[name]}
    </svg>
  )
}
export const NOTE_ICON: Record<NoteType, { icon: keyof typeof PATHS; bg: string; stroke: string; fg: string }> = {
  eval: { icon: 'clip', bg: 'var(--color-row-hover)', stroke: 'var(--color-primary-light)', fg: 'var(--color-primary)' },
  goal: { icon: 'target', bg: 'var(--color-info-bg)', stroke: 'var(--color-info-stroke)', fg: 'var(--color-info)' },
  people: { icon: 'people', bg: 'var(--color-purple-bg)', stroke: 'var(--color-purple-stroke)', fg: 'var(--color-purple)' },
  award: { icon: 'award', bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)', fg: 'var(--color-success-dark)' },
  policy: { icon: 'policy', bg: 'var(--color-grey-150)', stroke: 'var(--color-grey-200)', fg: 'var(--color-light-text)' },
}

/* ---------- small pieces ---------- */

export function Card({ title, aside, sub, children, className = '', gap = 'gap-4', busy, id }: { title?: ReactNode; aside?: ReactNode; sub?: string; children: ReactNode; className?: string; gap?: string; busy?: boolean; id?: string }) {
  return (
    <section id={id} aria-busy={busy} className={`flex min-w-0 scroll-mt-20 flex-col rounded-xl border border-grey-200 bg-card p-6 ${gap} ${className}`}>
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h3 className="flex flex-wrap items-center gap-2 text-base leading-6 font-semibold text-heading">{title}</h3>
            {sub && <p className="text-xs leading-4 text-light-text">{sub}</p>}
          </div>
          {aside && <div className="flex flex-wrap items-center gap-3">{aside}</div>}
        </div>
      )}
      {children}
    </section>
  )
}

export function TextLink({ children, arrow, onClick, className = '' }: { children: ReactNode; arrow?: boolean; onClick?: () => void; className?: string }) {
  return (
    <button type="button" onClick={onClick} className={`group inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm leading-5 font-medium whitespace-nowrap text-primary hover:text-primary-dark ${className}`}>
      {children}
      {arrow && <Icon name="arrow" size={14} className="transition-transform group-hover:translate-x-0.5" />}
    </button>
  )
}

export const Pill = ({ tone, dot, children }: { tone: Tone; dot?: boolean; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs leading-4 font-medium whitespace-nowrap" style={{ background: tone.bg, borderColor: tone.stroke, color: tone.fg }}>
    {dot && <Dot color={tone.dot} size={6} />}
    {children}
  </span>
)
export const Chip = ({ tone, dot, children }: { tone: Pick<Tone, 'bg' | 'fg'> & { stroke?: string; dot?: string }; dot?: boolean; children: ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs leading-4 font-medium whitespace-nowrap" style={{ background: tone.bg, borderColor: tone.stroke ?? tone.bg, color: tone.fg }}>
    {dot && tone.dot && <Dot color={tone.dot} size={6} />}
    {children}
  </span>
)

export function Empty({ icon, title, text, tone = 'brand', children }: { icon: keyof typeof PATHS; title: string; text: string; tone?: 'brand' | 'grey'; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
      <span className={`empty-icon flex size-12 items-center justify-center rounded-full border ${tone === 'brand' ? 'border-primary-light bg-row-hover text-primary-light' : 'border-grey-200 bg-grey-150 text-grey-200'}`}>
        <Icon name={icon} size={22} sw={1.8} color={tone === 'brand' ? 'var(--color-primary)' : 'var(--color-light-text)'} />
      </span>
      <p className="text-base leading-6 font-semibold text-heading">{title}</p>
      <p className="max-w-105 text-sm leading-5 text-light-text">{text}</p>
      {children}
    </div>
  )
}

export function Skel({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded bg-grey-150 ${className}`} />
}

export function Ring({ value, size, stroke, color, track, children, label }: { value: number; size: number; stroke: number; color: string; track: string; children?: ReactNode; label?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <span role={label ? 'img' : undefined} aria-label={label} className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        {value > 0 && <circle className="dash-ring" cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(c * Math.min(100, value)) / 100} ${c}`} />}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</span>
    </span>
  )
}

export function Bar({ pct, color, track = 'var(--color-grey-150)', label, delay = 0 }: { pct: number; color: string; track?: string; label?: string; delay?: number }) {
  return (
    <span role={label ? 'progressbar' : undefined} aria-label={label} aria-valuemin={label ? 0 : undefined} aria-valuemax={label ? 100 : undefined} aria-valuenow={label ? Math.round(pct) : undefined} className="block h-2 w-full min-w-0 shrink overflow-hidden rounded-full" style={{ background: track }}>
      <span className="fill-x block h-full rounded-full" style={{ width: `${pct}%`, background: color, animationDelay: `${delay}ms` }} />
    </span>
  )
}

export const Dot = ({ color, size = 8, hollow }: { color: string; size?: number; hollow?: boolean }) => (
  <span aria-hidden="true" className="shrink-0 rounded-full" style={{ width: size, height: size, background: hollow ? 'transparent' : color, border: hollow ? `1.5px solid ${color}` : undefined }} />
)

/** One shared round in the score history (newest first). */
export type Hist = { v: number; q: string; range: string; published: string }
