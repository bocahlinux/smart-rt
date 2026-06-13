/**
 * Halaman daftar warga dengan tabel + filter + import/export.
 * Lihat docs/06-API-CONTRACT.md §3.1 dan docs/07-TASK-BREAKDOWN.md §3.16, §3.19.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import {
  deleteWarga,
  downloadBlob,
  exportWarga,
  importWarga,
  listWarga,
} from '../../services/wargaService'
import type { Pagination, WargaAny } from '../../types/warga'

const STATUS_LABELS: Record<string, string> = {
  aktif: 'Aktif',
  tidak_aktif: 'Tidak Aktif',
  pindah: 'Pindah',
  meninggal: 'Meninggal',
}

export function WargaListPage() {
  const { user } = useAuthStore()
  const [wargaList, setWargaList] = useState<WargaAny[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterBlok, setFilterBlok] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [importMsg, setImportMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const canWrite = user?.role === 'admin' || user?.role === 'sekretaris'
  const canExport = user?.role === 'admin' || user?.role === 'sekretaris'
  const canDelete = user?.role === 'admin'

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const result = await listWarga({
        page: p,
        search: search || undefined,
        blok: filterBlok || undefined,
        status: filterStatus || undefined,
      })
      setWargaList(result.data)
      if (result.pagination) setPagination(result.pagination)
    } catch {
      setError('Gagal memuat data warga.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(1)
    setPage(1)
  }, [search, filterBlok, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load(page)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDelete(id: string, nama: string) {
    if (!confirm(`Hapus data warga "${nama}"? Tindakan ini tidak bisa dibatalkan.`)) return
    try {
      await deleteWarga(id)
      void load(page)
    } catch {
      alert('Gagal menghapus data warga.')
    }
  }

  async function handleExport(fmt: 'excel' | 'pdf') {
    try {
      const blob = await exportWarga(fmt, {
        blok: filterBlok || undefined,
        status: filterStatus || undefined,
      })
      const ext = fmt === 'excel' ? 'xlsx' : 'pdf'
      downloadBlob(blob, `data-warga.${ext}`)
    } catch {
      alert('Gagal mengekspor data warga.')
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportMsg('Mengimpor...')
    try {
      const result = await importWarga(file)
      setImportMsg(`Import selesai: ${result.imported} berhasil, ${result.failed} gagal.`)
      void load(1)
    } catch {
      setImportMsg('Import gagal.')
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Data Warga</h1>
          <div className="flex flex-wrap gap-2">
            {canExport && (
              <>
                <button
                  type="button"
                  onClick={() => void handleExport('excel')}
                  className="rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => void handleExport('pdf')}
                  className="rounded-md bg-orange-600 px-3 py-2 text-sm font-medium text-white hover:bg-orange-700"
                >
                  Export PDF
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Import Excel
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => void handleImport(e)}
                />
              </>
            )}
            {canWrite && (
              <Link
                to="/warga/baru"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                + Tambah Warga
              </Link>
            )}
          </div>
        </div>

        {importMsg && (
          <p className="mb-4 rounded-md bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-200">
            {importMsg}
          </p>
        )}

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Cari nama / NIK..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <input
            type="text"
            placeholder="Blok..."
            value={filterBlok}
            onChange={(e) => setFilterBlok(e.target.value)}
            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>

        {/* Error */}
        {error && (
          <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
            <thead className="bg-slate-100 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Nama Lengkap</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">NIK / Masked</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Blok</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">No Rumah</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Memuat...</td>
                </tr>
              ) : wargaList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">Tidak ada data warga.</td>
                </tr>
              ) : (
                wargaList.map((w) => {
                  const full = w as Record<string, string | null | undefined>
                  const nik = full.nik ?? full.nikMasked ?? '—'
                  return (
                    <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{w.namaLengkap}</td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">{nik}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w.blok ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{w.noRumah ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          w.status === 'aktif' ? 'bg-green-100 text-green-700' :
                          w.status === 'tidak_aktif' ? 'bg-slate-100 text-slate-600' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {STATUS_LABELS[w.status] ?? w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Link
                            to={`/warga/${w.id}`}
                            className="text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Detail
                          </Link>
                          {canWrite && (
                            <Link
                              to={`/warga/${w.id}/edit`}
                              className="text-amber-600 hover:underline dark:text-amber-400"
                            >
                              Edit
                            </Link>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(w.id, w.namaLengkap)}
                              className="text-red-600 hover:underline dark:text-red-400"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>
              Menampilkan {wargaList.length} dari {pagination.total} data
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                ← Sebelumnya
              </button>
              <span className="rounded-md border border-slate-300 px-3 py-1 dark:border-slate-600">
                {page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-slate-300 px-3 py-1 disabled:opacity-40 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
