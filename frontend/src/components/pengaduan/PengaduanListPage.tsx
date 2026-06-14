import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
  infrastruktur: 'bg-orange-100 text-orange-700',
  keamanan: 'bg-red-100 text-red-700',
  kebersihan: 'bg-green-100 text-green-700',
  sosial: 'bg-purple-100 text-purple-700',
  lainnya: 'bg-gray-100 text-gray-700',
}

const STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const STATUS_COLOR: Record<string, string> = {
  diajukan: 'bg-blue-100 text-blue-700',
  diproses: 'bg-yellow-100 text-yellow-700',
  selesai: 'bg-green-100 text-green-700',
  ditolak: 'bg-red-100 text-red-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const MODERATOR_ROLES = ['admin', 'sekretaris', 'pengurus']

export function PengaduanListPage() {
  const { user } = useAuthStore()
  const [pengaduan, setPengaduan] = useState<Pengaduan[]>([])
  const [filterStatus, setFilterStatus] = useState<PengaduanStatus | ''>('')
  const [filterKategori, setFilterKategori] = useState<PengaduanKategori | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const isModerator = user?.role && MODERATOR_ROLES.includes(user.role)

  useEffect(() => {
    load()
  }, [page, filterStatus, filterKategori])

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
      setMsg(`Pengaduan "${p.judul}" dihapus.`)
      load()
    } catch {
      setMsg('Gagal menghapus pengaduan.')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengaduan Warga</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isModerator ? 'Semua pengaduan warga' : 'Pengaduan Anda'}
          </p>
        </div>
        <Link
          to="/pengaduan/baru"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Buat Pengaduan
        </Link>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700">
          {msg}
        </div>
      )}

      {/* Filter status */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {(['', 'diajukan', 'diproses', 'selesai', 'ditolak'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterStatus === s
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {s === '' ? 'Semua Status' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Filter kategori */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(['', 'infrastruktur', 'keamanan', 'kebersihan', 'sosial', 'lainnya'] as const).map(
          (k) => (
            <button
              key={k}
              onClick={() => { setFilterKategori(k); setPage(1) }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filterKategori === k
                  ? 'bg-gray-700 text-white border-gray-700'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500'
              }`}
            >
              {k === '' ? 'Semua Kategori' : KATEGORI_LABEL[k]}
            </button>
          ),
        )}
      </div>

      {loading && <p className="text-center text-gray-400 py-10">Memuat...</p>}

      {!loading && pengaduan.length === 0 && (
        <p className="text-center text-gray-400 py-10">Belum ada pengaduan.</p>
      )}

      <div className="space-y-3">
        {pengaduan.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      KATEGORI_COLOR[p.kategori] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      STATUS_COLOR[p.status] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </div>
                <Link
                  to={`/pengaduan/${p.id}`}
                  className="block font-semibold text-gray-800 hover:text-blue-700 truncate"
                >
                  {p.judul}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(p.createdAt)} · {p.warga.namaLengkap}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {p.foto && (
                  <a
                    href={p.foto}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                    title="Lihat foto"
                  >
                    📷
                  </a>
                )}
                {/* Pemilik atau admin bisa hapus */}
                {(user?.id === undefined || isModerator || user?.role === 'admin') && (
                  <button
                    onClick={() => handleDelete(p)}
                    className="text-xs text-rose-500 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-gray-600 px-3 py-1.5">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  )
}
