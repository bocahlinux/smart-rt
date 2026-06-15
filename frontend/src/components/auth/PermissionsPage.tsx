import { useEffect, useState } from 'react'
import { Settings2, ShieldCheck } from 'lucide-react'

import { cn } from '@/lib/utils'
import { listPermissions, updatePermission } from '@/services/permissionService'
import type { PermissionConfig } from '@/services/permissionService'
import { useAuthStore } from '@/stores/authStore'

const CONFIGURABLE_ROLES = ['ketua_rt', 'sekretaris', 'bendahara', 'pengurus', 'warga'] as const
type ConfigurableRole = (typeof CONFIGURABLE_ROLES)[number]

const ROLE_LABEL: Record<ConfigurableRole, string> = {
  ketua_rt: 'Ketua RT',
  sekretaris: 'Sekretaris',
  bendahara: 'Bendahara',
  pengurus: 'Pengurus',
  warga: 'Warga',
}

const ROLE_COLOR: Record<ConfigurableRole, string> = {
  ketua_rt: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  sekretaris: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  bendahara: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pengurus: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  warga: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
}

const CATEGORY_LABEL: Record<string, string> = {
  warga: 'Data Warga',
  kartu_keluarga: 'Kartu Keluarga',
  keuangan: 'Keuangan',
  konten: 'Konten & Moderasi',
  dashboard: 'Dashboard',
}

function groupByCategory(configs: PermissionConfig[]): Record<string, PermissionConfig[]> {
  const groups: Record<string, PermissionConfig[]> = {}
  for (const c of configs) {
    const cat = c.category || 'lainnya'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(c)
  }
  return groups
}

export function PermissionsPage() {
  const { user } = useAuthStore()
  const [configs, setConfigs] = useState<PermissionConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listPermissions()
      .then(setConfigs)
      .catch(() => setError('Gagal memuat konfigurasi izin.'))
      .finally(() => setLoading(false))
  }, [])

  if (user?.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-sm text-slate-500">Halaman ini hanya untuk admin.</p>
      </div>
    )
  }

  async function toggleRole(key: string, role: ConfigurableRole, currentRoles: string[]) {
    const hasRole = currentRoles.includes(role)
    const newRoles = hasRole
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role]

    setSaving(`${key}-${role}`)
    try {
      const updated = await updatePermission(key, newRoles)
      setConfigs((prev) =>
        prev.map((c) => (c.key === key ? { ...c, allowedRoles: updated.allowedRoles } : c)),
      )
    } catch {
      setError('Gagal menyimpan perubahan izin.')
    } finally {
      setSaving(null)
    }
  }

  const grouped = groupByCategory(configs)
  const categoryOrder = Object.keys(CATEGORY_LABEL)
  const sortedCategories = [
    ...categoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !categoryOrder.includes(c)),
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
          <Settings2 className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Konfigurasi Izin Role</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Atur role mana yang memiliki izin tertentu. Admin selalu memiliki semua izin.
          </p>
        </div>
      </div>

      {/* Admin badge info */}
      <div className="flex items-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm text-primary-700 dark:border-primary-900/30 dark:bg-primary-900/20 dark:text-primary-300">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>
          Role <strong>Admin</strong> selalu memiliki semua izin dan tidak dapat dikonfigurasi.
        </span>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Memuat konfigurasi…</div>
      ) : (
        <div className="space-y-6">
          {sortedCategories.map((category) => (
            <div
              key={category}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
            >
              {/* Category header */}
              <div className="border-b border-slate-100 px-5 py-3 dark:border-slate-800">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {CATEGORY_LABEL[category] ?? category}
                </h2>
              </div>

              {/* Permission rows */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {grouped[category].map((config) => (
                  <div key={config.key} className="px-5 py-4">
                    <div className="mb-3 flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {config.label}
                        </p>
                        {config.description && (
                          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                            {config.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Role toggles */}
                    <div className="flex flex-wrap gap-2">
                      {CONFIGURABLE_ROLES.map((role) => {
                        const isActive = config.allowedRoles.includes(role)
                        const isSavingThis = saving === `${config.key}-${role}`
                        return (
                          <button
                            key={role}
                            type="button"
                            disabled={!!saving}
                            onClick={() => void toggleRole(config.key, role, config.allowedRoles)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition',
                              isActive
                                ? ROLE_COLOR[role] + ' border-transparent'
                                : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:border-slate-700 dark:text-slate-500 dark:hover:border-slate-600 dark:hover:text-slate-400',
                              isSavingThis && 'opacity-60',
                            )}
                          >
                            {isActive && (
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            )}
                            {isSavingThis ? '…' : ROLE_LABEL[role]}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
