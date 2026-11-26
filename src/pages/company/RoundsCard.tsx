import { useEffect, useRef, useState } from 'react'
import { Bar, Chip, Empty, Icon, Skel, TextLink, progressColor } from '../dashboard/shared'

/** One active round as the dashboard shows it (already scoped to the company or the manager's teams). */
export type RoundVM = {
  id: string
  title: string
  covered: string
  started: string
  deadline: string
  due: number
  forms: number
  submitted: number
  pending: number
  pct: number
  participants: number
  evaluators: number
  reminded: string | null
}
export type RoundActions = { remind: (r: RoundVM) => void; edit: (r: RoundVM) => void; end: (r: RoundVM) => void; cancel: (r: RoundVM) => void }

export const dueText = (d: number) => (d < 0 ? `Overdue by ${-d} day${d === -1 ? '' : 's'}` : d === 0 ? 'Due today' : d <= 3 ? `Due in ${d} day${d === 1 ? '' : 's'}` : `${d} days left`)
export const dueTone = (r: RoundVM) =>
  r.pending === 0
    ? { bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)', fg: 'var(--color-success-dark)' }
    : r.due <= 3
      ? { bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)' }
      : r.due <= 10
        ? { bg: 'var(--color-warning-bg)', stroke: 'var(--color-warning-stroke)', fg: 'var(--color-warning-fg)' }
        : { bg: 'var(--color-info-bg)', stroke: 'var(--color-info-stroke)', fg: 'var(--color-info-dark)' }
const fmt = (n: number) => n.toLocaleString('en-US')

