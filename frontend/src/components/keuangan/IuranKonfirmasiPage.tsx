import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CheckCircle, ClipboardList, Eye, FileText, X, XCircle } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { konfirmasiIuran, listIuran, listJenisIuran } from '../../services/keuanganService'
import type { IuranStatus, IuranWarga, JenisIuran } from '../../types/keuangan'

const BULAN = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

const STATUS_BADGE: Record<IuranStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  lunas: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ditolak: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
}

const STATUS_LABEL: Record<IuranStatus, string> = {
  pending: 'Menunggu', lunas: 'Lunas', ditolak: 'Ditolak',
}

function formatRp(val: string | number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(Number(val))
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
}

// ─── Kartu iuran ─────────────────────────────────────────────────────────────

function IuranCard({
  iuran, busy, onTinjau, onSetujui,
}: {
  iuran: IuranWarga
  busy: boolean
  onTinjau: () => void
  onSetujui: () => void
}) {
  const isPending = iuran.status === 'pending'
  const buktiUrl = iuran.buktiUrl
  const isImg = !!buktiUrl && isImageUrl(buktiUrl)

  return (
    <div className={cn(
      'relative flex flex-col overflow-hidden rounded-2xl border bg-white transition-shadow hover:shadow-md dark:bg-slate-900',
      isPending
        ? 'border-amber-100 dark:border-amber-900/40'
        : 'border-slate-200 dark:border-slate-700',
    )}>
      {isPending && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-300 dark:from-amber-500 dark:to-amber-400" />
      )}

      {/* Thumbnail bukti — klik untuk buka drawer */}
      <button
        type="button"
        onClick={onTinjau}
        className="group relative block w-full overflow-hidden bg-slate-100 dark:bg-slate-800"
        aria-label="Lihat detail bukti"
      >
        {isImg ? (
          <img
            src={buktiUrl!}
            alt="Bukti transfer"
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : buktiUrl ? (
          <div className="flex h-28 items-center justify-center gap-2 text-slate-400 dark:text-slate-500">
            <FileText className="h-8 w-8" />
            <span className="text-sm font-medium">Dokumen PDF</span>
          </div>
        ) : (
          <div className="flex h-20 items-center justify-center text-xs text-slate-300 dark:text-slate-600">
            Tidak ada bukti
          </div>
        )}
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 via-transparent to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:bg-black/70 dark:text-white">
            <Eye className="h-3 w-3" />
            Lihat Detail
          </span>
        </div>
      </button>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {iuran.warga.namaLengkap}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Blok {iuran.warga.blok} / No. {iuran.warga.noRumah}
            </p>
          </div>
          <span className={cn('shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_BADGE[iuran.status])}>
            {STATUS_LABEL[iuran.status]}
          </span>
        </div>
        {iuran.jenis && (
          <div className="mb-2">
            <span className={cn(
              'rounded-lg px-2 py-0.5 text-[11px] font-medium',
              iuran.jenis.tipe === 'wajib'
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
            )}>
              {iuran.jenis.nama}
            </span>
          </div>
        )}

        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {BULAN[iuran.bulan]} {iuran.tahun}
          </span>
          <span className="font-bold text-slate-900 dark:text-white">{formatRp(iuran.jumlah)}</span>
        </div>

        {iuran.status === 'ditolak' && iuran.keterangan && (
          <div className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            <span className="font-medium">Alasan: </span>{iuran.keterangan}
          </div>
        )}
        {iuran.status === 'lunas' && iuran.confirmed_by && (
          <p className="mb-3 text-xs text-emerald-600 dark:text-emerald-400">
            ✓ {iuran.confirmed_by.namaLengkap}
            {iuran.confirmed_at && (
              <> · {new Date(iuran.confirmed_at).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}</>
            )}
          </p>
        )}

        <div className="mt-auto flex gap-2 pt-1">
          <button
            type="button"
            onClick={onTinjau}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Eye className="h-3.5 w-3.5" />
            {isPending ? 'Tinjau Bukti' : 'Lihat Detail'}
          </button>
          {isPending && (
            <button
              type="button"
              onClick={onSetujui}
              disabled={busy}
              title="Konfirmasi lunas langsung"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" />
                  Setujui
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Drawer detail iuran ──────────────────────────────────────────────────────

function DetailDrawer({
  iuran, keterangan, onKetChange, busy, onAksi, onClose,
}: {
  iuran: IuranWarga
  keterangan: string
  onKetChange: (v: string) => void
  busy: boolean
  onAksi: (aksi: 'lunas' | 'ditolak') => void
  onClose: () => void
}) {
  const isPending = iuran.status === 'pending'
  const buktiUrl = iuran.buktiUrl
  const isImg = !!buktiUrl && isImageUrl(buktiUrl)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl dark:bg-slate-900">

        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">{iuran.warga.namaLengkap}</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Blok {iuran.warga.blok} / No. {iuran.warga.noRumah}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Konten (scroll) */}
        <div className="flex-1 overflow-y-auto">

          {/* Info periode & nominal */}
          <div className="flex items-center justify-between border-b border-slate-50 px-5 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_BADGE[iuran.status])}>
                {STATUS_LABEL[iuran.status]}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {BULAN[iuran.bulan]} {iuran.tahun}
              </span>
            </div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              {formatRp(iuran.jumlah)}
            </span>
          </div>

          {/* Preview bukti */}
          <div className="border-b border-slate-50 dark:border-slate-800">
            {isImg ? (
              <a href={buktiUrl!} target="_blank" rel="noreferrer" title="Buka gambar penuh di tab baru">
                <img
                  src={buktiUrl!}
                  alt="Bukti transfer"
                  className="max-h-[55vh] w-full bg-slate-50 object-contain dark:bg-slate-800"
                />
              </a>
            ) : buktiUrl ? (
              <div className="flex flex-col items-center gap-4 bg-slate-50 py-10 dark:bg-slate-800">
                <FileText className="h-14 w-14 text-slate-300 dark:text-slate-600" />
                <a
                  href={buktiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
                >
                  Buka File PDF ↗
                </a>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10 text-slate-300 dark:text-slate-600">
                <FileText className="h-10 w-10" />
                <p className="text-sm">Tidak ada bukti transfer</p>
              </div>
            )}
          </div>

          {/* Info konfirmasi */}
          {iuran.confirmed_by && (
            <div className="border-b border-slate-50 px-5 py-3 dark:border-slate-800">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Diproses oleh{' '}
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {iuran.confirmed_by.namaLengkap}
                </span>
                {iuran.confirmed_at && (
                  <> pada {new Date(iuran.confirmed_at).toLocaleString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}</>
                )}
              </p>
            </div>
          )}

          {/* Keterangan */}
          <div className="px-5 py-4">
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Keterangan{' '}
              {isPending && (
                <span className="font-normal text-slate-400">
                  (opsional — catatan atau alasan penolakan)
                </span>
              )}
            </label>
            {isPending ? (
              <textarea
                value={keterangan}
                onChange={(e) => onKetChange(e.target.value)}
                rows={3}
                placeholder="Contoh: Bukti transfer sudah sesuai / Nominal tidak sesuai..."
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
              />
            ) : (
              <p className={cn(
                'min-h-[3rem] rounded-xl px-3 py-2.5 text-sm',
                iuran.keterangan
                  ? 'text-slate-700 dark:text-slate-300'
                  : 'italic text-slate-400 dark:text-slate-500',
              )}>
                {iuran.keterangan || 'Tidak ada keterangan.'}
              </p>
            )}
          </div>
        </div>

        {/* Footer aksi */}
        {isPending && (
          <div className="shrink-0 border-t border-slate-100 p-4 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onAksi('ditolak')}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:border-rose-800/50 dark:text-rose-400 dark:hover:bg-rose-900/20"
              >
                <XCircle className="h-4 w-4" />
                Tolak Iuran
              </button>
              <button
                type="button"
                onClick={() => onAksi('lunas')}
                disabled={busy}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {busy ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Halaman utama ────────────────────────────────────────────────────────────

export function IuranKonfirmasiPage() {
  const { user } = useAuthStore()
  const [allList, setAllList] = useState<IuranWarga[]>([])
  const [jenisList, setJenisList] = useState<JenisIuran[]>([])
  const [filterStatus, setFilterStatus] = useState<IuranStatus | ''>('pending')
  const [filterJenis, setFilterJenis] = useState<string>('')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [detail, setDetail] = useState<IuranWarga | null>(null)
  const [keterangan, setKeterangan] = useState('')
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const canAccess = hasPerm(user, 'konfirmasi_iuran')

  useEffect(() => {
    if (canAccess) {
      void load()
      listJenisIuran().then(setJenisList).catch(() => undefined)
    }
  }, [filterTahun, canAccess]) // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type })
    if (toastRef.current) clearTimeout(toastRef.current)
    toastRef.current = setTimeout(() => setToast(null), 4000)
  }

  async function load() {
    setLoading(true)
    try {
      const result = await listIuran({ tahun: filterTahun })
      setAllList(result.data)
    } catch {
      showToast('Gagal memuat data iuran.', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleAksi(iuran: IuranWarga, aksi: 'lunas' | 'ditolak', ket = '') {
    setActionLoading(iuran.id)
    try {
      await konfirmasiIuran(iuran.id, { status: aksi, keterangan: ket })
      showToast(
        aksi === 'lunas'
          ? `Iuran ${iuran.warga.namaLengkap} dikonfirmasi lunas.`
          : `Iuran ${iuran.warga.namaLengkap} ditolak.`,
        'success',
      )
      setDetail(null)
      setKeterangan('')
      setAllList((prev) =>
        prev.map((i) =>
          i.id === iuran.id ? { ...i, status: aksi, keterangan: ket } : i
        )
      )
    } catch {
      showToast('Gagal memproses konfirmasi.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const counts = {
    pending: allList.filter((i) => i.status === 'pending').length,
    lunas: allList.filter((i) => i.status === 'lunas').length,
    ditolak: allList.filter((i) => i.status === 'ditolak').length,
  }

  const filtered = allList
    .filter((i) => !filterStatus || i.status === filterStatus)
    .filter((i) => !filterJenis || i.jenis?.id === filterJenis)

  if (!canAccess) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Akses ditolak. Hanya bendahara dan admin.
        </p>
      </div>
    )
  }

  const FILTERS: Array<{
    value: IuranStatus | ''
    label: string
    count: number
    activeCls: string
  }> = [
    {
      value: 'pending', label: 'Menunggu', count: counts.pending,
      activeCls: 'bg-amber-500 text-white shadow-sm',
    },
    {
      value: 'lunas', label: 'Lunas', count: counts.lunas,
      activeCls: 'bg-emerald-600 text-white shadow-sm',
    },
    {
      value: 'ditolak', label: 'Ditolak', count: counts.ditolak,
      activeCls: 'bg-rose-600 text-white shadow-sm',
    },
    {
      value: '', label: 'Semua', count: allList.length,
      activeCls: 'bg-slate-800 text-white shadow-sm dark:bg-slate-200 dark:text-slate-900',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Toast notifikasi */}
      {toast && (
        <div className={cn(
          'fixed right-4 top-4 z-60 flex max-w-sm items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium shadow-xl',
          toast.type === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
            : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/50 dark:text-red-200',
        )}>
          {toast.type === 'success'
            ? <CheckCircle className="h-4 w-4 shrink-0" />
            : <XCircle className="h-4 w-4 shrink-0" />
          }
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/keuangan"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Kembali ke Buku Kas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <ClipboardList className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Konfirmasi Iuran</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Tinjau dan konfirmasi bukti pembayaran warga</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {jenisList.length > 0 && (
            <select
              value={filterJenis}
              onChange={(e) => setFilterJenis(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              <option value="">Semua Jenis</option>
              {jenisList.map((j) => (
                <option key={j.id} value={j.id}>{j.nama}</option>
              ))}
            </select>
          )}
          <select
            value={filterTahun}
            onChange={(e) => setFilterTahun(Number(e.target.value))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          >
            {[new Date().getFullYear() - 1, new Date().getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const isActive = filterStatus === f.value
          return (
            <button
              key={String(f.value)}
              type="button"
              onClick={() => setFilterStatus(f.value)}
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all',
                isActive
                  ? f.activeCls
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
              )}
            >
              {f.label}
              <span className={cn(
                'flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold',
                isActive
                  ? 'bg-white/20 text-inherit'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
              )}>
                {loading ? '…' : f.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Konten */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-20 dark:border-slate-700 dark:bg-slate-900/50">
          <ClipboardList className="mb-3 h-12 w-12 text-slate-200 dark:text-slate-700" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {filterStatus === 'pending'
              ? 'Tidak ada iuran yang menunggu konfirmasi'
              : 'Tidak ada data iuran'}
          </p>
          {filterStatus !== '' && (
            <button
              type="button"
              onClick={() => setFilterStatus('')}
              className="mt-3 text-xs text-primary-600 hover:underline dark:text-primary-400"
            >
              Lihat semua iuran
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((iuran) => (
            <IuranCard
              key={iuran.id}
              iuran={iuran}
              busy={actionLoading === iuran.id}
              onTinjau={() => { setDetail(iuran); setKeterangan(iuran.keterangan || '') }}
              onSetujui={() => void handleAksi(iuran, 'lunas', '')}
            />
          ))}
        </div>
      )}

      {/* Drawer detail */}
      {detail && (
        <DetailDrawer
          iuran={detail}
          keterangan={keterangan}
          onKetChange={setKeterangan}
          busy={actionLoading === detail.id}
          onAksi={(aksi) => void handleAksi(detail, aksi, keterangan)}
          onClose={() => { setDetail(null); setKeterangan('') }}
        />
      )}
    </div>
  )
}
