import { NavLink } from 'react-router-dom'
import {
  PenLine,
  Inbox,
  ListChecks,
  BarChart3,
  Gauge,
  Settings as SettingsIcon,
  HelpCircle,
  X,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', label: 'Rubric Builder', icon: PenLine },
  { path: '/ingestion', label: 'Ingestion Hub', icon: Inbox },
  { path: '/queue', label: 'Processing Queue', icon: ListChecks },
  { path: '/analytics', label: 'Analytics Dashboard', icon: BarChart3 },
  { path: '/performance', label: 'System Performance', icon: Gauge },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()

  return (
    <>
      {/* Backdrop - mobile only, shown when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          bg-ink-maroon text-white flex flex-col p-4 w-64 h-screen
          fixed top-0 left-0 z-50 transition-transform duration-200
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between mb-8 px-2">
          <div className="flex items-center gap-2 text-xl font-bold">
            <PenLine size={22} />
            InkSight
          </div>
          <button className="md:hidden" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive ? 'bg-ink-maroon-dark font-semibold' : 'hover:bg-ink-maroon-dark/60'
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        <NavLink
          to="/help"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              isActive ? 'bg-ink-maroon-dark font-semibold' : 'hover:bg-ink-maroon-dark/60'
            }`
          }
        >
          <HelpCircle size={18} />
          Help & Support
        </NavLink>

        <div className="border-t border-white/10 mt-2 pt-3 px-2">
          <p className="text-xs text-white/60 truncate mb-2">{user?.email}</p>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
          >
            <LogOut size={16} /> Log Out
          </button>
        </div>
      </aside>
    </>
  )
}