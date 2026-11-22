import { useState } from 'react'
import { dayStr, unitCompletion, type Joiner, type OverdueEvaluator, type SetupStep } from '../../data/company'
import { Card, Chip, Empty, Icon, Ring, Skel, TextLink, progressColor } from '../dashboard/shared'
import { Avatar } from './ResultsCard'
import { type RoundVM } from './RoundsCard'

/* ---------- Needs Your Attention ---------- */

export type Sev = 'critical' | 'warning' | 'info'
export type AttentionItem = { id: string; sev: Sev; text: string; meta: string; action: string; onAction: () => void; primary?: boolean }
const SEV: Record<Sev, { label: string; bg: string; stroke: string; fg: string; dot: string }> = {
  critical: { label: 'Critical', bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger-dark)', dot: 'var(--color-danger)' },
  warning: { label: 'Warning', bg: 'var(--color-warning-bg)', stroke: 'var(--color-warning-stroke)', fg: 'var(--color-warning-fg)', dot: 'var(--color-warning)' },
  info: { label: 'Info', bg: 'var(--color-info-bg)', stroke: 'var(--color-info-stroke)', fg: 'var(--color-info-dark)', dot: 'var(--color-info)' },
}

export function AttentionCard({ items, loading }: { items: AttentionItem[]; loading: boolean }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, 4)
  return (
    <Card id="co-attention" busy={loading} title={<>Needs Your Attention{!loading && items.length > 0 && <span className={`rounded-full px-2 py-0.5 text-xs leading-4 font-medium text-white ${items.some((i) => i.sev === 'critical') ? 'bg-danger' : 'bg-primary'}`}>{items.length}</span>}</>} sub={loading ? undefined : items.length ? 'Most urgent first' : undefined} gap="gap-3">
      {loading ? (
        [0, 1, 2, 3].map((i) => <Skel key={i} className="h-19 rounded-lg" />)
      ) : items.length === 0 ? (
        <Empty icon="check" title="All Clear" text="Nothing needs your action right now. New issues with rounds, results or setup show up here." />
      ) : (
        <>
          {shown.map((a) => {
            const s = SEV[a.sev]
            return (
              <div key={a.id} className="flex flex-col gap-2.5 rounded-tile border p-3.5" style={{ borderColor: a.sev === 'critical' ? s.stroke : 'var(--color-grey-200)', background: a.sev === 'critical' ? 'var(--color-danger-surface)' : 'var(--color-card)' }}>
                <div className="flex items-start gap-2.5">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ background: s.dot }} />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-sm leading-5 text-heading">{a.text}</p>
                    <span className="flex flex-wrap items-center gap-2 text-xs leading-4 text-light-text">
                      <Chip tone={s}>{s.label}</Chip>
                      {a.meta}
                    </span>
                  </div>
                </div>
                <div className="flex justify-end">
                  {a.primary ? (
                    <button type="button" onClick={a.onAction} className="h-8 cursor-pointer rounded-lg bg-primary px-3.5 text-xs-plus font-medium text-white transition-colors hover:bg-primary-dark">{a.action}</button>
                  ) : (
                    <TextLink arrow onClick={a.onAction}>{a.action}</TextLink>
                  )}
                </div>
              </div>
            )
          })}
          {items.length > 4 && <TextLink onClick={() => setAll(!all)}>{all ? 'Show Less' : `Show ${items.length - 4} More`}</TextLink>}
        </>
      )}
    </Card>
  )
}

/* ---------- Finish Setting Up (Super Admin, until every step is done) ---------- */

