import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { DashboardPage } from './pages/DashboardPage'

// Signed-in employee (prototype). In production this comes from the session.
const EMPLOYEE_USER = { name: 'Ahmed Samy', role: 'Employee', avatar: '/assets/avatar-ahmed.png' }

export default function App() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setNavOpen(true)} user={EMPLOYEE_USER} />
        <main className="page-in flex-1 px-4 pb-10 sm:px-6">
          <DashboardPage />
        </main>
        <footer className="py-7.5 text-center text-sm leading-5 text-primary-dark">© Ensido 2026 - All Rights Reserved</footer>
      </div>
    </div>
  )
}
