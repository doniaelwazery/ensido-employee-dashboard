import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { category } from '../../data/dashboard'
import { Dot, type Hist, Icon, Ring, Skel } from './shared'

/* ---------- Hero ---------- */


export function Hero({ summary, tiles, history, loading, jump }: { summary: string; tiles: { label: string; value: number; hint: string; dot: string; target: string }[]; history: Hist[]; loading: boolean; jump: (id: string) => void }) {
  const latest = history[0]
  const prev = history[1]
  const cat = latest ? category(latest.v) : null
  const ringColor = cat?.key === 'exceeds' ? 'var(--color-primary-light)' : cat?.color

  /* cursor light: section-relative --mx/--my for the spotlight, tile-relative --x/--y for border glow */
  const ref = useRef<HTMLElement>(null)
  const frame = useRef(0)
  const move = (e: ReactPointerEvent<HTMLElement>) => {
    if (e.pointerType === 'touch') return
    const { clientX: x, clientY: y } = e
    cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${x - r.left}px`)
      el.style.setProperty('--my', `${y - r.top}px`)
      el.querySelectorAll<HTMLElement>('.glow-tile').forEach((t) => {
        const b = t.getBoundingClientRect()
        t.style.setProperty('--x', `${x - b.left}px`)
        t.style.setProperty('--y', `${y - b.top}px`)
      })
      el.dataset.lit = ''
    })
  }
  const leave = () => {
    cancelAnimationFrame(frame.current)
    const el = ref.current
    if (!el) return
    delete el.dataset.lit
  }
  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  return (
    <section ref={ref} onPointerMove={move} onPointerLeave={leave} aria-labelledby="hero-title" className="hero relative flex flex-col gap-7 overflow-hidden rounded-2xl bg-secondary px-8 py-7 text-white lg:flex-row lg:items-center lg:gap-10">
      <span aria-hidden="true" className="hero-aurora" />
      <span aria-hidden="true" className="hero-spot" />
      <span aria-hidden="true" className="hero-grid" />
      <svg aria-hidden="true" width="420" height="420" viewBox="0 0 420 420" fill="none" className="pointer-events-none absolute -top-37.5 -right-27.5">
        <circle cx="210" cy="210" r="200" stroke="var(--color-primary-dark)" strokeWidth="2" opacity="0.25" />
        <circle cx="210" cy="210" r="150" stroke="var(--color-primary-dark)" strokeWidth="2" opacity="0.18" />
        <circle cx="210" cy="210" r="100" stroke="var(--color-primary)" strokeWidth="2" opacity="0.14" />
        <circle cx="210" cy="210" r="50" stroke="var(--color-primary)" strokeWidth="2" opacity="0.1" />
      </svg>
      <div className="relative flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <p className="rise text-xs leading-4 text-primary-light">Monday, 12 October 2026</p>
          <h2 id="hero-title" className="rise text-display leading-9 font-bold" style={{ animationDelay: '80ms' }}>Good morning, Ahmed</h2>
          {loading ? <Skel className="my-1 h-3 w-96 max-w-full bg-white/15" /> : <p className="rise max-w-140 text-sm leading-5 text-grey-200" style={{ animationDelay: '160ms' }}>{summary}</p>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tiles.map((t, i) => (
            <button key={t.label} type="button" onClick={() => jump(t.target)} style={{ animationDelay: `${240 + i * 90}ms` }} className="glow-tile rise relative flex cursor-pointer flex-col gap-1.5 rounded-xl border border-white/15 bg-white/[0.07] px-4 py-3.5 text-left transition-colors hover:border-primary-light hover:bg-white/[0.12]">
              <span className="flex items-center gap-2 text-xs leading-4 font-medium text-primary-light">
                <Dot color={loading ? 'color-mix(in srgb, var(--color-white) 25%, transparent)' : t.dot} />
                {t.label}
              </span>
              {loading ? <Skel className="my-1 h-7 w-11 rounded-md bg-white/15" /> : <span className="text-3xl leading-9 font-bold"><CountUp value={t.value} /></span>}
              <span className="text-xs leading-4 text-grey-200">{loading ? 'Loading' : t.hint}</span>
            </button>
          ))}
        </div>
      </div>
      <TiltCard className="relative flex shrink-0 flex-col items-center justify-center gap-3.5 self-stretch rounded-panel border border-white/20 bg-white/[0.07] px-6 py-5 text-center lg:w-65">
        {loading ? (
          <span className="size-33 animate-pulse rounded-full border-12 border-white/10" />
        ) : latest && cat ? (
          <>
            <p className="text-xs leading-4 font-medium text-primary-light">Latest Result · {latest.q}</p>
            <span className="tilt-pop block">
            <Ring value={latest.v} size={140} stroke={10.6} color={ringColor!} track="color-mix(in srgb, var(--color-white) 12%, transparent)" label={`Overall score ${latest.v}% in ${latest.q} Performance Review, ${cat.label}`}>
              <span className="text-display-lg leading-9.5 font-bold"><CountUp value={latest.v} duration={1300} />%</span>
              <span className="text-2xs leading-3.5 text-primary-light">Overall score</span>
            </Ring>
            </span>
            <div className="tilt-pop-sm flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs leading-4 font-semibold" style={{ color: cat.fg }}>
                <Dot color={ringColor!} size={6} />
                {cat.label}
              </span>
              {prev ? (
                <span className="inline-flex items-center gap-1 text-xs leading-4 font-medium" style={{ color: latest.v >= prev.v ? 'var(--color-success-stroke)' : 'var(--color-danger-stroke)' }}>
                  <Icon name="up" size={12} sw={2.6} className={latest.v >= prev.v ? '' : 'rotate-180'} />
                  {latest.v >= prev.v ? '+' : ''}{latest.v - prev.v} pts since {prev.q}
                </span>
              ) : (
                <span className="text-xs leading-4 font-medium text-success-stroke">Your first shared result</span>
              )}
            </div>
            <button type="button" onClick={() => jump('dash-kpis')} className="group flex w-full cursor-pointer items-center justify-center gap-1.5 border-t border-white/10 pt-3 text-sm leading-5 font-medium">
              See My Scores <Icon name="arrow" size={14} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        ) : (
          <>
            <p className="text-xs leading-4 font-medium text-primary-light">Latest Result</p>
            <svg width="96" height="96" viewBox="0 0 96 96" aria-hidden="true" className="empty-spin"><circle cx="48" cy="48" r="38" fill="none" stroke="color-mix(in srgb, var(--color-white) 25%, transparent)" strokeWidth="8" strokeDasharray="6 8" /></svg>
            <p className="max-w-50 text-xs-plus leading-4.5 text-grey-200">Your first results will show here once a round is shared with you.</p>
          </>
        )}
      </TiltCard>
    </section>
  )
}

/** Counts up from 0 to `value` on mount (instant when the user prefers reduced motion). */
export function CountUp({ value, duration = 900 }: { value: number; duration?: number }) {
  const [n, setN] = useState(() => (matchMedia('(prefers-reduced-motion: reduce)').matches ? value : 0))
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setN(value)
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / duration)) // rAF time can precede `start`
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return <>{n}</>
}

/** Card that tilts toward the pointer like a physical card, with a glare that follows it. */
export function TiltCard({ className, children }: { className: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el || e.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    el.style.setProperty('--ry', `${(x - 0.5) * 16}deg`)
    el.style.setProperty('--rx', `${(0.5 - y) * 16}deg`)
    el.style.setProperty('--gx', `${x * 100}%`)
    el.style.setProperty('--gy', `${y * 100}%`)
    el.dataset.active = ''
  }
  const leave = () => {
    const el = ref.current
    if (!el) return
    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
    delete el.dataset.active
  }
  return (
    <div ref={ref} onPointerMove={move} onPointerLeave={leave} className={`tilt ${className}`}>
      <span aria-hidden="true" className="tilt-glare" />
      {children}
    </div>
  )
}
