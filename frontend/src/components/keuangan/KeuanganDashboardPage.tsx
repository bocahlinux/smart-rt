/**
 * Dashboard Keuangan — ringkasan saldo, pemasukan, pengeluaran, dan grafik bulanan.
 * Lihat docs/06-API-CONTRACT.md §4.9 dan docs/07-TASK-BREAKDOWN.md §4.7, §4.17.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { getDashboardKeuangan } from '../../services/keuanganService'
import type { DashboardKeuangan } from '../../types/keuangan'

const BULAN_LABELS = [
  '', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)
}

function BarChart({ data }: { data: DashboardKeuangan['bulanan'] }) {
  const max = Math.max(...data.flatMap((d) => [d.pemasukan, d.pengeluaran]), 1)
  return (
    <div className="mt-4">
      <div className="flex gap-4 mb-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-emerald-500 rounded-sm" /> Pemasukan</span>
        <span className="flex items-center gap-1"><span className="inline-block w-3 h-3 bg-rose-500 rounded-sm" /> Pengeluaran</span>
      </div>
      <div className="flex items-end gap-1 h-40 overflow-x-auto">
        {data.map((d) => (
          <div key={d.bulan} className="flex flex-col items-center gap-0.5 min-w-[40px]">
            <div className="flex items-end gap-0.5 h-32">
              <div
                className="bg-emerald-500 rounded-t w-4"
                style={{ height: `${(d.pemasukan / max) * 100}%` }}
                title={formatRupiah(d.pemasukan)}
              />
              <div
                className="bg-rose-500 rounded-t w-4"
                style={{ height: `${(d.pengeluaran / max) * 100}%` }}
                title={formatRupiah(d.pengeluaran)}
              />
            </div>
            <span className="text-[10px] text-gray-500">{BULAN_LABELS[d.bulan]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KeuanganDashboardPage() {
  const { user } = useAuthStore()
  const currentYear = new Date().getFullYear()
  const [tahun, setTahun] = useState(currentYear)
  const [dashboard, setDashboard] = useState<DashboardKeuangan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canAccess = user?.role === 'admin' || user?.role === 'bendahara'

  useEffect(() => {
    if (!canAccess) return
    setLoading(true)
    setError('')
    getDashboardKeuangan(tahun)
      .then(setDashboard)
      .catch(() => setError('Gagal memuat dashboard keuangan.'))
      .finally(() => setLoading(false))
  }, [tahun, canAccess])

  if (!canAccess) {
    return (
      <div className="p-6 text-center text-gray-500">Akses ditolak. Hanya bendahara dan admin.</div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Keuangan</h1>
        <div className="flex items-center gap-3">
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Link to="/keuangan" className="text-sm text-blue-600 hover:underline">Lihat Transaksi →</Link>
        </div>
      </div>

      {error && <div className="text-red-600 mb-4">{error}</div>}
      {loading && <div className="text-gray-500">Memuat...</div>}

      {dashboard && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Saldo Kas</p>
              <p className={`text-2xl font-bold ${dashboard.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatRupiah(dashboard.saldo)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Pemasukan</p>
              <p className="text-2xl font-bold text-emerald-600">{formatRupiah(dashboard.totalPemasukan)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-1">Total Pengeluaran</p>
              <p className="text-2xl font-bold text-rose-600">{formatRupiah(dashboard.totalPengeluaran)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
            <h2 className="font-semibold text-gray-700 mb-1">Grafik Bulanan {tahun}</h2>
            <BarChart data={dashboard.bulanan} />
          </div>

          {/* Quick links */}
          <div className="flex gap-3">
            <Link
              to="/keuangan/baru"
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
            >
              + Tambah Transaksi
            </Link>
            <Link
              to="/keuangan/laporan"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200 border border-gray-300"
            >
              Laporan PDF
            </Link>
            <Link
              to="/keuangan/iuran"
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-200 border border-gray-300"
            >
              Daftar Iuran
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
