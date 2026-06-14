import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { listKegiatan } from '../../services/kegiatanService'
import type { Kegiatan } from '../../types/kegiatan'

const PENGURUS_ROLES = ['admin', 'sekretaris', 'pengurus']

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isMendatang(tanggal: string) {
  return new Date(tanggal) > new Date()
}

export function KegiatanListPage() {
  const { user } = useAuthStore()
  const [kegiatan, setKegiatan] = useState<Kegiatan[]>([])
  const [filter, setFilter] = useState<'semua' | 'mendatang' | 'lampau'>('mendatang')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isModerator = user?.role && PENGURUS_ROLES.includes(user.role)

  const load = async () => {
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

  useEffect(() => {
    void load()
  }, []) // load only runs on mount — intentional

  const filtered = kegiatan.filter((k) => {
    if (filter === 'mendatang') return isMendatang(k.tanggal)
    if (filter === 'lampau') return !isMendatang(k.tanggal)
    return true
  })

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kegiatan RT</h1>
          <p className="text-sm text-gray-500 mt-0.5">Jadwal kegiatan dan acara warga</p>
        </div>
        {isModerator && (
          <Link
            to="/kegiatan/baru"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Tambah Kegiatan
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(['mendatang', 'semua', 'lampau'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors capitalize ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {f === 'mendatang' ? '📅 Mendatang' : f === 'semua' ? '📋 Semua' : '🕰️ Lampau'}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400 py-10">Memuat...</p>}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">Tidak ada kegiatan{filter === 'mendatang' ? ' mendatang' : ''}.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((k) => {
          const mendatang = isMendatang(k.tanggal)
          return (
            <Link
              key={k.id}
              to={`/kegiatan/${k.id}`}
              className={`block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow ${
                mendatang ? 'border-blue-100' : 'border-gray-200 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {mendatang ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                        Mendatang
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                        Selesai
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate">{k.nama}</h3>
                  {k.deskripsi && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{k.deskripsi}</p>
                  )}
                  <div className="text-xs text-gray-400 mt-1.5 flex flex-wrap gap-x-3">
                    <span>📅 {formatTanggal(k.tanggal)}, {formatJam(k.tanggal)}</span>
                    {k.lokasi && <span>📍 {k.lokasi}</span>}
                    <span>👥 {k.rsvpCount} hadir</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
