import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Trash2, Vote } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { deletePoll, getPoll, votePoll } from '../../services/pollingService'
import type { PollDetail } from '../../types/polling'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function ResultBar({ label, count, total, isMyVote }: {
  label: string; count: number; total: number; isMyVote: boolean
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1.5 text-sm', isMyVote ? 'font-semibold text-primary-700 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300')}>
          {isMyVote && <Check className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />}
          {label}
        </span>
        <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500">
          {count} suara · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn('h-full rounded-full transition-all duration-500', isMyVote ? 'bg-primary-500' : 'bg-violet-400 dark:bg-violet-500')}
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

  const isModerator = hasPerm(user, 'kelola_polling')

  useEffect(() => {
    if (!id) return
    void load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await getPoll(id!)
      setPoll(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      setError(axiosErr.response?.status === 404 ? 'Poll tidak ditemukan.' : 'Gagal memuat poll.')
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
      setMsg(code === 'POLLING_ALREADY_VOTED'
        ? 'Anda sudah melakukan vote pada poll ini.'
        : (axiosErr.response?.data?.message ?? 'Gagal melakukan vote.'))
    } finally {
      setVoting(false)
    }
  }

  async function handleDelete() {
    if (!poll || !confirm(`Hapus poll "${poll.pertanyaan}"?`)) return
    try { await deletePoll(poll.id); navigate('/polling') }
    catch { setMsg('Gagal menghapus poll.') }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error || !poll) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 text-center">
        <p className="text-slate-400 dark:text-slate-500">{error || 'Poll tidak ditemukan.'}</p>
        <Link to="/polling" className="mt-3 inline-block text-sm text-primary-600 hover:underline">
          ← Kembali ke Polling
        </Link>
      </div>
    )
  }

  const totalVotes = poll.totalVotes ?? 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/polling"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex flex-1 items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <Vote className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="min-w-0">
            <h1 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">{poll.pertanyaan}</h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Detail Polling</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className={cn(
          'mb-4 rounded-xl border px-4 py-3 text-sm',
          msg.includes('Gagal') || msg.includes('sudah')
            ? 'border-red-100 bg-red-50 text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300'
            : 'border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-300',
        )}>
          {msg}
        </div>
      )}

      {/* Status badges */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {poll.isExpired ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            Berakhir
          </span>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Aktif
          </span>
        )}
        {poll.hasVoted && (
          <span className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            <Check className="h-3 w-3" /> Sudah Vote
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="mb-5 space-y-1.5 text-xs text-slate-400 dark:text-slate-500">
        <p>Dibuat oleh {poll.createdBy.namaLengkap}</p>
        {poll.startsAt && (
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Mulai: {formatDateTime(poll.startsAt)}
          </p>
        )}
        <p className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Berakhir: {formatDateTime(poll.deadline)}
        </p>
        {totalVotes > 0 && <p>{totalVotes} total suara</p>}
      </div>

      {/* Pilihan vote */}
      {!poll.isExpired && !poll.hasVoted && (
        <div className="mb-5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Pilih jawaban Anda:</p>
          <div className="space-y-2">
            {poll.opsi.map((opsi, idx) => (
              <button
                key={idx}
                onClick={() => void handleVote(idx)}
                disabled={voting}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm text-slate-700 transition-colors hover:border-primary-400 hover:bg-primary-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-primary-500 dark:hover:bg-primary-900/20"
              >
                {opsi}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hasil voting */}
      {poll.results !== null && (
        <div className="mb-5 border-t border-slate-100 pt-5 dark:border-slate-800">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Hasil Polling</h2>
            {!poll.isExpired && isModerator && (
              <span className="text-xs text-slate-400 dark:text-slate-500">(hanya terlihat moderator)</span>
            )}
          </div>
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

      {/* Belum expired, sudah vote, hasil tersembunyi */}
      {!poll.isExpired && poll.results === null && poll.hasVoted && (
        <div className="mb-5 rounded-xl border border-slate-100 py-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Hasil polling akan ditampilkan setelah deadline berakhir.
        </div>
      )}

      {/* Moderator delete */}
      {isModerator && (
        <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => void handleDelete()}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus Poll
          </button>
        </div>
      )}
    </div>
  )
}
