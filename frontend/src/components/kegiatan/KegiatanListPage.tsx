import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Calendar, MapPin, Users } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { listKegiatan } from '../../services/kegiatanService'
import type { Kegiatan } from '../../types/kegiatan'

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function isMendatang(tanggal: string) {
  return new Date(tanggal) > new Date()
}

type FilterKey = 'semua' | 'mendatang' | 'lampau'

const FILTER_PILLS: { key: FilterKey; label: string }[] = [
  { key: 'mendatang', label: 'Mendatang' },
  { key: 'semua', label: 'Semua' },
  { key: 'lampau', label: 'Lampau' },
]

export function KegiatanListPage() {
  const { user } = useAuthStore()
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([])
  const [filter, setFilter] = useState<FilterKey>('semua')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isModerator = hasPerm(user, 'kelola_kegiatan')

  useEffect(() => {
    void load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listKegiatan()
      setKegiatan(data)
    } catch {
      setError('Gagal memuat daftar kegiatan.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = kegiatan.filter((k) => {
    if (filter === 'mendatang') return isMendatang(k.tanggal)
    if (filter === 'lampau') return !isMendatang(k.tanggal)
    return true
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Calendar className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Kegiatan RT</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Jadwal kegiatan dan acara warga</p>
          </div>
        </div>
        {isModerator && (
          <Link
            to="/kegiatan/baru"
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah Kegiatan
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {FILTER_PILLS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === key
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary-500',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Tidak ada kegiatan{filter === 'mendatang' ? ' mendatang' : filter === 'lampau' ? ' yang sudah berlalu' : ''}.
          </p>
        </div>
      )}

      {/* List */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((k) => {
            const mendatang = isMendatang(k.tanggal)
            return (
              <Link
                key={k.id}
                to={`/kegiatan/${k.id}`}
                className={cn(
                  'block overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900',
                  mendatang
                    ? 'border-primary-100 dark:border-primary-900/40'
                    : 'border-slate-200 opacity-75 dark:border-slate-700',
                )}
              >
                <div className="p-4">
                  <div className="mb-2">
                    {mendatang ? (
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        Mendatang
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Selesai
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate">{k.nama}</h3>
                  {k.deskripsi && (
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">{k.deskripsi}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatTanggal(k.tanggal)},{' '}
                      {formatJam(k.tanggal)}
                      {k.tanggalSelesai ? ` – ${formatJam(k.tanggalSelesai)}` : ''}
                    </span>
                    {k.lokasi && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {k.lokasi}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {k.rsvpCount} hadir
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
