import { useState } from 'react'
import { KeyRound, Mail, Phone, ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { changePassword } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin',
  ketua_rt: 'Ketua RT',
  sekretaris: 'Sekretaris',
  bendahara: 'Bendahara',
  pengurus: 'Pengurus',
  warga: 'Warga',
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif', pending: 'Menunggu Verifikasi', rejected: 'Ditolak',
}

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

export function ProfilePage() {
  const { user } = useAuthStore()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  if (!user) return null

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password baru tidak cocok.')
      return
    }
    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.')
      return
    }
    setSaving(true)
    try {
      await changePassword({
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmPassword,
      })
      setSuccess('Password berhasil diubah.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      setError('Gagal mengubah password. Pastikan password saat ini benar.')
    } finally {
      setSaving(false)
    }
  }

  const initials = user.email.slice(0, 2).toUpperCase()

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Profil Saya</h1>

      {/* Info akun */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {/* Avatar header */}
        <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {user.email.split('@')[0]}
            </p>
            <span className={cn(
              'mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
              STATUS_STYLE[user.status] ?? 'bg-slate-100 text-slate-600',
            )}>
              {STATUS_LABEL[user.status] ?? user.status}
            </span>
          </div>
        </div>

        {/* Detail */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Email</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">No. HP</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 px-5 py-3.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-slate-400" />
            <div>
              <p className="text-xs text-slate-400">Role</p>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {ROLE_LABEL[user.role] ?? user.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ganti password */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <KeyRound className="h-4 w-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Ganti Password</h2>
        </div>

        <form onSubmit={(e) => void handleChangePassword(e)} className="space-y-4 px-5 py-4">
          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              {success}
            </p>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password Saat Ini
            </label>
            <input
              type="password"
              className={INPUT}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Password Baru
            </label>
            <input
              type="password"
              className={INPUT}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              className={INPUT}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
