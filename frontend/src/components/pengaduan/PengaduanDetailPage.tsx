import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import {
  deletePengaduan,
  getPengaduan,
  updateStatusPengaduan,
} from '../../services/pengaduanService'
import type { PengaduanDetail, PengaduanStatus } from '../../types/pengaduan'

const STATUS_LABEL: Record<string, string> = {
  diajukan: 'Diajukan',
  diproses: 'Sedang Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const STATUS_COLOR: Record<string, string> = {
  diajukan: 'bg-blue-100 text-blue-700 border-blue-200',
  diproses: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  selesai: 'bg-green-100 text-green-700 border-green-200',
  ditolak: 'bg-red-100 text-red-700 border-red-200',
}

const TIMELINE_DOT: Record<string, string> = {
  diajukan: 'bg-blue-400',
  diproses: 'bg-yellow-400',
  selesai: 'bg-green-400',
  ditolak: 'bg-red-400',
}

const KATEGORI_LABEL: Record<string, string> = {
  infrastruktur: 'Infrastruktur',
  keamanan: 'Keamanan',
  kebersihan: 'Kebersihan',
  sosial: 'Sosial',
  lainnya: 'Lainnya',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const STATUS_OPTIONS: PengaduanStatus[] = ['diajukan', 'diproses', 'selesai', 'ditolak']

export function PengaduanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [pengaduan, setPengaduan] = useState<PengaduanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State untuk update status
  const [showStatusForm, setShowStatusForm] = useState(false)
  const [newStatus, setNewStatus] = useState<PengaduanStatus>('diproses')
  const [keterangan, setKeterangan] = useState('')
  const [updating, setUpdating] = useState(false)
  const [updateMsg, setUpdateMsg] = useState('')

  const isModerator = hasPerm(user, 'update_pengaduan')

  useEffect(() => {
    if (!id) return
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getPengaduan(id!)
      setPengaduan(data)
      // Set default status option ke yang lebih maju dari saat ini
      const idx = STATUS_OPTIONS.indexOf(data.status)
      setNewStatus(STATUS_OPTIONS[Math.min(idx + 1, STATUS_OPTIONS.length - 1)])
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 403) {
        setError('Anda tidak memiliki akses ke pengaduan ini.')
      } else if (axiosErr.response?.status === 404) {
        setError('Pengaduan tidak ditemukan.')
      } else {
        setError('Gagal memuat pengaduan.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!pengaduan) return
    setUpdating(true)
    setUpdateMsg('')
    try {
      await updateStatusPengaduan(pengaduan.id, { status: newStatus, keterangan })
      setUpdateMsg(`Status berhasil diperbarui menjadi "${STATUS_LABEL[newStatus]}".`)
      setShowStatusForm(false)
      setKeterangan('')
      await load()
    } catch {
      setUpdateMsg('Gagal memperbarui status.')
    } finally {
      setUpdating(false)
    }
  }

  async function handleDelete() {
    if (!pengaduan || !confirm(`Hapus pengaduan "${pengaduan.judul}"?`)) return
    try {
      await deletePengaduan(pengaduan.id)
      navigate('/pengaduan')
    } catch {
      setError('Gagal menghapus pengaduan.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400">
        <p>Memuat pengaduan...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
        <button onClick={() => navigate('/pengaduan')} className="text-sm text-gray-500 hover:text-gray-700 mb-4">
          ← Kembali
        </button>
        <div className="px-4 py-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      </div>
    )
  }

  if (!pengaduan) return null

  const isOwner = user?.email === (pengaduan.warga as { namaLengkap?: string; email?: string })?.email
  const canDelete = isOwner || hasPerm(user, 'update_pengaduan')

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => navigate('/pengaduan')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          ← Semua Pengaduan
        </button>
      </div>

      {updateMsg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-700">
          {updateMsg}
        </div>
      )}

      {/* Card utama */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Foto jika ada */}
        {pengaduan.foto && (
          <a href={pengaduan.foto} target="_blank" rel="noopener noreferrer">
            <img
              src={pengaduan.foto}
              alt="Foto pengaduan"
              className="w-full max-h-72 object-cover"
            />
          </a>
        )}

        <div className="p-6">
          {/* Badge kategori + status */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">
              {KATEGORI_LABEL[pengaduan.kategori] ?? pengaduan.kategori}
            </span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded border font-semibold ${
                STATUS_COLOR[pengaduan.status] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {STATUS_LABEL[pengaduan.status] ?? pengaduan.status}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-1">{pengaduan.judul}</h1>
          <p className="text-xs text-gray-400 mb-4">
            Dilaporkan oleh <strong>{pengaduan.warga.namaLengkap}</strong> ·{' '}
            {formatDate(pengaduan.createdAt)}
          </p>

          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {pengaduan.deskripsi}
          </p>

          {/* Aksi */}
          {(isModerator || canDelete) && (
            <div className="mt-5 flex gap-2 flex-wrap">
              {isModerator && (
                <button
                  id="btn-update-status"
                  onClick={() => setShowStatusForm((v) => !v)}
                  className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showStatusForm ? 'Batal' : 'Update Status'}
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Hapus Pengaduan
                </button>
              )}
            </div>
          )}

          {/* Form update status (pengurus) */}
          {showStatusForm && isModerator && (
            <form
              onSubmit={handleStatusUpdate}
              className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
            >
              <h3 className="text-sm font-semibold text-gray-700">Perbarui Status Pengaduan</h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Status Baru
                </label>
                <select
                  id="select-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PengaduanStatus)}
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Keterangan (opsional)
                </label>
                <textarea
                  id="keterangan-status"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={3}
                  placeholder="Tambahkan keterangan untuk pelapor..."
                  className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={updating}
                className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {updating ? 'Menyimpan...' : 'Simpan Status'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Timeline status history */}
      {pengaduan.statusHistory && pengaduan.statusHistory.length > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Riwayat Status</h2>
          <div className="relative pl-6">
            {/* Garis vertikal */}
            <div className="absolute left-2.5 top-1 bottom-4 w-px bg-gray-200" />

            <div className="space-y-4">
              {[...pengaduan.statusHistory].reverse().map((h, idx) => (
                <div key={idx} className="relative">
                  {/* Dot */}
                  <div
                    className={`absolute -left-4 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                      TIMELINE_DOT[h.status] ?? 'bg-gray-400'
                    }`}
                  />

                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-semibold border ${
                          STATUS_COLOR[h.status] ?? 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {STATUS_LABEL[h.status] ?? h.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(h.updatedAt)}
                      </span>
                    </div>
                    {h.keterangan && (
                      <p className="text-sm text-gray-600 mt-1">{h.keterangan}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">oleh {h.updatedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
