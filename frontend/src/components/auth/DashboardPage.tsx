import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Home,
  MessageSquare,
  Megaphone,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { getDashboardPengurus, getDashboardWarga } from '@/services/dashboardService'
import { getBukuKas } from '@/services/keuanganService'
import { useAuthStore } from '@/stores/authStore'
import type { DashboardPengurus, DashboardWarga, IuranBulanIni, IuranRiwayat, ProfileInfoWarga, WargaBelumLunas } from '@/types/dashboard'

// ── Constants ──────────────────────────────────────────────────

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', ketua_rt: 'Ketua RT', sekretaris: 'Sekretaris',
  bendahara: 'Bendahara', pengurus: 'Pengurus', warga: 'Warga',
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

// ── Stat card (pengurus) ───────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky'
  to?: string
  sub?: string
}

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',  icon: 'text-indigo-600 dark:text-indigo-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',    icon: 'text-amber-600 dark:text-amber-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',      icon: 'text-rose-600 dark:text-rose-400' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',  icon: 'text-violet-600 dark:text-violet-400' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',        icon: 'text-sky-600 dark:text-sky-400' },
}

function StatCard({ label, value, icon: Icon, color, to, sub }: StatCardProps) {
  const c = COLOR_MAP[color]
  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className={cn('mb-3 flex h-9 w-9 items-center justify-center rounded-xl', c.bg)}>
        <Icon className={cn('h-4.5 w-4.5', c.icon)} />
      </div>
      <p className="text-xl font-bold text-slate-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      {sub && <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{sub}</p>}
    </div>
  )
  return to ? <Link to={to} className="block">{content}</Link> : content
}

// ── Iuran progress (pengurus) ──────────────────────────────────

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
          <p className="text-xs text-slate-400 dark:text-slate-500">Status pembayaran warga bulan ini</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {pct}% lunas
        </span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex gap-6">
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

// ── Warga belum lunas list (pengurus) ─────────────────────────

