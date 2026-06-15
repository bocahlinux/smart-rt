import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deleteKegiatan, getKegiatan, rsvpKegiatan } from '../../services/kegiatanService'
import type { KegiatanDetail, RSVPStatus } from '../../types/kegiatan'

const RSVP_LABELS: Record<RSVPStatus, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  masih_ragu: 'Masih Ragu',
}

const RSVP_COLOR: Record<RSVPStatus, string> = {
  hadir: 'bg-green-100 text-green-700 border-green-200',
  tidak_hadir: 'bg-red-100 text-red-700 border-red-200',
  masih_ragu: 'bg-yellow-100 text-yellow-700 border-yellow-200',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function KegiatanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [kegiatan, setKegiatan] = useState<KegiatanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const isModerator = hasPerm(user, 'kelola_kegiatan')

  useEffect(() => {
    if (!id) return
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getKegiatan(id!)
      setKegiatan(data)
    } catch {
      setError('Gagal memuat detail kegiatan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRSVP(rsvpStatus: RSVPStatus) {
    if (!kegiatan) return
    setRsvpLoading(true)
    setMsg('')
    try {
      const res = await rsvpKegiatan(kegiatan.id, rsvpStatus)
      setMsg(`RSVP berhasil diperbarui: ${RSVP_LABELS[res.rsvpStatus]}.`)
      await load()
    } catch {
      setMsg('Gagal memperbarui RSVP.')
    } finally {
      setRsvpLoading(false)
    }
  }

  async function handleDelete() {
    if (!kegiatan || !confirm(`Hapus kegiatan "${kegiatan.nama}"?`)) return
    try {
      await deleteKegiatan(kegiatan.id)
      navigate('/kegiatan')
    } catch {
      setMsg('Gagal menghapus kegiatan.')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400">Memuat...</div>
  }
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-6 lg:px-8">
        <button onClick={() => navigate('/kegiatan')} className="text-sm text-gray-500 mb-4">
          ← Kembali
        </button>
        <div className="px-4 py-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      </div>
    )
  }
  if (!kegiatan) return null

  const isMendatang = new Date(kegiatan.tanggal) > new Date()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={() => navigate('/kegiatan')} className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1">
        ← Semua Kegiatan
      </button>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-700">{msg}</div>
      )}

      {/* Card utama */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-3">
          {isMendatang ? (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium border border-blue-200">
              📅 Mendatang
            </span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">Selesai</span>
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">{kegiatan.nama}</h1>
        {kegiatan.deskripsi && (
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{kegiatan.deskripsi}</p>
        )}

        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatTanggal(kegiatan.tanggal)}</span>
          </div>
          {kegiatan.lokasi && (
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{kegiatan.lokasi}</span>
            </div>
          )}
          {kegiatan.penanggungJawab && (
            <div className="flex items-center gap-2">
              <span>👤</span>
              <span>PJ: {kegiatan.penanggungJawab.namaLengkap}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span>👥</span>
            <span>
              {kegiatan.rsvpCount} hadir
              {kegiatan.kuotaPeserta ? ` / Kuota ${kegiatan.kuotaPeserta}` : ''}
            </span>
          </div>
        </div>

        {/* RSVP section — hanya jika kegiatan masih mendatang */}
        {isMendatang && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Konfirmasi Kehadiran Anda:
              {kegiatan.myRsvp && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded border font-medium ${RSVP_COLOR[kegiatan.myRsvp]}`}>
                  {RSVP_LABELS[kegiatan.myRsvp]}
                </span>
              )}
            </p>
            <div className="flex gap-2 flex-wrap">
              {(['hadir', 'masih_ragu', 'tidak_hadir'] as RSVPStatus[]).map((s) => (
                <button
                  key={s}
                  id={`rsvp-${s}`}
                  onClick={() => handleRSVP(s)}
                  disabled={rsvpLoading}
                  className={`text-sm px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
                    kegiatan.myRsvp === s
                      ? `${RSVP_COLOR[s]} border font-semibold`
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                  }`}
                >
                  {RSVP_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Aksi moderator */}
        {isModerator && (
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => navigate(`/kegiatan/${kegiatan.id}/edit`)}
              className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Edit Kegiatan
            </button>
            <button
              onClick={handleDelete}
              className="text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Hapus
            </button>
          </div>
        )}
      </div>

      {/* Daftar peserta RSVP */}
      {kegiatan.rsvpList.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            Daftar RSVP ({kegiatan.rsvpList.length})
          </h2>
          <div className="space-y-2">
            {kegiatan.rsvpList.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-white rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
              >
                <span className="text-gray-800">{r.user.namaLengkap}</span>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${RSVP_COLOR[r.status]}`}>
                  {RSVP_LABELS[r.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
