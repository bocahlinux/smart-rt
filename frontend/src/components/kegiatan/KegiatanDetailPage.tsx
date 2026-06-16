import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MapPin, Pencil, Trash2, Users } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deleteKegiatan, getKegiatan, rsvpKegiatan } from '../../services/kegiatanService'
import type { KegiatanDetail, RSVPStatus } from '../../types/kegiatan'

const RSVP_LABELS: Record<RSVPStatus, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  masih_ragu: 'Masih Ragu',
}

const RSVP_ACTIVE: Record<RSVPStatus, string> = {
  hadir: 'border-emerald-500 bg-emerald-600 text-white',
  tidak_hadir: 'border-rose-500 bg-rose-600 text-white',
  masih_ragu: 'border-amber-500 bg-amber-500 text-white',
}

const RSVP_PILL: Record<RSVPStatus, string> = {
  hadir: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  tidak_hadir: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  masih_ragu: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
}

function formatTanggal(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
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
    void load()
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
      setMsg(`RSVP diperbarui: ${RSVP_LABELS[res.rsvpStatus]}.`)
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
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !kegiatan) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-400 dark:text-slate-500">{error || 'Kegiatan tidak ditemukan.'}</p>
        <Link to="/kegiatan" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
          ← Kembali ke Kegiatan
        </Link>
      </div>
    )
  }

  const isMendatang = new Date(kegiatan.tanggal) > new Date()

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/kegiatan"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Calendar className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">{kegiatan.nama}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Detail Kegiatan</p>
          </div>
        </div>
        {isModerator && (
          <Link
            to={`/kegiatan/${kegiatan.id}/edit`}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        )}
      </div>

      {msg && (
        <div className={cn(
          'mb-4 rounded-xl border px-4 py-3 text-sm',
          msg.includes('Gagal')
            ? 'border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300'
            : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300',
        )}>
          {msg}
        </div>
      )}

      {/* Status badge */}
      <div className="mb-4">
        {isMendatang ? (
          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            Mendatang
          </span>
        ) : (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Selesai
          </span>
        )}
      </div>

      {/* Deskripsi */}
      {kegiatan.deskripsi && (
        <p className="mb-5 whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {kegiatan.deskripsi}
        </p>
      )}

      {/* Meta info */}
      <div className="mb-5 space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
          <span>{formatTanggal(kegiatan.tanggal)}</span>
        </div>
        {kegiatan.tanggalSelesai && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <Clock className="h-4 w-4 shrink-0 text-slate-400" />
            <span>Selesai pukul {formatJam(kegiatan.tanggalSelesai)}</span>
          </div>
        )}
        {kegiatan.lokasi && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
            <span>{kegiatan.lokasi}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
          <Users className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {kegiatan.rsvpCount} konfirmasi hadir
            {kegiatan.kuotaPeserta ? ` · Kuota ${kegiatan.kuotaPeserta} orang` : ''}
          </span>
        </div>
        {kegiatan.penanggungJawab && (
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-400">
            <span className="text-slate-400">PJ:</span>
            <span>{kegiatan.penanggungJawab.namaLengkap}</span>
          </div>
        )}
      </div>

      {/* RSVP */}
      {isMendatang && (
        <div className="mb-5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Konfirmasi Kehadiran Anda</p>
            {kegiatan.myRsvp && (
              <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', RSVP_PILL[kegiatan.myRsvp])}>
                {RSVP_LABELS[kegiatan.myRsvp]}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {(['hadir', 'masih_ragu', 'tidak_hadir'] as RSVPStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => void handleRSVP(s)}
                disabled={rsvpLoading}
                className={cn(
                  'rounded-xl border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50',
                  kegiatan.myRsvp === s
                    ? RSVP_ACTIVE[s]
                    : 'border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500',
                )}
              >
                {RSVP_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Moderator delete */}
      {isModerator && (
        <div className="mb-6 flex gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => void handleDelete()}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Kegiatan
          </button>
        </div>
      )}

      {/* Daftar RSVP */}
      {kegiatan.rsvpList.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
            Daftar RSVP ({kegiatan.rsvpList.length})
          </h2>
          <div className="space-y-2">
            {kegiatan.rsvpList.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 dark:border-slate-800"
              >
                <span className="text-sm text-slate-800 dark:text-slate-200">{r.user.namaLengkap}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', RSVP_PILL[r.status])}>
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
