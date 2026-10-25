import { useState } from 'react'
import { type Scenario } from '../../data/dashboard'

/* ---------- prototype controls ---------- */

export function Controls({ scenario, setScenario, loading, reload, fail, setFail, many, setMany }: { scenario: Scenario; setScenario: (s: Scenario) => void; loading: boolean; reload: () => void; fail: boolean; setFail: (v: boolean) => void; many: boolean; setMany: (v: boolean) => void }) {
  const opts: [Scenario, string][] = [['typical', 'Typical'], ['new', 'New Employee'], ['busy', 'Heavy Use'], ['first', 'First Round']]
  const [open, setOpen] = useState(false)
  return (
    <div role="region" aria-label="Prototype controls" className="fixed right-4 bottom-4 z-40 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
      <div className="menu-in flex w-85 max-w-full flex-col items-start gap-3 rounded-lg bg-secondary p-4 text-sm leading-5 text-white shadow-tooltip">
      <span className="font-medium">Data scenario</span>
      <div role="group" aria-label="Data scenario" className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">
        {opts.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={scenario === id} onClick={() => setScenario(id)} className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors ${scenario === id ? 'bg-primary text-white' : 'text-primary-light hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>
      <button type="button" onClick={reload} className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-primary-light px-4 font-medium hover:bg-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7" /><path d="M20 4v7h-7" /></svg>
        Reload Dashboard
      </button>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} className="size-4 accent-primary" /> Notifications fail to load
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input type="checkbox" checked={many} onChange={(e) => setMany(e.target.checked)} className="size-4 accent-primary" /> 22 competencies
      </label>
      <span role="status" className="text-xs leading-4 text-primary-light">{loading ? 'Loading data…' : 'Try the notifications, goal filters, timeline markers and the chart toggle.'}</span>
      </div>
      )}
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-10 cursor-pointer items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-white shadow-tooltip hover:bg-primary-dark">
        <span className="rounded bg-primary-dark px-2 py-0.5 text-xs leading-4">Prototype</span>
        {open ? 'Hide' : 'Scenarios'}
      </button>
    </div>
  )
}
