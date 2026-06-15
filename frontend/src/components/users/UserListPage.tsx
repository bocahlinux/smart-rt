import axios from 'axios'
import {
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  Eye,
  EyeOff,
  Plus,
  Search,
  ShieldCheck,
  UserCog,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import type { UserRole, UserStatus } from '@/types/auth'
import {
  type CreateUserPayload,
  type LinkedWarga,
  type ManagedUser,
  type UpdateUserPayload,
  createUser,
  listUsers,
  updateUser,
} from '@/services/userService'
import { WargaDetailModal } from '@/components/warga/WargaDetailModal'
import { unlinkUser } from '@/services/wargaService'

// ── Badge helpers ──────────────────────────────────────────────

const STATUS_STYLE: Record<UserStatus, { label: string; cls: string; icon: React.ElementType }> = {
  active:   { label: 'Aktif',   cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  pending:  { label: 'Pending', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',         icon: Clock },
  rejected: { label: 'Ditolak',cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',                  icon: XCircle },
}

const ROLE_STYLE: Record<UserRole, string> = {
  admin:      'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  sekretaris: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  bendahara:  'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  pengurus:   'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  warga:      'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin', sekretaris: 'Sekretaris', bendahara: 'Bendahara', pengurus: 'Pengurus', warga: 'Warga',
}

const ALL_ROLES: UserRole[] = ['admin', 'sekretaris', 'bendahara', 'pengurus', 'warga']
const ALL_STATUSES: UserStatus[] = ['active', 'pending', 'rejected']

const SELECT_CLS = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'
const INPUT_CLS  = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800'

// ── Warga badge ───────────────────────────────────────────────

const WARGA_STATUS_CLS: Record<string, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_aktif: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pindah: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  meninggal: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const WARGA_STATUS_LABEL: Record<string, string> = {
  aktif: 'Aktif', tidak_aktif: 'Tdk Aktif', pindah: 'Pindah', meninggal: 'Meninggal',
}

function WargaBadge({ warga, onOpen, onUnlinked }: { warga: LinkedWarga | null; onOpen: (id: string) => void; onUnlinked: () => void }) {
  const [unlinking, setUnlinking] = useState(false)

  async function handleUnlink() {
    if (!warga) return
    if (!confirm(`Lepas tautan akun pengguna dari data warga "${warga.namaLengkap}"?`)) return
    setUnlinking(true)
    try {
      await unlinkUser(warga.id)
      onUnlinked()
    } catch {
      alert('Gagal melepas tautan.')
    } finally {
      setUnlinking(false)
    }
  }

  if (!warga) {
    return (
      <p className="mt-0.5 text-xs text-slate-300 dark:text-slate-600">Belum terlink ke data warga</p>
    )
  }
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => onOpen(warga.id)}
        className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
      >
        {warga.namaLengkap}
      </button>
      {(warga.blok || warga.noRumah) && (
        <span className="text-xs text-slate-400">
          · Blok {warga.blok ?? '—'} / {warga.noRumah ?? '—'}
        </span>
      )}
      <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-medium', WARGA_STATUS_CLS[warga.status] ?? 'bg-slate-100 text-slate-500')}>
        {WARGA_STATUS_LABEL[warga.status] ?? warga.status}
      </span>
      <button
        type="button"
        onClick={() => void handleUnlink()}
        disabled={unlinking}
        title="Lepas tautan ke data warga"
        className="rounded-md border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400 hover:border-red-300 hover:text-red-500 disabled:opacity-50 dark:border-slate-700 dark:hover:border-red-700 dark:hover:text-red-400"
      >
        {unlinking ? '...' : 'Lepas'}
      </button>
    </div>
  )
}

// ── Action menu (role/status changer) ─────────────────────────

function ActionMenu({ user, onUpdated }: { user: ManagedUser; onUpdated: (u: ManagedUser) => void }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Hanya daftarkan listener saat menu terbuka agar tidak interferensi klik lain
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function apply(payload: UpdateUserPayload) {
    setSaving(true)
    try {
      const updated = await updateUser(user.id, payload)
      onUpdated(updated)
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={saving}
        title="Ubah role / status"
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <UserCog className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-52 rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Ubah Role</p>
          {ALL_ROLES.map((r) => (
            <button key={r} type="button" disabled={user.role === r}
              onClick={() => void apply({ role: r })}
              className={cn(
                'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800',
                user.role === r ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300',
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', user.role === r ? 'bg-primary-500' : 'bg-slate-300')} />
              {ROLE_LABEL[r]}
            </button>
          ))}

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <p className="px-3 pt-1 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Ubah Status</p>
          {ALL_STATUSES.map((s) => {
            const st = STATUS_STYLE[s]
            return (
              <button key={s} type="button" disabled={user.status === s}
                onClick={() => void apply({ status: s })}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-1.5 text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800',
                  user.status === s ? 'font-semibold text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300',
                )}
              >
                <st.icon className="h-3.5 w-3.5" />
                {st.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Add User Modal ─────────────────────────────────────────────

interface AddUserModalProps {
  onClose: () => void
  onCreated: (user: ManagedUser) => void
}

interface ApiError { message?: string; errors?: { field: string; message: string }[] }

function AddUserModal({ onClose, onCreated }: AddUserModalProps) {
  const [form, setForm] = useState<CreateUserPayload>({
    email: '', phone: '', password: '', role: 'warga', status: 'active',
  })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  function set<K extends keyof CreateUserPayload>(key: K, value: CreateUserPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  async function handleSubmit() {
    setSaving(true)
    setErrors({})
    setGeneralError('')
    try {
      const user = await createUser(form)
      onCreated(user)
      onClose()
    } catch (err) {
      if (axios.isAxiosError<{ code: string; message: string; errors?: ApiError['errors'] }>(err)) {
        const data = err.response?.data
        if (data?.errors?.length) {
          const fieldErrors: Record<string, string> = {}
          for (const e of data.errors) fieldErrors[e.field] = e.message
          setErrors(fieldErrors)
        } else {
          setGeneralError(data?.message ?? 'Terjadi kesalahan.')
        }
      } else {
        setGeneralError('Terjadi kesalahan.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Pengguna</h2>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {generalError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {generalError}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              placeholder="nama@email.com" className={cn(INPUT_CLS, errors['email'] && 'border-red-400')} />
            {errors['email'] && <p className="mt-1 text-xs text-red-600">{errors['email']}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nomor HP</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
              placeholder="08xxxxxxxxxx" className={cn(INPUT_CLS, errors['phone'] && 'border-red-400')} />
            {errors['phone'] && <p className="mt-1 text-xs text-red-600">{errors['phone']}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder="Min. 8 karakter" className={cn(INPUT_CLS, 'pr-10', errors['password'] && 'border-red-400')} />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors['password'] && <p className="mt-1 text-xs text-red-600">{errors['password']}</p>}
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value as UserRole)} className={SELECT_CLS}>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as UserStatus)} className={SELECT_CLS}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Batal
          </button>
          <button type="button" disabled={saving} onClick={() => void handleSubmit()}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Tambah'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Edit User Modal ────────────────────────────────────────────

interface EditForm {
  email: string
  phone: string
  role: UserRole
  status: UserStatus
  newPassword: string
}

interface EditUserModalProps {
  user: ManagedUser
  onClose: () => void
  onUpdated: (u: ManagedUser) => void
}

function EditUserModal({ user, onClose, onUpdated }: EditUserModalProps) {
  const [form, setForm] = useState<EditForm>({
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    newPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')

  function set<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => { const next = { ...prev }; delete next[key]; return next })
  }

  // Tutup dengan ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit() {
    setSaving(true)
    setErrors({})
    setGeneralError('')
    try {
      const payload: UpdateUserPayload = {
        email: form.email,
        phone: form.phone,
        role: form.role,
        status: form.status,
      }
      if (form.newPassword) payload.newPassword = form.newPassword
      const updated = await updateUser(user.id, payload)
      onUpdated(updated)
      onClose()
    } catch (err) {
      if (axios.isAxiosError<{ code: string; message: string; errors?: { field: string; message: string }[] }>(err)) {
        const data = err.response?.data
        if (data?.errors?.length) {
          const fieldErrors: Record<string, string> = {}
          for (const e of data.errors) fieldErrors[e.field] = e.message
          setErrors(fieldErrors)
        } else {
          setGeneralError(data?.message ?? 'Terjadi kesalahan.')
        }
      } else {
        setGeneralError('Terjadi kesalahan.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-md sm:max-h-none sm:rounded-2xl">
        {/* Drag handle mobile */}
        <div className="mx-auto mb-1 mt-2 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Edit Pengguna</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-6 py-5">
          {generalError && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {generalError}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className={cn(INPUT_CLS, errors['email'] && 'border-red-400')} />
            {errors['email'] && <p className="mt-1 text-xs text-red-600">{errors['email']}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Nomor HP</label>
            <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)}
              className={cn(INPUT_CLS, errors['phone'] && 'border-red-400')} />
            {errors['phone'] && <p className="mt-1 text-xs text-red-600">{errors['phone']}</p>}
          </div>

          {/* Role + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
              <select value={form.role} onChange={(e) => set('role', e.target.value as UserRole)} className={SELECT_CLS}>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value as UserStatus)} className={SELECT_CLS}>
                {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
              </select>
            </div>
          </div>

          {/* Data Warga (read-only) */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Data Warga Terlink</p>
            {user.warga ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.warga.namaLengkap}</span>
                {(user.warga.blok || user.warga.noRumah) && (
                  <span className="text-xs text-slate-400">Blok {user.warga.blok ?? '—'} / {user.warga.noRumah ?? '—'}</span>
                )}
                {user.warga.nik && (
                  <span className="font-mono text-xs text-slate-400">{user.warga.nik}</span>
                )}
                <span className={cn('rounded-full px-1.5 py-0.5 text-xs font-medium', WARGA_STATUS_CLS[user.warga.status] ?? 'bg-slate-100 text-slate-500')}>
                  {WARGA_STATUS_LABEL[user.warga.status] ?? user.warga.status}
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum terlink ke data warga</p>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100 pt-1 dark:border-slate-800">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Reset Password (opsional)</p>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => set('newPassword', e.target.value)}
                placeholder="Kosongkan jika tidak ingin mengubah"
                className={cn(INPUT_CLS, 'pr-10', errors['newPassword'] && 'border-red-400')}
              />
              <button type="button" onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors['newPassword'] && <p className="mt-1 text-xs text-red-600">{errors['newPassword']}</p>}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <button type="button" onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
            Batal
          </button>
          <button type="button" disabled={saving} onClick={() => void handleSubmit()}
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────

export function UserListPage() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<ManagedUser | null>(null)
  const [wargaDetailId, setWargaDetailId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    listUsers({ role: roleFilter, status: statusFilter, search })
      .then((res) => {
        if (cancelled) return
        setUsers(res.results)
        setCount(res.count)
      })
      .catch(() => { if (!cancelled) setError('Gagal memuat data pengguna.') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [search, roleFilter, statusFilter])

  function handleUpdated(updated: ManagedUser) {
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
  }

  function handleCreated(user: ManagedUser) {
    setUsers((prev) => [user, ...prev])
    setCount((c) => c + 1)
  }

  function copyId(id: string) {
    void navigator.clipboard.writeText(id)
    setCopied(id)
    setTimeout(() => setCopied(null), 1500)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Manajemen Pengguna</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{count} akun terdaftar</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-4 w-4" />
          Tambah Pengguna
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-48 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari email atau nomor HP..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as UserRole | '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">Semua Role</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UserStatus | '')}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
          <option value="">Semua Status</option>
          {ALL_STATUSES.map((s) => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-sm text-slate-400">Tidak ada pengguna ditemukan.</div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u, idx) => {
              const statusInfo = STATUS_STYLE[u.status]
              const StatusIcon = statusInfo.icon
              const isFirst = idx === 0
              const isLast  = idx === users.length - 1
              return (
                <li key={u.id} className={cn(
                  'flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40',
                  isFirst && 'rounded-t-2xl',
                  isLast  && 'rounded-b-2xl',
                )}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {u.email.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{u.email}</p>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', ROLE_STYLE[u.role])}>
                        {ROLE_LABEL[u.role]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{u.phone}</p>
                    <WargaBadge
                      warga={u.warga}
                      onOpen={setWargaDetailId}
                      onUnlinked={() => handleUpdated({ ...u, warga: null })}
                    />
                  </div>
                  <div className={cn('hidden shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium sm:flex', statusInfo.cls)}>
                    <StatusIcon className="h-3 w-3" />
                    {statusInfo.label}
                  </div>
                  <p className="hidden shrink-0 text-xs text-slate-400 lg:block">
                    {new Date(u.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                  <button type="button" onClick={() => copyId(u.id)} title="Salin UUID"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                    {copied === u.id
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      : <Copy className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => setEditUser(u)} title="Edit pengguna"
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <ActionMenu user={u} onUpdated={handleUpdated} />
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
        Klik <Copy className="inline h-3 w-3" /> untuk menyalin UUID — digunakan saat menghubungkan akun ke data warga.
      </p>

      {showModal && (
        <AddUserModal onClose={() => setShowModal(false)} onCreated={handleCreated} />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onUpdated={(updated) => { handleUpdated(updated); setEditUser(null) }}
        />
      )}

      {wargaDetailId && (
        <WargaDetailModal
          id={wargaDetailId}
          onClose={() => setWargaDetailId(null)}
        />
      )}
    </div>
  )
}
