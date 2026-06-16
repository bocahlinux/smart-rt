import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronUp, Lock, MessageSquare, Pin, Trash2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import {
  addComment,
  deleteComment,
  deleteThread,
  getThread,
  lockThread,
  pinThread,
  toggleVote,
  updateComment,
} from '../../services/forumService'
import type { Comment, ThreadDetail } from '../../types/forum'

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

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Avatar({ name, size = 8, color = 'primary' }: { name: string; size?: number; color?: 'primary' | 'violet' }) {
  const cls = color === 'violet'
    ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
    : 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
  return (
    <div className={cn(`flex h-${size} w-${size} shrink-0 items-center justify-center rounded-full text-xs font-bold`, cls)}>
      {name[0]?.toUpperCase()}
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  onDelete: (id: string) => void
  onEdit: (id: string, isi: string) => void
  currentUserId?: string
  isModerator: boolean
  onReply: (parentId: string) => void
  isThreadLocked: boolean
}

function CommentItem({ comment, onDelete, onEdit, currentUserId, isModerator, onReply, isThreadLocked }: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.isi)

  const isOwner = currentUserId === comment.createdBy.id
  const canEdit = isOwner || isModerator

  async function handleSaveEdit() {
    if (!editText.trim()) return
    await onEdit(comment.id, editText)
    setEditing(false)
  }

  return (
    <div className="flex gap-3">
      <Avatar name={comment.createdBy.namaLengkap} size={8} />
      <div className="flex-1 min-w-0">
        <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
          <p className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
            {comment.createdBy.namaLengkap}
          </p>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className={cn(INPUT, 'resize-none')}
              />
              <div className="flex gap-2">
                <button onClick={() => void handleSaveEdit()}
                  className="rounded-lg bg-primary-600 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-700">
                  Simpan
                </button>
                <button onClick={() => setEditing(false)}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300">
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{comment.isi}</p>
          )}
        </div>
        <div className="mt-1 flex items-center gap-3 px-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(comment.createdAt)}</span>
          {!isThreadLocked && (
            <button onClick={() => onReply(comment.id)} className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400">
              Balas
            </button>
          )}
          {canEdit && !editing && (
            <button onClick={() => setEditing(true)} className="text-xs text-slate-400 hover:text-slate-600 dark:text-slate-500">
              Edit
            </button>
          )}
          {isModerator && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400">
              Hapus
            </button>
          )}
        </div>

        {comment.replies.length > 0 && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-slate-200 pl-4 dark:border-slate-700">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-2.5">
                <Avatar name={reply.createdBy.namaLengkap} size={6} color="violet" />
                <div className="flex-1 min-w-0">
                  <div className="rounded-xl border border-slate-100 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
                    <p className="mb-0.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {reply.createdBy.namaLengkap}
                    </p>
                    <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{reply.isi}</p>
                  </div>
                  <div className="mt-0.5 flex items-center gap-3 px-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(reply.createdAt)}</span>
                    {isModerator && (
                      <button onClick={() => onDelete(reply.id)} className="text-xs text-rose-500 hover:text-rose-600">
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [thread, setThread] = useState<ThreadDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [commentText, setCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)

  const isModerator = hasPerm(user, 'moderasi_forum')
  const isOwner = thread?.createdBy.id === user?.id
  const isLocked = thread?.status === 'locked'

  useEffect(() => {
    if (id) void loadThread(id)
  }, [id])

  async function loadThread(threadId: string) {
    setLoading(true)
    try {
      const data = await getThread(threadId)
      setThread(data)
    } catch {
      setMsg('Thread tidak ditemukan.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVote() {
    if (!thread) return
    const result = await toggleVote(thread.id)
    setThread((prev) => prev ? { ...prev, voteCount: result.voteCount, hasVoted: result.hasVoted } : prev)
  }

  async function handleDeleteThread() {
    if (!thread || !confirm(`Hapus thread "${thread.judul}"?`)) return
    try { await deleteThread(thread.id); navigate('/forum') }
    catch { setMsg('Gagal menghapus thread.') }
  }

  async function handlePin() {
    if (!thread) return
    await pinThread(thread.id)
    void loadThread(thread.id)
  }

  async function handleLock() {
    if (!thread) return
    await lockThread(thread.id)
    void loadThread(thread.id)
  }

  async function handleSubmitComment() {
    if (!thread || !commentText.trim()) return
    setSubmittingComment(true)
    try {
      await addComment(thread.id, { isi: commentText.trim(), parentId: replyingTo ?? undefined })
      setCommentText('')
      setReplyingTo(null)
      void loadThread(thread.id)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string } } }
      if (axiosErr?.response?.data?.code === 'FORUM_THREAD_LOCKED') {
        setMsg('Thread terkunci, tidak bisa menambah komentar.')
      } else {
        setMsg('Gagal mengirim komentar.')
      }
    } finally {
      setSubmittingComment(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Hapus komentar ini?')) return
    try { await deleteComment(commentId); if (thread) void loadThread(thread.id) }
    catch { setMsg('Gagal menghapus komentar.') }
  }

  async function handleEditComment(commentId: string, isi: string) {
    try { await updateComment(commentId, isi); if (thread) void loadThread(thread.id) }
    catch { setMsg('Gagal mengedit komentar.') }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 text-center">
        <p className="text-slate-400 dark:text-slate-500">{msg || 'Thread tidak ditemukan.'}</p>
        <Link to="/forum" className="mt-3 inline-block text-sm text-primary-600 hover:underline">← Kembali ke Forum</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 lg:px-8 lg:py-6">

      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <Link
          to="/forum"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/20">
            <MessageSquare className="h-4.5 w-4.5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="line-clamp-1 text-lg font-bold text-slate-900 dark:text-white">
              {thread.judul}
            </h1>
            <p className="text-xs text-slate-400 dark:text-slate-500">Forum Diskusi RT</p>
          </div>
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
          {msg}
        </div>
      )}

      {/* Thread body */}
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        {/* Badges */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', KATEGORI_COLOR[thread.kategori] ?? 'bg-slate-100 text-slate-600')}>
            {KATEGORI_LABEL[thread.kategori] ?? thread.kategori}
          </span>
          {thread.status === 'pinned' && (
            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          {thread.status === 'locked' && (
            <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
              <Lock className="h-3 w-3" /> Terkunci
            </span>
          )}
        </div>

        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {thread.isi}
        </p>

        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
          {formatDate(thread.createdAt)} · {thread.createdBy.namaLengkap}
        </p>

        {/* Actions bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => void handleVote()}
            className={cn(
              'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              thread.hasVoted
                ? 'border-primary-500 bg-primary-600 text-white'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
            )}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            {thread.voteCount}
          </button>

          <span className="text-sm text-slate-400 dark:text-slate-500">
            {thread.comments.reduce((s, c) => s + 1 + c.replies.length, 0)} komentar
          </span>

          <div className="flex-1" />

          {(isOwner || isModerator) && (
            <Link to={`/forum/${thread.id}/edit`}
              className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
              Edit
            </Link>
          )}
          {isModerator && (
            <>
              <button onClick={() => void handlePin()} className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400">
                {thread.status === 'pinned' ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={() => void handleLock()} className="text-xs text-orange-600 hover:text-orange-700 dark:text-orange-400">
                {thread.status === 'locked' ? 'Unlock' : 'Lock'}
              </button>
              <button onClick={() => void handleDeleteThread()}
                className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400">
                <Trash2 className="h-3 w-3" /> Hapus
              </button>
            </>
          )}
        </div>
      </div>

      {/* Komentar */}
      <h2 className="mb-3 font-semibold text-slate-700 dark:text-slate-200">
        Komentar ({thread.comments.reduce((s, c) => s + 1 + c.replies.length, 0)})
      </h2>

      <div className="mb-5 space-y-4">
        {thread.comments.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Belum ada komentar. Jadilah yang pertama!</p>
        )}
        {thread.comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={(cid) => void handleDeleteComment(cid)}
            onEdit={(cid, isi) => void handleEditComment(cid, isi)}
            currentUserId={user?.id}
            isModerator={!!isModerator}
            onReply={(parentId) => {
              setReplyingTo(parentId)
              document.getElementById('comment-input')?.focus()
            }}
            isThreadLocked={isLocked}
          />
        ))}
      </div>

      {/* Form komentar */}
      {!isLocked ? (
        <div>
          {replyingTo && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-primary-50 px-3 py-1.5 text-xs dark:bg-primary-900/20">
              <span className="text-primary-600 dark:text-primary-400">Membalas komentar...</span>
              <button onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-500">
                Batal
              </button>
            </div>
          )}
          <textarea
            id="comment-input"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={replyingTo ? 'Tulis balasan...' : 'Tulis komentar...'}
            rows={3}
            className={cn(INPUT, 'resize-none')}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={() => void handleSubmitComment()}
              disabled={submittingComment || !commentText.trim()}
              className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
            >
              {submittingComment ? 'Mengirim...' : 'Kirim Komentar'}
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-900/20 dark:text-rose-300">
          Thread ini terkunci. Komentar baru tidak dapat ditambahkan.
        </div>
      )}
    </div>
  )
}
