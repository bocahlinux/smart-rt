import { useEffect, useState } from 'react'
import { X, Plus, Trash2, Tag } from 'lucide-react'

import { cn } from '@/lib/utils'
import { createKategori, deleteKategori, listKategori } from '@/services/keuanganService'
import type { KategoriTransaksi } from '@/types/keuangan'

const INPUT = cn(
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition',
  'focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20',
  'dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800',
)

interface Props {
  onClose: () => void
  onChanged?: () => void
}

export function KategoriModal({ onClose, onChanged }: Props) {
  const [kategori, setKategori] = useState<KategoriTransaksi[]>([])
  const [activeTab, setActiveTab] = useState<'pemasukan' | 'pengeluaran'>('pemasukan')
  const [newNama, setNewNama] = useState('')
  const [adding, setAdding] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [error, setError] = useState('')

  function load() {
    listKategori().then(setKategori).catch(() => setError('Gagal memuat kategori.'))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const nama = newNama.trim()
    if (!nama) return
    setAdding(true)
    setError('')
    try {
      await createKategori({ nama, tipe: activeTab })
      setNewNama('')
      load()
      onChanged?.()
    } catch {
      setError('Gagal menambahkan kategori.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus kategori ini? Transaksi yang menggunakan kategori ini tidak akan terhapus.')) return
    setDeleteId(id)
    try {
      await deleteKategori(id)
      load()
      onChanged?.()
    } catch {
      setError('Gagal menghapus. Mungkin masih digunakan transaksi.')
    } finally {
      setDeleteId(null)
    }
  }

  const filtered = kategori.filter((k) => k.tipe === activeTab)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:px-4">
        <div className="relative flex w-full max-h-[88vh] flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-slate-900 sm:max-w-lg sm:max-h-[80vh] sm:rounded-2xl">

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
                <Tag className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Kelola Kategori</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex shrink-0 border-b border-slate-100 dark:border-slate-800">
            {(['pemasukan', 'pengeluaran'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => { setActiveTab(tab); setNewNama(''); setError('') }}
                className={cn(
                  'flex-1 py-3 text-sm font-semibold transition-colors',
                  activeTab === tab
                    ? tab === 'pemasukan'
                      ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'border-b-2 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
                )}
              >
                {tab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}
                <span className={cn(
                  'ml-2 rounded-full px-1.5 py-0.5 text-[10px]',
                  activeTab === tab
                    ? tab === 'pemasukan'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                )}>
                  {kategori.filter((k) => k.tipe === tab).length}
                </span>
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {error}
              </div>
            )}

            {/* List */}
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                Belum ada kategori {activeTab === 'pemasukan' ? 'pemasukan' : 'pengeluaran'}.
              </p>
            ) : (
              <ul className="mb-4 divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((k) => (
                  <li key={k.id} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-slate-800 dark:text-slate-200">{k.nama}</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(k.id)}
                      disabled={deleteId === k.id}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 dark:hover:bg-red-900/30"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add form */}
            <form onSubmit={(e) => void handleAdd(e)} className="flex items-center gap-2">
              <input
                type="text"
                value={newNama}
                onChange={(e) => setNewNama(e.target.value)}
                placeholder={`Nama kategori ${activeTab === 'pemasukan' ? 'pemasukan' : 'pengeluaran'}...`}
                className={cn(INPUT, 'flex-1')}
              />
              <button
                type="submit"
                disabled={adding || !newNama.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-end border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Selesai
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
