import { CheckCircle2, ChevronDown, Clock, FileText, X, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'
import { listPermohonan, reviewPermohonan } from '@/services/suratService'
import type { PermohonanSurat, ReviewPermohonanPayload, StatusPermohonan } from '@/types/surat'

const BULAN = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des']

function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${BULAN[d.getMonth() + 1]} ${d.getFullYear()}`
}

const STATUS_CFG: Record<StatusPermohonan, { label: string; cls: string; icon: React.ElementType }> = {
  diajukan:  { label: 'Diajukan',  cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',       icon: Clock },
  diproses:  { label: 'Diproses',  cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',   icon: Clock },
  disetujui: { label: 'Disetujui', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle2 },
  ditolak:   { label: 'Ditolak',   cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',           icon: XCircle },
  selesai:   { label: 'Selesai',   cls: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',       icon: CheckCircle2 },
}

const STATUS_OPTS: { value: StatusPermohonan | ''; label: string }[] = [
  { value: '',          label: 'Semua Status' },
  { value: 'diajukan',  label: 'Diajukan' },
  { value: 'diproses',  label: 'Diproses' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak',   label: 'Ditolak' },
  { value: 'selesai',   label: 'Selesai' },
]

const NEXT_STATUS: Record<StatusPermohonan, ReviewPermohonanPayload['status'][]> = {
  diajukan:  ['diproses', 'disetujui', 'ditolak'],
  diproses:  ['disetujui', 'ditolak'],
  disetujui: ['selesai'],
  ditolak:   [],
  selesai:   [],
}

const NEXT_LABEL: Record<string, string> = {
  diproses:  'Tandai Diproses',
  disetujui: 'Setujui',
  ditolak:   'Tolak',
  selesai:   'Tandai Selesai',
}

// ── Review Modal ───────────────────────────────────────────────

function ReviewModal({
  item,
  onClose,
  onDone,
}: {
  item: PermohonanSurat
  onClose: () => void
  onDone: (updated: PermohonanSurat) => void
}) {
  const nextActions = NEXT_STATUS[item.status]
  const [chosenStatus, setChosenStatus] = useState<ReviewPermohonanPayload['status']>(
    nextActions[0] ?? 'disetujui',
  )
  const [catatan, setCatatan] = useState(item.catatanAdmin ?? '')
  const [noSurat, setNoSurat] = useState(item.noSurat ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload: ReviewPermohonanPayload = {
        status: chosenStatus,
        catatan_admin: catatan,
        ...(noSurat.trim() && { no_surat: noSurat.trim() }),
      }
      const updated = await reviewPermohonan(item.id, payload)
      onDone(updated)
    } catch {
      setError('Gagal memperbarui status. Silakan coba lagi.')
    } finally {
      setSaving(false)
    }
  }

  const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Review Permohonan</h2>
            <p className="text-xs text-slate-400">{item.jenisNama} — {item.pemohonNama}</p>
          </div>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Permohonan info */}
        <div className="mx-6 mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/50">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div>
              <dt className="text-slate-400">Pemohon</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-200">{item.pemohonNama}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Tanggal</dt>
              <dd className="font-medium text-slate-700 dark:text-slate-200">{formatDate(item.createdAt)}</dd>
            </div>
            {item.keperluan && (
              <div className="col-span-2">
                <dt className="text-slate-400">Keperluan</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">{item.keperluan}</dd>
              </div>
            )}
            {Object.entries(item.dataForm).map(([k, v]) => (
              <div key={k} className="col-span-2">
                <dt className="capitalize text-slate-400">{k.replace(/_/g, ' ')}</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <form onSubmit={e => void handleSubmit(e)} className="px-6 pb-6">
          {nextActions.length === 0 ? (
            <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500 dark:bg-slate-800">
              Permohonan ini sudah dalam status final dan tidak dapat diubah lagi.
            </div>
          ) : (
            <>
              {/* Status selector */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Ubah Status
                </label>
                <div className="flex flex-wrap gap-2">
                  {nextActions.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setChosenStatus(s)}
                      className={cn(
                        'rounded-xl border px-4 py-2 text-sm font-medium transition',
                        chosenStatus === s
                          ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500 dark:bg-primary-900/20 dark:text-primary-400'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {NEXT_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>

              {/* No Surat (only for disetujui / selesai) */}
              {(chosenStatus === 'disetujui' || chosenStatus === 'selesai') && (
                <div className="mt-4">
                  <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    No. Surat <span className="text-slate-400">(opsional)</span>
                  </label>
                  <input
                    type="text"
                    className={INPUT}
                    value={noSurat}
                    onChange={e => setNoSurat(e.target.value)}
                    placeholder="mis. 001/RT04/VI/2025"
                  />
                </div>
              )}

              {/* Catatan */}
              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Catatan <span className="text-slate-400">(opsional)</span>
                </label>
                <textarea
                  rows={2}
                  className={INPUT}
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                  placeholder={chosenStatus === 'ditolak' ? 'Alasan penolakan…' : 'Catatan tambahan…'}
                />
              </div>
            </>
          )}

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="mt-5 flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Tutup
            </button>
            {nextActions.length > 0 && (
              <button type="submit" disabled={saving}
                className="rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
                {saving ? 'Menyimpan…' : 'Simpan Perubahan'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Halaman Kelola ─────────────────────────────────────────────

export function SuratKelolaPage() {
  const [list, setList] = useState<PermohonanSurat[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<StatusPermohonan | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [reviewed, setReviewed] = useState<PermohonanSurat | null>(null)

  function load(pg = 1, st = filterStatus) {
    setLoading(true)
    const params: Record<string, string> = { page: String(pg) }
    if (st) params.status = st
    listPermohonan(params)
      .then(r => {
        setList(r.data)
        setTotalPages(r.pagination?.totalPages ?? 1)
        setPage(pg)
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1) }, [])

  function handleFilterChange(st: StatusPermohonan | '') {
    setFilterStatus(st)
    load(1, st)
  }

  function handleDone(updated: PermohonanSurat) {
    setList(prev => prev.map(p => p.id === updated.id ? updated : p))
    setReviewed(null)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Kelola Surat Menyurat</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Tinjau dan proses permohonan surat warga</p>
        </div>

        {/* Filter status */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => handleFilterChange(e.target.value as StatusPermohonan | '')}
            className="w-48 appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3.5 pr-9 text-sm text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {STATUS_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">
            {filterStatus ? 'Tidak ada permohonan dengan status ini.' : 'Belum ada permohonan surat.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pemohon</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Jenis Surat</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Tanggal</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p, i) => {
                    const cfg = STATUS_CFG[p.status] ?? STATUS_CFG.diajukan
                    const StatusIcon = cfg.icon
                    return (
                      <tr
                        key={p.id}
                        className={cn(
                          'border-b border-slate-50 dark:border-slate-800/60',
                          i === list.length - 1 && 'border-b-0',
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{p.pemohonNama}</p>
                          <p className="text-xs text-slate-400">{p.pemohonEmail}</p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">{p.jenisNama}</td>
                        <td className="px-5 py-3.5 text-slate-500">{formatDate(p.createdAt)}</td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.cls)}>
                            <StatusIcon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setReviewed(p)}
                            className="rounded-lg border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            {NEXT_STATUS[p.status].length > 0 ? 'Review' : 'Detail'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                Hal {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {reviewed && (
        <ReviewModal item={reviewed} onClose={() => setReviewed(null)} onDone={handleDone} />
      )}
    </div>
  )
}
