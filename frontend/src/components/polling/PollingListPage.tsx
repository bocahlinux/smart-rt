import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Vote, ChevronRight, Check, Clock } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { listPolls } from '../../services/pollingService'
import type { PollListItem } from '../../types/polling'

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function timeLeft(iso: string) {
  const diff = new Date(iso).getTime() - Date.now()
  if (diff <= 0) return null
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days} hari lagi`
  return `${hours} jam lagi`
}

type FilterKey = '' | 'aktif' | 'expired'

const FILTER_PILLS: { key: FilterKey; label: string }[] = [
  { key: 'aktif', label: 'Aktif' },
  { key: 'expired', label: 'Berakhir' },
  { key: '', label: 'Semua' },
]

export function PollingListPage() {
  const { user } = useAuthStore()
  const [polls, setPolls] = useState<PollListItem[]>([])
  const [filter, setFilter] = useState<FilterKey>('aktif')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isModerator = hasPerm(user, 'kelola_polling')

  useEffect(() => {
    load()
  }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await listPolls({ status: filter || undefined })
      setPolls(data)
    } catch {
      setError('Gagal memuat daftar polling.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Vote className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white lg:text-2xl">Polling RT</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Sampaikan suara Anda untuk kemajuan RT</p>
          </div>
        </div>
        {isModerator && (
          <Link
            to="/polling/baru"
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-xs font-semibold text-white hover:bg-primary-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Buat Polling
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-5 flex gap-2">
        {FILTER_PILLS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
              filter === key
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
      {!loading && polls.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center dark:border-slate-700 dark:bg-slate-900">
          <Vote className="mx-auto mb-3 h-8 w-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Tidak ada polling{filter === 'aktif' ? ' yang sedang aktif' : ''}.
          </p>
        </div>
      )}

      {/* List */}
      {!loading && polls.length > 0 && (
        <div className="space-y-3">
          {polls.map((p) => (
            <Link
              key={p.id}
              to={`/polling/${p.id}`}
              className={cn(
                'block overflow-hidden rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900',
                p.isExpired
                  ? 'border-slate-200 opacity-80 dark:border-slate-700'
                  : 'border-primary-100 dark:border-primary-900/40',
              )}
            >
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Status badges */}
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {p.isExpired ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                          Berakhir
                        </span>
                      ) : (
                        <>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                            Aktif
                          </span>
                          {timeLeft(p.deadline) && (
                            <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                              <Clock className="h-3 w-3" />
                              {timeLeft(p.deadline)}
                            </span>
                          )}
                        </>
                      )}
                      {p.hasVoted && (
                        <span className="flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          <Check className="h-3 w-3" />
                          Sudah Vote
                        </span>
                      )}
                    </div>

                    {/* Question */}
                    <h3 className="font-semibold text-slate-900 dark:text-white leading-snug">{p.pertanyaan}</h3>
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      Oleh {p.createdBy.namaLengkap} · Deadline {formatDeadline(p.deadline)}
                      {p.totalVotes !== null && ` · ${p.totalVotes} suara`}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
