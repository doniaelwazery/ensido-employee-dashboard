type NavItem = { label: string; icon: string; href: string; active?: boolean }

// Employee role menu (Figma employee dashboard). Only Dashboard is built; the other items are placeholders.
const NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'nav-dashboard.svg', href: '#', active: true },
  { label: 'Organization Structure', icon: 'nav-structure.svg', href: '#' },
  { label: 'Employees', icon: 'nav-employees.svg', href: '#' },
  { label: 'Policies', icon: 'nav-policies.svg', href: '#' },
]

type SidebarProps = {
  /** Below lg the sidebar is an off-canvas drawer. */
  open?: boolean
  onClose?: () => void
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  return (
    <>
      {/* Drawer backdrop (tablet / mobile only) */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-secondary/40 transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex h-screen w-67.5 shrink-0 flex-col bg-side-menu transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:sticky lg:top-0 lg:z-auto lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex justify-center border-b border-primary-dark px-3 pt-6 pb-6.25">
        <div className="grid place-items-start">
          <img className="col-start-1 row-start-1 ml-5.25 block" src="/assets/logo-mark.svg" alt="" width={27.481} height={30.219} />
          <img className="col-start-1 row-start-1 mt-9.25 block" src="/assets/logo-word.svg" alt="ensido" width={70.418} height={16.91} />
        </div>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-x-hidden overflow-y-auto px-4 py-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          className="flex h-12 w-full shrink-0 cursor-pointer items-center gap-2 rounded-lg border-2 border-ai-accent bg-white/10 px-4 py-3 text-base leading-6 font-medium text-white shadow-ai-glow"
        >
          <img src="/assets/sparkle.svg" alt="" width={20} height={20} />
          <span>ensidoMate</span>
        </button>

        {NAV.map((item) => (
          <a
            key={item.label}
            href={item.href}
            onClick={onClose}
            aria-current={item.active ? 'page' : undefined}
            className={`flex w-full shrink-0 items-center gap-2 rounded-lg px-4 py-3 text-white ${item.active ? 'bg-primary text-base leading-6 font-medium capitalize' : 'text-sm leading-5'}`}
          >
            <img className="shrink-0" src={`/assets/${item.icon}`} alt="" width={24} height={24} />
            <span className="min-w-0 flex-1">{item.label}</span>
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-2 border-t border-primary-dark p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-dark">
          <img src="/assets/org-icon.svg" alt="" width={20} height={19} />
        </div>
        <div>
          <p className="text-xs leading-4.5 text-primary-light">Organization</p>
          <p className="text-sm leading-5 text-white">Acme Corporation</p>
        </div>
      </div>
    </aside>
    </>
  )
}
