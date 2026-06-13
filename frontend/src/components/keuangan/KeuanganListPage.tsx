/**
 * Halaman daftar transaksi keuangan RT.
 * Lihat docs/06-API-CONTRACT.md §4.1-4.4 dan docs/07-TASK-BREAKDOWN.md §4.13.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import {
  deleteTransaksi,
  listKategori,
  listTransaksi,
} from '../../services/keuanganService'
import type { KategoriTransaksi, Pagination, Transaksi, TransaksiTipe } from '../../types/keuangan'

function formatRupiah(val: string | number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

const TIPE_BADGE: Record<TransaksiTipe, string> = {
  pemasukan: 'bg-emerald-100 text-emerald-700',
  pengeluaran: 'bg-rose-100 text-rose-700',
}

export function KeuanganListPage() {
  const { user } = useAuthStore()
  const [list, setList] = useState<Transaksi[]>([])
  const [kategoriList, setKategoriList] = useState<KategoriTransaksi[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [filterTipe, setFilterTipe] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterDari, setFilterDari] = useState('')
  const [filterSampai, setFilterSampai] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleteMsg, setDeleteMsg] = useState('')

  const canWrite = user?.role === 'admin' || user?.role === 'bendahara'
  const canDelete = user?.role === 'admin'

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const result = await listTransaksi({
        page: p,
        tipe: filterTipe || undefined,
        kategori: filterKategori || undefined,
        dari: filterDari || undefined,
        sampai: filterSampai || undefined,
      })
      setList(result.data)
      if (result.pagination) setPagination(result.pagination)
    } catch {
      setError('Gagal memuat data transaksi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    listKategori().then(setKategoriList).catch(() => {})
    load(1)
  }, [])

  function handleFilter(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    load(1)
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin hapus transaksi ini?')) return
    try {
      await deleteTransaksi(id)
      setDeleteMsg('Transaksi berhasil dihapus.')
      load(page)
    } catch {
      setDeleteMsg('Gagal menghapus transaksi.')
    }
  }

  function handlePage(p: number) {
    setPage(p)
    load(p)
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Transaksi Keuangan</h1>
        <div className="flex gap-2">
          <Link to="/keuangan/dashboard" className="text-sm text-blue-600 hover:underline">Dashboard</Link>
          <Link to="/keuangan/laporan" className="text-sm text-blue-600 hover:underline">Laporan PDF</Link>
          {canWrite && (
            <Link
              to="/keuangan/baru"
              className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
            >
              + Tambah
            </Link>
          )}
        </div>
      </div>

      {/* Filter */}
      <form onSubmit={handleFilter} className="bg-gray-50 rounded-lg p-4 mb-4 flex flex-wrap gap-3 items-end border border-gray-200">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tipe</label>
          <select
            value={filterTipe}
            onChange={(e) => setFilterTipe(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Kategori</label>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm"
          >
            <option value="">Semua</option>
            {kategoriList.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Dari</label>
          <input type="date" value={filterDari} onChange={(e) => setFilterDari(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Sampai</label>
          <input type="date" value={filterSampai} onChange={(e) => setFilterSampai(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <button type="submit" className="bg-gray-700 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-800">
          Filter
        </button>
        <button type="button" onClick={() => { setFilterTipe(''); setFilterKategori(''); setFilterDari(''); setFilterSampai(''); setTimeout(() => load(1), 0) }}
          className="text-sm text-gray-500 hover:underline">Reset</button>
      </form>

      {deleteMsg && <div className="text-green-700 mb-3 text-sm">{deleteMsg}</div>}
      {error && <div className="text-red-600 mb-3 text-sm">{error}</div>}

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Tanggal</th>
              <th className="px-4 py-3 text-left">Kategori</th>
              <th className="px-4 py-3 text-left">Keterangan</th>
              <th className="px-4 py-3 text-left">Tipe</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              {canDelete && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Memuat...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Belum ada transaksi.</td></tr>
            )}
            {list.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{t.tanggal}</td>
                <td className="px-4 py-3 text-gray-800">{t.kategori.nama}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{t.keterangan || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${TIPE_BADGE[t.tipe]}`}>
                    {t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-medium ${t.tipe === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatRupiah(t.jumlah)}
                </td>
                {canDelete && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDelete(t.id)} className="text-xs text-red-500 hover:text-red-700">
                      Hapus
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} data)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              ← Prev
            </button>
            <button
              onClick={() => handlePage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