export function RoundsCard({ rounds, loading, admin, team, actions, error, onRetry }: { rounds: RoundVM[]; loading: boolean; admin: boolean; team: boolean; actions: RoundActions; error?: boolean; onRetry?: () => void }) {
  const spot = rounds[0]
  const rest = rounds.slice(1)
  const [all, setAll] = useState(false)
  const shown = all ? rest : rest.slice(0, 3)
  const formsTotal = rounds.reduce((s, r) => s + r.forms, 0)
  const subTotal = rounds.reduce((s, r) => s + r.submitted, 0)
  const sub = loading ? 'Loading rounds' : error ? 'Rounds could not load' : rounds.length === 0 ? 'No rounds running' : `${rounds.length} round${rounds.length === 1 ? '' : 's'} running, most urgent first${team ? ' · your teams only' : ''}`

  return (
    <section id="co-rounds" aria-labelledby="co-rounds-title" aria-busy={loading} className="flex min-w-0 scroll-mt-20 flex-col overflow-hidden rounded-panel border border-primary-light bg-card shadow-focus-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-primary-lighter bg-row-hover px-6 py-4.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-primary"><Icon name="clip" size={22} color="var(--color-white)" /></span>
          <span className="flex min-w-0 flex-col">
            <h3 id="co-rounds-title" className="text-lg leading-6.5 font-bold text-heading">Active Evaluation Rounds</h3>
            <span className="text-xs-plus leading-4.5 text-light-text">{sub}</span>
          </span>
        </div>
        {!loading && !error && rounds.length > 0 && (
          <div className="flex items-center gap-5">
            <span className="flex flex-col items-end">
              <span className="text-sm leading-4.5 font-bold text-heading">{fmt(subTotal)} / {fmt(formsTotal)}</span>
              <span className="text-2xs leading-3.5 text-light-text">forms submitted</span>
            </span>
            <span aria-hidden="true" className="h-8 w-px bg-primary-lighter" />
            <TextLink arrow>View All Rounds</TextLink>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 px-6 pt-4 pb-6">
        {loading ? (
          [0, 1, 2].map((i) => <Skel key={i} className={`${i ? 'h-21' : 'h-44'} rounded-lg`} />)
        ) : error ? (
          <div role="alert">
            <Empty icon="alert" tone="grey" title="Could Not Load Active Rounds" text="Something went wrong. Please try again. The rest of the dashboard is still up to date.">
              <button type="button" onClick={onRetry} className="mt-2 h-9 cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-body-bg">Try Again</button>
            </Empty>
          </div>
        ) : !spot ? (
          <Empty icon="clip" title="No Active Rounds" text={admin ? 'Start a round to collect evaluations from your teams. Its progress shows here until it closes.' : 'No running round includes your teams right now. When one opens, its progress shows here.'}>
            {admin && (
              <button type="button" className="mt-2 flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
                <Icon name="plus" /> Start Evaluation Round
              </button>
            )}
          </Empty>
        ) : (
          <>
            <Spotlight r={spot} admin={admin} team={team} actions={actions} />
            {rest.length > 0 && <p className="-mb-1.5 text-xs leading-4 font-semibold text-light-text">Also Running</p>}
            {shown.map((r) => <Row key={r.id} r={r} admin={admin} actions={actions} />)}
            {rest.length > 3 && (
              <TextLink onClick={() => setAll(!all)}>{all ? 'Show Less' : `Show ${rest.length - 3} More Round${rest.length - 3 === 1 ? '' : 's'}`}</TextLink>
            )}
          </>
        )}
      </div>
    </section>
  )
}

function Spotlight({ r, admin, team, actions }: { r: RoundVM; admin: boolean; team: boolean; actions: RoundActions }) {
  const done = r.pending === 0
  const overdue = r.due < 0
  const urgent = !done && r.due <= 3
  const st = done
    ? { bg: 'var(--color-success-bg)', border: 'var(--color-success-stroke)', fg: 'var(--color-success-dark)', accent: 'var(--color-success)' }
    : urgent
      ? { bg: 'var(--color-danger-bg)', border: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)', accent: 'var(--color-danger)' }
      : { bg: 'var(--color-row-hover)', border: 'var(--color-primary-light)', fg: 'var(--color-primary-dark)', accent: 'var(--color-primary)' }
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-xl border p-5" style={{ background: st.bg, borderColor: st.border }}>
      <svg aria-hidden="true" width="220" height="220" viewBox="0 0 220 220" fill="none" className="pointer-events-none absolute -top-22.5 -right-17.5 opacity-50">
        <circle cx="110" cy="110" r="100" stroke={st.border} strokeWidth="2" />
        <circle cx="110" cy="110" r="70" stroke={st.border} strokeWidth="2" />
      </svg>
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 basis-80 flex-col gap-2">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs leading-4 font-semibold" style={{ borderColor: st.border, color: st.fg }}>
            <span className="relative flex size-1.5">
              {urgent && <span className="absolute inset-0 animate-ping rounded-full" style={{ background: st.accent }} />}
              <span className="relative size-1.5 rounded-full" style={{ background: st.accent }} />
            </span>
            {done ? 'All Forms Submitted' : overdue ? dueText(r.due) : urgent ? dueText(r.due) : 'Next Deadline'}
          </span>
          <span className="text-lg leading-6.5 font-bold text-heading">{r.title}</span>
          <span className="text-xs-plus leading-4.5 text-body-text">Covered period {r.covered} · Started {r.started} · Deadline {r.deadline}</span>
        </div>
        {admin && <RoundMenu r={r} actions={actions} />}
      </div>

      <div className="relative flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3 text-xs leading-4">
          <span className="text-body-text">{fmt(r.submitted)} of {fmt(r.forms)} forms submitted</span>
          <span className="font-semibold text-heading">{r.pct}%</span>
        </div>
        <Bar pct={r.pct} color={progressColor(r.pct)} track="var(--color-card)" label={`${r.title} forms submitted`} />
      </div>

      <dl className="relative grid grid-cols-3 gap-3">
        {[
          ['Participants', fmt(r.participants)],
          ['Pending forms', fmt(r.pending)],
          [team ? 'Your evaluators waiting' : 'Evaluators waiting', fmt(r.evaluators)],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 rounded-tile border bg-white px-3 py-2.5" style={{ borderColor: st.border }}>
            <dt className="text-2xs leading-3.5 text-light-text">{k}</dt>
            <dd className="text-lg leading-6.5 font-bold text-heading">{v}</dd>
          </div>
        ))}
      </dl>

      {overdue && !done && (
        <p className="relative flex items-start gap-2 rounded-lg border border-danger-stroke bg-white px-3 py-2.5 text-xs-plus leading-4.5 text-danger-dark">
          <Icon name="alert" size={16} color="var(--color-danger)" className="mt-px" />
          {admin
            ? 'The deadline has passed and the round is still open. Evaluators can keep submitting until you edit the deadline or end the round.'
            : 'The deadline has passed and the round is still open. Your admin decides when it ends.'}
        </p>
      )}

      <div className="relative flex flex-wrap items-center gap-3">
        {done ? (
          admin ? (
            <button type="button" onClick={() => actions.end(r)} className="flex h-10 cursor-pointer items-center gap-2 rounded-tile bg-primary px-4 text-sm font-semibold text-white shadow-primary-lg transition-colors hover:bg-primary-dark">End Round</button>
          ) : null
        ) : (
          <button type="button" onClick={() => actions.remind(r)} className="flex h-10 cursor-pointer items-center gap-2 rounded-tile bg-primary px-4 text-sm font-semibold text-white shadow-primary-lg transition-colors hover:bg-primary-dark">
            <Icon name="bell" /> Remind Evaluators
          </button>
        )}
        <button type="button" className="flex h-10 cursor-pointer items-center gap-1.5 rounded-tile px-2 text-sm font-medium text-primary hover:text-primary-dark">View Details <Icon name="arrow" size={14} /></button>
        <span className="ml-auto text-xs leading-4 text-light-text">{done ? 'Ready to close' : r.reminded ? `Last reminded ${r.reminded}` : 'No reminders sent yet'}</span>
      </div>
    </div>
  )
}

