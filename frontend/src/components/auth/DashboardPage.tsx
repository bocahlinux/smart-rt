import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileText,
  Home,
  ListChecks,
  Megaphone,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  UserPlus,
  Users,
  Vote,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { getDashboardPengurus, getDashboardWarga } from '@/services/dashboardService'
import { getBukuKas } from '@/services/keuanganService'
import { useAuthStore } from '@/stores/authStore'
import type {
  DashboardPengurus,
  DashboardWarga,
  IuranBulanIni,
  IuranRiwayat,
  KegiatanRingkas,
  PengaduanRingkas,
  PengumumanRingkas,
  ProfileInfoWarga,
  WargaBelumLunas,
} from '@/types/dashboard'

// ── Constants ──────────────────────────────────────────────────

const BULAN = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', ketua_rt: 'Ketua RT', sekretaris: 'Sekretaris',
  bendahara: 'Bendahara', pengurus: 'Pengurus', warga: 'Warga',
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Shared: Stat card ──────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ElementType
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'violet' | 'sky' | 'teal'
  to?: string
  sub?: string
  badge?: number
}

const COLOR_MAP = {
  indigo:  { bg: 'bg-indigo-50 dark:bg-indigo-900/20',   icon: 'text-indigo-600 dark:text-indigo-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400' },
  amber:   { bg: 'bg-amber-50 dark:bg-amber-900/20',     icon: 'text-amber-600 dark:text-amber-400' },
  rose:    { bg: 'bg-rose-50 dark:bg-rose-900/20',       icon: 'text-rose-600 dark:text-rose-400' },
  violet:  { bg: 'bg-violet-50 dark:bg-violet-900/20',   icon: 'text-violet-600 dark:text-violet-400' },
  sky:     { bg: 'bg-sky-50 dark:bg-sky-900/20',         icon: 'text-sky-600 dark:text-sky-400' },
  teal:    { bg: 'bg-teal-50 dark:bg-teal-900/20',       icon: 'text-teal-600 dark:text-teal-400' },
}

