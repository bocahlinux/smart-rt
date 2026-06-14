import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { deletePoll, getPoll, votePoll } from '../../services/pollingService'
import type { PollDetail } from '../../types/polling'

const PENGURUS_ROLES = ['admin', 'sekretaris', 'pengurus']

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Bar chart sederhana tanpa library eksternal */
function ResultBar({
  label,
  count,
  total,
  isMyVote,
}: {
  label: string
  count: number
  total: number
  isMyVote: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-sm mb-1">
        <span className={`font-medium ${isMyVote ? 'text-blue-700' : 'text-gray-700'}`}>
          {isMyVote ? '✓ ' : ''}
          {label}
        </span>
        <span className="text-gray-500">
          {count} suara · {pct}%
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isMyVote ? 'bg-blue-500' : 'bg-purple-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function PollingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [poll, setPoll] = useState<PollDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [voting, setVoting] = useState(false)
  const [msg, setMsg] = useState('')

  const isModerator = user?.role && PENGURUS_ROLES.includes(user.role)

  useEffect(() => {
    if (!id) return
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getPoll(id!)
      setPoll(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 404) {
        setError('Poll tidak ditemukan.')
      } else {
        setError('Gagal memuat poll.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleVote(opsiIndex: number) {
    if (!poll) return
    setVoting(true)
    setMsg('')
    try {
      await votePoll(poll.id, opsiIndex)
      setMsg(`Vote berhasil: "${poll.opsi[opsiIndex]}".`)
      await load()
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } }
      const code = axiosErr.response?.data?.code
      if (code === 'POLLING_ALREADY_VOTED') {
        setMsg('Anda sudah melakukan vote pada poll ini.')
      } else {
        setMsg(axiosErr.response?.data?.message ?? 'Gagal melakukan vote.')
      }
    } finally {
      setVoting(false)
    }
  }

  async function handleDelete() {
    if (!poll || !confirm(`Hapus poll "${poll.pertanyaan}"?`)) return
    try {
      await deletePoll(poll.id)
      navigate('/polling')
    } catch {
      setMsg('Gagal menghapus poll.')
    }
  }

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400">Memuat...</div>
  if (error) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <button onClick={() => navigate('/polling')} className="text-sm text-gray-500 mb-4">
          ← Kembali
        </button>
        <div className="px-4 py-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      </div>
    )
  }
  if (!poll) return null

  const totalVotes = poll.totalVotes ?? 0

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button
        onClick={() => navigate('/polling')}
        className="text-sm text-gray-500 hover:text-gray-700 mb-5 flex items-center gap-1"
      >
        ← Semua Polling
      </button>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700">{msg}</div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-5">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {poll.isExpired ? (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">Berakhir</span>
          ) : (
            <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">🟢 Aktif</span>
          )}
          {poll.hasVoted && (
            <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-600 font-medium">
              ✓ Anda sudah vote
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-3">{poll.pertanyaan}</h1>

        <div className="text-xs text-gray-400 space-y-1">
          <p>Oleh {poll.createdBy.namaLengkap}</p>
          <p>Deadline: {formatDeadline(poll.deadline)}</p>
          {poll.totalVotes !== null && <p>{poll.totalVotes} total suara</p>}
        </div>

        {/* Pilihan vote — tampil jika poll aktif dan belum vote */}
        {!poll.isExpired && !poll.hasVoted && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Pilih jawaban Anda:</p>
            <div className="space-y-2">
              {poll.opsi.map((opsi, idx) => (
                <button
                  key={idx}
                  id={`vote-option-${idx}`}
                  onClick={() => handleVote(idx)}
                  disabled={voting}
                  className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  {opsi}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Hasil voting */}
        {poll.results !== null && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Hasil Polling
              {!poll.isExpired && isModerator && (
                <span className="ml-2 text-xs text-gray-400">(hanya terlihat oleh moderator)</span>
              )}
            </h2>
            {poll.opsi.map((opsi, idx) => (
              <ResultBar
                key={idx}
                label={opsi}
                count={poll.results![opsi] ?? 0}
                total={totalVotes}
                isMyVote={poll.myVote === idx}
              />
            ))}
          </div>
        )}

        {/* Jika belum expired dan bukan moderator: sembunyikan hasil */}
        {!poll.isExpired && poll.results === null && poll.hasVoted && (
          <div className="mt-5 pt-4 border-t border-gray-100 text-sm text-gray-400 text-center py-4">
            <p>🔒 Hasil polling akan ditampilkan setelah deadline berakhir.</p>
          </div>
        )}

        {/* Aksi moderator */}
        {isModerator && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={handleDelete}
              className="text-sm px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              Hapus Poll
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
