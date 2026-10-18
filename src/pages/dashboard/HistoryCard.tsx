import { useState } from 'react'
import { category } from '../../data/dashboard'
import { Card, Chip, type Hist, TextLink } from './shared'

/* ---------- Score history ---------- */

export function HistoryCard({ history }: { history: Hist[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const chrono = [...history].reverse()
  const n = chrono.length
  const W = 560, yBot = 170
  const yFor = (v: number) => yBot - (Math.max(50, Math.min(100, v)) - 50) * 3
  const pts = chrono.map((h, i) => [n > 1 ? Math.round(60 + (i * 470) / (n - 1)) : 295, Math.round(yFor(h.v))] as const)
  const line = pts.map((p) => p.join(',')).join(' ')
  const area = `${line} ${pts[n - 1][0]},${yBot} ${pts[0][0]},${yBot}`
  /* build-up timing: the line draws at constant speed and each dot pops the moment the line reaches it */
  const START = 250, DRAW = 1800
  const seg = pts.map((p, i) => (i ? Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0))
  const total = seg.reduce((a, b) => a + b, 0) || 1
  const reach = seg.map((_, i) => START + (seg.slice(0, i + 1).reduce((a, b) => a + b, 0) / total) * DRAW)
  return (
    <Card className="h-full" title="Score History" aside={<TextLink>All Reports</TextLink>}>
      <div className="relative">
        <svg viewBox={`0 0 ${W} 200`} role="img" aria-label={`Overall score by round, oldest to newest: ${chrono.map((h) => `${h.q} ${h.v}%`).join(', ')}`} className="reveal block h-auto w-full">
          {[20, 50, 80, 110, 140, 170].map((y) => <line key={y} x1="44" x2="550" y1={y} y2={y} stroke="var(--color-grey-200)" />)}
          {[[100, 24], [80, 84], [60, 144]].map(([v, y]) => <text key={v} x="36" y={y} textAnchor="end" fontSize="11" fill="var(--color-light-text)">{v}%</text>)}
          <polygon className="hist-area" points={area} fill="color-mix(in srgb, var(--color-primary) 8%, transparent)" style={{ animationDelay: `${START + DRAW - 200}ms` }} />
          <polyline className="hist-line" pathLength={1} points={line} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ animationDelay: `${START}ms`, animationDuration: `${DRAW}ms` }} />
          {pts.map(([x, y], i) => (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-pointer">
              <circle cx={x} cy={y} r="14" fill="transparent" />
              <circle className="hist-ripple" cx={x} cy={y} r="5" fill="none" stroke="var(--color-primary)" strokeWidth="2" style={{ animationDelay: `${reach[i]}ms` }} />
              <circle className="hist-dot" cx={x} cy={y} r={hover === i ? 6 : 4} fill="var(--color-white)" stroke="var(--color-primary)" strokeWidth="2.5" style={{ animationDelay: `${reach[i] - 60}ms` }} />
            </g>
          ))}
          <text x="60" y="192" fontSize="11" fill="var(--color-light-text)">{chrono[0].q}</text>
          <text x="530" y="192" textAnchor="end" fontSize="11" fill="var(--color-light-text)">{chrono[n - 1].q}</text>
        </svg>
        {hover != null && (
          <div className="menu-in pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-secondary px-3 py-2 whitespace-nowrap text-white shadow-tooltip" style={{ left: `${(pts[hover][0] / W) * 100}%`, top: `${(pts[hover][1] / 200) * 100}%`, marginTop: -12 }}>
            <p className="text-xs leading-4 font-semibold">{chrono[hover].q} Performance Review</p>
            <p className="text-2xs leading-3.5 text-primary-light">{chrono[hover].v}% · {category(chrono[hover].v).label}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col">
        {history.slice(0, 4).map((h) => {
          const c = category(h.v)
          return (
            <a key={h.q} href="#" onClick={(e) => e.preventDefault()} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-grey-200 py-2.5 transition-colors hover:bg-grey-light">
              <span className="flex min-w-0 flex-1 basis-48 flex-col">
                <span className="text-sm leading-5 font-medium text-heading">{h.q} Performance Review</span>
                <span className="text-xs leading-4 text-light-text">{h.range} · published {h.published}</span>
              </span>
              <Chip tone={{ bg: c.bg, fg: c.fg, dot: c.color }} dot>{c.label}</Chip>
              <span className="w-11 text-right text-sm leading-5 font-semibold text-heading">{h.v}%</span>
            </a>
          )
        })}
        {history.length > 4 && <div className="border-t border-grey-200 pt-2.5"><TextLink>View All {history.length} Reports</TextLink></div>}
      </div>
    </Card>
  )
}