function StatCard({ label, value, icon: Icon, color, to, sub, badge }: StatCardProps) {
  const c = COLOR_MAP[color]
  const content = (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {badge != null && badge > 0 && (
        <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
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

// ── Shared: Iuran progress ─────────────────────────────────────

function IuranProgress({ lunas, pending, bulan, tahun }: { lunas: number; pending: number; bulan: number; tahun: number }) {
  const total = lunas + pending
  const pct = total > 0 ? Math.round((lunas / total) * 100) : 0

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Iuran {BULAN[bulan]} {tahun}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Status pembayaran warga bulan ini</p>
        </div>
        <Link to="/keuangan/iuran" className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300">
          {pct}% lunas
        </Link>
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

// ── Shared: Section card ───────────────────────────────────────

function SectionCard({ title, to, linkLabel = 'Lihat semua →', children }: { title: string; to: string; linkLabel?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        <Link to={to} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          {linkLabel}
        </Link>
      </div>
      <div className="divide-y divide-slate-50 dark:divide-slate-800/60">{children}</div>
    </div>
  )
}

// ── Shared: Kegiatan list ──────────────────────────────────────

function KegiatanList({ list }: { list: KegiatanRingkas[] }) {
  if (list.length === 0) return <p className="px-5 py-6 text-sm text-slate-400">Tidak ada kegiatan mendatang.</p>
  return (
    <>
      {list.map((k) => (
        <Link
          key={k.id}
          to={`/kegiatan/${k.id}`}
          className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-900/20">
            <CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{k.nama}</p>
            <p className="text-xs text-slate-400">{formatTanggal(k.tanggal)}{k.lokasi ? ` · ${k.lokasi}` : ''}</p>
          </div>
        </Link>
      ))}
    </>
  )
}

// ── Shared: Pengumuman list ────────────────────────────────────

const PENGUMUMAN_CLS: Record<string, string> = {
  penting:  'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  acara:    'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400',
  info:     'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
  keamanan: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  lainnya:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function PengumumanList({ list }: { list: PengumumanRingkas[] }) {
  if (list.length === 0) return <p className="px-5 py-6 text-sm text-slate-400">Belum ada pengumuman.</p>
  return (
    <>
      {list.map((p) => (
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
            <span className={cn('mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', PENGUMUMAN_CLS[p.kategori] ?? PENGUMUMAN_CLS.lainnya)}>
              {p.kategori}
            </span>
          </div>
        </Link>
      ))}
    </>
  )
}

// ── Shared: Pengaduan list ─────────────────────────────────────

const PENGADUAN_BADGE: Record<string, string> = {
  diajukan: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  diproses: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  selesai:  'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  ditolak:  'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
}
const PENGADUAN_LABEL: Record<string, string> = {
  diajukan: 'Diajukan', diproses: 'Diproses', selesai: 'Selesai', ditolak: 'Ditolak',
}

function PengaduanList({ list, to }: { list: PengaduanRingkas[]; to: string }) {
  if (list.length === 0) return <p className="px-5 py-6 text-sm text-slate-400">Tidak ada pengaduan aktif.</p>
  return (
    <>
      {list.map((p) => (
        <Link
          key={p.id}
          to={`${to}/${p.id}`}
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
    </>
  )
}

// ── Shared: Warga belum lunas ──────────────────────────────────

function WargaBelumLunasWidget({ list, bulan, tahun }: { list: WargaBelumLunas[]; bulan: number; tahun: number }) {
  if (list.length === 0) return null
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Belum Melunasi Iuran</h3>
          <p className="text-xs text-slate-400">{BULAN[bulan]} {tahun} · {list.length} warga</p>
        </div>
        <Link to="/keuangan/iuran" className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
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
            <div className="flex gap-2 text-xs text-slate-400">
              {(w.blok || w.noRumah) && <span>{[w.blok, w.noRumah].filter(Boolean).join('/')}</span>}
              {w.noKk && <span className="font-mono">KK {w.noKk.slice(-4)}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── ADMIN / KETUA RT dashboard ─────────────────────────────────

function AdminKetuaDashboard({ data }: { data: DashboardPengurus }) {
  const { iuranBulanIni } = data
  return (
    <div className="space-y-5">
      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Warga" value={data.totalWarga} icon={Users} color="indigo" to="/warga" />
        <StatCard label="Total KK" value={data.totalKk} icon={Home} color="sky" to="/kartu-keluarga" />
        <StatCard label="Saldo Kas" value={formatRupiah(data.saldoKas)} icon={CircleDollarSign} color="emerald" to="/keuangan" />
        <StatCard label="Iuran Perlu Konfirmasi" value={data.iuranPending} icon={ListChecks} color="amber" to="/keuangan/iuran"
          badge={data.iuranPending} sub={`Menunggu verifikasi`} />
        <StatCard label="Pengajuan KK" value={data.pengajuanKkPending} icon={FileText} color="violet" to="/pengajuan"
          badge={data.pengajuanKkPending} sub="Menunggu persetujuan" />
        <StatCard label="Aduan Aktif" value={data.pengaduanAktif} icon={ShieldAlert} color="rose" to="/pengaduan"
          badge={data.pengaduanAktif} />
      </div>

      {/* Iuran progress + Polling */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <IuranProgress lunas={iuranBulanIni.lunas} pending={iuranBulanIni.pending} bulan={iuranBulanIni.bulan} tahun={iuranBulanIni.tahun} />
        </div>
        <StatCard label="Polling Aktif" value={data.pollingAktif} icon={Vote} color="teal" to="/polling"
          sub="Menunggu partisipasi warga" />
      </div>

      {/* Warga belum lunas */}
      {data.wargaBelumLunas?.length > 0 && (
        <WargaBelumLunasWidget list={data.wargaBelumLunas} bulan={iuranBulanIni.bulan} tahun={iuranBulanIni.tahun} />
      )}

      {/* Kegiatan + Pengumuman + Pengaduan terbaru */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Kegiatan Mendatang" to="/kegiatan">
          <KegiatanList list={data.kegiatanMendatangList} />
        </SectionCard>
        <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
          <PengumumanList list={data.pengumumanTerbaru} />
        </SectionCard>
        <SectionCard title="Pengaduan Aktif" to="/pengaduan">
          <PengaduanList list={data.pengaduanTerbaru} to="/pengaduan" />
        </SectionCard>
      </div>
    </div>
  )
}

// ── BENDAHARA dashboard ────────────────────────────────────────

function BendaharaDashboard({ data }: { data: DashboardPengurus }) {
  const { iuranBulanIni } = data
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Saldo Kas RT" value={formatRupiah(data.saldoKas)} icon={CircleDollarSign} color="emerald" to="/keuangan" />
        <StatCard label="Iuran Perlu Konfirmasi" value={data.iuranPending} icon={ListChecks} color="amber" to="/keuangan/iuran"
          badge={data.iuranPending} sub="Menunggu verifikasi" />
        <StatCard label="Lunas Bulan Ini" value={iuranBulanIni.lunas} icon={CheckCircle2} color="sky"
          sub={`${BULAN[iuranBulanIni.bulan]} ${iuranBulanIni.tahun}`} />
        <StatCard label="Total Warga" value={data.totalWarga} icon={Users} color="indigo" to="/warga" />
      </div>

      <IuranProgress lunas={iuranBulanIni.lunas} pending={iuranBulanIni.pending} bulan={iuranBulanIni.bulan} tahun={iuranBulanIni.tahun} />

      {data.wargaBelumLunas?.length > 0 && (
        <WargaBelumLunasWidget list={data.wargaBelumLunas} bulan={iuranBulanIni.bulan} tahun={iuranBulanIni.tahun} />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Kegiatan Mendatang" to="/kegiatan">
          <KegiatanList list={data.kegiatanMendatangList} />
        </SectionCard>
        <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
          <PengumumanList list={data.pengumumanTerbaru} />
        </SectionCard>
      </div>
    </div>
  )
}

// ── SEKRETARIS dashboard ───────────────────────────────────────

function SekretarisDashboard({ data }: { data: DashboardPengurus }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Warga Aktif" value={data.wargaAktif} icon={Users} color="indigo" to="/warga"
          sub={`dari ${data.totalWarga} terdaftar`} />
        <StatCard label="Total KK" value={data.totalKk} icon={Home} color="sky" to="/kartu-keluarga" />
        <StatCard label="Pengajuan KK" value={data.pengajuanKkPending} icon={FileText} color="amber" to="/pengajuan"
          badge={data.pengajuanKkPending} sub="Menunggu persetujuan" />
        <StatCard label="Warga Baru Bulan Ini" value={data.wargaBaruBulanIni} icon={UserPlus} color="emerald"
          sub="Ditambahkan bulan ini" />
      </div>

      {/* Pengajuan KK banner jika ada yang pending */}
      {data.pengajuanKkPending > 0 && (
        <Link
          to="/pengajuan"
          className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20 dark:hover:bg-amber-900/30"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {data.pengajuanKkPending} Pengajuan KK Menunggu Persetujuan
            </p>
            <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">
              Klik untuk review pengajuan tambah/hapus/ubah anggota KK
            </p>
          </div>
          <FileText className="h-5 w-5 shrink-0 text-amber-400" />
        </Link>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Kegiatan Mendatang" to="/kegiatan">
          <KegiatanList list={data.kegiatanMendatangList} />
        </SectionCard>
        <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
          <PengumumanList list={data.pengumumanTerbaru} />
        </SectionCard>
      </div>

      <SectionCard title="Pengaduan Aktif" to="/pengaduan">
        <PengaduanList list={data.pengaduanTerbaru} to="/pengaduan" />
      </SectionCard>
    </div>
  )
}

// ── PENGURUS dashboard ─────────────────────────────────────────

function PengurusDashboard({ data }: { data: DashboardPengurus }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total Warga" value={data.totalWarga} icon={Users} color="indigo" to="/warga" />
        <StatCard label="Kegiatan Mendatang" value={data.kegiatanMendatang} icon={CalendarDays} color="amber" to="/kegiatan" />
        <StatCard label="Polling Aktif" value={data.pollingAktif} icon={Vote} color="teal" to="/polling" />
      </div>

      <SectionCard title="Kegiatan Mendatang" to="/kegiatan" linkLabel="Lihat semua →">
        <KegiatanList list={data.kegiatanMendatangList} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
          <PengumumanList list={data.pengumumanTerbaru} />
        </SectionCard>
        <SectionCard title="Pengaduan Aktif" to="/pengaduan">
          <PengaduanList list={data.pengaduanTerbaru} to="/pengaduan" />
        </SectionCard>
      </div>
    </div>
  )
}

// ── WARGA: Iuran card ──────────────────────────────────────────

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
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Iuran Bulan Ini</p>
        <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{BULAN[iuran.bulan]} {iuran.tahun}</p>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold', cfg.bg, cfg.text)}>
            {cfg.label}
          </span>
          {iuran.jumlah != null && (
            <span className="text-base font-bold text-slate-800 dark:text-slate-100">{formatRupiah(iuran.jumlah)}</span>
          )}
        </div>
        {iuran.status === 'belum_bayar' && (
          <Link to="/iuran/upload" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary-600 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
            <CircleDollarSign className="h-4 w-4" />
            Bayar Sekarang
          </Link>
        )}
        {iuran.status === 'ditolak' && (
          <Link to="/iuran/upload" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700">
            <CircleDollarSign className="h-4 w-4" />
            Upload Ulang Bukti
          </Link>
        )}
      </div>
      {riwayat.length > 0 && (
        <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Riwayat 3 Bulan</p>
          <div className="flex gap-2">
            {riwayat.map((r, i) => {
              const c = IURAN_CONFIG[r.status] ?? IURAN_CONFIG.belum_bayar
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', c.dot)} />
                  <span className="text-xs text-slate-500">{BULAN[r.bulan]?.slice(0, 3)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── WARGA: KK card ─────────────────────────────────────────────

function KKCard({ profile }: { profile: ProfileInfoWarga }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Kartu Keluarga</p>
        <p className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-white">{profile.noKk ?? '—'}</p>
      </div>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
            <Home className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.namaLengkap}</p>
            <p className="text-xs text-slate-400">{profile.jumlahAnggotaKK} anggota keluarga</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
        <Link to="/kk/saya" className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
          Lihat Kartu Keluarga
        </Link>
      </div>
    </div>
  )
}

// ── WARGA: Quick actions ───────────────────────────────────────

function QuickActions({ iuranStatus }: { iuranStatus: string }) {
  const actions = [
    {
      label: iuranStatus === 'belum_bayar' || iuranStatus === 'ditolak' ? 'Bayar Iuran' : 'Riwayat Iuran',
      sub: iuranStatus === 'belum_bayar' ? 'Belum dibayar' : iuranStatus === 'ditolak' ? 'Perlu upload ulang' : 'Sudah dibayar',
      to: '/iuran/upload',
      icon: CircleDollarSign,
      color: iuranStatus === 'belum_bayar' || iuranStatus === 'ditolak'
        ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    },
    { label: 'Buat Pengaduan', sub: 'Laporkan masalah', to: '/pengaduan/baru', icon: ShieldAlert, color: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' },
    { label: 'Forum Diskusi', sub: 'Tulis thread baru', to: '/forum', icon: MessageSquare, color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400' },
    { label: 'Kegiatan RT', sub: 'Jadwal acara warga', to: '/kegiatan', icon: CalendarDays, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400' },
  ]
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((a) => (
        <Link key={a.to} to={a.to} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <div className={cn('flex h-9 w-9 items-center justify-center rounded-xl', a.color)}>
            <a.icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{a.label}</p>
            <p className="mt-0.5 text-xs text-slate-400">{a.sub}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}

// ── WARGA: Kas RT widget ───────────────────────────────────────

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
    <Link to="/keuangan" className="flex items-center gap-4 rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50 to-white p-5 shadow-sm transition hover:shadow-md dark:border-indigo-900/30 dark:from-indigo-900/10 dark:to-slate-900">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
        <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-400">Kas RT · Transparansi Keuangan</p>
        {loading ? (
          <div className="mt-1 h-5 w-32 animate-pulse rounded bg-indigo-100 dark:bg-indigo-900/30" />
        ) : saldo !== null ? (
          <p className="text-lg font-bold text-indigo-700 dark:text-indigo-300">{formatRupiah(Number(saldo))}</p>
        ) : (
          <p className="text-sm text-slate-400">Data tidak tersedia</p>
        )}
        <p className="mt-0.5 text-xs text-indigo-400">Saldo kas RT tahun ini · Tap untuk lihat buku kas →</p>
      </div>
      <CircleDollarSign className="h-5 w-5 shrink-0 text-indigo-300 dark:text-indigo-700" />
    </Link>
  )
}

// ── WARGA dashboard ────────────────────────────────────────────

function WargaDashboard({ data }: { data: DashboardWarga }) {
  const { iuranBulanIni, riwayatIuran, profileInfo, pengumumanTerbaru, pengaduanSaya, kegiatanMendatang } = data
  const hasKK = !!profileInfo?.noKk
  const hasProfile = profileInfo !== null
  return (
    <div className="space-y-5">
      {!hasProfile && (
        <Link to="/profil/buat" className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Profil data diri belum dibuat</p>
            <p className="mt-0.5 text-xs text-amber-600">Tap di sini untuk melengkapi data diri Anda sebagai warga RT</p>
          </div>
        </Link>
      )}
      <div className={cn('grid gap-4', hasKK ? 'lg:grid-cols-2' : '')}>
        <IuranCard iuran={iuranBulanIni} riwayat={riwayatIuran} />
        {hasKK && profileInfo && <KKCard profile={profileInfo} />}
      </div>
      <KasRTWidget />
      <QuickActions iuranStatus={iuranBulanIni.status} />
      {(pengumumanTerbaru.length > 0 || kegiatanMendatang.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {pengumumanTerbaru.length > 0 && (
            <SectionCard title="Pengumuman Terbaru" to="/pengumuman">
              <PengumumanList list={pengumumanTerbaru} />
            </SectionCard>
          )}
          {kegiatanMendatang.length > 0 && (
            <SectionCard title="Kegiatan Mendatang" to="/kegiatan">
              <KegiatanList list={kegiatanMendatang} />
            </SectionCard>
          )}
        </div>
      )}
      {pengaduanSaya.length > 0 && (
        <SectionCard title="Pengaduan Saya" to="/pengaduan">
          <PengaduanList list={pengaduanSaya} to="/pengaduan" />
        </SectionCard>
      )}
      {pengumumanTerbaru.length === 0 && kegiatanMendatang.length === 0 && pengaduanSaya.length === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-400">Belum ada aktivitas terbaru.</p>
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
          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">{ROLE_LABEL[role] ?? role}</span>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard role router ──────────────────────────────────────

function PengurusRoleDashboard({ data }: { data: DashboardPengurus }) {
  const role = data.role
  if (role === 'admin' || role === 'ketua_rt') return <AdminKetuaDashboard data={data} />
  if (role === 'bendahara') return <BendaharaDashboard data={data} />
  if (role === 'sekretaris') return <SekretarisDashboard data={data} />
  return <PengurusDashboard data={data} />
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
          className="mb-4 flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 transition hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-900/20"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
            <UserPlus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Profil data diri belum dibuat</p>
            <p className="mt-0.5 text-xs text-amber-600">Tap di sini untuk melengkapi data diri Anda sebagai anggota RT</p>
          </div>
        </Link>
      )}

      {!loading && !error && isPengurus && pengurusData && <PengurusRoleDashboard data={pengurusData} />}
      {!loading && !error && !isPengurus && wargaData && <WargaDashboard data={wargaData} />}
    </div>
  )
}
