import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageSquareWarning, Trash2, Image } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deletePengaduan, listPengaduan } from '../../services/pengaduanService'
import type { Pengaduan, PengaduanKategori, PengaduanStatus } from '../../types/pengaduan'

const KATEGORI_LABEL: Record<string, string> = {
  infrastruktur: 'Infrastruktur',
  keamanan: 'Keamanan',
  kebersihan: 'Kebersihan',
  sosial: 'Sosial',
  lainnya: 'Lainnya',
}

const KATEGORI_COLOR: Record<string, string> = {
  infrastruktur: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  keamanan: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  kebersihan: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  sosial: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  lainnya: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const STATUS_COLOR: Record<string, string> = {
  diajukan: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  diproses: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  selesai: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ditolak: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function PengaduanListPage() {
  const { user } = useAuthStore()
  const [pengaduan, setPengaduan] = useState<Pengaduan[]>([])
  const [filterStatus, setFilterStatus] = useState<PengaduanStatus | ''>('')
  const [filterKategori, setFilterKategori] = useState<PengaduanKategori | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const isModerator = hasPerm(user, 'update_pengaduan')

  useEffect(() => {
    load()
  }, [page, filterStatus, filterKategori]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const res = await listPengaduan({
        page,
        limit: 20,
        status: filterStatus || undefined,
        kategori: filterKategori || undefined,
      })
      setPengaduan(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch {
      setMsg('Gagal memuat daftar pengaduan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(p: Pengaduan) {
    if (!confirm(`Hapus pengaduan "${p.judul}"?`)) return
    try {
      await deletePengaduan(p.id)
      setMsg('Pengaduan dihapus.')
      load()
    } catch {
      setMsg('Gagal menghapus pengaduan.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <MessageSquareWarning className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Pengaduan Warga</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {isModerator ? 'Semua pengaduan warga' : 'Pengaduan Anda'}
            </p>
          </div>
        </div>
        <Link
          to="/pengaduan/baru"
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Buat Pengaduan
        </Link>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
          {msg}
        </div>
      )}

      {/* Filter status */}
      <div className="mb-3 flex flex-wrap gap-2">
        {([['', 'Semua Status'], ['diajukan', 'Diajukan'], ['diproses', 'Diproses'], ['selesai', 'Selesai'], ['ditolak', 'Ditolak']] as const).map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => { setFilterStatus(s); setPage(1) }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filterStatus === s
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary-500',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filter kategori */}
      <div className="mb-5 flex flex-wrap gap-2">
        {([['', 'Semua Kategori'], ['infrastruktur', 'Infrastruktur'], ['keamanan', 'Keamanan'], ['kebersihan', 'Kebersihan'], ['sosial', 'Sosial'], ['lainnya', 'Lainnya']] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => { setFilterKategori(k); setPage(1) }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filterKategori === k
                ? 'border-slate-700 bg-slate-700 text-white dark:border-slate-400 dark:bg-slate-600'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500',
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
      {!loading && pengaduan.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <MessageSquareWarning className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada pengaduan.</p>
        </div>
      )}

      {/* List */}
      {!loading && pengaduan.length > 0 && (
        <div className="space-y-3">
          {pengaduan.map((p) => (
            <div
              key={p.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KATEGORI_COLOR[p.kategori] ?? 'bg-slate-100 text-slate-600')}>
                        {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                      </span>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLOR[p.status] ?? 'bg-slate-100 text-slate-600')}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>

                    {/* Title */}
                    <Link
                      to={`/pengaduan/${p.id}`}
                      className="block font-semibold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 truncate"
                    >
                      {p.judul}
                    </Link>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(p.createdAt)} · {p.warga.namaLengkap}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-1">
                    {p.foto && (
                      <a
                        href={p.foto}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Lihat foto"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      >
                        <Image className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {isModerator && (
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
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
