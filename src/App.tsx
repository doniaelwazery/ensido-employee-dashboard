import { useEffect, useState } from 'react'
import { PageTitle } from './components/PageTitle'
import { Sidebar } from './components/Sidebar'
import { TopBar, type ThemePref } from './components/TopBar'
import { USERS, type Role } from './data/company'
import { CompanyDashboardPage } from './pages/CompanyDashboardPage'
import { DashboardPage } from './pages/DashboardPage'
import { Icon } from './pages/dashboard/shared'

// Signed-in user (prototype). In production role + user come from the session.
// Employees only have My Dashboard; Managers and Super Admins switch between My Dashboard and Company Dashboard.
// Shareable links: ?role=employee|manager|admin&view=my|company&scenario=…
type View = 'my' | 'company'
const ROLES: [Role, string][] = [['admin', 'Super Admin'], ['manager', 'Manager'], ['employee', 'Employee']]

export default function App() {
  const [navOpen, setNavOpen] = useState(false)
  const q = new URLSearchParams(location.search)
  const [role, setRoleRaw] = useState<Role>(() => (ROLES.some(([r]) => r === q.get('role')) ? (q.get('role') as Role) : 'admin'))
  const [view, setViewRaw] = useState<View>(() => (q.get('view') === 'my' ? 'my' : 'company'))
  const sync = (r: Role, v: View) => {
    const u = new URL(location.href)
    u.searchParams.set('role', r)
    if (r === 'employee') u.searchParams.delete('view')
    else u.searchParams.set('view', v)
    history.replaceState(null, '', u)
  }
  const setRole = (r: Role) => {
    setRoleRaw(r)
    sync(r, view)
  }
  const setView = (v: View) => {
    setViewRaw(v)
    sync(role, v)
    window.scrollTo({ top: 0 })
  }
  // Theme: Light / Dark / System (avatar menu). Remembered per browser; ?theme=dark opens it directly.
  const [theme, setThemeRaw] = useState<ThemePref>(() => {
    const t = q.get('theme') ?? (() => { try { return localStorage.getItem('ensido-theme') } catch { return null } })()
    return t === 'dark' || t === 'system' ? t : 'light'
  })
  const setTheme = (t: ThemePref) => {
    setThemeRaw(t)
    try { localStorage.setItem('ensido-theme', t) } catch { /* storage unavailable */ }
  }
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => { document.documentElement.dataset.theme = theme === 'system' ? (mq.matches ? 'dark' : 'light') : theme }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  const user = USERS[role]
  const company = role !== 'employee' && view === 'company'

  const rolePicker = (
    <>
      <span className="font-medium">Signed in as</span>
      <div role="group" aria-label="Role" className="flex flex-wrap gap-1 rounded-lg bg-white/10 p-1">
        {ROLES.map(([id, label]) => (
          <button key={id} type="button" aria-pressed={role === id} onClick={() => setRole(id)} className={`h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors ${role === id ? 'bg-primary text-white' : 'text-primary-light hover:text-white'}`}>
            {label}
          </button>
        ))}
      </div>
    </>
  )

  // Ensido DS tabs (same as the manager dashboard in Figma): underline row, 4px primary bar on the active tab
  const tabs =
    role === 'employee' ? undefined : (
      <div role="tablist" aria-label="Dashboards" className="mb-6 flex overflow-x-auto border-b border-grey-200">
        {([['my', 'My Dashboard'], ['company', 'Company Dashboard']] as const).map(([v, l]) => {
          const on = view === v
          return (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setView(v)}
              className={`-mb-px shrink-0 cursor-pointer border-b-4 px-6 py-2.5 text-base leading-6 whitespace-nowrap transition-colors ${on ? 'border-primary font-medium text-primary' : 'border-transparent text-light-text hover:text-body-text'}`}
            >
              {l}
            </button>
          )
        })}
      </div>
    )

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setNavOpen(true)} user={user} theme={theme} setTheme={setTheme} />
        <main className="page-in flex-1 px-4 pb-10 sm:px-6">
          <PageTitle
            title="Dashboard"
            aside={
              company && role === 'admin' && (
                <button type="button" className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium whitespace-nowrap text-white transition-colors hover:bg-primary-dark">
                  <Icon name="plus" /> Start Evaluation Round
                </button>
              )
            }
          />
          {tabs}
          {company ? (
            <CompanyDashboardPage key={role} role={role as Exclude<Role, 'employee'>} rolePicker={rolePicker} />
          ) : (
            <DashboardPage key={role} name={user.name.split(' ')[0]} rolePicker={rolePicker} />
          )}
        </main>
        <footer className="py-7.5 text-center text-sm leading-5 text-primary-dark">© Ensido 2026 - All Rights Reserved</footer>
      </div>
    </div>
  )
}
