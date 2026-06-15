import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Wallet, LayoutDashboard, FileText, Settings2, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deleteTransaksi, listKategori, listTransaksi } from '../../services/keuanganService'
import type { KategoriTransaksi, Pagination, Transaksi, TransaksiTipe } from '../../types/keuangan'
import { KategoriModal } from './KategoriModal'

function formatRupiah(val: string | number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

const TIPE_COLOR: Record<TransaksiTipe, { badge: string; amount: string }> = {
  pemasukan: {
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    amount: 'text-emerald-600 dark:text-emerald-400',
  },
  pengeluaran: {
    badge: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
    amount: 'text-rose-600 dark:text-rose-400',
  },
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
  const [kategoriOpen, setKategoriOpen] = useState(false)

  const canWrite = hasPerm(user, 'kelola_keuangan')
  const canDelete = hasPerm(user, 'kelola_keuangan')

  function loadKategori() {
    listKategori().then(setKategoriList).catch(() => {})
  }

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
    loadKategori()
    load(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  const INPUT_CLS = 'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white'

  return (
    <>
      {kategoriOpen && (
        <KategoriModal onClose={() => setKategoriOpen(false)} onChanged={loadKategori} />
      )}

      <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
              <Wallet className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Transaksi Keuangan</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pemasukan dan pengeluaran kas RT</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/keuangan/dashboard"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <Link
              to="/keuangan/laporan"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FileText className="h-3.5 w-3.5" />
              Laporan PDF
            </Link>
            {canWrite && (
              <>
                <button
                  type="button"
                  onClick={() => setKategoriOpen(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Kategori
                </button>
                <Link
                  to="/keuangan/baru"
                  className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Filter */}
        <form
          onSubmit={handleFilter}
          className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Tipe</label>
            <select value={filterTipe} onChange={(e) => setFilterTipe(e.target.value)} className={INPUT_CLS}>
              <option value="">Semua</option>
              <option value="pemasukan">Pemasukan</option>
              <option value="pengeluaran">Pengeluaran</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kategori</label>
            <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className={INPUT_CLS}>
              <option value="">Semua</option>
              {kategoriList.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Dari</label>
            <input type="date" value={filterDari} onChange={(e) => setFilterDari(e.target.value)} className={INPUT_CLS} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Sampai</label>
            <input type="date" value={filterSampai} onChange={(e) => setFilterSampai(e.target.value)} className={INPUT_CLS} />
          </div>
          <button type="submit" className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600">
            Filter
          </button>
          <button
            type="button"
            onClick={() => { setFilterTipe(''); setFilterKategori(''); setFilterDari(''); setFilterSampai(''); setTimeout(() => load(1), 0) }}
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Reset
          </button>
        </form>

        {deleteMsg && (
          <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300">
            {deleteMsg}
          </div>
        )}
        {error && (
          <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Tanggal</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Kategori</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Keterangan</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Tipe</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Jumlah</th>
                  {canDelete && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <div className="flex justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
                      </div>
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                      Belum ada transaksi.
                    </td>
                  </tr>
                ) : (
                  list.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-slate-600 dark:text-slate-300">{t.tanggal}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-200">{t.kategori.nama}</td>
                      <td className="max-w-48 truncate px-5 py-3.5 text-sm text-slate-500 dark:text-slate-400">{t.keterangan || '—'}</td>
                      <td className="px-5 py-3.5">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', TIPE_COLOR[t.tipe].badge)}>
                          {t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className={cn('px-5 py-3.5 text-right font-semibold', TIPE_COLOR[t.tipe].amount)}>
                        {formatRupiah(t.jumlah)}
                      </td>
                      {canDelete && (
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(t.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} data)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handlePage(page - 1)}
                disabled={page <= 1}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                ← Sebelumnya
              </button>
              <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => handlePage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
