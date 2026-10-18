import { useState } from 'react'
import { CATEGORIES, category } from '../../data/dashboard'
import { Bar, Card, Dot, TextLink } from './shared'

/* ---------- Competency scores ---------- */

export function CompBar({ name, score, i }: { name: string; score: number; i: number }) {
  const pct = Math.round((score / 5) * 100)
  const c = category(pct)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span title={name} className="line-clamp-2 min-w-0 flex-1 basis-40 text-sm leading-5 font-medium text-heading">{name}</span>
        <span className="flex items-center gap-2">
          <span className="text-xs leading-4 font-medium" style={{ color: c.fg }}>{c.label}</span>
          <span className="text-sm leading-5 font-semibold text-heading">{score.toFixed(1)} / 5</span>
        </span>
      </div>
      <Bar pct={pct} color={c.color} label={`${name} score`} delay={150 + Math.min(i, 10) * 50} />
    </div>
  )
}

export function CompetencyCard({ kpis }: { kpis: [string, number][] }) {
  const [view, setView] = useState<'bars' | 'radar'>('radar')
  const [all, setAll] = useState(false)
  const sorted = [...kpis].sort((a, b) => b[1] - a[1])
  const many = kpis.length > 8
  const canRadar = kpis.length >= 3
  const showRadar = canRadar && view === 'radar'
  return (
    <Card
      id="dash-kpis"
      className="h-full"
      title="Latest Round Competency Scores"
      sub={`Q2 2026 Performance Review · ${kpis.length} competencies`}
      aside={
        <>
          {canRadar && (
            <div role="group" aria-label="Chart type" className="flex rounded-lg border border-grey-200 bg-grey-150 p-0.75">
              {(['radar', 'bars'] as const).map((v) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => setView(v)} className={`h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors ${view === v ? 'bg-white text-primary shadow-card' : 'text-light-text hover:text-body-text'}`}>
                  {v === 'radar' ? 'Radar' : 'Bars'}
                </button>
              ))}
            </div>
          )}
          <TextLink>View Full Report</TextLink>
        </>
      }
    >
      {showRadar ? (
        <Radar kpis={kpis} />
      ) : !many ? (
        sorted.map(([n, s], i) => <CompBar key={n} name={n} score={s} i={i} />)
      ) : all ? (
        <div className="classic-scroll flex max-h-110 flex-col gap-3 overflow-y-auto pr-2">{sorted.map(([n, s], i) => <CompBar key={n} name={n} score={s} i={i} />)}</div>
      ) : (
        <>
          <p className="text-xs leading-4 font-semibold text-success-dark">Strengths</p>
          {sorted.slice(0, 3).map(([n, s], i) => <CompBar key={n} name={n} score={s} i={i} />)}
          <p className="border-t border-grey-200 pt-2 text-xs leading-4 font-semibold text-danger-dark">Focus Areas</p>
          {sorted.slice(-3).reverse().map(([n, s], i) => <CompBar key={n} name={n} score={s} i={i + 3} />)}
        </>
      )}
      {!showRadar && many && (
        <button type="button" aria-expanded={all} onClick={() => setAll(!all)} className="h-9 w-fit cursor-pointer rounded-lg border border-primary bg-white px-4 text-sm font-medium text-primary hover:bg-row-hover">
          {all ? 'Show Less' : `Show All ${kpis.length} Competencies`}
        </button>
      )}
    </Card>
  )
}