function Row({ r, admin, actions }: { r: RoundVM; admin: boolean; actions: RoundActions }) {
  const done = r.pending === 0
  const u = !done && r.due <= 3
  return (
    <div className={`flex flex-wrap items-center gap-4 rounded-tile border p-4 transition-colors hover:bg-grey-light ${u ? 'border-danger-stroke bg-danger-surface' : 'border-grey-200 bg-white'}`}>
      <div className="flex min-w-0 flex-1 basis-65 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm leading-5 font-semibold text-heading">{r.title}</span>
          <Chip tone={dueTone(r)}>{done ? 'All submitted' : dueText(r.due)}</Chip>
        </div>
        <span className="text-xs leading-4 text-light-text">Deadline {r.deadline} · {fmt(r.participants)} participants · {done ? 'Ready to close' : r.reminded ? `Last reminded ${r.reminded}` : 'No reminders sent yet'}</span>
        <div className="flex items-center gap-3">
          <Bar pct={r.pct} color={progressColor(r.pct)} label={`${r.title} forms submitted`} />
          <span className="text-xs leading-4 whitespace-nowrap text-body-text">{fmt(r.submitted)} of {fmt(r.forms)} · {r.pct}%</span>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {done ? (
          admin && <button type="button" onClick={() => actions.end(r)} className="flex h-9 cursor-pointer items-center rounded-lg border border-primary bg-white px-4 text-sm font-medium whitespace-nowrap text-primary transition-colors hover:bg-body-bg">End Round</button>
        ) : (
          <button type="button" onClick={() => actions.remind(r)} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary bg-white px-4 text-sm font-medium whitespace-nowrap text-primary transition-colors hover:bg-body-bg">
            <Icon name="bell" size={15} /> Remind
          </button>
        )}
        {admin && <RoundMenu r={r} actions={actions} />}
      </div>
    </div>
  )
}

function RoundMenu({ r, actions }: { r: RoundVM; actions: RoundActions }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const off = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const key = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', off)
    document.addEventListener('keydown', key)
    return () => {
      document.removeEventListener('mousedown', off)
      document.removeEventListener('keydown', key)
    }
  }, [open])
  const item = 'flex w-full cursor-pointer items-center px-3 py-2 text-left text-sm leading-5 hover:bg-row-hover'
  const pick = (fn: (r: RoundVM) => void) => () => {
    setOpen(false)
    fn(r)
  }
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={`More actions for ${r.title}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-grey-200 bg-white text-body-text transition-colors hover:border-primary-light hover:text-primary">
        <Icon name="more" size={18} sw={2.6} />
      </button>
      {open && (
        <div role="menu" className="menu-in absolute top-[calc(100%+6px)] right-0 z-20 flex w-48 flex-col overflow-hidden rounded-lg border border-grey-200 bg-card py-1 shadow-tooltip">
          {/* every running round has the same three actions, whatever its state */}
          <button type="button" role="menuitem" onClick={pick(actions.edit)} className={`${item} text-body-text`}>Edit Round</button>
          <button type="button" role="menuitem" onClick={pick(actions.end)} className={`${item} text-body-text`}>End Round</button>
          <span className="my-1 h-px bg-grey-200" />
          <button type="button" role="menuitem" onClick={pick(actions.cancel)} className={`${item} text-danger`}>Cancel Round</button>
        </div>
      )}
    </div>
  )
}
