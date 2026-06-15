import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { getDashboardPengurus, getDashboardWarga } from '@/services/dashboardService'
import { useAuthStore } from '@/stores/authStore'
import type { DashboardPengurus, DashboardWarga } from '@/types/dashboard'

const PENGURUS_ROLES = ['admin', 'sekretaris', 'bendahara', 'pengurus']

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet'
  to?: string
  sub?: string
}

const COLOR_MAP = {
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    icon: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    icon: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    icon: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  },
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    icon: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  },
  violet: {
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    icon: 'text-violet-600 dark:text-violet-400',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  },
}

function StatCard({ label, value, icon: Icon, color, to, sub }: StatCardProps) {
  const c = COLOR_MAP[color]
  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', c.bg)}>
          <Icon className={cn('h-5 w-5', c.icon)} />
        </div>
        {to && (
          <TrendingUp className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-400 dark:text-slate-600" />
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function IuranProgress({ lunas, total, bulan, tahun }: { lunas: number; total: number; bulan: number; tahun: number }) {
  const pct = total > 0 ? Math.round((lunas / total) * 100) : 0
  const pending = total - lunas

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Iuran {BULAN[bulan]} {tahun}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Status pembayaran warga</p>
        </div>
        <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {pct}% lunas
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex gap-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{lunas}</span>
          <span className="text-xs text-slate-400">Lunas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{pending}</span>
          <span className="text-xs text-slate-400">Menunggu</span>
        </div>
      </div>
    </div>
  )
}

function PengurusDashboard({ data }: { data: DashboardPengurus }) {
  const { iuranBulanIni } = data
  const totalWarga = data.totalWarga

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ringkasan RT</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Statistik terkini Rukun Tetangga</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Warga" value={data.totalWarga} icon={Users} color="indigo" to="/warga" />
        <StatCard label="Warga Aktif" value={data.wargaAktif} icon={Users} color="emerald" to="/warga"
          sub={`${totalWarga > 0 ? Math.round((data.wargaAktif / totalWarga) * 100) : 0}% dari total`} />
        <StatCard label="Saldo Kas" value={formatRupiah(data.saldoKas)} icon={CircleDollarSign} color="violet" to="/keuangan" />
        <StatCard label="Pengaduan Aktif" value={data.pengaduanAktif} icon={ShieldAlert} color="rose" to="/pengaduan" />
        <StatCard label="Pengaduan Selesai" value={data.pengaduanSelesai} icon={CheckCircle2} color="emerald" to="/pengaduan" />
        <StatCard label="Kegiatan Mendatang" value={data.kegiatanMendatang} icon={CalendarDays} color="amber" to="/kegiatan" />
      </div>

      <IuranProgress
        lunas={iuranBulanIni.lunas}
        total={iuranBulanIni.lunas + iuranBulanIni.pending}
        bulan={iuranBulanIni.bulan}
        tahun={iuranBulanIni.tahun}
      />
    </div>
  )
}

const IURAN_STYLE: Record<string, { label: string; cls: string }> = {
  lunas:      { label: 'Lunas',              cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  pending:    { label: 'Menunggu Konfirmasi', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  ditolak:    { label: 'Ditolak',            cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  belum_bayar:{ label: 'Belum Bayar',        cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
}

const PENGADUAN_LABEL: Record<string, string> = {
  diajukan: 'Diajukan', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak',
}

function SectionCard({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <Link to={to} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Lihat semua →
        </Link>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800/60">{children}</div>
    </div>
  )
}

function WargaDashboard({ data }: { data: DashboardWarga }) {
  const iuran = data.iuranBulanIni
  const iuranStyle = IURAN_STYLE[iuran.status] ?? { label: iuran.status, cls: '' }

  return (
    <div className="space-y-5">
      {/* Iuran card */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Iuran {BULAN[iuran.bulan]} {iuran.tahun}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', iuranStyle.cls)}>
            {iuranStyle.label}
          </span>
          {iuran.jumlah != null && (
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {formatRupiah(iuran.jumlah)}
            </span>
          )}
        </div>
        {iuran.status === 'belum_bayar' && (
          <Link
            to="/iuran/upload"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <CircleDollarSign className="h-4 w-4" /> Bayar Sekarang
          </Link>
        )}
      </div>

      {/* Pengumuman terbaru */}
      {data.pengumumanTerbaru.length > 0 && (
        <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
          {data.pengumumanTerbaru.map((p) => (
            <Link
              key={p.id}
              to={`/pengumuman/${p.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
                <Megaphone className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.judul}</p>
                <p className="text-xs text-slate-400">{p.kategori}</p>
              </div>
            </Link>
          ))}
        </SectionCard>
      )}

      {/* Pengaduan saya */}
      {data.pengaduanSaya.length > 0 && (
        <SectionCard title="Pengaduan Saya" to="/pengaduan">
          {data.pengaduanSaya.map((p) => (
            <Link
              key={p.id}
              to={`/pengaduan/${p.id}`}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{p.judul}</p>
              </div>
              <span className="ml-2 shrink-0 text-xs text-slate-400">
                {PENGADUAN_LABEL[p.status] ?? p.status}
              </span>
            </Link>
          ))}
        </SectionCard>
      )}

      {/* Kegiatan mendatang */}
      {data.kegiatanMendatang.length > 0 && (
        <SectionCard title="Kegiatan Mendatang" to="/kegiatan">
          {data.kegiatanMendatang.map((k) => (
            <Link
              key={k.id}
              to={`/kegiatan/${k.id}`}
              className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{k.nama}</p>
                <p className="text-xs text-slate-400">
                  {new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {k.lokasi ? ` · ${k.lokasi}` : ''}
                </p>
              </div>
            </Link>
          ))}
        </SectionCard>
      )}
    </div>
  )
}

function PageHeader({ name, role }: { name: string; role: string }) {
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'
  return (
    <div className="mb-6">
      <p className="text-sm text-slate-500 dark:text-slate-400">{greet},</p>
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h1>
      <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 dark:bg-primary-900/30">
        <BarChart3 className="h-3 w-3 text-primary-600 dark:text-primary-400" />
        <span className="text-xs font-medium capitalize text-primary-700 dark:text-primary-300">{role}</span>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuthStore()
  const isPengurus = user?.role ? PENGURUS_ROLES.includes(user.role) : false

  const [pengurusData, setPengurusData] = useState<DashboardPengurus | null>(null)
  const [wargaData, setWargaData] = useState<DashboardWarga | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (isPengurus) {
          const data = await getDashboardPengurus()
          if (!cancelled) setPengurusData(data)
        } else {
          const data = await getDashboardWarga()
          if (!cancelled) setWargaData(data)
        }
      } catch {
        if (!cancelled) setError('Gagal memuat data dashboard.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [isPengurus])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:max-w-4xl lg:px-8">
      {user && <PageHeader name={user.email.split('@')[0] ?? user.email} role={user.role} />}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && isPengurus && pengurusData && <PengurusDashboard data={pengurusData} />}
      {!loading && !error && !isPengurus && wargaData && <WargaDashboard data={wargaData} />}
    </div>
  )
}
