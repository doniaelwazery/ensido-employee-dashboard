type TopBarProps = {
  /** Opens the navigation drawer (below the lg breakpoint the sidebar is off-canvas). */
  onMenu?: () => void
  /** Signed-in user. */
  user: { name: string; role: string; avatar: string }
}

export function TopBar({ onMenu, user }: TopBarProps) {
  return (
    <header className="sticky top-0 z-10 flex h-14 border-b border-border bg-white lg:bg-side-menu">
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 bg-white px-4 sm:px-6 lg:rounded-tl-2xl">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <button type="button" onClick={onMenu} aria-label="Open menu" className="-m-2 shrink-0 cursor-pointer p-2 lg:pointer-events-none">
            <img src="/assets/hamburger.svg" alt="" width={24} height={24} />
          </button>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-2">
          <img src="/assets/notification.svg" alt="Notifications" width={44} height={44} />
          <div className="flex items-center gap-2">
            <div className="hidden text-right whitespace-nowrap md:block">
              <p className="text-sm leading-5 text-body-text">{user.name}</p>
              <p className="text-xs leading-4.5 text-light-text">{user.role}</p>
            </div>
            <img className="size-10 shrink-0 rounded-lg object-cover" src={user.avatar} alt={user.name} width={40} height={40} />
            <img className="hidden sm:block" src="/assets/chevron-down.svg" alt="" width={24} height={24} />
          </div>
        </div>
      </div>
    </header>
  )
}
