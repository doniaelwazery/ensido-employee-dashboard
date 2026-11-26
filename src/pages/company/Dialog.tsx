import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type PATHS } from '../dashboard/shared'

type Tone = 'primary' | 'warning' | 'danger'
const TONES: Record<Tone, { bg: string; stroke: string; fg: string; btn: string }> = {
  primary: { bg: 'var(--color-row-hover)', stroke: 'var(--color-primary-light)', fg: 'var(--color-primary)', btn: 'bg-primary hover:bg-primary-dark' },
  warning: { bg: 'var(--color-warning-bg)', stroke: 'var(--color-warning-stroke)', fg: 'var(--color-warning-fg)', btn: 'bg-primary hover:bg-primary-dark' },
  danger: { bg: 'var(--color-danger-bg)', stroke: 'var(--color-danger-stroke)', fg: 'var(--color-danger)', btn: 'bg-danger hover:brightness-90' },
}

/** Confirmation dialog: icon, title, body, optional extra field, Cancel + confirm. Esc / backdrop close it. */
export function Dialog({ icon, tone = 'primary', title, children, confirm, onConfirm, onClose, disabled }: { icon: keyof typeof PATHS; tone?: Tone; title: string; children: ReactNode; confirm: string; onConfirm: () => void; onClose: () => void; disabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('input, button[data-confirm]')?.focus()
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      prev?.focus()
    }
  }, [onClose])
  const t = TONES[tone]
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-secondary/50" />
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="dlg-title" className="menu-in relative flex w-110 max-w-full flex-col gap-5 rounded-xl bg-card p-6 shadow-tooltip">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border" style={{ background: t.bg, borderColor: t.stroke }}>
            <Icon name={icon} size={20} color={t.fg} />
          </span>
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 id="dlg-title" className="text-lg leading-6.5 font-semibold text-heading">{title}</h2>
            <div className="text-sm leading-5 text-body-text">{children}</div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="h-10 cursor-pointer rounded-lg border border-border bg-white px-4 text-sm font-medium text-body-text transition-colors hover:bg-grey-light">Cancel</button>
          <button type="button" data-confirm onClick={onConfirm} disabled={disabled} className={`h-10 cursor-pointer rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${t.btn}`}>{confirm}</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

export function Toast({ text }: { text: string | null }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
      {text && (
        <span className="menu-in flex items-center gap-2.5 rounded-lg bg-secondary px-4 py-3 text-sm leading-5 text-white shadow-tooltip">
          <Icon name="check" size={16} color="var(--color-success)" sw={2.6} />
          {text}
        </span>
      )}
    </div>
  )
}
