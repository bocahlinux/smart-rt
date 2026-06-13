/**
 * Halaman laporan keuangan — download PDF.
 * Lihat docs/06-API-CONTRACT.md §4.10 dan docs/07-TASK-BREAKDOWN.md §4.8, §4.18.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { downloadLaporan } from '../../services/keuanganService'

export function LaporanPage() {
  const { user } = useAuthStore()
  const currentYear = new Date().getFullYear()
  const [dari, setDari] = useState(`${currentYear}-01-01`)
  const [sampai, setSampai] = useState(`${currentYear}-12-31`)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const canAccess = user?.role === 'admin' || user?.role === 'bendahara'

  async function handleDownload(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await downloadLaporan({ dari: dari || undefined, sampai: sampai || undefined })
      setSuccess('Laporan berhasil diunduh.')
    } catch {
      setError('Gagal mengunduh laporan keuangan.')
    } finally {
      setLoading(false)
    }
  }

  if (!canAccess) {
    return <div className="p-6 text-center text-gray-500">Akses ditolak. Hanya bendahara dan admin.</div>
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/keuangan/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-800">Laporan Keuangan</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <p className="text-sm text-gray-600 mb-5">
          Generate laporan keuangan RT dalam format PDF berisi semua transaksi yang sudah dikonfirmasi.
        </p>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 mb-4 text-sm">{error}</div>}
        {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded px-4 py-3 mb-4 text-sm">{success}</div>}

        <form onSubmit={handleDownload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode Dari</label>
            <input
              type="date"
              value={dari}
              onChange={(e) => setDari(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periode Sampai</label>
            <input
              type="date"
              value={sampai}
              onChange={(e) => setSampai(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-5 py-2.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Mengunduh...
              </>
            ) : (
              'Download Laporan PDF'
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        Laporan akan berisi semua transaksi yang berstatus <em>confirmed</em> dalam rentang periode yang dipilih.
        File akan diunduh otomatis ke perangkat Anda.
      </div>
    </div>
  )
}
