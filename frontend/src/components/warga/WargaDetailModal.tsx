import { useEffect } from 'react'
import { X } from 'lucide-react'

import { WargaDetailContent } from './WargaDetailPage'

interface Props {
  id: string
  onClose: () => void
  onDeleted?: () => void
}

export function WargaDetailModal({ id, onClose, onDeleted }: Props) {
  // Kunci scroll body saat modal terbuka
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Tutup dengan ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel: bottom-sheet di mobile, dialog center di desktop */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center sm:inset-0 sm:items-center sm:p-4">
        <div className="pointer-events-auto relative flex w-full max-h-[92vh] flex-col overflow-hidden rounded-t-3xl bg-slate-50 shadow-2xl dark:bg-slate-900 sm:max-w-2xl sm:max-h-[88vh] sm:rounded-2xl">
          {/* Drag handle (mobile) */}
          <div className="mx-auto mb-1 mt-2 h-1 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />

          {/* Header modal */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-3 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Detail Warga</span>
            <button
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            <WargaDetailContent
              id={id}
              isModal
              onDeleteSuccess={() => { onDeleted?.(); onClose() }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
