import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

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
  penting: 'bg-red-100 text-red-700',
  acara: 'bg-blue-100 text-blue-700',
  info: 'bg-gray-100 text-gray-700',
  keamanan: 'bg-amber-100 text-amber-700',
  lainnya: 'bg-purple-100 text-purple-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function PengumumanListPage() {
  const { user } = useAuthStore()
  const [list, setList] = useState<Pengumuman[]>([])
  const [filterKategori, setFilterKategori] = useState<PengumumanKategori | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const canWrite = user?.role && ['admin', 'pengurus', 'sekretaris'].includes(user.role)

  useEffect(() => {
    load()
  }, [page, filterKategori]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const res = await listPengumuman({
        page,
        limit: 10,
        kategori: filterKategori || undefined,
      })
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
      setMsg(`Pengumuman "${p.judul}" dihapus.`)
      load()
    } catch {
      setMsg('Gagal menghapus pengumuman.')
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pengumuman RT</h1>
        {canWrite && (
          <Link
            to="/pengumuman/baru"
            className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
          >
            + Buat Pengumuman
          </Link>
        )}
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded text-sm bg-blue-50 border border-blue-200 text-blue-700">
          {msg}
        </div>
      )}

      {/* Filter kategori */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['', 'penting', 'acara', 'info', 'keamanan', 'lainnya'] as const).map((k) => (
          <button
            key={k}
            onClick={() => { setFilterKategori(k); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterKategori === k
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {k === '' ? 'Semua' : KATEGORI_LABEL[k]}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Memuat...</p>}

      {!loading && list.length === 0 && (
        <p className="text-center text-gray-400 py-8">Belum ada pengumuman.</p>
      )}

      <div className="space-y-3">
        {list.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex gap-4 p-4">
              {p.gambar && (
                <img
                  src={p.gambar}
                  alt={p.judul}
                  className="w-20 h-20 object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${KATEGORI_COLOR[p.kategori] ?? 'bg-gray-100 text-gray-700'}`}
                    >
                      {KATEGORI_LABEL[p.kategori] ?? p.kategori}
                    </span>
                    {!p.isPublished && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                        Terjadwal
                      </span>
                    )}
                  </div>
                  {canWrite && (
                    <div className="flex gap-2 shrink-0">
                      <Link
                        to={`/pengumuman/${p.id}/edit`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(p)}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
                <Link to={`/pengumuman/${p.id}`} className="block mt-1 hover:text-blue-700">
                  <h2 className="font-semibold text-gray-800 truncate">{p.judul}</h2>
                </Link>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.isi}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatDate(p.createdAt)} · {p.createdBy.namaLengkap}
                </p>
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