export function SetupCard({ steps, canHide, onHide }: { steps: SetupStep[]; canHide: boolean; onHide: () => void }) {
  const done = steps.filter((s) => s.done >= s.total).length
  const pct = Math.round((done / steps.length) * 100)
  const next = steps.find((s) => s.done < s.total)
  return (
    <Card id="co-setup" title="Finish Setting Up" sub={`${done} of ${steps.length} steps complete`} aside={canHide && <TextLink onClick={onHide}>Hide for Now</TextLink>} gap="gap-4">
      <div className="flex items-center gap-4">
        <Ring value={pct} size={56} stroke={6} color={progressColor(pct)} track="var(--color-grey-150)" label={`Setup ${pct}% complete`}>
          <span className="text-xs leading-4 font-bold text-heading">{pct}%</span>
        </Ring>
        <p className="text-xs-plus leading-4.5 text-body-text">Rounds stay accurate when every employee has a manager, a job title and competencies.</p>
      </div>
      <ol className="flex flex-col">
        {steps.map((s) => {
          const ok = s.done >= s.total
          const prog = !ok && s.done > 0
          return (
            <li key={s.name} className="flex items-center gap-3 border-t border-grey-200 py-2.5">
              <span className={`flex size-5.5 shrink-0 items-center justify-center rounded-full border ${ok ? 'border-success bg-success' : prog ? 'border-warning bg-warning-bg' : 'border-border bg-white'}`}>
                {ok && <Icon name="check" size={12} color="var(--color-white)" sw={3} />}
                {prog && <span className="size-2 rounded-full bg-warning" />}
              </span>
              <span className={`min-w-0 flex-1 text-sm leading-5 ${ok ? 'text-light-text' : 'font-medium text-heading'}`}>{s.name}</span>
              <span className="text-xs leading-4 text-light-text">{ok ? 'Completed' : prog ? `${s.done} of ${s.total}` : 'Not started'}</span>
            </li>
          )
        })}
      </ol>
      {next && (
        <button type="button" className="group flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
          Continue: {next.name} <Icon name="arrow" size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}
    </Card>
  )
}

/* ---------- Recently Joined ---------- */

export function JoinersCard({ joiners, loading, admin, you }: { joiners: Joiner[]; loading: boolean; admin: boolean; you: { name: string; role: string } }) {
  return (
    <Card title="Recently Joined" aside={joiners.length > 0 && !loading && <TextLink>View All Employees</TextLink>} gap="gap-1" busy={loading}>
      {loading ? (
        [0, 1, 2, 3].map((i) => <Skel key={i} className="my-1.5 h-9" />)
      ) : joiners.length === 0 ? (
        <>
          <div className="flex items-center gap-3 py-2">
            <Avatar name={you.name} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm leading-5 font-medium text-heading">{you.name}</span>
              <span className="text-xs leading-4 text-light-text">{you.role} · joined today</span>
            </span>
            <Chip tone={{ bg: 'var(--color-row-hover)', stroke: 'var(--color-primary-light)', fg: 'var(--color-primary-dark)' }}>You</Chip>
          </div>
          <p className="border-t border-grey-200 pt-3 text-sm leading-5 text-light-text">You are the only one here so far. Add or import your team to start evaluating.</p>
          {admin && (
            <button type="button" className="mt-2 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary transition-colors hover:bg-body-bg">
              <Icon name="plus" /> Add Employees
            </button>
          )}
        </>
      ) : (
        joiners.map((j) => (
          <div key={j.name} className="flex items-center gap-3 border-t border-grey-200 py-2.5 first:border-t-0">
            <Avatar name={j.name} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm leading-5 font-medium text-heading">{j.name}</span>
              <span className="truncate text-xs leading-4 text-light-text">{j.job}</span>
            </span>
            <span className="flex flex-col items-end gap-0.5">
              {j.joined > -14 && <Chip tone={{ bg: 'var(--color-success-bg)', stroke: 'var(--color-success-stroke)', fg: 'var(--color-success-dark)' }}>New</Chip>}
              <span className="text-2xs leading-3.5 text-light-text">{dayStr(j.joined, false)}</span>
            </span>
          </div>
        ))
      )}
    </Card>
  )
}

/* ---------- Overdue Evaluators ---------- */

export function OverdueCard({ people, rounds, team, reminded, onRemind, onRemindAll }: { people: OverdueEvaluator[]; rounds: RoundVM[]; team: boolean; reminded: Record<string, boolean>; onRemind: (p: OverdueEvaluator) => void; onRemindAll: (ps: OverdueEvaluator[]) => void }) {
  const live = people.filter((p) => p.rounds.some((id) => rounds.some((r) => r.id === id)))
  const left = live.filter((p) => !reminded[p.id])
  const forms = live.reduce((s, p) => s + p.forms, 0)
  return (
    <Card
      id="co-evaluators"
      title="Evaluators With Most Pending Forms"
      sub={live.length ? `${live.length} people hold ${forms} pending forms across active rounds` : undefined}
      aside={left.length > 0 && <button type="button" onClick={() => onRemindAll(left)} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary bg-white px-3.5 text-sm font-medium text-primary transition-colors hover:bg-body-bg"><Icon name="bell" size={15} /> Remind All ({left.length})</button>}
      gap="gap-2"
    >
      {live.length === 0 ? (
        <Empty icon="check" title="Everyone Is on Track" text="No evaluator has pending forms in the active rounds." />
      ) : (
        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-140 text-left text-sm leading-5">
            <thead>
              <tr className="text-xs leading-4 text-light-text">
                <th scope="col" className="py-2 font-medium">Evaluator</th>
                <th scope="col" className="py-2 font-medium">Pending</th>
                <th scope="col" className="py-2 font-medium">Waiting since</th>
                {!team && <th scope="col" className="py-2 font-medium">Manager</th>}
                <th scope="col" className="py-2 text-right font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {live.map((p) => {
                const age = -p.since
                const n = p.rounds.filter((id) => rounds.some((r) => r.id === id)).length
                return (
                  <tr key={p.id} className="border-t border-grey-200">
                    <td className="py-2.5">
                      <span className="flex items-center gap-3">
                        <Avatar name={p.name} size={32} />
                        <span className="flex flex-col">
                          <span className="font-medium text-heading">{p.name}</span>
                          <span className="text-xs leading-4 text-light-text">{p.unit}</span>
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span className="font-semibold" style={{ color: p.forms >= 8 ? 'var(--color-danger-dark)' : 'var(--color-heading)' }}>{p.forms} forms</span>
                      <span className="block text-xs leading-4 text-light-text">in {n} round{n === 1 ? '' : 's'}</span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap" style={{ color: age >= 10 ? 'var(--color-danger-dark)' : 'var(--color-body-text)' }}>{dayStr(p.since, false)} · {age} days</td>
                    {!team && <td className="py-2.5 whitespace-nowrap text-body-text">{p.manager}</td>}
                    <td className="py-2.5 text-right">
                      {reminded[p.id] ? (
                        <span className="inline-flex items-center gap-1.5 text-xs leading-4 font-medium text-success-dark"><Icon name="check" size={14} sw={2.6} /> Reminded</span>
                      ) : (
                        <button type="button" onClick={() => onRemind(p)} className="h-8 cursor-pointer rounded-lg px-3 text-xs-plus font-medium text-primary hover:bg-row-hover">Remind</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

/* ---------- Completion by Department / Team ---------- */

export function CompletionCard({ rounds, team }: { rounds: RoundVM[]; team: boolean }) {
  const [id, setId] = useState(rounds[0]?.id)
  const r = rounds.find((x) => x.id === id) ?? rounds[0]
  if (!r) return null
  const units = unitCompletion(r.id, team)
  const word = team ? 'Team' : 'Department'
  return (
    <Card
      title={`Completion by ${word}`}
      sub="Share of forms submitted"
      aside={
        rounds.length > 1 && (
          <select aria-label="Round" value={r.id} onChange={(e) => setId(e.target.value)} className="h-9 max-w-56 cursor-pointer truncate rounded-lg border border-border bg-white px-3 text-sm leading-5 font-medium text-heading">
            {rounds.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}
          </select>
        )
      }
      gap="gap-3"
    >
      <div role="img" aria-label={`Forms submitted by ${word.toLowerCase()} in ${r.title}: ${units.map(([n, v]) => `${n} ${v}%`).join(', ')}`} className="flex flex-col gap-2">
        <div className="relative h-44">
          {[0, 25, 50, 75, 100].map((g) => <span key={g} aria-hidden="true" className="absolute inset-x-0 border-t border-dashed border-grey-200" style={{ bottom: `${g}%` }} />)}
          <div className="absolute inset-0 flex items-end gap-2 px-1 sm:gap-3">
            {units.map(([n, v], i) => (
              <div key={`${r.id}-${n}`} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                <span className="mb-1 text-xs leading-4 font-semibold text-heading">{v}%</span>
                <span className="grow-y block w-full max-w-11 rounded-t-md" style={{ height: `${(v / 100) * 82}%`, background: progressColor(v), animationDelay: `${i * 60}ms` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 px-1 sm:gap-3">
          {units.map(([n]) => <span key={n} className="min-w-0 flex-1 text-center text-2xs leading-3.5 [overflow-wrap:anywhere] text-body-text">{n}</span>)}
        </div>
      </div>
      <p className="border-t border-grey-200 pt-3 text-xs leading-4 text-light-text">{r.title} · {r.pct}% overall · deadline {r.deadline}</p>
    </Card>
  )
}