export function Radar({ kpis }: { kpis: [string, number][] }) {
  const [hover, setHover] = useState<number | null>(null)
  const N = kpis.length
  const cx = 220, cy = 150, R = 88
  const pt = (i: number, r: number) => {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / N
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const
  }
  const ring = (f: number) => kpis.map((_, i) => pt(i, R * f).map((v) => v.toFixed(1)).join(',')).join(' ')
  const pts = kpis.map(([, s], i) => pt(i, (R * Math.round((s / 5) * 100)) / 100))
  const numbered = N > 8 || kpis.some(([n]) => n.length > 40)
  /* when scrolled into view the outline traces from dot to dot (clockwise from the top), then the fill fades in */
  const TRACE = 250
  const ms = (v: number) => ({ animationDelay: `${v}ms` })
  return (
    <>
      <div className="reveal relative mx-auto aspect-[440/300] w-full max-w-120">
        <svg viewBox="0 0 440 300" role="img" aria-label={`Competency scores out of 5: ${kpis.map(([n, s]) => `${n} ${s.toFixed(1)}`).join(', ')}`} className="absolute inset-0 size-full overflow-visible">
          <polygon points={ring(1)} fill="var(--color-grey-light)" stroke="var(--color-grey-200)" />
          {[0.75, 0.5, 0.25].map((f) => <polygon key={f} points={ring(f)} fill="none" stroke="var(--color-grey-200)" />)}
          {kpis.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={hover === i ? 'var(--color-primary-dark)' : 'var(--color-grey-200)'} strokeWidth={hover === i ? 1.5 : 1} strokeDasharray={hover === i ? '3 3' : undefined} /> })}
          <polygon className="rv rd-fill" style={ms(TRACE + 1100)} points={pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')} fill="color-mix(in srgb, var(--color-primary) 14%, transparent)" />
          <polygon className="rv rd-trace" pathLength={1} style={ms(TRACE)} points={pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ')} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" />
          {pts.map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={hover === i ? 7 : 4} fill={hover === i ? 'var(--color-primary-dark)' : 'var(--color-primary)'} />
              <circle cx={x} cy={y} r={hover === i ? 2.5 : 1.75} fill="var(--color-white)" />
            </g>
          ))}
        </svg>
        {kpis.map(([n, s], i) => {
          const [x, y] = pt(i, R + (numbered ? 15 : 16))
          const dx = x - cx
          const pos = { left: `${(x / 440) * 100}%`, top: `${(y / 300) * 100}%` }
          if (numbered)
            return <span key={n} aria-hidden="true" className={`absolute -mt-2.25 -ml-2.25 flex size-4.5 items-center justify-center rounded-full border text-4xs font-semibold transition-colors ${hover === i ? 'border-primary-dark bg-primary-dark text-white' : 'border-border bg-white text-body-text'}`} style={pos}>{i + 1}</span>
          const tf = dx > 8 ? 'translate(0,-50%)' : dx < -8 ? 'translate(-100%,-50%)' : y < cy ? 'translate(-50%,-100%)' : 'translate(-50%,0)'
          return (
            <span key={n} title={n} className={`absolute flex max-w-29 flex-col text-2xs leading-3.5 ${dx > 8 ? 'items-start text-left' : dx < -8 ? 'items-end text-right' : 'items-center text-center'}`} style={{ ...pos, transform: tf }}>
              <span className="line-clamp-3 font-medium text-body-text">{n}</span>
              <span className="font-semibold" style={{ color: category((s / 5) * 100).fg }}>{s.toFixed(1)}</span>
            </span>
          )
        })}
      </div>
      {numbered && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between gap-2 text-xs leading-4 text-light-text"><span className="font-semibold text-body-text">{N} competencies</span><span>Hover a name to find it on the chart</span></div>
          <div className="classic-scroll grid max-h-58 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-3 gap-y-0.5 overflow-y-auto pr-1">
            {kpis.map(([n, s], i) => (
              <div key={n} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className={`flex items-center gap-2 rounded-md px-2 py-1.25 transition-colors ${hover === i ? 'bg-row-hover' : ''}`}>
                <span className={`flex size-4.5 shrink-0 items-center justify-center rounded-full border text-4xs font-semibold ${hover === i ? 'border-primary-dark bg-primary-dark text-white' : 'border-border bg-white text-body-text'}`}>{i + 1}</span>
                <span title={n} className="min-w-0 flex-1 truncate text-xs leading-4 text-body-text">{n}</span>
                <span className="text-xs leading-4 font-semibold" style={{ color: category((s / 5) * 100).fg }}>{s.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-2xs leading-3.5 text-light-text">
        {CATEGORIES.map((c) => <span key={c.key} className="inline-flex items-center gap-1.5"><Dot color={c.color} />{c.label}</span>)}
      </div>
    </>
  )
}
