import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, Upload, X, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { listJenisIuran, getMyIuran, uploadIuran } from '../../services/keuanganService'
import type { JenisIuran, MyIuran } from '../../types/keuangan'

const BULAN_LABELS = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'pdf']
const MAX_SIZE_MB = 5

const STATUS_CLS = {
  lunas: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  ditolak: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}
const STATUS_LABEL = { lunas: 'Lunas', pending: 'Menunggu', ditolak: 'Ditolak' }

function formatRupiah(val: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

// ─── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({
  jenis, bulan, tahun, onClose, onSuccess,
}: {
  jenis: JenisIuran
  bulan: number
  tahun: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [jumlah, setJumlah] = useState(String(Math.round(Number(jenis.nominal))))
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function validateFile(f: File): string {
    const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
    if (!ALLOWED_EXTS.includes(ext)) return `Ekstensi tidak diizinkan: .${ext}. Gunakan: ${ALLOWED_EXTS.join(', ')}`
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Ukuran file maksimal ${MAX_SIZE_MB}MB.`
    return ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Pilih file bukti transfer terlebih dahulu.'); return }
    if (fileError) { setError(fileError); return }
    if (!jumlah || Number(jumlah) <= 0) { setError('Jumlah iuran harus lebih dari 0.'); return }
    setLoading(true)
    setError('')
    try {
      await uploadIuran({ jenisId: jenis.id, bulan, tahun, jumlah: parseFloat(jumlah), bukti_transfer: file })
      onSuccess()
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Gagal mengupload bukti transfer.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-slate-900 sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Upload Bukti — {jenis.nama}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {BULAN_LABELS[bulan]} {tahun} · Nominal: {formatRupiah(jenis.nominal)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 p-5">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Jumlah Iuran (Rp) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={jumlah ? new Intl.NumberFormat('id-ID').format(Number(jumlah)) : ''}
              onChange={(e) => setJumlah(e.target.value.replace(/[^0-9]/g, ''))}
              required
              placeholder="0"
              className={INPUT}
            />
            {jenis.keterangan && (
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{jenis.keterangan}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Bukti Transfer <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null
                setFile(f)
                setFileError(f ? validateFile(f) : '')
              }}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100 dark:text-slate-400 dark:file:bg-primary-900/20 dark:file:text-primary-300"
            />
            {fileError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fileError}</p>}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Format: JPG, PNG, WebP, PDF. Maks. 5MB.</p>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !!fileError}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {loading ? 'Mengupload...' : 'Upload Bukti'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Kartu jenis iuran ─────────────────────────────────────────────────────────

function JenisCard({
  jenis, iuranBulanIni, onUpload,
}: {
  jenis: JenisIuran
  iuranBulanIni: MyIuran | undefined
  onUpload: () => void
}) {
  const isWajib = jenis.tipe === 'wajib'
  const status = iuranBulanIni?.status

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition dark:bg-slate-900',
      isWajib ? 'border-primary-100 dark:border-primary-900/40' : 'border-slate-200 dark:border-slate-700',
    )}>
      {isWajib && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-primary-400 to-primary-500" />
      )}

      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 dark:text-white">{jenis.nama}</h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {jenis.unit === 'per_kk' ? 'Per KK' : 'Per Orang'} ·{' '}
            {formatRupiah(jenis.nominal)}/bulan
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={cn(
            'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
            isWajib
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
          )}>
            {isWajib ? 'Wajib' : 'Opsional'}
          </span>
        </div>
      </div>

      {jenis.keterangan && (
        <p className="mb-3 text-xs text-slate-400 dark:text-slate-500">{jenis.keterangan}</p>
      )}

      {status ? (
        <div className="flex items-center justify-between">
          <span className={cn('flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium', STATUS_CLS[status])}>
            {status === 'lunas' ? <CheckCircle2 className="h-3.5 w-3.5" /> : status === 'pending' ? <Clock className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {STATUS_LABEL[status]}
          </span>
          {status === 'ditolak' && (
            <button
              type="button"
              onClick={onUpload}
              className="rounded-xl bg-primary-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-primary-700"
            >
              Upload Ulang
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={onUpload}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl py-2 text-sm font-semibold transition',
            isWajib
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
          )}
        >
          <Upload className="h-4 w-4" />
          Upload Bukti
        </button>
      )}
    </div>
  )
}

// ─── Halaman utama ─────────────────────────────────────────────────────────────

export function IuranUploadPage() {
  const currentYear = new Date().getFullYear()
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(currentYear)
  const [jenisList, setJenisList] = useState<JenisIuran[]>([])
  const [riwayat, setRiwayat] = useState<MyIuran[]>([])
  const [loadingJenis, setLoadingJenis] = useState(true)
  const [uploadTarget, setUploadTarget] = useState<JenisIuran | null>(null)
  const prevBulanTahun = useRef({ bulan, tahun })

  useEffect(() => {
    listJenisIuran(true)
      .then(setJenisList)
      .catch(() => undefined)
      .finally(() => setLoadingJenis(false))
  }, [])

  useEffect(() => {
    loadRiwayat()
  }, [bulan, tahun]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadRiwayat() {
    try {
      const data = await getMyIuran(tahun)
      setRiwayat(data)
    } catch {
      // riwayat tidak kritis
    }
  }

  // Iuran bulan ini per jenis
  function getIuranBulanIni(jenisId: string): MyIuran | undefined {
    return riwayat.find((r) => r.jenis?.id === jenisId && r.bulan === bulan && r.tahun === tahun)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">
      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Upload Bukti Iuran</h1>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">Pilih jenis iuran dan upload bukti pembayaran</p>

      {/* Pilih periode */}
      <div className="mb-5 flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Bulan</label>
          <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={INPUT}>
            {BULAN_LABELS.slice(1).map((b, i) => <option key={i + 1} value={i + 1}>{b}</option>)}
          </select>
        </div>
        <div className="w-28">
          <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Tahun</label>
          <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={INPUT}>
            {[currentYear - 1, currentYear].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Daftar jenis iuran */}
      {loadingJenis ? (
        <div className="flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : jenisList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400 dark:border-slate-700 dark:text-slate-500">
          Belum ada jenis iuran yang dikonfigurasi.
        </div>
      ) : (
        <div className="space-y-3">
          {jenisList.map((jenis) => (
            <JenisCard
              key={jenis.id}
              jenis={jenis}
              iuranBulanIni={getIuranBulanIni(jenis.id)}
              onUpload={() => setUploadTarget(jenis)}
            />
          ))}
        </div>
      )}

      {/* Riwayat semua iuran tahun ini */}
      {riwayat.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Riwayat Iuran {tahun}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Periode</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Jenis</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-400">Jumlah</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {riwayat.map((r) => {
                  const st = STATUS_CLS[r.status] ?? ''
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{BULAN_LABELS[r.bulan]} {r.tahun}</td>
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.jenis?.nama ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">{formatRupiah(r.jumlah)}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', st)}>
                          {STATUS_LABEL[r.status]}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal upload */}
      {uploadTarget && (
        <UploadModal
          jenis={uploadTarget}
          bulan={bulan}
          tahun={tahun}
          onClose={() => setUploadTarget(null)}
          onSuccess={loadRiwayat}
        />
      )}
    </div>
  )
}
