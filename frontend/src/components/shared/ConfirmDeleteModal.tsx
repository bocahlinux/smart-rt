import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  title?: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export function ConfirmDeleteModal({
  title = 'Hapus Data',
  description,
  confirmLabel = 'Hapus',
  onConfirm,
  onCancel,
  loading = false,
}: Props) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        {/* Top accent */}
        <div className="h-1 w-full bg-gradient-to-r from-red-500 to-rose-600" />

        <div className="p-6">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
            <AlertTriangle className="h-7 w-7 text-red-500 dark:text-red-400" />
          </div>

          {/* Text */}
          <h3 className="text-center text-base font-semibold text-slate-900 dark:text-white">
            {title}
          </h3>
          <p className="mt-2 text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {description}
          </p>

          {/* Soft-delete notice */}
          <div className="mt-4 rounded-xl bg-amber-50 px-3.5 py-2.5 dark:bg-amber-900/20">
            <p className="text-center text-xs text-amber-700 dark:text-amber-400">
              Data tidak dihapus permanen — dapat dipulihkan kapan saja di menu <strong>Data Warga Terhapus</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {loading ? 'Menghapus...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
