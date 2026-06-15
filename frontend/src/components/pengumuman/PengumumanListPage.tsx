import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Megaphone, Edit2, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deletePengumuman, listPengumuman } from '../../services/pengumumanService'
import type { Pengumuman, PengumumanKategori } from '../../types/pengumuman'

const KATEGORI_LABEL: Record<string, string> = {
  penting: 'Penting',
  acara: 'Acara',
  info: 'Informasi',
  keamanan: 'Keamanan',
  lainnya: 'Lainnya',
}

const KATEGORI_COLOR: Record<string, string> = {
  penting: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  acara: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  info: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  keamanan: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  lainnya: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const FILTER_PILLS: { key: PengumumanKategori | ''; label: string }[] = [
  { key: '', label: 'Semua' },
  { key: 'penting', label: 'Penting' },
  { key: 'acara', label: 'Acara' },
  { key: 'info', label: 'Informasi' },
  { key: 'keamanan', label: 'Keamanan' },
  { key: 'lainnya', label: 'Lainnya' },
]

export function PengumumanListPage() {
  const { user } = useAuthStore()
  const [list, setList] = useState<Pengumuman[]>([])
  const [filterKategori, setFilterKategori] = useState<PengumumanKategori | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const canWrite = hasPerm(user, 'kelola_pengumuman')

  useEffect(() => {
    load()
  }, [page, filterKategori]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const res = await listPengumuman({ page, limit: 10, kategori: filterKategori || undefined })
      setList(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch {
      setMsg('Gagal memuat pengumuman.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(p: Pengumuman) {
    if (!confirm(`Hapus pengumuman "${p.judul}"?`)) return
    try {
      await deletePengumuman(p.id)
      setMsg(`Pengumuman dihapus.`)
      load()
    } catch {
      setMsg('Gagal menghapus pengumuman.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Megaphone className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Pengumuman RT</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Informasi dan pengumuman terbaru</p>
          </div>
        </div>
        {canWrite && (
          <Link
            to="/pengumuman/baru"
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Pengumuman
          </Link>
        )}
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
          {msg}
        </div>
      )}

      {/* Filter kategori */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_PILLS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setFilterKategori(key); setPage(1) }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filterKategori === key
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
      {!loading && list.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Megaphone className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada pengumuman.</p>
        </div>
      )}

      {/* List */}
      {!loading && list.length > 0 && (
        <div className="space-y-3">
          {list.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex gap-4 p-4">
                {p.gambar && (
                  <img
                    src={p.gambar}
                    alt={p.judul}
                    className="h-20 w-20 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {/* Badges row */}
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KATEGORI_COLOR[p.kategori] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-800')}>
                        {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                      </span>
                      {!p.isPublished && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          Terjadwal
                        </span>
                      )}
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Link
                          to={`/pengumuman/${p.id}/edit`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(p)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <Link to={`/pengumuman/${p.id}`} className="block">
                    <h2 className="font-semibold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 truncate">
                      {p.judul}
                    </h2>
                  </Link>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{p.isi}</p>
                  <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                    {formatDate(p.createdAt)} · {p.createdBy.namaLengkap}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
          <span className="text-xs text-slate-400 dark:text-slate-500">Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              ← Sebelumnya
            </button>
            <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
