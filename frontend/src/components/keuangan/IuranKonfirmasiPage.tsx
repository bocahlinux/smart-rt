/**
 * Halaman konfirmasi/tolak iuran warga (untuk bendahara/admin).
 * Lihat docs/06-API-CONTRACT.md §4.7 dan docs/07-TASK-BREAKDOWN.md §4.16.
 */

import { useEffect, useState } from 'react'

import { useAuthStore } from '../../stores/authStore'
import { konfirmasiIuran, listIuran } from '../../services/keuanganService'
import type { IuranStatus, IuranWarga } from '../../types/keuangan'

const BULAN_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const STATUS_BADGE: Record<IuranStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  lunas: 'bg-emerald-100 text-emerald-700',
  ditolak: 'bg-rose-100 text-rose-700',
}

const STATUS_LABEL: Record<IuranStatus, string> = {
  pending: 'Menunggu',
  lunas: 'Lunas',
  ditolak: 'Ditolak',
}

function formatRupiah(val: string | number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))
}

export function IuranKonfirmasiPage() {
  const { user } = useAuthStore()
  const [list, setList] = useState<IuranWarga[]>([])
  const [filterStatus, setFilterStatus] = useState<IuranStatus | ''>('pending')
  const [filterTahun, setFilterTahun] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [modalIuran, setModalIuran] = useState<IuranWarga | null>(null)
  const [keterangan, setKeterangan] = useState('')

  const canAccess = user?.role === 'admin' || user?.role === 'bendahara'

  useEffect(() => {
    if (!canAccess) return
    load()
  }, [filterStatus, filterTahun, canAccess])

  async function load() {
    setLoading(true)
    try {
      const result = await listIuran({
        status: filterStatus || undefined,
        tahun: filterTahun,
      })
      setList(result.data)
    } catch {
      setMsg('Gagal memuat data iuran.')
    } finally {
      setLoading(false)
    }
  }

  async function handleKonfirmasi(iuran: IuranWarga, aksi: 'lunas' | 'ditolak') {
    setActionLoading(iuran.id)
    setMsg('')
    try {
      await konfirmasiIuran(iuran.id, { status: aksi, keterangan })
      setMsg(`Iuran ${iuran.warga.namaLengkap} berhasil ${aksi === 'lunas' ? 'dikonfirmasi' : 'ditolak'}.`)
      setModalIuran(null)
      setKeterangan('')
      load()
    } catch {
      setMsg('Gagal memproses konfirmasi.')
    } finally {
      setActionLoading(null)
    }
  }

  if (!canAccess) {
    return <div className="p-6 text-center text-gray-500">Akses ditolak. Hanya bendahara dan admin.</div>
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Konfirmasi Iuran Warga</h1>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded text-sm bg-blue-50 border border-blue-200 text-blue-700">{msg}</div>
      )}

      {/* Filter */}
      <div className="flex gap-4 items-end mb-4">
        <div>
          <label className="block text-xs text-gray-600 mb-1">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as IuranStatus | '')}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="">Semua</option>
            <option value="pending">Menunggu</option>
            <option value="lunas">Lunas</option>
            <option value="ditolak">Ditolak</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-600 mb-1">Tahun</label>
          <select value={filterTahun} onChange={(e) => setFilterTahun(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            {[new Date().getFullYear() - 1, new Date().getFullYear()].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-600 uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Warga</th>
              <th className="px-4 py-3 text-left">Periode</th>
              <th className="px-4 py-3 text-right">Jumlah</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-left">Bukti</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Memuat...</td></tr>
            )}
            {!loading && list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">Tidak ada data iuran.</td></tr>
            )}
            {list.map((iuran) => (
              <tr key={iuran.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-800">{iuran.warga.namaLengkap}</p>
                  <p className="text-xs text-gray-500">Blok {iuran.warga.blok}/{iuran.warga.noRumah}</p>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {BULAN_LABELS[iuran.bulan]} {iuran.tahun}
                </td>
                <td className="px-4 py-3 text-right font-medium">{formatRupiah(iuran.jumlah)}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_BADGE[iuran.status]}`}>
                    {STATUS_LABEL[iuran.status]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {iuran.buktiUrl ? (
                    <a href={iuran.buktiUrl} target="_blank" rel="noreferrer"
                      className="text-blue-600 text-xs hover:underline">Lihat Bukti</a>
                  ) : (
                    <span className="text-gray-400 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {iuran.status === 'pending' ? (
                    <button
                      onClick={() => { setModalIuran(iuran); setKeterangan('') }}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Proses
                    </button>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal konfirmasi */}
      {modalIuran && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="font-bold text-gray-800 mb-1">Proses Iuran</h2>
            <p className="text-sm text-gray-600 mb-4">
              {modalIuran.warga.namaLengkap} — {BULAN_LABELS[modalIuran.bulan]} {modalIuran.tahun} — {formatRupiah(modalIuran.jumlah)}
            </p>
            {modalIuran.buktiUrl && (
              <div className="mb-4">
                <a href={modalIuran.buktiUrl} target="_blank" rel="noreferrer"
                  className="text-blue-600 text-sm hover:underline">Buka Bukti Transfer ↗</a>
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan (opsional)</label>
              <textarea value={keterangan} onChange={(e) => setKeterangan(e.target.value)}
                rows={2} placeholder="Catatan konfirmasi atau alasan penolakan..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none" />
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setModalIuran(null)}
                className="text-sm text-gray-600 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
                Batal
              </button>
              <button
                onClick={() => handleKonfirmasi(modalIuran, 'ditolak')}
                disabled={actionLoading === modalIuran.id}
                className="text-sm text-white px-4 py-2 bg-rose-600 rounded hover:bg-rose-700 disabled:opacity-50">
                Tolak
              </button>
              <button
                onClick={() => handleKonfirmasi(modalIuran, 'lunas')}
                disabled={actionLoading === modalIuran.id}
                className="text-sm text-white px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700 disabled:opacity-50">
                Konfirmasi Lunas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
