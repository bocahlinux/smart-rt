import { ArrowLeft, CheckCircle2, PenLine, Save, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  deleteTTD,
  getPengaturanRT,
  updatePengaturanRT,
  uploadTTD,
} from '@/services/suratService'
import type { PengaturanRT } from '@/types/surat'

const INPUT = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-900'

export function SuratPengaturanPage() {
  const [data, setData] = useState<PengaturanRT | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // TTD upload state
  const [ttdUploading, setTtdUploading] = useState(false)
  const [ttdMsg, setTtdMsg] = useState('')
  const [ttdPreview, setTtdPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getPengaturanRT()
      .then(setData)
      .catch(() => setError('Gagal memuat pengaturan.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setSaving(true); setSaved(false); setError('')
    try {
      const updated = await updatePengaturanRT(data)
      setData(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleTTDUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setTtdMsg('File harus berupa gambar (PNG/JPG).')
      return
    }
    // Preview
    const reader = new FileReader()
    reader.onload = ev => setTtdPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setTtdUploading(true); setTtdMsg('')
    try {
      await uploadTTD(file)
      setData(prev => prev ? { ...prev, hasTTD: true } : prev)
      setTtdMsg('Tanda tangan berhasil diunggah.')
    } catch {
      setTtdMsg('Gagal mengunggah tanda tangan.')
    } finally {
      setTtdUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleTTDDelete() {
    if (!confirm('Hapus tanda tangan digital?')) return
    try {
      await deleteTTD()
      setData(prev => prev ? { ...prev, hasTTD: false } : prev)
      setTtdPreview(null)
      setTtdMsg('Tanda tangan dihapus.')
    } catch {
      setTtdMsg('Gagal menghapus tanda tangan.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 lg:px-8">
      <Link to="/surat/kelola"
        className="mb-5 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100">
        <ArrowLeft className="h-4 w-4" />
        Kembali ke Kelola Surat
      </Link>

      <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Pengaturan RT</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Informasi RT dan tanda tangan digital untuk kop surat resmi.
      </p>

      {/* ── Info RT ── */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <PenLine className="h-4 w-4 text-primary-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Informasi RT</h2>
        </div>
        <form onSubmit={e => void handleSave(e)} className="p-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Nama RT</label>
              <input className={INPUT} value={data?.namaRT ?? ''} onChange={e => setData(p => p ? { ...p, namaRT: e.target.value } : p)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Nama RW</label>
              <input className={INPUT} value={data?.namaRW ?? ''} onChange={e => setData(p => p ? { ...p, namaRW: e.target.value } : p)} required />
            </div>
            <div className="col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Kelurahan</label>
              <input className={INPUT} value={data?.kelurahan ?? ''} onChange={e => setData(p => p ? { ...p, kelurahan: e.target.value } : p)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Kecamatan</label>
              <input className={INPUT} value={data?.kecamatan ?? ''} onChange={e => setData(p => p ? { ...p, kecamatan: e.target.value } : p)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Kota</label>
              <input className={INPUT} value={data?.kota ?? ''} onChange={e => setData(p => p ? { ...p, kota: e.target.value } : p)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Provinsi</label>
              <input className={INPUT} value={data?.provinsi ?? ''} onChange={e => setData(p => p ? { ...p, provinsi: e.target.value } : p)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Kode POS</label>
              <input className={INPUT} value={data?.kodePOS ?? ''} onChange={e => setData(p => p ? { ...p, kodePOS: e.target.value } : p)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">Nama Ketua RT</label>
              <input className={INPUT} value={data?.namaKetuaRT ?? ''} onChange={e => setData(p => p ? { ...p, namaKetuaRT: e.target.value } : p)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">NIK Ketua RT</label>
              <input className={INPUT} value={data?.nikKetuaRT ?? ''} onChange={e => setData(p => p ? { ...p, nikKetuaRT: e.target.value } : p)} maxLength={16} />
            </div>
          </div>

          {error && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400">{error}</p>
          )}
          {saved && (
            <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Pengaturan berhasil disimpan.
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="submit" disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan…' : 'Simpan Pengaturan'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Tanda Tangan Digital ── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <PenLine className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Tanda Tangan Digital Ketua RT</h2>
        </div>
        <div className="p-5">
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Upload gambar tanda tangan (PNG transparan atau JPG, maks 2 MB).
            Tanda tangan akan tampil otomatis di setiap surat yang diterbitkan.
          </p>

          {/* Preview area */}
          <div className="mb-4 flex min-h-[100px] items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            {ttdPreview ? (
              <img src={ttdPreview} alt="Preview TTD" className="max-h-24 max-w-[240px] object-contain" />
            ) : data?.hasTTD ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ Tanda tangan sudah diunggah</p>
            ) : (
              <p className="text-sm text-slate-400">Belum ada tanda tangan</p>
            )}
          </div>

          {ttdMsg && (
            <p className={`mb-3 text-sm ${ttdMsg.includes('Gagal') ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {ttdMsg}
            </p>
          )}

          <div className="flex gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
              <Upload className="h-4 w-4" />
              {ttdUploading ? 'Mengunggah…' : (data?.hasTTD ? 'Ganti TTD' : 'Upload TTD')}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={e => void handleTTDUpload(e)}
                disabled={ttdUploading}
              />
            </label>

            {data?.hasTTD && !ttdPreview && (
              <button type="button" onClick={() => void handleTTDDelete()}
                className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                <Trash2 className="h-4 w-4" /> Hapus TTD
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
