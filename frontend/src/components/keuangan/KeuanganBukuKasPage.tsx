import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  ClipboardList,
  Plus,
  Settings2,
  TrendingUp,
  Wallet,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { getBukuKas } from '../../services/keuanganService'
import type { BukuKasData, BukuKasEntry } from '../../types/keuangan'

const BULAN_OPTS = [
  { value: 0, label: 'Semua Bulan' },
  { value: 1, label: 'Januari' }, { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' }, { value: 4, label: 'April' },
  { value: 5, label: 'Mei' }, { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' }, { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' }, { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' }, { value: 12, label: 'Desember' },
]

function formatRp(val: string | number): string {
  const n = Number(val)
  if (isNaN(n)) return '—'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n)
}

function formatTanggal(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// ─── Summary card ─────────────────────────────────────────────────────────────

function SummaryCard({
  label, value, icon: Icon, cls,
}: {
  label: string
  value: string
  icon: React.ElementType
  cls: { bg: string; icon: string; value: string }
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900')}>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', cls.bg)}>
        <Icon className={cn('h-5 w-5', cls.icon)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <p className={cn('truncate text-base font-bold', cls.value)}>{value}</p>
      </div>
    </div>
  )
}

// ─── Mobile card entry ────────────────────────────────────────────────────────

function BukuKasCard({ entry, isSaldoAwal }: { entry?: BukuKasEntry; isSaldoAwal?: boolean }) {
  if (isSaldoAwal) {
    return (
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
        <div>
          <p className="text-xs font-semibold italic text-slate-500 dark:text-slate-400">Saldo Awal</p>
          <p className="text-[10px] text-slate-400">Pembukaan kas</p>
        </div>
        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
          {entry ? formatRp(entry.saldo) : ''}
        </span>
      </div>
    )
  }

  if (!entry) return null

  const isPemasukan = entry.tipe === 'pemasukan'
  const isIuran = entry.sumber === 'iuran'

  return (
    <div className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800/60">
      <div className="flex items-start justify-between gap-2">
        {/* Left: icon + keterangan */}
        <div className="flex min-w-0 items-start gap-2.5">
          <div className={cn(
            'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            isIuran
              ? 'bg-blue-50 dark:bg-blue-900/30'
              : isPemasukan
                ? 'bg-emerald-50 dark:bg-emerald-900/30'
                : 'bg-rose-50 dark:bg-rose-900/30',
          )}>
            {isPemasukan
              ? <ArrowDownLeft className={cn('h-3.5 w-3.5', isIuran ? 'text-blue-500' : 'text-emerald-500')} />
              : <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">
              {entry.keterangan}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
              {formatTanggal(entry.tanggal)} ·{' '}
              <span className={cn(
                'rounded px-1 py-0.5 font-medium',
                isIuran
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 dark:text-slate-400',
              )}>
                {entry.kategori}
              </span>
            </p>
          </div>
        </div>

        {/* Right: jumlah + saldo */}
        <div className="shrink-0 text-right">
          <p className={cn(
            'text-sm font-bold',
            isPemasukan ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
          )}>
            {isPemasukan ? '+' : '-'}{formatRp(entry.jumlah)}
          </p>
          <p className={cn(
            'text-[10px] font-medium',
            Number(entry.saldo) >= 0 ? 'text-indigo-500 dark:text-indigo-400' : 'text-rose-500',
          )}>
            Saldo: {formatRp(entry.saldo)}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Desktop table row ────────────────────────────────────────────────────────

function BukuKasRow({ entry, isSaldoAwal }: { entry?: BukuKasEntry; isSaldoAwal?: boolean }) {
  if (isSaldoAwal) {
    return (
      <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40">
        <td className="px-4 py-2.5 text-center text-xs text-slate-400">—</td>
        <td className="px-4 py-2.5 text-xs text-slate-400">—</td>
        <td className="px-4 py-2.5 text-xs font-semibold italic text-slate-500 dark:text-slate-400">
          Saldo Awal
        </td>
        <td className="px-4 py-2.5" />
        <td className="px-4 py-2.5" />
        <td className="px-4 py-2.5 text-right text-xs font-semibold text-indigo-600 dark:text-indigo-400">
          {entry ? formatRp(entry.saldo) : ''}
        </td>
      </tr>
    )
  }

  if (!entry) return null

  const isPemasukan = entry.tipe === 'pemasukan'
  const isIuran = entry.sumber === 'iuran'

  return (
    <tr className="border-b border-slate-50 transition-colors hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/30">
      <td className="px-4 py-3 text-center text-xs text-slate-400 dark:text-slate-500">{entry.no}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
        {formatTanggal(entry.tanggal)}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className={cn(
            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
            isIuran ? 'bg-blue-50 dark:bg-blue-900/30'
              : isPemasukan ? 'bg-emerald-50 dark:bg-emerald-900/30'
              : 'bg-rose-50 dark:bg-rose-900/30',
          )}>
            {isPemasukan
              ? <ArrowDownLeft className={cn('h-3 w-3', isIuran ? 'text-blue-500' : 'text-emerald-500')} />
              : <ArrowUpRight className="h-3 w-3 text-rose-500" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm text-slate-800 dark:text-slate-200 leading-tight">{entry.keterangan}</p>
            <span className={cn(
              'mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium',
              isIuran
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
            )}>
              {entry.kategori}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        {isPemasukan && (
          <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            {formatRp(entry.jumlah)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        {!isPemasukan && (
          <span className="text-sm font-semibold text-rose-600 dark:text-rose-400">
            {formatRp(entry.jumlah)}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={cn(
          'text-sm font-semibold',
          Number(entry.saldo) >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-rose-600 dark:text-rose-400',
        )}>
          {formatRp(entry.saldo)}
        </span>
      </td>
    </tr>
  )
}

// ─── Halaman utama ────────────────────────────────────────────────────────────

export function KeuanganBukuKasPage() {
  const { user } = useAuthStore()
  const canKelola = hasPerm(user, 'kelola_keuangan')
  const canKonfirmasi = hasPerm(user, 'konfirmasi_iuran')

  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const [tahun, setTahun] = useState(currentYear)
  const [bulan, setBulan] = useState(0) // 0 = semua
  const [data, setData] = useState<BukuKasData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void load()
  }, [tahun, bulan]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const result = await getBukuKas({ tahun, bulan: bulan || undefined })
      setData(result)
    } catch {
      setError('Gagal memuat data buku kas.')
    } finally {
      setLoading(false)
    }
  }

  const SELECT = cn(
    'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none',
    'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
    'dark:border-slate-700 dark:bg-slate-900 dark:text-white',
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <BookOpen className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Buku Kas RT</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pembukuan keuangan Rukun Tetangga — transparan untuk semua warga
            </p>
          </div>
        </div>

        {/* Aksi (hanya tampil jika punya izin) */}
        {(canKelola || canKonfirmasi) && (
          <div className="flex flex-wrap items-center gap-2">
            {canKonfirmasi && (
              <Link
                to="/keuangan/iuran"
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <ClipboardList className="h-3.5 w-3.5" />
                Konfirmasi Iuran
              </Link>
            )}
            {canKelola && (
              <>
                <Link
                  to="/keuangan/pengaturan-iuran"
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Pengaturan
                </Link>
                <Link
                  to="/keuangan/baru"
                  className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Tambah Transaksi
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Filter ──────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <select value={tahun} onChange={(e) => setTahun(Number(e.target.value))} className={SELECT}>
          {[currentYear - 1, currentYear].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select value={bulan} onChange={(e) => setBulan(Number(e.target.value))} className={SELECT}>
          {BULAN_OPTS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        {bulan !== 0 && (
          <button
            type="button"
            onClick={() => setBulan(0)}
            className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          >
            Reset bulan
          </button>
        )}
      </div>

      {/* ── Summary cards ───────────────────────────────────────── */}
      {data && !loading && (
        <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard
            label="Saldo Awal"
            value={formatRp(data.saldo_awal)}
            icon={Wallet}
            cls={{ bg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-500 dark:text-slate-400', value: 'text-slate-700 dark:text-slate-200' }}
          />
          <SummaryCard
            label="Total Masuk"
            value={formatRp(data.total_masuk)}
            icon={ArrowDownLeft}
            cls={{ bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', value: 'text-emerald-700 dark:text-emerald-300' }}
          />
          <SummaryCard
            label="Total Keluar"
            value={formatRp(data.total_keluar)}
            icon={ArrowUpRight}
            cls={{ bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-600 dark:text-rose-400', value: 'text-rose-700 dark:text-rose-300' }}
          />
          <SummaryCard
            label="Saldo Akhir"
            value={formatRp(data.saldo_akhir)}
            icon={TrendingUp}
            cls={{ bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400', value: 'text-indigo-700 dark:text-indigo-300' }}
          />
        </div>
      )}

      {/* ── Buku kas (mobile = card, desktop = table) ─────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">

        {/* Header legenda */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Legenda:</span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" /> Masuk
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <ArrowUpRight className="h-3.5 w-3.5 text-rose-500" /> Keluar
          </span>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-400" /> Iuran
          </span>
        </div>

        {/* ── Loading / Error ─────────────────────────────────── */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        )}
        {!loading && error && (
          <p className="py-12 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && !data && (
          <p className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">Tidak ada data.</p>
        )}

        {/* ── MOBILE: card list (hidden on lg+) ───────────────── */}
        {!loading && !error && data && (
          <div className="lg:hidden">
            {/* Saldo awal row */}
            <BukuKasCard
              isSaldoAwal
              entry={{ no: 0, id: '', tanggal: '', keterangan: '', kategori: '', tipe: 'pemasukan', jumlah: data.saldo_awal, saldo: data.saldo_awal, sumber: 'manual' }}
            />

            {data.entries.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                Tidak ada transaksi pada periode ini.
              </p>
            ) : (
              data.entries.map((entry) => <BukuKasCard key={entry.id} entry={entry} />)
            )}

            {/* Mobile footer total */}
            {data.entries.length > 0 && (
              <div className="border-t-2 border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Periode</span>
                  <div className="text-right">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                      Masuk: {formatRp(data.total_masuk)}
                    </p>
                    <p className="text-xs text-rose-600 dark:text-rose-400">
                      Keluar: {formatRp(data.total_keluar)}
                    </p>
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      Saldo: {formatRp(data.saldo_akhir)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── DESKTOP: table (hidden below lg) ────────────────── */}
        {!loading && !error && data && (
          <div className="hidden overflow-x-auto lg:block">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="w-12 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">No</th>
                  <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">Keterangan</th>
                  <th className="w-36 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-emerald-500">Masuk (Rp)</th>
                  <th className="w-36 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-rose-500">Keluar (Rp)</th>
                  <th className="w-36 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-indigo-500">Saldo (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {/* Baris saldo awal */}
                <BukuKasRow
                  isSaldoAwal
                  entry={{ no: 0, id: '', tanggal: '', keterangan: '', kategori: '', tipe: 'pemasukan', jumlah: data.saldo_awal, saldo: data.saldo_awal, sumber: 'manual' }}
                />

                {data.entries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-sm text-slate-400 dark:text-slate-500">
                      Tidak ada transaksi pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.entries.map((entry) => <BukuKasRow key={entry.id} entry={entry} />)
                )}
              </tbody>

              {data.entries.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                    <td colSpan={3} className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Total Periode
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRp(data.total_masuk)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-rose-600 dark:text-rose-400">
                      {formatRp(data.total_keluar)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {formatRp(data.saldo_akhir)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}

        {/* Footer info */}
        {data && !loading && (
          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {data.entries.length} transaksi ·{' '}
              {data.entries.filter((e) => e.sumber === 'iuran').length} iuran ·{' '}
              {data.entries.filter((e) => e.sumber === 'manual').length} manual
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
