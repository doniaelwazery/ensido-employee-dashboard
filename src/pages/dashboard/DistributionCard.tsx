import { CATEGORIES, category } from '../../data/dashboard'
import { Card, type Hist } from './shared'

/* ---------- Category distribution ---------- */

export function DistributionCard({ history }: { history: Hist[] }) {
  const counts = CATEGORIES.map((c) => ({ c, n: history.filter((h) => category(h.v).key === c.key).length }))
  const total = history.length
  const r = 40, C = 2 * Math.PI * r
  let acc = 0
  return (
    <Card title="Score Category Distribution" sub={`Across your ${total} shared rounds`} gap="gap-3">
      <div className="flex flex-wrap items-center gap-x-7 gap-y-5">
        <span className="relative size-33 shrink-0">
          <svg width="132" height="132" viewBox="0 0 100 100" role="img" aria-label={`Score categories across ${total} rounds: ${counts.map(({ c, n }) => `${c.label} ${n}`).join(', ')}`} className="-rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-grey-150)" strokeWidth="13" />
            {counts.map(({ c, n }) => {
              if (!n) return null
              const len = (n / total) * C
              const seg = <circle key={c.key} className="dash-ring" cx="50" cy="50" r={r} fill="none" stroke={c.color} strokeWidth="13" strokeDasharray={`${Math.max(0, len - (n < total ? 2 : 0))} ${C}`} strokeDashoffset={-acc} />
              acc += len
              return seg
            })}
          </svg>
          <span className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-display leading-7.5 font-bold text-heading">{total}</span>
            <span className="text-2xs leading-3.5 text-light-text">rounds</span>
          </span>
        </span>
        <div className="flex min-w-50 flex-1 flex-col gap-2.5">
          {counts.map(({ c, n }) => (
            <div key={c.key} className="flex items-center gap-2.5 text-xs leading-4">
              <span className="size-2.5 shrink-0 rounded-swatch" style={{ background: c.color }} />
              <span className="min-w-0 flex-1 text-body-text">{c.label}</span>
              <span className="font-semibold text-heading">{n}</span>
              <span className="w-9 text-right text-light-text">{Math.round((n / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
