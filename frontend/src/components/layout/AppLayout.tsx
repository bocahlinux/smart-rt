import axios from 'axios'
import {
  BarChart3,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  Home,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Megaphone,
  MessageSquare,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  User as UserIcon,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { AnnouncementBell } from '@/components/layout/AnnouncementBell'
import { useTheme } from '@/hooks/useTheme'
import { hasPerm } from '@/lib/permissions'
import { cn } from '@/lib/utils'
import { logout as logoutRequest } from '@/services/authService'
import apiClient from '@/services/apiClient'
import { listPengajuanTambah, listPengajuanHapus, listPengajuanUbah } from '@/services/kartuKeluargaService'
import { useAuthStore } from '@/stores/authStore'
import type { User } from '@/types/auth'

// ── Types & constants ──────────────────────────────────────────

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  /** Tampilkan hanya untuk role persis ini */
  roles?: string[]
  /** Tampilkan jika user memiliki salah satu permission ini */
  permAny?: string[]
}

const NAV_ITEMS: NavItem[] = [
  { to: '/',             label: 'Beranda',        icon: LayoutDashboard },
  { to: '/warga',        label: 'Warga',          icon: Users,             permAny: ['tambah_edit_warga', 'verifikasi_warga', 'export_import_warga'] },
  { to: '/keuangan',     label: 'Keuangan',       icon: CircleDollarSign },
  { to: '/pengumuman',   label: 'Pengumuman',     icon: Megaphone },
  { to: '/pengaduan',    label: 'Pengaduan',      icon: ShieldAlert },
  { to: '/forum',        label: 'Forum',          icon: MessageSquare },
  { to: '/kegiatan',     label: 'Kegiatan',       icon: CalendarDays },
  { to: '/polling',      label: 'Polling',        icon: BarChart3 },
  // Khusus warga
  { to: '/kk/saya',      label: 'Kartu Keluarga', icon: Home,              roles: ['warga'] },
  { to: '/iuran/upload', label: 'Iuran Saya',     icon: Wallet,            roles: ['warga'] },
  { to: '/pengajuan',    label: 'Pengajuan',      icon: ClipboardList,     roles: ['warga'] },
  // Manajemen KK untuk pengurus/admin
  { to: '/pengajuan',    label: 'Pengajuan KK',   icon: ClipboardList,     permAny: ['kelola_kartu_keluarga'] },
  // Admin-only (disendirikan ke bawah)
  { to: '/users',        label: 'Pengguna',       icon: ShieldCheck,       roles: ['admin'] },
  { to: '/permissions',  label: 'Izin Role',      icon: Settings2,         roles: ['admin'] },
]

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', ketua_rt: 'Ketua RT', sekretaris: 'Sekretaris',
  bendahara: 'Bendahara', pengurus: 'Pengurus', warga: 'Warga',
}

function isNavVisible(item: NavItem, user: User | null): boolean {
  if (!user) return false
  if (user.role === 'admin') {
    if (item.roles && !item.roles.includes('admin')) return false
    return true
  }
  if (user.role === 'ketua_rt') {
    if (item.roles) return false
    if (item.permAny) return item.permAny.some((p) => hasPerm(user, p))
    return true
  }
  if (item.roles) return item.roles.includes(user.role)
  if (item.permAny) return item.permAny.some((p) => hasPerm(user, p))
  return true
}

function getPrimaryNav(visibleNav: NavItem[], user: User | null): NavItem[] {
  const isPengurus = user?.role !== 'warga'
  if (isPengurus) {
    const priority = ['/', '/warga', '/keuangan', '/pengaduan']
    return priority.flatMap((p) => visibleNav.filter((i) => i.to === p))
  }
  const priority = ['/', '/kk/saya', '/iuran/upload', '/pengaduan']
  return priority.flatMap((p) => visibleNav.filter((i) => i.to === p))
}

// ── Theme toggle ───────────────────────────────────────────────

