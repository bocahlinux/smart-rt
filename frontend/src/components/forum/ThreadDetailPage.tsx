import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

function CommentItem({
  comment,
  onDelete,
  onEdit,
  currentUserId,
  isModerator,
  onReply,
  isThreadLocked,
}: CommentItemProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(comment.isi)

  const isOwner = currentUserId === comment.createdBy.id
  const canEdit = isOwner || isModerator
  const canDelete = isModerator

  async function handleSaveEdit() {
    if (!editText.trim()) return
    await onEdit(comment.id, editText)
    setEditing(false)
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
        {comment.createdBy.namaLengkap[0]}
      </div>
      <div className="flex-1">
        <div className="bg-gray-50 rounded-xl px-4 py-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">{comment.createdBy.namaLengkap}</p>
          {editing ? (
            <div className="space-y-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-700 whitespace-pre-line">{comment.isi}</p>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 px-1">
          <span className="text-xs text-gray-400">{formatDate(comment.createdAt)}</span>
          {!isThreadLocked && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-blue-500 hover:underline"
            >
              Balas
            </button>
          )}
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs text-gray-500 hover:underline"
            >
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-xs text-rose-500 hover:underline"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="ml-4 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {reply.createdBy.namaLengkap[0]}
                </div>
                <div className="flex-1">
                  <div className="bg-white rounded-xl px-4 py-2 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-0.5">
                      {reply.createdBy.namaLengkap}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{reply.isi}</p>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 px-1">
                    <span className="text-xs text-gray-400">{formatDate(reply.createdAt)}</span>
                    {isModerator && (
                      <button
                        onClick={() => onDelete(reply.id)}
                        className="text-xs text-rose-500 hover:underline"
                      >
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
    if (id) loadThread(id)
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
    setThread((prev) =>
      prev ? { ...prev, voteCount: result.voteCount, hasVoted: result.hasVoted } : prev
    )
  }

  async function handleDeleteThread() {
    if (!thread || !confirm(`Hapus thread "${thread.judul}"?`)) return
    try {
      await deleteThread(thread.id)
      navigate('/forum')
    } catch {
      setMsg('Gagal menghapus thread.')
    }
  }

  async function handlePin() {
    if (!thread) return
    await pinThread(thread.id)
    loadThread(thread.id)
  }

  async function handleLock() {
    if (!thread) return
    await lockThread(thread.id)
    loadThread(thread.id)
  }

  async function handleSubmitComment() {
    if (!thread || !commentText.trim()) return
    setSubmittingComment(true)
    try {
      await addComment(thread.id, {
        isi: commentText.trim(),
        parentId: replyingTo ?? undefined,
      })
      setCommentText('')
      setReplyingTo(null)
      loadThread(thread.id)
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
    try {
      await deleteComment(commentId)
      if (thread) loadThread(thread.id)
    } catch {
      setMsg('Gagal menghapus komentar.')
    }
  }

  async function handleEditComment(commentId: string, isi: string) {
    try {
      await updateComment(commentId, isi)
      if (thread) loadThread(thread.id)
    } catch {
      setMsg('Gagal mengedit komentar.')
    }
  }

  if (loading) return <p className="text-center text-gray-400 py-16">Memuat...</p>
  if (!thread) return <p className="text-center text-gray-500 py-16">{msg || 'Thread tidak ditemukan.'}</p>

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link to="/forum" className="hover:text-blue-600">Forum</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-700">{thread.judul}</span>
      </div>

      {msg && (
        <div className="mb-4 px-4 py-3 rounded text-sm bg-red-50 border border-red-200 text-red-700">
          {msg}
        </div>
      )}

      {/* Thread header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium">
                {KATEGORI_LABEL[thread.kategori] ?? thread.kategori}
              </span>
              {thread.status === 'pinned' && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-700 font-medium">
                  📌 Pinned
                </span>
              )}
              {thread.status === 'locked' && (
                <span className="text-xs px-2 py-0.5 rounded bg-rose-100 text-rose-700 font-medium">
                  🔒 Terkunci
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-3">{thread.judul}</h1>
            <p className="text-gray-700 whitespace-pre-line">{thread.isi}</p>
            <p className="text-xs text-gray-400 mt-3">
              {formatDate(thread.createdAt)} · {thread.createdBy.namaLengkap}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {/* Vote */}
          <button
            onClick={handleVote}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              thread.hasVoted
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            ▲ {thread.voteCount}
          </button>

          <span className="text-sm text-gray-500">{thread.comments.length} komentar</span>

          <div className="flex-1" />

          {/* Owner actions */}
          {(isOwner || isModerator) && (
            <Link
              to={`/forum/${thread.id}/edit`}
              className="text-xs text-blue-600 hover:underline"
            >
              Edit
            </Link>
          )}

          {/* Moderator actions */}
          {isModerator && (
            <>
              <button onClick={handlePin} className="text-xs text-yellow-600 hover:underline">
                {thread.status === 'pinned' ? 'Unpin' : 'Pin'}
              </button>
              <button onClick={handleLock} className="text-xs text-orange-600 hover:underline">
                {thread.status === 'locked' ? 'Unlock' : 'Lock'}
              </button>
              <button onClick={handleDeleteThread} className="text-xs text-rose-600 hover:underline">
                Hapus Thread
              </button>
            </>
          )}
        </div>
      </div>

      {/* Komentar */}
      <h2 className="font-semibold text-gray-700 mb-3">
        Komentar ({thread.comments.reduce((sum, c) => sum + 1 + c.replies.length, 0)})
      </h2>

      <div className="space-y-4 mb-6">
        {thread.comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={handleDeleteComment}
            onEdit={handleEditComment}
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
      {!isLocked && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          {replyingTo && (
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-blue-600">Membalas komentar...</span>
              <button
                onClick={() => setReplyingTo(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmitComment}
              disabled={submittingComment || !commentText.trim()}
              className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40"
            >
              {submittingComment ? 'Mengirim...' : 'Kirim Komentar'}
            </button>
          </div>
        </div>
      )}

      {isLocked && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm text-center">
          Thread ini terkunci. Komentar baru tidak dapat ditambahkan.
        </div>
      )}
    </div>
  )
}
