import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deleteThread, listThreads, lockThread, pinThread } from '../../services/forumService'
import type { Thread, ThreadKategori } from '../../types/forum'

const KATEGORI_LABEL: Record<string, string> = {
  keamanan: 'Keamanan',
  kebersihan: 'Kebersihan',
  acara: 'Acara',
  usul: 'Usul/Saran',
  lainnya: 'Lainnya',
}

const KATEGORI_COLOR: Record<string, string> = {
  keamanan: 'bg-red-100 text-red-700',
  kebersihan: 'bg-green-100 text-green-700',
  acara: 'bg-blue-100 text-blue-700',
  usul: 'bg-purple-100 text-purple-700',
  lainnya: 'bg-gray-100 text-gray-700',
}

const STATUS_BADGE: Record<string, string> = {
  pinned: 'bg-yellow-100 text-yellow-700',
  locked: 'bg-rose-100 text-rose-700',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ForumListPage() {
  const { user } = useAuthStore()
  const [threads, setThreads] = useState<Thread[]>([])
  const [filterKategori, setFilterKategori] = useState<ThreadKategori | ''>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const isModerator = hasPerm(user, 'moderasi_forum')

  useEffect(() => {
    load()
  }, [page, filterKategori]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    try {
      const res = await listThreads({
        page,
        limit: 20,
        kategori: filterKategori || undefined,
      })
      setThreads(res.data)
      setTotalPages(res.pagination.totalPages)
    } catch {
      setMsg('Gagal memuat forum.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(t: Thread) {
    if (!confirm(`Hapus thread "${t.judul}"?`)) return
    try {
      await deleteThread(t.id)
      setMsg(`Thread "${t.judul}" dihapus.`)
      load()
    } catch {
      setMsg('Gagal menghapus thread.')
    }
  }

  async function handlePin(t: Thread) {
    try {
      await pinThread(t.id)
      load()
    } catch {
      setMsg('Gagal mengubah status pin.')
    }
  }

  async function handleLock(t: Thread) {
    try {
      await lockThread(t.id)
      load()
    } catch {
      setMsg('Gagal mengubah status lock.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Forum Diskusi RT</h1>
        <Link
          to="/forum/baru"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          + Buat Thread
        </Link>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded text-sm bg-blue-50 border border-blue-200 text-blue-700">
          {msg}
        </div>
      )}

      {/* Filter kategori */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['', 'keamanan', 'kebersihan', 'acara', 'usul', 'lainnya'] as const).map((k) => (
          <button
            key={k}
            onClick={() => { setFilterKategori(k); setPage(1) }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filterKategori === k
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            }`}
          >
            {k === '' ? 'Semua' : KATEGORI_LABEL[k]}
          </button>
        ))}
      </div>

      {loading && <p className="text-center text-gray-400 py-8">Memuat...</p>}

      {!loading && threads.length === 0 && (
        <p className="text-center text-gray-400 py-8">Belum ada thread diskusi.</p>
      )}

      <div className="space-y-3">
        {threads.map((t) => (
          <div
            key={t.id}
            className={`bg-white rounded-xl border shadow-sm p-4 ${
              t.status === 'pinned' ? 'border-yellow-300' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      KATEGORI_COLOR[t.kategori] ?? 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {KATEGORI_LABEL[t.kategori] ?? t.kategori}
                  </span>
                  {t.status !== 'active' && (
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_BADGE[t.status]}`}
                    >
                      {t.status === 'pinned' ? '📌 Pinned' : '🔒 Locked'}
                    </span>
                  )}
                </div>
                <Link
                  to={`/forum/${t.id}`}
                  className="block font-semibold text-gray-800 hover:text-blue-700 truncate"
                >
                  {t.judul}
                </Link>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDate(t.createdAt)} · {t.createdBy.namaLengkap} ·{' '}
                  {t.commentCount} komentar · {t.voteCount} vote
                </p>
              </div>

              {/* Aksi moderator */}
              {isModerator && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handlePin(t)}
                    title={t.status === 'pinned' ? 'Unpin' : 'Pin'}
                    className="text-xs text-yellow-600 hover:underline"
                  >
                    {t.status === 'pinned' ? 'Unpin' : 'Pin'}
                  </button>
                  <button
                    onClick={() => handleLock(t)}
                    title={t.status === 'locked' ? 'Unlock' : 'Lock'}
                    className="text-xs text-orange-600 hover:underline"
                  >
                    {t.status === 'locked' ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="text-xs text-rose-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            ← Sebelumnya
          </button>
          <span className="text-sm text-gray-600 px-3 py-1.5">
            {page} / {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-sm px-3 py-1.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
          >
            Berikutnya →
          </button>
        </div>
      )}
    </div>
  )
}
