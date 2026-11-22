import { useEffect, useRef, useState } from 'react'

export type ThemePref = 'light' | 'dark' | 'system'

type TopBarProps = {
  /** Opens the navigation drawer (below the lg breakpoint the sidebar is off-canvas). */
  onMenu?: () => void
  /** Signed-in user. */
  user: { name: string; role: string; avatar?: string }
  theme: ThemePref
  setTheme: (t: ThemePref) => void
}

export function TopBar({ onMenu, user, theme, setTheme }: TopBarProps) {
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

  return (
    <header className="sticky top-0 z-30 flex h-14 border-b border-border bg-white lg:bg-side-menu">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 bg-white px-4 sm:px-6 lg:rounded-tl-2xl">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button type="button" onClick={onMenu} aria-label="Open menu" className="-m-2 shrink-0 cursor-pointer p-2 lg:pointer-events-none">
            <img src="/assets/hamburger.svg" alt="" width={24} height={24} className="dark-invert" />
          </button>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <img src="/assets/notification.svg" alt="Notifications" width={44} height={44} className="dark-invert" />
          <div ref={ref} className="relative">
            <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="User menu" onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-2 rounded-lg">
              <span className="hidden text-right whitespace-nowrap md:block">
                <span className="block text-sm leading-5 text-body-text">{user.name}</span>
                <span className="block text-xs leading-4.5 text-light-text">{user.role}</span>
              </span>
              {user.avatar ? (
                <img className="size-10 shrink-0 rounded-lg object-cover" src={user.avatar} alt="" width={40} height={40} />
              ) : (
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-lighter text-sm font-semibold text-primary-dark">
                  {user.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}
                </span>
              )}
              <img className={`dark-invert hidden transition-transform sm:block ${open ? 'rotate-180' : ''}`} src="/assets/chevron-down.svg" alt="" width={24} height={24} />
            </button>
            {open && (
              <div role="menu" className="menu-in absolute top-[calc(100%+8px)] right-0 flex w-60 flex-col gap-2 rounded-lg border border-grey-200 bg-card p-3 shadow-tooltip">
                <span className="text-xs leading-4 font-medium text-light-text">Theme</span>
                <div role="group" aria-label="Theme" className="flex gap-0.5 rounded-lg bg-grey-150 p-0.5">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      role="menuitemradio"
                      aria-checked={theme === t}
                      onClick={() => setTheme(t)}
                      className={`h-8 flex-1 cursor-pointer rounded-md text-sm font-medium capitalize transition-colors ${theme === t ? 'bg-card text-primary shadow-card' : 'text-light-text hover:text-body-text'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
