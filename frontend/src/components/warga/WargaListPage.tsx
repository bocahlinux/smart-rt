import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, Home, ChevronDown, Edit2, Trash2, Download, Upload, Plus, RotateCcw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { deleteWarga, downloadBlob, exportWarga, importWarga, listDeletedWarga, listWarga, restoreWarga, verifyWarga } from '@/services/wargaService'
import { listKK } from '@/services/kartuKeluargaService'
import type { Pagination, WargaAny, WargaFull } from '@/types/warga'
import type { KartuKeluarga } from '@/types/kartuKeluarga'
import { HUBUNGAN_LABEL } from '@/types/kartuKeluarga'
import { WargaDetailModal } from './WargaDetailModal'
import { WargaFormModal } from './WargaFormModal'
import { ConfirmDeleteModal } from '@/components/shared/ConfirmDeleteModal'

const STATUS_LABEL: Record<string, string> = {
  aktif: 'Aktif', tidak_aktif: 'Tdk Aktif', pindah: 'Pindah', meninggal: 'Meninggal',
}

const STATUS_CLS: Record<string, string> = {
  aktif: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_aktif: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  pindah: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  meninggal: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}

// ── Per-KK group card ─────────────────────────────────────────────────────────

function KKGroupCard({ kk, canWrite, canDelete, onDelete, onOpenDetail, onEdit }: {
  kk: KartuKeluarga
  canWrite: boolean
  canDelete: boolean
  onDelete: (id: string, nama: string) => void
  onOpenDetail: (id: string) => void
  onEdit: (id: string) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between bg-slate-800 px-5 py-4 text-left dark:bg-slate-950"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Home className="h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="font-mono text-sm font-bold text-white">{kk.noKk}</p>
            {kk.kepalaKeluarga && (
              <p className="truncate text-xs text-slate-400">{kk.kepalaKeluarga.namaLengkap}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <span className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs font-semibold text-white">
            <Users className="h-3 w-3" />{kk.jumlahAnggota}
          </span>
          <Link
            to={`/kk/${kk.id}`}
            onClick={(e) => e.stopPropagation()}
            className="rounded-lg bg-primary-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-primary-700"
          >
            Buka KK
          </Link>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </div>
      </button>

      {open && (
        <>
          {kk.anggota.length === 0 ? (
            <p className="px-5 py-6 text-sm text-slate-400">Belum ada anggota terdaftar.</p>
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400">Nama</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400">Hubungan</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400">NIK</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400">Blok / No</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-slate-400">Status</th>
                      {(canWrite || canDelete) && <th className="px-5 py-2.5" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {kk.anggota.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-2.5">
                          <button type="button" onClick={() => onOpenDetail(m.id)} className="font-medium text-primary-600 hover:underline dark:text-primary-400 text-left">
                            {m.namaLengkap}
                          </button>
                        </td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {m.hubunganKeluarga ? (HUBUNGAN_LABEL[m.hubunganKeluarga] ?? m.hubunganKeluarga) : '—'}
                        </td>
                        <td className="px-5 py-2.5 font-mono text-xs text-slate-500">{m.nik ?? '—'}</td>
                        <td className="px-5 py-2.5 text-xs text-slate-500">
                          {m.blok ? `${m.blok} / ${m.noRumah ?? '—'}` : '—'}
                        </td>
                        <td className="px-5 py-2.5">
                          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLS[m.status] ?? 'bg-slate-100 text-slate-500')}>
                            {STATUS_LABEL[m.status] ?? m.status}
                          </span>
                        </td>
                        {(canWrite || canDelete) && (
                          <td className="px-5 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {canWrite && (
                                <button type="button" onClick={() => onEdit(m.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                                  title="Edit">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button type="button" onClick={() => onDelete(m.id, m.namaLengkap)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                  title="Hapus">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: stacked rows */}
              <div className="divide-y divide-slate-50 dark:divide-slate-800 sm:hidden">
                {kk.anggota.map((m) => (
                  <div key={m.id} className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0">
                      <button type="button" onClick={() => onOpenDetail(m.id)} className="font-semibold text-primary-600 dark:text-primary-400 text-left hover:underline">
                        {m.namaLengkap}
                      </button>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {m.hubunganKeluarga ? (HUBUNGAN_LABEL[m.hubunganKeluarga] ?? m.hubunganKeluarga) : '—'}
                        {m.blok && <span className="ml-1.5">· Blok {m.blok}/{m.noRumah ?? '—'}</span>}
                      </p>
                    </div>
                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLS[m.status] ?? 'bg-slate-100 text-slate-500')}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                      {canWrite && (
                        <button type="button" onClick={() => onEdit(m.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

// ── Halaman Utama ──────────────────────────────────────────────────────────────

export function WargaListPage() {
  const { user } = useAuthStore()
  const [viewMode, setViewMode] = useState<'list' | 'kk'>('list')

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

  const [kkList, setKkList] = useState<KartuKeluarga[]>([])
  const [kkLoading, setKkLoading] = useState(false)
  const [kkError, setKkError] = useState('')

  const [detailId, setDetailId] = useState<string | null>(null)
  const [formId, setFormId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [showDeleted, setShowDeleted] = useState(false)
  const [deletedList, setDeletedList] = useState<WargaFull[]>([])
  const [deletedLoading, setDeletedLoading] = useState(false)
  const [deletedError, setDeletedError] = useState('')
  const [restoreMsg, setRestoreMsg] = useState('')

  const canWrite = hasPerm(user, 'tambah_edit_warga')
  const canExport = hasPerm(user, 'export_import_warga')
  const canDelete = hasPerm(user, 'hapus_restore_warga')
  const canSeeKK = hasPerm(user, 'tambah_edit_warga')

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const result = await listWarga({ page: p, search: search || undefined, blok: filterBlok || undefined, status: filterStatus || undefined })
      setWargaList(result.data)
      if (result.pagination) setPagination(result.pagination)
    } catch {
      setError('Gagal memuat data warga.')
    } finally {
      setLoading(false)
    }
  }

  async function loadKK() {
    setKkLoading(true)
    setKkError('')
    try {
      const data = await listKK()
      setKkList(data.sort((a, b) => a.noKk.localeCompare(b.noKk)))
    } catch {
      setKkError('Gagal memuat data kartu keluarga.')
    } finally {
      setKkLoading(false)
    }
  }

  useEffect(() => {
    if (viewMode === 'list') { void load(1); setPage(1) }
    else void loadKK()
  }, [viewMode, search, filterBlok, filterStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (viewMode === 'list') void load(page)
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleDelete(id: string, nama: string) {
    setDeleteTarget({ id, nama })
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteWarga(deleteTarget.id)
      setDeleteTarget(null)
      void load(page)
      if (viewMode === 'kk') void loadKK()
    } catch {
      alert('Gagal menghapus data warga.')
    } finally {
      setDeleting(false)
    }
  }

  async function handleVerify(wargaId: string, action: 'active' | 'rejected') {
    try {
      await verifyWarga(wargaId, { status: action })
      void load(page)
      if (viewMode === 'kk') void loadKK()
    } catch {
      alert('Gagal mengubah status akun warga.')
    }
  }

  async function handleExport(fmt: 'excel' | 'pdf') {
    try {
      const blob = await exportWarga(fmt, { blok: filterBlok || undefined, status: filterStatus || undefined })
      downloadBlob(blob, `data-warga.${fmt === 'excel' ? 'xlsx' : 'pdf'}`)
    } catch {
      alert('Gagal mengekspor data warga.')
    }
  }

  async function loadDeleted() {
    setDeletedLoading(true)
    setDeletedError('')
    try {
      const data = await listDeletedWarga()
      setDeletedList(data)
    } catch {
      setDeletedError('Gagal memuat data warga terhapus.')
    } finally {
      setDeletedLoading(false)
    }
  }

  useEffect(() => {
    if (showDeleted) void loadDeleted()
  }, [showDeleted]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRestore(id: string, nama: string) {
    setRestoreMsg('')
    try {
      await restoreWarga(id)
      void loadDeleted()
      void load(page)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setRestoreMsg(msg ?? `Gagal memulihkan data warga "${nama}".`)
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
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
      {detailId && (
        <WargaDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          onDeleted={() => { setDetailId(null); void load(page) }}
        />
      )}
      {formId !== null && (
        <WargaFormModal
          id={formId === 'new' ? undefined : formId}
          onClose={() => setFormId(null)}
          onSuccess={() => { setFormId(null); void load(1); setPage(1) }}
        />
      )}
      {deleteTarget && (
        <ConfirmDeleteModal
          title="Hapus Data Warga"
          description={`Anda akan menghapus data warga "${deleteTarget.nama}". Tautan ke akun pengguna juga akan dilepas.`}
          onConfirm={() => void confirmDelete()}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Data Warga</h1>
        <div className="flex flex-wrap items-center gap-2">
          {canExport && (
            <>
              <button type="button" onClick={() => void handleExport('excel')}
                title="Export Excel"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <Download className="h-3.5 w-3.5" /> Excel
              </button>
              <button type="button" onClick={() => void handleExport('pdf')}
                title="Export PDF"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                title="Import Excel"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700">
                <Upload className="h-3.5 w-3.5" /> Import
              </button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => void handleImport(e)} />
            </>
          )}
          {canWrite && (
            <button type="button" onClick={() => setFormId('new')}
              className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700">
              <Plus className="h-3.5 w-3.5" /> Tambah Warga
            </button>
          )}
        </div>
      </div>

      {importMsg && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-900/20 dark:text-blue-300">
          {importMsg}
        </div>
      )}

      {/* Mode toggle */}
      {canSeeKK && (
        <div className="mb-4 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 w-fit">
          <button type="button" onClick={() => setViewMode('list')}
            className={cn('rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')}>
            Semua Warga
          </button>
          <button type="button" onClick={() => setViewMode('kk')}
            className={cn('flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-colors',
              viewMode === 'kk' ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200')}>
            <Users className="h-3.5 w-3.5" /> Per Kartu Keluarga
          </button>
        </div>
      )}

      {/* ── VIEW: Per KK ── */}
      {viewMode === 'kk' && (
        <div className="space-y-4">
          {kkLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : kkError ? (
            <p className="text-sm text-red-600">{kkError}</p>
          ) : kkList.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-slate-400">Belum ada Kartu Keluarga terdaftar.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {kkList.length} Kartu Keluarga terdaftar
              </p>
              {kkList.map((kk) => (
                <KKGroupCard key={kk.id} kk={kk} canWrite={canWrite} canDelete={canDelete} onDelete={handleDelete} onOpenDetail={setDetailId} onEdit={setFormId} />
              ))}
            </>
          )}
        </div>
      )}

      {/* ── VIEW: Flat List ── */}
      {viewMode === 'list' && (
        <>
          {/* Filters */}
          <div className="mb-4 flex flex-wrap gap-2">
            <input type="text" placeholder="Cari nama / NIK..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white min-w-40" />
            <input type="text" placeholder="Blok"
              value={filterBlok} onChange={(e) => setFilterBlok(e.target.value)}
              className="w-20 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white" />
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white">
              <option value="">Semua Status</option>
              {Object.entries(STATUS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {error && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>}

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Nama</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">NIK</th>
                  {canSeeKK && (
                    <>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">No. KK</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Hubungan</th>
                    </>
                  )}
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Blok / No.</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                  {(canWrite || canDelete) && <th className="px-5 py-3" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan={10} className="py-10 text-center text-slate-400">Memuat...</td></tr>
                ) : wargaList.length === 0 ? (
                  <tr><td colSpan={10} className="py-10 text-center text-slate-400">Tidak ada data warga.</td></tr>
                ) : (
                  wargaList.map((w) => {
                    const full = w as Record<string, string | null | undefined>
                    const nik = full.nik ?? full.nikMasked ?? '—'
                    const noKk = full.noKk ?? full.noKkMasked
                    const kkId = full.kartuKeluargaId
                    const hubungan = full.hubunganKeluargaLabel ?? (full.hubunganKeluarga
                      ? (HUBUNGAN_LABEL[full.hubunganKeluarga as keyof typeof HUBUNGAN_LABEL] ?? full.hubunganKeluarga)
                      : null)
                    return (
                      <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-3.5">
                          <button type="button" onClick={() => setDetailId(w.id)} className="text-left font-semibold text-primary-600 hover:underline dark:text-primary-400">
                            {w.namaLengkap}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{nik}</td>
                        {canSeeKK && (
                          <>
                            <td className="px-5 py-3.5 font-mono text-xs">
                              {noKk && kkId
                                ? <Link to={`/kk/${kkId}`} className="text-primary-600 hover:underline dark:text-primary-400">{noKk}</Link>
                                : <span className="text-slate-300 dark:text-slate-600">—</span>}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-slate-500">
                              {hubungan ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                            </td>
                          </>
                        )}
                        <td className="px-5 py-3.5 text-xs text-slate-500">
                          {w.blok ? `${w.blok} / ${w.noRumah ?? '—'}` : '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_CLS[w.status] ?? 'bg-slate-100 text-slate-500')}>
                            {STATUS_LABEL[w.status] ?? w.status}
                          </span>
                        </td>
                        {(canWrite || canDelete) && (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1">
                              {canWrite && (() => {
                                const us = (w as WargaFull).userStatus
                                if (!us) return null
                                const cfg =
                                  us === 'pending' ? { label: 'Verifikasi', cls: 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400', action: 'active' as const } :
                                  us === 'active'  ? { label: 'Blokir',     cls: 'text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400',   action: 'rejected' as const } :
                                                     { label: 'Aktifkan',   cls: 'text-sky-700 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400',           action: 'active' as const }
                                return (
                                  <button type="button" onClick={() => void handleVerify(w.id, cfg.action)}
                                    className={cn('rounded-lg px-2.5 py-1 text-xs font-medium', cfg.cls)}>
                                    {cfg.label}
                                  </button>
                                )
                              })()}
                              {canWrite && (
                                <button type="button" onClick={() => setFormId(w.id)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700"
                                  title="Edit warga">
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button type="button" onClick={() => void handleDelete(w.id, w.namaLengkap)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                                  title="Hapus warga">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          {!loading && wargaList.length > 0 && (
            <div className="space-y-3 sm:hidden">
              {wargaList.map((w) => {
                const full = w as Record<string, string | null | undefined>
                const nik = full.nik ?? full.nikMasked
                const noKk = full.noKk ?? full.noKkMasked
                const kkId = full.kartuKeluargaId
                return (
                  <div key={w.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                    <div className="flex items-start justify-between px-4 py-3">
                      <div className="min-w-0">
                        <button type="button" onClick={() => setDetailId(w.id)} className="text-left font-semibold text-primary-600 hover:underline dark:text-primary-400">
                          {w.namaLengkap}
                        </button>
                        {nik && <p className="font-mono text-xs text-slate-400">{nik}</p>}
                        {noKk && kkId && (
                          <Link to={`/kk/${kkId}`} className="font-mono text-xs text-slate-400 hover:underline">
                            KK: {noKk}
                          </Link>
                        )}
                        <p className="mt-0.5 text-xs text-slate-500">
                          {w.blok ? `Blok ${w.blok} / No. ${w.noRumah ?? '—'}` : ''}
                        </p>
                      </div>
                      <span className={cn('ml-2 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', STATUS_CLS[w.status] ?? 'bg-slate-100 text-slate-500')}>
                        {STATUS_LABEL[w.status] ?? w.status}
                      </span>
                    </div>
                    {(canWrite || canDelete) && (
                      <div className="flex flex-wrap justify-end gap-1 border-t border-slate-50 px-3 py-2 dark:border-slate-800">
                        {canWrite && (() => {
                          const us = (w as WargaFull).userStatus
                          if (!us) return null
                          const cfg =
                            us === 'pending' ? { label: 'Verifikasi', cls: 'text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-900/20', action: 'active' as const } :
                            us === 'active'  ? { label: 'Blokir',     cls: 'text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20',           action: 'rejected' as const } :
                                               { label: 'Aktifkan',   cls: 'text-sky-700 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-900/20',                  action: 'active' as const }
                          return (
                            <button type="button" onClick={() => void handleVerify(w.id, cfg.action)}
                              className={cn('flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium', cfg.cls)}>
                              {cfg.label}
                            </button>
                          )
                        })()}
                        {canWrite && (
                          <button type="button" onClick={() => setFormId(w.id)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                            <Edit2 className="h-3 w-3" /> Edit
                          </button>
                        )}
                        {canDelete && (
                          <button type="button" onClick={() => void handleDelete(w.id, w.namaLengkap)}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="h-3 w-3" /> Hapus
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {loading && (
            <div className="flex justify-center py-12 sm:hidden">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            </div>
          )}

          {!loading && wargaList.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-400 dark:border-slate-700 dark:bg-slate-900 sm:hidden">
              Tidak ada data warga.
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="text-xs">Menampilkan {wargaList.length} dari {pagination.total} data</span>
              <div className="flex gap-2">
                <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                  ← Sebelumnya
                </button>
                <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700">
                  {page} / {pagination.totalPages}
                </span>
                <button type="button" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
                  Berikutnya →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Data Warga Terhapus (admin only) ── */}
      {canDelete && (
        <div className="mt-8 border-t border-dashed border-red-200 pt-6 dark:border-red-900/30">
          <button
            type="button"
            onClick={() => setShowDeleted((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash2 className="h-4 w-4" />
            {showDeleted ? 'Sembunyikan' : 'Tampilkan'} Data Warga Terhapus
            <ChevronDown className={cn('h-4 w-4 transition-transform', showDeleted && 'rotate-180')} />
          </button>

          {showDeleted && (
            <div className="mt-4">
              {restoreMsg && (
                <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {restoreMsg}
                </div>
              )}
              {deletedLoading ? (
                <div className="flex justify-center py-8">
                  <div className="h-7 w-7 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
                </div>
              ) : deletedError ? (
                <p className="text-sm text-red-600">{deletedError}</p>
              ) : deletedList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-slate-700">
                  Tidak ada data warga yang terhapus.
                </div>
              ) : (
                <>
                  {/* Desktop */}
                  <div className="hidden overflow-hidden rounded-2xl border border-red-100 bg-white dark:border-red-900/20 dark:bg-slate-900 sm:block">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-red-50 bg-red-50/60 dark:border-red-900/20 dark:bg-red-900/10">
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-red-400">Nama</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-red-400">NIK</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-red-400">Blok / No.</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-red-400">Tgl Hapus</th>
                          <th className="px-5 py-3" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-50 dark:divide-red-900/10">
                        {deletedList.map((w) => (
                          <tr key={w.id} className="bg-red-50/20 dark:bg-red-900/5">
                            <td className="px-5 py-3 font-medium text-slate-600 dark:text-slate-300">{w.namaLengkap}</td>
                            <td className="px-5 py-3 font-mono text-xs text-slate-500">{w.nik ?? '—'}</td>
                            <td className="px-5 py-3 text-xs text-slate-500">{w.blok ? `${w.blok} / ${w.noRumah ?? '—'}` : '—'}</td>
                            <td className="px-5 py-3 text-xs text-slate-400">
                              {w.deletedAt ? new Date(w.deletedAt).toLocaleDateString('id-ID') : '—'}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button type="button"
                                onClick={() => void handleRestore(w.id, w.namaLengkap)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40">
                                <RotateCcw className="h-3.5 w-3.5" /> Pulihkan
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile */}
                  <div className="space-y-3 sm:hidden">
                    {deletedList.map((w) => (
                      <div key={w.id} className="overflow-hidden rounded-2xl border border-red-100 bg-white dark:border-red-900/20 dark:bg-slate-900">
                        <div className="flex items-start justify-between px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{w.namaLengkap}</p>
                            {w.nik && <p className="font-mono text-xs text-slate-400">{w.nik}</p>}
                            {w.blok && <p className="mt-0.5 text-xs text-slate-500">Blok {w.blok} / No. {w.noRumah ?? '—'}</p>}
                            {w.deletedAt && (
                              <p className="mt-0.5 text-xs text-slate-400">Dihapus: {new Date(w.deletedAt).toLocaleDateString('id-ID')}</p>
                            )}
                          </div>
                          <span className="ml-2 shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            Terhapus
                          </span>
                        </div>
                        <div className="flex justify-end border-t border-slate-50 px-3 py-2 dark:border-slate-800">
                          <button type="button"
                            onClick={() => void handleRestore(w.id, w.namaLengkap)}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400">
                            <RotateCcw className="h-3 w-3" /> Pulihkan
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
