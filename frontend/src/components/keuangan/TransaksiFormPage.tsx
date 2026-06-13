/**
 * Form tambah transaksi keuangan RT.
 * Lihat docs/06-API-CONTRACT.md §4.2 dan docs/07-TASK-BREAKDOWN.md §4.14.
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../../stores/authStore'
import { createTransaksi, listKategori } from '../../services/keuanganService'
import type { KategoriTransaksi, TransaksiTipe } from '../../types/keuangan'

interface FormState {
  kategoriId: string
  jumlah: string
  keterangan: string
  tanggal: string
  tipe: TransaksiTipe
}

const INITIAL: FormState = {
  kategoriId: '',
  jumlah: '',
  keterangan: '',
  tanggal: new Date().toISOString().split('T')[0],
  tipe: 'pemasukan',
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export function TransaksiFormPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [kategoriAll, setKategoriAll] = useState<KategoriTransaksi[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canAccess = user?.role === 'admin' || user?.role === 'bendahara'

  useEffect(() => {
    if (!canAccess) return
    listKategori().then(setKategoriAll).catch(() => {})
  }, [canAccess])

  const kategoriFiltered = kategoriAll.filter((k) => k.tipe === form.tipe)

  function set(field: keyof FormState, val: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: val }
      if (field === 'tipe') next.kategoriId = ''
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.kategoriId || !form.jumlah || !form.tanggal) {
      setError('Lengkapi semua field wajib.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createTransaksi({
        kategoriId: form.kategoriId,
        jumlah: parseFloat(form.jumlah),
        keterangan: form.keterangan,
        tanggal: form.tanggal,
        tipe: form.tipe,
      })
      navigate('/keuangan')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg || 'Gagal menyimpan transaksi.')
    } finally {
      setLoading(false)
    }
  }

  if (!canAccess) {
    return <div className="p-6 text-center text-gray-500">Akses ditolak.</div>
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tambah Transaksi</h1>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <Field label="Tipe" required>
          <div className="flex gap-3">
            {(['pemasukan', 'pengeluaran'] as TransaksiTipe[]).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tipe"
                  value={t}
                  checked={form.tipe === t}
                  onChange={() => set('tipe', t)}
                  className="accent-blue-600"
                />
                <span className="text-sm capitalize">{t}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Kategori" required>
          <select
            value={form.kategoriId}
            onChange={(e) => set('kategoriId', e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Pilih kategori...</option>
            {kategoriFiltered.map((k) => (
              <option key={k.id} value={k.id}>{k.nama}</option>
            ))}
          </select>
          {kategoriFiltered.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">Belum ada kategori untuk tipe ini. Tambah dulu di halaman kategori.</p>
          )}
        </Field>

        <Field label="Jumlah (Rp)" required>
          <input
            type="number"
            value={form.jumlah}
            onChange={(e) => set('jumlah', e.target.value)}
            required
            min={1}
            placeholder="50000"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Tanggal" required>
          <input
            type="date"
            value={form.tanggal}
            onChange={(e) => set('tanggal', e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </Field>

        <Field label="Keterangan">
          <textarea
            value={form.keterangan}
            onChange={(e) => set('keterangan', e.target.value)}
            rows={3}
            placeholder="Keterangan transaksi (opsional)..."
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Transaksi'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/keuangan')}
            className="bg-gray-100 text-gray-700 px-5 py-2 rounded text-sm hover:bg-gray-200 border border-gray-300"
          >
            Batal
          </button>
        </div>
      </form>
    </div>
  )
}
