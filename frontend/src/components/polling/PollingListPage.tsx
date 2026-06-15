import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { listPolls } from '../../services/pollingService'
import type { PollListItem } from '../../types/polling'

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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

export function PollingListPage() {
  const { user } = useAuthStore()
  const [polls, setPolls] = useState<PollListItem[]>([])
  const [filter, setFilter] = useState<'' | 'aktif' | 'expired'>('aktif')
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
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Polling RT</h1>
          <p className="text-sm text-gray-500 mt-0.5">Sampaikan suara Anda untuk kemajuan RT</p>
        </div>
        {isModerator && (
          <Link
            to="/polling/baru"
            className="bg-purple-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Buat Polling
          </Link>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {([['aktif', '🟢 Aktif'], ['expired', '🕰️ Berakhir'], ['', '📋 Semua']] as const).map(
          ([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                filter === val
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-purple-400'
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {loading && <p className="text-center text-gray-400 py-10">Memuat...</p>}

      {!loading && polls.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🗳️</p>
          <p className="text-sm">Tidak ada polling{filter === 'aktif' ? ' yang sedang aktif' : ''}.</p>
        </div>
      )}

      <div className="space-y-3">
        {polls.map((p) => (
          <Link
            key={p.id}
            to={`/polling/${p.id}`}
            className={`block bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-shadow ${
              p.isExpired ? 'border-gray-200 opacity-80' : 'border-purple-100'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  {p.isExpired ? (
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                      Berakhir
                    </span>
                  ) : (
                    <>
                      <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                        Aktif
                      </span>
                      {timeLeft(p.deadline) && (
                        <span className="text-xs text-orange-600">⏰ {timeLeft(p.deadline)}</span>
                      )}
                    </>
                  )}
                  {p.hasVoted && (
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
                      ✓ Sudah Vote
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 leading-snug">{p.pertanyaan}</h3>
                <p className="text-xs text-gray-400 mt-1.5">
                  Oleh {p.createdBy.namaLengkap} · Deadline {formatDeadline(p.deadline)}
                  {p.totalVotes !== null && ` · ${p.totalVotes} suara`}
                </p>
              </div>
              <span className="text-gray-300 text-lg flex-shrink-0">›</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
