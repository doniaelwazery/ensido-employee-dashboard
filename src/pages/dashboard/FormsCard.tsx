import { useEffect, useState } from 'react'
import { type DashRound } from '../../data/dashboard'
import { Bar, Chip, Empty, Icon, Ring, Skel, TextLink } from './shared'

/* ---------- Evaluation forms ---------- */

export const NOW = new Date(2026, 9, 12, 9, 30, 0).getTime()

export function useCountdown(days: number | undefined) {
  const [t0] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const i = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(i)
  }, [])
  if (days == null) return null
  const left = Math.max(0, new Date(2026, 9, 12 + days, 23, 59, 59).getTime() - (NOW + now - t0))
  const pad = (x: number) => String(x).padStart(2, '0')
  const dd = Math.floor(left / 86400000), hh = Math.floor(left / 3600000) % 24, mm = Math.floor(left / 60000) % 60, ss = Math.floor(left / 1000) % 60
  return { units: [[pad(dd), 'days'], [pad(hh), 'hours'], [pad(mm), 'mins'], [pad(ss), 'secs']] as const, label: `${dd} days ${hh} hours left` }
}

export function FormsCard({ rounds, loading, pendingTotal }: { rounds: DashRound[]; loading: boolean; pendingTotal: number }) {
  const open = rounds.filter((x) => x.forms > x.submitted)
  const spot = open[0]
  const rest = rounds.filter((x) => x !== spot)
  const formsTotal = rounds.reduce((s, x) => s + x.forms, 0)
  const subTotal = rounds.reduce((s, x) => s + x.submitted, 0)
  const cd = useCountdown(spot?.days)
  const urgent = !!spot && spot.days <= 3
  const st = urgent ? { bg: 'var(--color-danger-bg)', border: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)', accent: 'var(--color-danger)' } : { bg: 'var(--color-row-hover)', border: 'var(--color-primary-light)', fg: 'var(--color-primary-dark)', accent: 'var(--color-primary)' }
  const marks = open.filter((x) => x.days <= 30)
  const [tip, setTip] = useState<number | null>(null)
  const date = (s: string) => s.replace(',', '')
  return (
    <section id="dash-forms" aria-labelledby="forms-title" aria-busy={loading} className="flex min-w-0 scroll-mt-20 flex-col overflow-hidden rounded-panel border border-primary-light bg-card shadow-focus-card">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-primary-lighter bg-row-hover px-6 py-4.5">
        <div className="flex min-w-0 items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary shadow-primary"><Icon name="clip" size={22} color="var(--color-white)" /></span>
          <span className="flex min-w-0 flex-col">
            <span className="flex flex-wrap items-center gap-2">
              <h3 id="forms-title" className="text-lg leading-6.5 font-bold text-heading">Evaluation Forms to Fill</h3>
              {!loading && pendingTotal > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-xs leading-4 font-medium text-white">{pendingTotal} pending</span>}
            </span>
            <span className="text-xs-plus leading-4.5 text-light-text">{loading ? 'Loading your rounds' : pendingTotal ? 'Your teammates are waiting on your feedback.' : 'You are all caught up.'}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          {!loading && formsTotal > 0 && (
            <span className="flex items-center gap-2.5">
              <Ring value={(subTotal / formsTotal) * 100} size={40} stroke={4.4} color="var(--color-primary)" track="var(--color-primary-lighter)" />
              <span className="flex flex-col">
                <span className="text-sm leading-4.5 font-bold text-heading">{subTotal} / {formsTotal}</span>
                <span className="text-2xs leading-3.5 text-light-text">forms submitted</span>
              </span>
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 pt-4 pb-6">
        {loading ? (
          [0, 1].map((i) => <Skel key={i} className="h-21 rounded-lg" />)
        ) : rounds.length === 0 ? (
          <Empty icon="clip" title="No Open Evaluations" text="There is no evaluation round running for you right now. When a round opens, its forms will appear here with their deadline." />
        ) : (
          <>
            {pendingTotal === 0 && (
              <div role="status" className="flex items-center gap-3 rounded-lg border border-success-stroke bg-success-bg px-4 py-3 text-sm leading-5 font-medium text-success-dark">
                <Icon name="check" size={18} color="var(--color-success)" sw={2.4} />
                All your forms are submitted. Rounds stay listed here until they close.
              </div>
            )}

            {spot && cd && (
              <div className="relative flex flex-col gap-5 overflow-hidden rounded-xl border p-5" style={{ background: st.bg, borderColor: st.border }}>
                <svg aria-hidden="true" width="220" height="220" viewBox="0 0 220 220" fill="none" className="pointer-events-none absolute -top-22.5 -right-17.5 opacity-50">
                  <circle cx="110" cy="110" r="100" stroke={st.border} strokeWidth="2" />
                  <circle cx="110" cy="110" r="70" stroke={st.border} strokeWidth="2" />
                </svg>
                <div className="relative flex flex-wrap items-center gap-5">
                  <div className="flex min-w-60 flex-1 flex-col gap-2">
                    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border bg-white px-2.5 py-0.5 text-xs leading-4 font-semibold" style={{ borderColor: st.border, color: st.fg }}>
                      <span className="relative flex size-1.5"><span className="absolute inset-0 animate-ping rounded-full" style={{ background: st.accent }} /><span className="relative size-1.5 rounded-full" style={{ background: st.accent }} /></span>
                      {urgent ? 'Due Soon' : 'Next Due'}
                    </span>
                    <span className="text-lg leading-6.5 font-bold text-heading">{spot.title}</span>
                    <span className="text-xs-plus leading-4.5 text-body-text">Deadline {date(spot.deadline)} · {spot.forms - spot.submitted} of {spot.forms} forms left</span>
                    <Bar pct={(spot.submitted / spot.forms) * 100} color={st.accent} track="var(--color-white)" label={`${spot.title} forms submitted`} />
                  </div>
                  <div role="timer" aria-label={`${cd.label} until ${spot.title} closes`} className="flex gap-2">
                    {cd.units.map(([v, l]) => (
                      <span key={l} className="flex w-13.5 flex-col items-center rounded-tile border bg-white py-2 shadow-sm" style={{ borderColor: st.border }}>
                        <span className="text-display-sm leading-7 font-bold tabular-nums" style={{ color: st.fg }}>{v}</span>
                        <span className="text-3xs leading-3 text-light-text">{l}</span>
                      </span>
                    ))}
                  </div>
                </div>
                <button type="button" aria-label={`Continue filling ${spot.forms - spot.submitted} pending forms for ${spot.title}`} className="group relative flex h-11 cursor-pointer items-center justify-center gap-2.5 rounded-tile bg-primary text-sm font-semibold text-white shadow-primary-lg transition-colors hover:bg-primary-dark">
                  Continue Filling Forms
                  <span className="min-w-5.5 rounded-full bg-white px-1.75 text-xs leading-5.5 font-bold text-primary">{spot.forms - spot.submitted}</span>
                  <Icon name="arrow" className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            )}

            {marks.length > 0 && (
              <div className="flex flex-col gap-1.5 rounded-tile border border-grey-200 bg-grey-light px-5 pt-3.5 pb-3">
                <div className="flex flex-wrap justify-between gap-2 text-xs leading-4 text-light-text">
                  <span className="font-semibold text-body-text">Deadlines in the Next 30 Days</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-1 w-4 rounded-full bg-danger-stroke" />Due within 3 days</span>
                </div>
                <div role="img" aria-label={`Upcoming deadlines: ${open.map((x) => `${x.title} in ${x.days} days`).join(', ')}`} className="relative mx-4 h-19">
                  <span className="absolute inset-x-0 top-11 h-1 rounded-full bg-grey-200" />
                  <span className="fill-x absolute top-11 left-0 h-1 w-[10%] rounded-full bg-danger-stroke" />
                  {[23.33, 46.67, 70].map((p) => <span key={p} className="absolute top-12.5 h-1.5 w-px bg-border" style={{ left: `${p}%` }} />)}
                  <span className="absolute top-10 -left-1.5 size-3 rounded-full border-2 border-white bg-secondary" />
                  {marks.map((x, i) => {
                    const u = x.days <= 3
                    const c = u ? 'var(--color-danger)' : 'var(--color-primary)'
                    return (
                      <button key={x.title} type="button" aria-label={`${x.title}, due ${date(x.deadline)}, ${x.forms - x.submitted} forms pending`} onMouseEnter={() => setTip(i)} onMouseLeave={() => setTip(null)} onFocus={() => setTip(i)} onBlur={() => setTip(null)} className="absolute top-0 -ml-9 flex w-18 cursor-pointer flex-col items-center" style={{ left: `${Math.max(3, Math.min(97, (x.days / 30) * 100))}%`, zIndex: tip === i ? 20 : 10 - i }}>
                        {tip === i && (
                          <span className="menu-in absolute bottom-[calc(100%+8px)] left-1/2 flex -translate-x-1/2 flex-col gap-0.5 rounded-lg bg-secondary px-3 py-2 text-left text-2xs leading-3.5 whitespace-nowrap text-white shadow-tooltip">
                            <span className="font-semibold">{x.title}</span>
                            <span className="text-primary-light">{x.forms - x.submitted} forms pending · due {date(x.deadline)}</span>
                          </span>
                        )}
                        <span className="relative size-7.5">
                          {u && <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-60" />}
                          <span className="absolute inset-0 flex items-center justify-center rounded-full border-2 border-white text-3xs font-semibold text-white shadow-tooltip" style={{ background: c }}>{x.days}d</span>
                        </span>
                        <span className="h-3 w-0.5 opacity-50" style={{ background: c }} />
                        <span className="-mt-0.5 box-content size-2 rounded-full border-2 border-white" style={{ background: c }} />
                        <span className="mt-2 text-2xs leading-3.5 font-medium whitespace-nowrap text-body-text">{date(x.deadline).replace(/ \d{4}$/, '')}</span>
                      </button>
                    )
                  })}
                </div>
                <div className="relative mx-4 h-3.5 text-2xs leading-3.5 text-light-text">
                  {[[0, 'Today'], [23.33, '1 week'], [46.67, '2 weeks'], [70, '3 weeks'], [100, '11 Nov']].map(([p, l]) => <span key={l} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${p}%` }}>{l}</span>)}
                </div>
              </div>
            )}

            {spot && rest.length > 0 && <p className="-mb-1.5 text-xs leading-4 font-semibold text-light-text">Also Open</p>}
            {rest.slice(0, 3).map((x) => {
              const pending = x.forms - x.submitted
              const done = pending === 0
              const u = !done && x.days <= 3
              const chip = done ? { bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)', fg: 'var(--color-success-dark)' } : u ? { bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)' } : { bg: 'var(--color-info-bg)', stroke: 'var(--color-info-stroke)', fg: 'var(--color-info-dark)' }
              return (
                <div key={x.title} className={`flex flex-wrap items-center gap-4 rounded-tile border p-4 transition-colors hover:bg-grey-light ${u ? 'border-danger-stroke bg-danger-surface' : 'border-grey-200 bg-white'}`}>
                  <div className="flex min-w-65 flex-1 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm leading-5 font-semibold text-heading">{x.title}</span>
                      <Chip tone={chip}>{done ? 'All submitted' : u ? `Due in ${x.days} days` : `${x.days} days left`}</Chip>
                    </div>
                    <span className="text-xs leading-4 text-light-text">Deadline {date(x.deadline)} · {x.forms} forms · {pending} pending</span>
                    <div className="flex items-center gap-3">
                      <Bar pct={(x.submitted / x.forms) * 100} color={done ? 'var(--color-success)' : u ? 'var(--color-danger)' : 'var(--color-primary)'} label={`${x.title} forms submitted`} />
                      <span className="text-xs leading-4 whitespace-nowrap text-body-text">{x.submitted} of {x.forms} submitted</span>
                    </div>
                  </div>
                  {done ? (
                    <button type="button" className="ml-auto flex h-9 min-w-37 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 text-sm font-medium whitespace-nowrap text-primary transition-colors hover:bg-body-bg">
                      <Icon name="eye" />
                      Review Forms
                    </button>
                  ) : (
                    <button type="button" aria-label={`Fill ${pending} pending forms for ${x.title}`} className="group ml-auto flex h-9 min-w-37 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary pr-3 pl-4 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-primary-dark">
                      Fill Forms
                      <span className="min-w-5 rounded-full bg-white px-1.5 text-xs leading-5 font-semibold text-primary">{pending}</span>
                      <Icon name="arrow" className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  )}
                </div>
              )
            })}
            {rest.length > 3 && <TextLink>View {rest.length - 3} More Round{rest.length - 3 === 1 ? '' : 's'}</TextLink>}
          </>
        )}
      </div>
    </section>
  )
}
