import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, MessageSquare, Pin, Lock, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
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
  keamanan: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  kebersihan: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  acara: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  usul: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  lainnya: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const FILTER_PILLS: { key: ThreadKategori | ''; label: string }[] = [
  { key: '', label: 'Semua' },
  { key: 'keamanan', label: 'Keamanan' },
  { key: 'kebersihan', label: 'Kebersihan' },
  { key: 'acara', label: 'Acara' },
  { key: 'usul', label: 'Usul/Saran' },
  { key: 'lainnya', label: 'Lainnya' },
]

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
      const res = await listThreads({ page, limit: 20, kategori: filterKategori || undefined })
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
      setMsg('Thread dihapus.')
      load()
    } catch {
      setMsg('Gagal menghapus thread.')
    }
  }

  async function handlePin(t: Thread) {
    try { await pinThread(t.id); load() }
    catch { setMsg('Gagal mengubah status pin.') }
  }

  async function handleLock(t: Thread) {
    try { await lockThread(t.id); load() }
    catch { setMsg('Gagal mengubah status lock.') }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <MessageSquare className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Forum Diskusi RT</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Diskusi dan aspirasi warga</p>
          </div>
        </div>
        <Link
          to="/forum/baru"
          className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Buat Thread
        </Link>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700 dark:border-blue-900/30 dark:bg-blue-900/20 dark:text-blue-300">
          {msg}
        </div>
      )}

      {/* Filter kategori */}
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTER_PILLS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => { setFilterKategori(key); setPage(1) }}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filterKategori === key
                ? 'border-primary-600 bg-primary-600 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-primary-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-primary-500',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!loading && threads.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <MessageSquare className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">Belum ada thread diskusi.</p>
        </div>
      )}

      {/* List */}
      {!loading && threads.length > 0 && (
        <div className="space-y-3">
          {threads.map((t) => (
            <div
              key={t.id}
              className={cn(
                'overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900',
                t.status === 'pinned'
                  ? 'border-amber-200 dark:border-amber-700/50'
                  : 'border-slate-200 dark:border-slate-700',
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Badges */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KATEGORI_COLOR[t.kategori] ?? 'bg-slate-100 text-slate-600')}>
                        {KATEGORI_LABEL[t.kategori] ?? t.kategori}
                      </span>
                      {t.status === 'pinned' && (
                        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          <Pin className="h-3 w-3" /> Pinned
                        </span>
                      )}
                      {t.status === 'locked' && (
                        <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <Link
                      to={`/forum/${t.id}`}
                      className="block font-semibold text-slate-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 truncate"
                    >
                      {t.judul}
                    </Link>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {formatDate(t.createdAt)} · {t.createdBy.namaLengkap} · {t.commentCount} komentar · {t.voteCount} vote
                    </p>
                  </div>

                  {/* Moderator actions */}
                  {isModerator && (
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handlePin(t)}
                        title={t.status === 'pinned' ? 'Unpin' : 'Pin'}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                          t.status === 'pinned'
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100 dark:bg-amber-900/20'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800',
                        )}
                      >
                        <Pin className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLock(t)}
                        title={t.status === 'locked' ? 'Unlock' : 'Lock'}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition-colors',
                          t.status === 'locked'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800',
                        )}
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(t)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                        title="Hapus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400 dark:text-slate-500">Halaman {page} dari {totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              ← Sebelumnya
            </button>
            <span className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Berikutnya →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
