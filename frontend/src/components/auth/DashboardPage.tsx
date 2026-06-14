import axios from 'axios'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { logout as logoutRequest } from '../../services/authService'
import { getDashboardPengurus, getDashboardWarga } from '../../services/dashboardService'
import { useAuthStore } from '../../stores/authStore'
import type { DashboardPengurus, DashboardWarga } from '../../types/dashboard'

const PENGURUS_ROLES = ['admin', 'sekretaris', 'bendahara', 'pengurus']

const BULAN_NAMES = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function StatCard({ label, value, to }: { label: string; value: string | number; to?: string }) {
  const content = (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

function PengurusDashboard({ data }: { data: DashboardPengurus }) {
  const { iuranBulanIni } = data
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Statistik RT</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Warga" value={data.totalWarga} to="/warga" />
        <StatCard label="Warga Aktif" value={data.wargaAktif} to="/warga" />
        <StatCard label="Saldo Kas" value={formatRupiah(data.saldoKas)} to="/keuangan" />
        <StatCard label="Pengaduan Aktif" value={data.pengaduanAktif} to="/pengaduan" />
        <StatCard label="Pengaduan Selesai" value={data.pengaduanSelesai} to="/pengaduan" />
        <StatCard label="Kegiatan Mendatang" value={data.kegiatanMendatang} to="/kegiatan" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Iuran {BULAN_NAMES[iuranBulanIni.bulan]} {iuranBulanIni.tahun}
        </p>
        <div className="mt-3 flex gap-6">
          <div>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{iuranBulanIni.lunas}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lunas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-amber-500 dark:text-amber-400">{iuranBulanIni.pending}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Menunggu</p>
          </div>
        </div>
      </div>
    </div>
  )
}

const IURAN_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  lunas: { label: 'Lunas', color: 'text-green-600 dark:text-green-400' },
  pending: { label: 'Menunggu Konfirmasi', color: 'text-amber-500 dark:text-amber-400' },
  ditolak: { label: 'Ditolak', color: 'text-red-500 dark:text-red-400' },
  belum_bayar: { label: 'Belum Bayar', color: 'text-slate-500 dark:text-slate-400' },
}

const PENGADUAN_STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

function WargaDashboard({ data }: { data: DashboardWarga }) {
  const iuran = data.iuranBulanIni
  const iuranInfo = IURAN_STATUS_LABEL[iuran.status] ?? { label: iuran.status, color: '' }

  return (
    <div className="space-y-6">
      {/* Iuran bulan ini */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Iuran {BULAN_NAMES[iuran.bulan]} {iuran.tahun}
        </p>
        <p className={`mt-1 text-xl font-bold ${iuranInfo.color}`}>{iuranInfo.label}</p>
        {iuran.jumlah != null && (
          <p className="text-sm text-slate-500 dark:text-slate-400">{formatRupiah(iuran.jumlah)}</p>
        )}
        {iuran.status === 'belum_bayar' && (
          <Link
            to="/iuran/upload"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Bayar Sekarang
          </Link>
        )}
      </div>

      {/* Pengumuman terbaru */}
      {data.pengumumanTerbaru.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Pengumuman Terbaru</h3>
            <Link to="/pengumuman" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              Lihat semua
            </Link>
          </div>
          <ul className="space-y-2">
            {data.pengumumanTerbaru.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/pengumuman/${p.id}`}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <span className="font-medium">{p.judul}</span>
                  <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs dark:bg-slate-700">
                    {p.kategori}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pengaduan saya */}
      {data.pengaduanSaya.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Pengaduan Saya</h3>
            <Link to="/pengaduan" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              Lihat semua
            </Link>
          </div>
          <ul className="space-y-2">
            {data.pengaduanSaya.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/pengaduan/${p.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <span className="text-slate-700 dark:text-slate-300">{p.judul}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {PENGADUAN_STATUS_LABEL[p.status] ?? p.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Kegiatan mendatang */}
      {data.kegiatanMendatang.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Kegiatan Mendatang</h3>
            <Link to="/kegiatan" className="text-xs text-blue-600 hover:underline dark:text-blue-400">
              Lihat semua
            </Link>
          </div>
          <ul className="space-y-2">
            {data.kegiatanMendatang.map((k) => (
              <li key={k.id}>
                <Link
                  to={`/kegiatan/${k.id}`}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <span className="font-medium text-slate-700 dark:text-slate-300">{k.nama}</span>
                  {k.lokasi && (
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">@ {k.lokasi}</span>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {new Date(k.tanggal).toLocaleDateString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export function DashboardPage() {
  const { user, logout } = useAuthStore()
  const isPengurus = user?.role && PENGURUS_ROLES.includes(user.role)

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

  async function handleLogout() {
    try {
      await logoutRequest()
    } catch (err) {
      if (!axios.isAxiosError(err)) throw err
    } finally {
      logout()
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Smart-RT</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.email} · {user?.role}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Keluar
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-6">
        <nav className="mb-6 flex flex-wrap gap-2 text-sm">
          {isPengurus && (
            <>
              <Link to="/warga" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Warga</Link>
              <Link to="/keuangan" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Keuangan</Link>
            </>
          )}
          <Link to="/pengumuman" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Pengumuman</Link>
          <Link to="/pengaduan" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Pengaduan</Link>
          <Link to="/forum" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Forum</Link>
          <Link to="/kegiatan" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Kegiatan</Link>
          <Link to="/polling" className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">Polling</Link>
        </nav>

        {loading && (
          <p className="text-slate-500 dark:text-slate-400">Memuat dashboard...</p>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}
        {!loading && !error && isPengurus && pengurusData && (
          <PengurusDashboard data={pengurusData} />
        )}
        {!loading && !error && !isPengurus && wargaData && (
          <WargaDashboard data={wargaData} />
        )}
      </div>
    </main>
  )
}
