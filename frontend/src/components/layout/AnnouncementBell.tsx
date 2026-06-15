import { Bell, BookOpen, CheckCheck, ExternalLink } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { listPengumuman } from '@/services/pengumumanService'
import { useAuthStore } from '@/stores/authStore'
import type { Pengumuman } from '@/types/pengumuman'

const KATEGORI_CLS: Record<string, string> = {
  penting:   'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  acara:     'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  info:      'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  keamanan:  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  lainnya:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function storageKey(userId: string) {
  return `smartrt_read_pengumuman_${userId}`
}

function getReadIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function persistRead(userId: string, ids: Set<string>) {
  localStorage.setItem(storageKey(userId), JSON.stringify([...ids]))
}

export function AnnouncementBell() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Pengumuman[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  // Tutup saat klik di luar
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Muat pengumuman dan read-state
  useEffect(() => {
    if (!user) return
    const ids = getReadIds(user.id)
    setReadIds(ids)
    listPengumuman({ limit: 15, is_published: true })
      .then((res) => setItems(res.data))
      .catch(() => undefined)
  }, [user])

  function markRead(id: string) {
    if (!user) return
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      persistRead(user.id, next)
      return next
    })
  }

  function markAllRead() {
    if (!user) return
    const all = new Set(items.map((i) => i.id))
    persistRead(user.id, all)
    setReadIds(all)
  }

  function handleOpen(id: string) {
    markRead(id)
    setOpen(false)
    navigate(`/pengumuman/${id}`)
  }

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Pengumuman"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Pengumuman</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-900/20"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai semua dibaca
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul className="max-h-[60vh] overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
            {items.length === 0 ? (
              <li className="py-10 text-center text-sm text-slate-400">Belum ada pengumuman.</li>
            ) : (
              items.map((item) => {
                const isRead = readIds.has(item.id)
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'flex gap-3 px-4 py-3 transition',
                      !isRead && 'bg-primary-50/40 dark:bg-primary-900/10',
                    )}
                  >
                    {/* Unread dot */}
                    <div className="mt-1.5 shrink-0">
                      <span className={cn('block h-2 w-2 rounded-full', isRead ? 'bg-slate-200 dark:bg-slate-700' : 'bg-primary-500')} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm leading-snug', isRead ? 'text-slate-500 dark:text-slate-400' : 'font-medium text-slate-800 dark:text-slate-100')}>
                        {item.judul}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', KATEGORI_CLS[item.kategori] ?? KATEGORI_CLS['lainnya'])}>
                          {item.kategori}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpen(item.id)}
                          className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Lihat Detail
                        </button>
                        {!isRead && (
                          <button
                            type="button"
                            onClick={() => markRead(item.id)}
                            className="flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                          >
                            <BookOpen className="h-3 w-3" />
                            Sudah Baca
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5 dark:border-slate-800">
            <button
              type="button"
              onClick={() => { setOpen(false); navigate('/pengumuman') }}
              className="w-full text-center text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Lihat semua pengumuman →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