function WargaBelumLunasWidget({ list, bulan, tahun }: { list: WargaBelumLunas[]; bulan: number; tahun: number }) {
  if (list.length === 0) return null
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Belum Melunasi Iuran
          </h3>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {BULAN[bulan]} {tahun} · {list.length} warga
          </p>
        </div>
        <Link to="/keuangan" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Kelola →
        </Link>
      </div>
      <ul className="divide-y divide-slate-50 dark:divide-slate-800/60">
        {list.map((w) => (
          <li key={w.id} className="flex items-center gap-3 px-5 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <Users className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            </div>
            <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{w.namaLengkap}</span>
            {(w.blok || w.noRumah) && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {[w.blok, w.noRumah].filter(Boolean).join(' / ')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Pengurus dashboard ─────────────────────────────────────────

function PengurusDashboard({ data }: { data: DashboardPengurus }) {
  const { iuranBulanIni, totalWarga } = data
  const today = new Date()
  const dateLabel = today.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Ringkasan RT</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Statistik terkini Rukun Tetangga</p>
        </div>
        <p className="hidden text-xs text-slate-400 dark:text-slate-500 sm:block">{dateLabel}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Warga" value={data.totalWarga} icon={Users} color="indigo" to="/warga" />
        <StatCard
          label="Warga Aktif" value={data.wargaAktif} icon={CheckCircle2} color="emerald" to="/warga"
          sub={`${totalWarga > 0 ? Math.round((data.wargaAktif / totalWarga) * 100) : 0}% dari total`}
        />
        <StatCard label="Saldo Kas" value={formatRupiah(data.saldoKas)} icon={CircleDollarSign} color="violet" to="/keuangan" />
        <StatCard label="Aduan Aktif" value={data.pengaduanAktif} icon={ShieldAlert} color="rose" to="/pengaduan" />
        <StatCard label="Aduan Selesai" value={data.pengaduanSelesai} icon={FileText} color="sky" to="/pengaduan" />
        <StatCard label="Keg. Mendatang" value={data.kegiatanMendatang} icon={CalendarDays} color="amber" to="/kegiatan" />
      </div>

      <IuranProgress
        lunas={iuranBulanIni.lunas}
        total={iuranBulanIni.lunas + iuranBulanIni.pending}
        bulan={iuranBulanIni.bulan}
        tahun={iuranBulanIni.tahun}
      />

      {data.wargaBelumLunas?.length > 0 && (
        <WargaBelumLunasWidget
          list={data.wargaBelumLunas}
          bulan={iuranBulanIni.bulan}
          tahun={iuranBulanIni.tahun}
        />
      )}
    </div>
  )
}

// ── Iuran card (warga) ─────────────────────────────────────────

const IURAN_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  lunas:       { label: 'Lunas',              bg: 'bg-emerald-50 dark:bg-emerald-900/20',  text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  pending:     { label: 'Menunggu Konfirmasi', bg: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-700 dark:text-amber-400',    dot: 'bg-amber-400' },
  ditolak:     { label: 'Ditolak',            bg: 'bg-red-50 dark:bg-red-900/20',          text: 'text-red-700 dark:text-red-400',        dot: 'bg-red-500' },
  belum_bayar: { label: 'Belum Dibayar',      bg: 'bg-slate-50 dark:bg-slate-800',         text: 'text-slate-600 dark:text-slate-400',    dot: 'bg-slate-300 dark:bg-slate-600' },
}

function IuranCard({ iuran, riwayat }: { iuran: IuranBulanIni; riwayat: IuranRiwayat[] }) {
  const cfg = IURAN_CONFIG[iuran.status] ?? IURAN_CONFIG.belum_bayar

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Iuran Bulan Ini
        </p>
        <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
          {BULAN[iuran.bulan]} {iuran.tahun}
        </p>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', cfg.bg, cfg.text)}>
            {cfg.label}
          </span>
          {iuran.jumlah != null && (
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">
              {formatRupiah(iuran.jumlah)}
            </span>
          )}
        </div>

        {iuran.status === 'belum_bayar' && (
          <Link
            to="/iuran/upload"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <CircleDollarSign className="h-4 w-4" />
            Bayar Sekarang
          </Link>
        )}
        {iuran.status === 'ditolak' && (
          <Link
            to="/iuran/upload"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            <CircleDollarSign className="h-4 w-4" />
            Upload Ulang Bukti
          </Link>
        )}
      </div>

      {riwayat.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Riwayat 3 Bulan
          </p>
          <div className="flex gap-2">
            {riwayat.map((r, i) => {
              const c = IURAN_CONFIG[r.status] ?? IURAN_CONFIG.belum_bayar
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', c.dot)} />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {BULAN[r.bulan]?.slice(0, 3)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── KK card (warga) ────────────────────────────────────────────

function KKCard({ profile }: { profile: ProfileInfoWarga }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Kartu Keluarga
        </p>
        <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-white">
          {profile.noKk ?? '—'}
        </p>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <Home className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {profile.namaLengkap}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {profile.jumlahAnggotaKK} anggota keluarga
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <Link
          to="/kk/saya"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Lihat Kartu Keluarga
        </Link>
      </div>
    </div>
  )
}

// ── Quick actions (warga) ──────────────────────────────────────

interface QuickAction { label: string; sub: string; to: string; icon: React.ElementType; color: string }

function QuickActions({ iuranStatus }: { iuranStatus: string }) {
  const actions: QuickAction[] = [
    {
      label: iuranStatus === 'belum_bayar' || iuranStatus === 'ditolak' ? 'Bayar Iuran' : 'Riwayat Iuran',
      sub: iuranStatus === 'belum_bayar' ? 'Belum dibayar' : iuranStatus === 'ditolak' ? 'Perlu upload ulang' : 'Sudah dibayar',
      to: '/iuran/upload',
      icon: CircleDollarSign,
      color: iuranStatus === 'belum_bayar' || iuranStatus === 'ditolak'
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    },
    {
      label: 'Buat Pengaduan',
      sub: 'Laporkan masalah',
      to: '/pengaduan/baru',
      icon: ShieldAlert,
      color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400',
    },
    {
      label: 'Forum Diskusi',
      sub: 'Tulis thread baru',
      to: '/forum',
      icon: MessageSquare,
      color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
    },
    {
      label: 'Kegiatan RT',
      sub: 'Jadwal acara warga',
      to: '/kegiatan',
      icon: CalendarDays,
      color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => (
        <Link
          key={a.to}
          to={a.to}
          className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', a.color)}>
            <a.icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.label}</p>
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{a.sub}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── Section card ───────────────────────────────────────────────

function SectionCard({ title, to, children }: { title: string; to: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <Link to={to} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Lihat semua →
        </Link>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800/60">{children}</div>
    </div>
  )
}

// ── Pengaduan status ───────────────────────────────────────────

const PENGADUAN_BADGE: Record<string, string> = {
  diajukan: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  diproses: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  selesai:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ditolak:  'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const PENGADUAN_LABEL: Record<string, string> = {
  diajukan: 'Diajukan', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak',
}

const PENGUMUMAN_KATEGORI_CLS: Record<string, string> = {
  penting:  'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  acara:    'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  info:     'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  keamanan: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  lainnya:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

// ── Kas RT transparency widget (warga) ─────────────────────────

function KasRTWidget() {
  const [saldo, setSaldo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBukuKas({ tahun: new Date().getFullYear() })
      .then((d) => setSaldo(d.saldo_akhir))
      .catch(() => setSaldo(null))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Link
      to="/keuangan"
      className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-white p-5 shadow-sm transition hover:shadow-md dark:border-indigo-900/30 dark:from-indigo-900/10 dark:to-slate-900"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400 dark:text-indigo-500">
          Kas RT · Transparansi Keuangan
        </p>
        {loading ? (
          <div className="mt-1 h-5 w-32 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900/30" />
        ) : saldo !== null ? (
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">
            {formatRupiah(Number(saldo))}
          </p>
        ) : (
          <p className="text-sm text-slate-400">Data tidak tersedia</p>
        )}
        <p className="mt-0.5 text-xs text-indigo-400 dark:text-indigo-500">
          Saldo kas RT tahun ini · Tap untuk lihat buku kas →
        </p>
      </div>
      <CircleDollarSign className="h-5 w-5 shrink-0 text-indigo-300 dark:text-indigo-700" />
    </Link>
  )
}

// ── Warga dashboard ────────────────────────────────────────────

function WargaDashboard({ data }: { data: DashboardWarga }) {
  const { iuranBulanIni, riwayatIuran, profileInfo, pengumumanTerbaru, pengaduanSaya, kegiatanMendatang } = data
  const hasKK = !!profileInfo?.noKk
  const hasProfile = profileInfo !== null

  return (
    <div className="space-y-5">
      {/* Banner buat profil jika belum ada */}
      {!hasProfile && (
        <Link
          to="/profil/buat"
          className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Profil data diri belum dibuat
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
              Tap di sini untuk melengkapi data diri Anda sebagai warga RT
            </p>
          </div>
        </Link>
      )}

      {/* Row 1: Iuran + KK cards */}
      <div className={cn('grid gap-4', hasKK ? 'lg:grid-cols-2' : '')}>
        <IuranCard iuran={iuranBulanIni} riwayat={riwayatIuran} />
        {hasKK && profileInfo && <KKCard profile={profileInfo} />}
      </div>

      {/* Row 2: Kas RT transparency */}
      <KasRTWidget />

      {/* Row 3: Quick actions */}
      <QuickActions iuranStatus={iuranBulanIni.status} />

      {/* Row 4: Pengumuman + Kegiatan */}
      {(pengumumanTerbaru.length > 0 || kegiatanMendatang.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {pengumumanTerbaru.length > 0 && (
            <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
              {pengumumanTerbaru.map((p) => (
                <Link
                  key={p.id}
                  to={`/pengumuman/${p.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/20">
                    <Megaphone className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.judul}</p>
                    <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', PENGUMUMAN_KATEGORI_CLS[p.kategori] ?? PENGUMUMAN_KATEGORI_CLS.lainnya)}>
                      {p.kategori}
                    </span>
                  </div>
                </Link>
              ))}
            </SectionCard>
          )}

          {kegiatanMendatang.length > 0 && (
            <SectionCard title="Kegiatan Mendatang" to="/kegiatan">
              {kegiatanMendatang.map((k) => (
                <Link
                  key={k.id}
                  to={`/kegiatan/${k.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
                    <CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{k.nama}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(k.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {k.lokasi ? ` · ${k.lokasi}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </SectionCard>
          )}
        </div>
      )}

      {/* Row 5: Pengaduan saya */}
      {pengaduanSaya.length > 0 && (
        <SectionCard title="Pengaduan Saya" to="/pengaduan">
          {pengaduanSaya.map((p) => (
            <Link
              key={p.id}
              to={`/pengaduan/${p.id}`}
              className="flex items-center justify-between px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-900/20">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <p className="truncate text-sm text-slate-700 dark:text-slate-300">{p.judul}</p>
              </div>
              <span className={cn('ml-3 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold', PENGADUAN_BADGE[p.status] ?? '')}>
                {PENGADUAN_LABEL[p.status] ?? p.status}
              </span>
            </Link>
          ))}
        </SectionCard>
      )}

      {/* Empty state if no content */}
      {pengumumanTerbaru.length === 0 && kegiatanMendatang.length === 0 && pengaduanSaya.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada aktivitas terbaru.</p>
        </div>
      )}
    </div>
  )
}

// ── Page header ────────────────────────────────────────────────

function PageHeader({ name, role }: { name: string; role: string }) {
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Selamat pagi' : hour < 17 ? 'Selamat siang' : 'Selamat malam'

  return (
    <div className="mb-6 flex items-end justify-between">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{greet},</p>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h1>
        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-2.5 py-0.5 dark:bg-primary-900/30">
          <BarChart3 className="h-3 w-3 text-primary-600 dark:text-primary-400" />
          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
            {ROLE_LABEL[role] ?? role}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard page ─────────────────────────────────────────────

export function DashboardPage() {
  const { user } = useAuthStore()
  const isPengurus = hasPerm(user, 'akses_dashboard_pengurus')

  const [pengurusData, setPengurusData] = useState<DashboardPengurus | null>(null)
  const [wargaData, setWargaData] = useState<DashboardWarga | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pengurusHasProfile, setPengurusHasProfile] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        if (isPengurus) {
          const [data, profilRes] = await Promise.allSettled([
            getDashboardPengurus(),
            import('@/services/wargaService').then((m) => m.getProfilSaya()),
          ])
          if (!cancelled) {
            if (data.status === 'fulfilled') setPengurusData(data.value)
            if (profilRes.status === 'fulfilled') setPengurusHasProfile(profilRes.value.hasProfile)
            else setPengurusHasProfile(false)
          }
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

  // Nama tampilan: prioritaskan nama lengkap dari profil warga
  const displayName = (!isPengurus && wargaData?.profileInfo?.namaLengkap)
    ? wargaData.profileInfo.namaLengkap
    : (user?.email.split('@')[0] ?? '')

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      {user && <PageHeader name={displayName} role={user.role} />}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && isPengurus && pengurusHasProfile === false && (
        <Link
          to="/profil/buat"
          className="mb-4 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Profil data diri belum dibuat
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
              Tap di sini untuk melengkapi data diri Anda sebagai anggota RT
            </p>
          </div>
        </Link>
      )}
      {!loading && !error && isPengurus && pengurusData && <PengurusDashboard data={pengurusData} />}
      {!loading && !error && !isPengurus && wargaData && <WargaDashboard data={wargaData} />}
    </div>
  )
}
