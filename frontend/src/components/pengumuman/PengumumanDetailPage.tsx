import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

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
  penting: 'bg-red-100 text-red-700',
  acara: 'bg-blue-100 text-blue-700',
  info: 'bg-gray-100 text-gray-700',
  keamanan: 'bg-amber-100 text-amber-700',
  lainnya: 'bg-purple-100 text-purple-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PengumumanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const [pengumuman, setPengumuman] = useState<Pengumuman | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canWrite = user?.role && ['admin', 'pengurus', 'sekretaris'].includes(user.role)

  useEffect(() => {
    if (!id) return
    getPengumuman(id)
      .then(setPengumuman)
      .catch(() => setError('Pengumuman tidak ditemukan.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Memuat...</div>
  }

  if (error || !pengumuman) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p className="mb-4">{error || 'Pengumuman tidak ditemukan.'}</p>
        <Link to="/pengumuman" className="text-blue-600 hover:underline text-sm">
          ← Kembali ke daftar pengumuman
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/pengumuman" className="text-gray-500 hover:text-gray-700 text-sm">
          ← Semua Pengumuman
        </Link>
        {canWrite && (
          <Link
            to={`/pengumuman/${pengumuman.id}/edit`}
            className="ml-auto text-sm text-blue-600 hover:underline"
          >
            Edit
          </Link>
        )}
      </div>

      <article className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {pengumuman.gambar && (
          <img
            src={pengumuman.gambar}
            alt={pengumuman.judul}
            className="w-full h-52 object-cover"
          />
        )}

        <div className="p-6">
          <div className="flex items-center gap-2 mb-3">
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${KATEGORI_COLOR[pengumuman.kategori] ?? 'bg-gray-100 text-gray-700'}`}
            >
              {KATEGORI_LABEL[pengumuman.kategori] ?? pengumuman.kategori}
            </span>
            {!pengumuman.isPublished && (
              <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">
                Terjadwal
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">{pengumuman.judul}</h1>

          <p className="text-xs text-gray-400 mb-6">
            {formatDate(pengumuman.createdAt)} · oleh {pengumuman.createdBy.namaLengkap}
          </p>

          {pengumuman.scheduledAt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded px-4 py-3 mb-4 text-sm text-yellow-800">
              Dijadwalkan tayang: {formatDate(pengumuman.scheduledAt)}
            </div>
          )}

          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
            {pengumuman.isi}
          </div>
        </div>
      </article>
    </div>
  )
}
