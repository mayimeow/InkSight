import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  PenTool,
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
  { path: '/', label: 'Rubric Builder', icon: PenTool },
  { path: '/ingestion', label: 'Ingestion Hub', icon: Inbox },
  { path: '/queue', label: 'Processing Queue', icon: ListChecks },
  { path: '/analytics', label: 'Analytics Dashboard', icon: BarChart3 },
  { path: '/performance', label: 'System Performance', icon: Gauge },
]

const bottomItems = [
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
  { path: '/help', label: 'Help & Support', icon: HelpCircle },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user, signOut } = useAuth()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email
  const initials = (user?.user_metadata?.full_name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const confirmLogout = async () => {
    setShowLogoutConfirm(false)
    await signOut()
  }

  const linkClasses = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-150 ${
      isActive
        ? 'bg-white/12 text-white font-semibold shadow-sm'
        : 'text-white/65 hover:bg-white/8 hover:text-white'
    }`

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          overflow-hidden bg-[#2a0509] text-white flex flex-col w-72 h-screen
          fixed top-0 left-0 z-50 transition-transform duration-200
          md:static md:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Geometric backdrop, matching the login page */}
        <svg
          className="absolute inset-0 w-full h-full opacity-40 pointer-events-none"
          viewBox="0 0 400 1000"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="sidebar-g1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4a0e14" />
              <stop offset="100%" stopColor="#2a0509" />
            </linearGradient>
          </defs>
          <rect width="400" height="1000" fill="url(#sidebar-g1)" />
          <polygon points="0,0 250,0 120,220 0,180" fill="#5C0F1A" opacity="0.6" />
          <polygon points="250,0 400,0 400,300 200,220" fill="#7a1620" opacity="0.45" />
          <polygon points="0,500 220,460 150,780 0,750" fill="#5C0F1A" opacity="0.35" />
          <polygon points="220,460 400,520 400,850 260,780" fill="#3d0c10" opacity="0.6" />
          <line x1="120" y1="220" x2="250" y2="220" stroke="#C9A227" strokeWidth="1" opacity="0.25" />
          <line x1="150" y1="780" x2="260" y2="780" stroke="#C9A227" strokeWidth="1" opacity="0.25" />
        </svg>

        {/* Header */}
        <div className="relative flex items-center justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-2.5">
            <PenTool size={24} className="text-white" />
            <span className="text-lg font-bold tracking-wide">InkSight</span>
          </div>
          <button className="md:hidden text-white/70 hover:text-white" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <div className="relative mx-6 h-px bg-white/10 mb-5" />

        {/* Main nav */}
        <nav className="relative flex flex-col gap-1 px-4 flex-1">
          <p className="px-3.5 text-[10px] font-semibold tracking-widest text-white/40 uppercase mb-2">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink key={item.path} to={item.path} onClick={onClose} className={linkClasses}>
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom nav */}
        <div className="relative px-4 pb-2">
          <div className="mx-2 h-px bg-white/10 mb-3" />
          <nav className="flex flex-col gap-1">
            {bottomItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink key={item.path} to={item.path} onClick={onClose} className={linkClasses}>
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>
        </div>

        {/* User card */}
        <div className="relative m-4 mt-2 p-3.5 rounded-xl bg-white/8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{displayName}</p>
              {user?.user_metadata?.full_name && (
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium text-white/80 hover:text-white bg-white/5 hover:bg-white/12 rounded-lg py-2 transition-colors"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 bg-black/40 z-60 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-gray-800 mb-2">Log out of InkSight?</h3>
            <p className="text-sm text-gray-500 mb-6">
              You'll need to log in again to access your assignments and submissions.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-ink-maroon text-white rounded-lg py-2 text-sm font-semibold hover:bg-ink-maroon-dark transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}