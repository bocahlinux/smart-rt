import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Edit2, Megaphone } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { getPengumuman } from '../../services/pengumumanService'
import type { Pengumuman } from '../../types/pengumuman'

const KATEGORI_LABEL: Record<string, string> = {
  penting: 'Penting',
  acara: 'Acara',
  info: 'Informasi',
  keamanan: 'Keamanan',
  lainnya: 'Lainnya',
}

const KATEGORI_COLOR: Record<string, string> = {
  penting: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  acara: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  info: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  keamanan: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  lainnya: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function PengumumanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [pengumuman, setPengumuman] = useState<Pengumuman | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canWrite = hasPerm(user, 'kelola_pengumuman')

  useEffect(() => {
    if (!id) return
    getPengumuman(id)
      .then(setPengumuman)
      .catch(() => setError('Pengumuman tidak ditemukan.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !pengumuman) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-slate-400 dark:text-slate-500">{error || 'Pengumuman tidak ditemukan.'}</p>
        <Link to="/pengumuman" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
          ← Kembali ke Pengumuman
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/pengumuman"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Megaphone className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">{pengumuman.judul}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Pengumuman RT</p>
          </div>
        </div>
        {canWrite && (
          <Link
            to={`/pengumuman/${pengumuman.id}/edit`}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Edit2 className="h-3.5 w-3.5" />
            Edit
          </Link>
        )}
      </div>

      {/* Gambar */}
      {pengumuman.gambar && (
        <img
          src={pengumuman.gambar}
          alt={pengumuman.judul}
          className="mb-5 w-full rounded-2xl object-cover border border-slate-200 dark:border-slate-700"
          style={{ maxHeight: '280px' }}
        />
      )}

      {/* Badges + meta */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KATEGORI_COLOR[pengumuman.kategori] ?? 'bg-slate-100 text-slate-600')}>
          {KATEGORI_LABEL[pengumuman.kategori] ?? pengumuman.kategori}
        </span>
        {!pengumuman.isPublished && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            Terjadwal
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
          {formatDate(pengumuman.createdAt)} · {pengumuman.createdBy.namaLengkap}
        </span>
      </div>

      {/* Jadwal tayang */}
      {pengumuman.scheduledAt && (
        <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-300">
          Dijadwalkan tayang: {formatDate(pengumuman.scheduledAt)}
        </div>
      )}

      {/* Isi */}
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {pengumuman.isi}
      </div>
    </div>
  )
}