function ThemeToggle({ theme, onToggle }: { theme: 'light' | 'dark'; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}

// ── User menu (avatar → dropdown) — mobile only ────────────────

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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu akun"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white ring-2 ring-transparent transition hover:ring-primary-300 dark:hover:ring-primary-700"
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3.5 dark:border-slate-800">
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
          <div className="py-1">
            <NavLink
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <UserIcon className="h-4 w-4 text-slate-400" />
              Profil Saya
            </NavLink>
            <button
              type="button"
              onClick={() => { setOpen(false); onLogout() }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
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
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white pb-safe pt-1 dark:bg-slate-900">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
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
        <div className="grid grid-cols-3 gap-1 px-4 py-3">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-medium transition',
                  isActive
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('h-5 w-5', isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </div>
        <div className="border-t border-slate-100 px-4 pb-6 pt-2 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { onClose(); onLogout() }}
            className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </>
  )
}

// ── Sidebar nav item ───────────────────────────────────────────

function SidebarNavItem({ item, collapsed, badge }: { item: NavItem; collapsed?: boolean; badge?: number }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150',
          collapsed ? 'justify-center px-2.5' : 'gap-3 px-3',
          isActive
            ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-400'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && !collapsed && (
            <span className="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-primary-600 dark:bg-primary-400" />
          )}
          <div className="relative shrink-0">
            <item.icon
              className={cn(
                'h-4.5 w-4.5 transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200',
              )}
            />
            {!!badge && badge > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-0.5 text-[9px] font-bold text-white">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
          {!collapsed && !!badge && badge > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Bottom nav item ────────────────────────────────────────────

function BottomNavItem({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
          isActive
            ? 'text-primary-600 dark:text-primary-400'
            : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300',
        )
      }
    >
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
  const [pendingIuranCount, setPendingIuranCount] = useState(0)
  const [pendingPengajuanCount, setPendingPengajuanCount] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try { return localStorage.getItem('sidebar-collapsed') === 'true' } catch { return false }
  })

  useEffect(() => {
    if (!hasPerm(user ?? null, 'konfirmasi_iuran')) return
    apiClient.get<{ status: string; data: { count: number } }>('/iuran/pending-count/')
      .then((res) => setPendingIuranCount(res.data.data.count))
      .catch(() => {/* silent */})
  }, [user])

  useEffect(() => {
    if (!hasPerm(user ?? null, 'kelola_kartu_keluarga')) return
    Promise.all([
      listPengajuanTambah('pending'),
      listPengajuanHapus('pending'),
      listPengajuanUbah('pending'),
    ])
      .then(([a, b, c]) => setPendingPengajuanCount(a.length + b.length + c.length))
      .catch(() => {/* silent */})
  }, [user])

  function toggleSidebar() {
    setSidebarCollapsed((v) => {
      const next = !v
      try { localStorage.setItem('sidebar-collapsed', String(next)) } catch {}
      return next
    })
  }

  const visibleNav = NAV_ITEMS.filter((item) => isNavVisible(item, user ?? null))

  // Split into main nav and admin-only nav
  const mainNav = visibleNav.filter((i) => !i.roles?.includes('admin'))
  const adminNav = visibleNav.filter((i) => i.roles?.includes('admin'))

  const primaryNav = getPrimaryNav(visibleNav, user ?? null)
  const primarySet = new Set(primaryNav.map((i) => i.to))
  const moreNav = visibleNav.filter((i) => !primarySet.has(i.to))

  async function handleLogout() {
    try { await logoutRequest() } catch (err) { if (!axios.isAxiosError(err)) throw err }
    finally { logout(); navigate('/login', { replace: true }) }
  }

  const initials = user?.email.slice(0, 2).toUpperCase() ?? ''
  const username = user?.email.split('@')[0] ?? ''

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">

      {/* ── Desktop Sidebar ─────────────────────────────────── */}
      <aside className={cn(
        'hidden flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950',
        'lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex',
        'transition-[width] duration-200 ease-in-out',
        sidebarCollapsed ? 'w-[72px]' : 'w-64',
      )}>

        {/* Brand area + collapse toggle */}
        <div className={cn(
          'flex h-14 shrink-0 items-center border-b border-slate-100 dark:border-slate-800/80',
          sidebarCollapsed ? 'justify-between px-2' : 'gap-3 px-3',
        )}>
          {sidebarCollapsed ? (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Perluas sidebar"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 shadow-sm">
                <Building2 className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">Smart-RT</p>
                <p className="text-[10px] font-medium leading-snug text-slate-400 dark:text-slate-500">
                  Sistem Informasi RT
                </p>
              </div>
              <div className="flex items-center gap-0.5">
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <AnnouncementBell dropdownClassName="left-0" />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  title="Perkecil sidebar"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* Main items */}
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <SidebarNavItem
                key={item.label}
                item={item}
                collapsed={sidebarCollapsed}
                badge={
                  item.to === '/keuangan' && hasPerm(user ?? null, 'konfirmasi_iuran') ? pendingIuranCount
                  : item.to === '/pengajuan' && hasPerm(user ?? null, 'kelola_kartu_keluarga') ? pendingPengajuanCount
                  : undefined
                }
              />
            ))}
          </div>

          {/* Admin section */}
          {adminNav.length > 0 && (
            <div className="mt-5">
              {sidebarCollapsed ? (
                <div className="mb-2 border-t border-slate-200 dark:border-slate-700" />
              ) : (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-600">
                  Administrasi
                </p>
              )}
              <div className="space-y-0.5">
                {adminNav.map((item) => (
                  <SidebarNavItem key={item.to} item={item} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User + logout + collapse toggle */}
        <div className="shrink-0 border-t border-slate-100 p-3 dark:border-slate-800">
          {user && (
            <NavLink
              to="/profile"
              title={sidebarCollapsed ? username : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg transition-colors',
                  sidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-500/10'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                    {initials}
                  </div>
                  {!sidebarCollapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <p className={cn(
                          'truncate text-sm font-semibold leading-snug',
                          isActive ? 'text-primary-700 dark:text-primary-400' : 'text-slate-800 dark:text-slate-100',
                        )}>
                          {username}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-primary-50 px-1.5 py-px text-[10px] font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                          {ROLE_LABEL[user.role] ?? user.role}
                        </span>
                      </div>
                      <ChevronRight className={cn(
                        'h-3.5 w-3.5 shrink-0',
                        isActive ? 'text-primary-400' : 'text-slate-300 dark:text-slate-600',
                      )} />
                    </>
                  )}
                </>
              )}
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            title={sidebarCollapsed ? 'Keluar' : undefined}
            className={cn(
              'mt-1 flex w-full items-center rounded-lg text-sm font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/20 dark:hover:text-red-400',
              sidebarCollapsed ? 'justify-center p-2' : 'gap-2.5 px-3 py-2',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!sidebarCollapsed && 'Keluar'}
          </button>

        </div>
      </aside>

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className={cn(
        'flex min-w-0 flex-1 flex-col',
        'transition-[margin-left] duration-200 ease-in-out',
        sidebarCollapsed ? 'lg:ml-18' : 'lg:ml-64',
      )}>
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

      {/* ── Mobile Bottom Navigation ─────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <ul className="flex">
          {primaryNav.map((item) => (
            <li key={item.to} className="flex-1">
              <BottomNavItem item={item} />
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              <LayoutGrid className="h-5 w-5" />
              Lainnya
            </button>
          </li>
        </ul>
      </nav>

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
