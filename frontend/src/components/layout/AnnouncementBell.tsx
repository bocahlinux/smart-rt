import { Bell, BookOpen, CheckCheck, ExternalLink, ShieldAlert } from 'lucide-react'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { cn } from '@/lib/utils'
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/pengumumanService'
import { useAuthStore } from '@/stores/authStore'
import type { Notification } from '@/types/pengumuman'

const TIPE_CLS: Record<string, string> = {
  penting:   'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  acara:     'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  info:      'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  keamanan:  'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  lainnya:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  } catch {
    // Browser AudioContext not supported — silently skip
  }
}

export function AnnouncementBell({ dropdownClassName = 'right-0' }: { dropdownClassName?: string }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const prevUnreadRef = useRef<number>(0)
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

  const loadNotifications = useCallback(() => {
    if (!user) return
    listNotifications({ limit: 20 })
      .then((res) => {
        const newItems = res.data
        const newUnread = newItems.filter((n) => !n.isRead).length
        if (newUnread > prevUnreadRef.current && prevUnreadRef.current >= 0) {
          playNotifSound()
        }
        prevUnreadRef.current = newUnread
        setItems(newItems)
      })
      .catch(() => undefined)
  }, [user])

  // Muat notifikasi saat mount + polling tiap 60 detik
  useEffect(() => {
    loadNotifications()
    const id = window.setInterval(loadNotifications, 60_000)
    return () => clearInterval(id)
  }, [loadNotifications])

  async function handleMarkRead(id: string) {
    await markNotificationRead(id).catch(() => undefined)
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
    prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1)
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead().catch(() => undefined)
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    prevUnreadRef.current = 0
  }

  function handleOpen(notif: Notification) {
    handleMarkRead(notif.id)
    setOpen(false)
    if (notif.link) {
      navigate(notif.link)
    } else if (notif.pengumumanId) {
      navigate(`/pengumuman/${notif.pengumumanId}`)
    } else {
      navigate('/pengumuman')
    }
  }

  const unreadCount = items.filter((n) => !n.isRead).length

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifikasi"
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
        <div className={cn('absolute z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96', dropdownClassName)}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifikasi</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
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
              <li className="py-10 text-center text-sm text-slate-400">Belum ada notifikasi.</li>
            ) : (
              items.map((item) => {
                const isRead = item.isRead
                const isPengaduan = item.link?.startsWith('/pengaduan') || (!item.pengumumanId && !item.link && (
                  item.judul.toLowerCase().includes('pengaduan') ||
                  item.isi.toLowerCase().includes('pengaduan')
                ))
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
                      {item.isi && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-400 dark:text-slate-500">{item.isi}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2">
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium capitalize', TIPE_CLS[item.tipe] ?? TIPE_CLS['lainnya'])}>
                          {item.tipe}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {/* Actions */}
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpen(item)}
                          className="flex items-center gap-1 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400"
                        >
                          {isPengaduan
                            ? <ShieldAlert className="h-3 w-3" />
                            : <ExternalLink className="h-3 w-3" />}
                          Lihat Detail
                        </button>
                        {!isRead && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(item.id)}
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
