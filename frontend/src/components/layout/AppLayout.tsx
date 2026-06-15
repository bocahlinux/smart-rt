import axios from 'axios'
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  MessageSquare,
  Moon,
  ShieldAlert,
  ShieldCheck,
  Sun,
  User,
  Users,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { AnnouncementBell } from '@/components/layout/AnnouncementBell'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import { logout as logoutRequest } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

// ── Types & constants ──────────────────────────────────────────

const PENGURUS_ROLES = ['admin', 'sekretaris', 'bendahara', 'pengurus']

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  roles?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',           label: 'Beranda',    icon: LayoutDashboard },
  { to: '/users',      label: 'Pengguna',   icon: ShieldCheck,      roles: ['admin'] },
  { to: '/warga',      label: 'Warga',      icon: Users,            roles: PENGURUS_ROLES },
  { to: '/keuangan',   label: 'Keuangan',   icon: CircleDollarSign, roles: ['admin', 'bendahara', 'pengurus'] },
  { to: '/pengumuman', label: 'Pengumuman', icon: Megaphone },
  { to: '/pengaduan',  label: 'Pengaduan',  icon: ShieldAlert },
  { to: '/forum',      label: 'Forum',      icon: MessageSquare },
  { to: '/kegiatan',   label: 'Kegiatan',   icon: CalendarDays },
  { to: '/polling',    label: 'Polling',    icon: BarChart3 },
]

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', sekretaris: 'Sekretaris', bendahara: 'Bendahara',
  pengurus: 'Pengurus', warga: 'Warga',
}

// Pilih 4 item utama untuk bottom nav berdasarkan role — sisanya masuk "Lainnya"
function getPrimaryNav(visibleNav: NavItem[], isPengurus: boolean): NavItem[] {
  if (isPengurus) {
    // Pengurus: Beranda, Warga, Keuangan, Pengaduan
    const priority = ['/', '/warga', '/keuangan', '/pengaduan']
    return priority.flatMap((p) => visibleNav.filter((i) => i.to === p))
  }
  // Warga: Beranda, Pengaduan, Forum, Kegiatan
  const priority = ['/', '/pengaduan', '/forum', '/kegiatan']
  return priority.flatMap((p) => visibleNav.filter((i) => i.to === p))
}

// ── Theme toggle ───────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button type="button" onClick={onToggle}
      aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

// ── User menu (avatar → dropdown) ─────────────────────────────

function UserMenu({ onLogout }: { onLogout: () => void }) {
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) return null
  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white ring-2 ring-transparent hover:ring-primary-300 dark:hover:ring-primary-700 transition">
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* User info */}
          <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {user.email.split('@')[0]}
                </p>
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">{user.email}</p>
                <span className="mt-0.5 inline-block rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {ROLE_LABEL[user.role] ?? user.role}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1">
            <NavLink to="/profile" onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800">
              <User className="h-4 w-4 text-slate-400" />
              Profil Saya
            </NavLink>
            <button type="button" onClick={() => { setOpen(false); onLogout() }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── More drawer (mobile) ───────────────────────────────────────

function MoreDrawer({
  items,
  onClose,
  onLogout,
  theme,
  onToggleTheme,
}: {
  items: NavItem[]
  onClose: () => void
  onLogout: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}) {
  const { user } = useAuthStore()

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-safe pt-1 dark:bg-slate-900">
        {/* Drag handle */}
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 pb-3 dark:border-slate-800">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
              {user.email.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                {user.email.split('@')[0]}
              </p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="ml-auto">
              <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            </div>
          </div>
        )}

        {/* Nav grid */}
        <div className="grid grid-cols-3 gap-1 px-4 py-3">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={onClose}
              className={({ isActive }) => cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition',
                isActive
                  ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
              )}>
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Logout */}
        <div className="border-t border-slate-100 px-4 pb-6 pt-2 dark:border-slate-800">
          <button type="button" onClick={() => { onClose(); onLogout() }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}

// ── Sidebar nav item ───────────────────────────────────────────

function SidebarNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink to={item.to} end={item.to === '/'}
      className={({ isActive }) => cn(
        'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
        isActive
          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
      )}>
      {({ isActive }) => (
        <>
          <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-slate-600')} />
          {item.label}
          {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-primary-400" />}
        </>
      )}
    </NavLink>
  )
}

// ── Bottom nav item ────────────────────────────────────────────

function BottomNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink to={item.to} end={item.to === '/'}
      className={({ isActive }) => cn(
        'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
        isActive
          ? 'text-primary-600 dark:text-primary-400'
          : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
      )}>
      {({ isActive }) => (
        <>
          <item.icon className={cn('h-5 w-5', isActive && 'text-primary-600 dark:text-primary-400')} />
          {item.label}
        </>
      )}
    </NavLink>
  )
}

// ── AppLayout ──────────────────────────────────────────────────

export function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const [moreOpen, setMoreOpen] = useState(false)

  const isPengurus = user?.role ? PENGURUS_ROLES.includes(user.role) : false

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role)),
  )

  const primaryNav = getPrimaryNav(visibleNav, isPengurus)
  const primarySet = new Set(primaryNav.map((i) => i.to))
  const moreNav = visibleNav.filter((i) => !primarySet.has(i.to))

  async function handleLogout() {
    try { await logoutRequest() } catch (err) { if (!axios.isAxiosError(err)) throw err }
    finally { logout(); navigate('/login', { replace: true }) }
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="flex-1 text-base font-bold text-slate-900 dark:text-white">Smart-RT</span>
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {visibleNav.map((item) => (
              <li key={item.to}><SidebarNavItem item={item} /></li>
            ))}
          </ul>
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          {user && (
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{user.email}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[user.role] ?? user.role}</p>
              </div>
            </div>
          )}
          <button type="button" onClick={() => void handleLogout()}
            className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400">
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-900 dark:text-white">Smart-RT</span>

          <div className="ml-auto flex items-center gap-1.5">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
            <AnnouncementBell />
            <UserMenu onLogout={() => void handleLogout()} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <ul className="flex">
          {primaryNav.map((item) => (
            <li key={item.to} className="flex-1">
              <BottomNavItem item={item} />
            </li>
          ))}

          {/* More button */}
          <li className="flex-1">
            <button type="button" onClick={() => setMoreOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <LayoutGrid className="h-5 w-5" />
              Lainnya
            </button>
          </li>
        </ul>
      </nav>

      {/* More drawer */}
      {moreOpen && (
        <MoreDrawer
          items={moreNav}
          onClose={() => setMoreOpen(false)}
          onLogout={() => void handleLogout()}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      )}
    </div>
  )
}
