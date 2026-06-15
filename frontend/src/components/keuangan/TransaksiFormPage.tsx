import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings2 } from 'lucide-react'

import { hasPerm } from '@/lib/permissions'
import { useAuthStore } from '../../stores/authStore'
import { createTransaksi, listKategori } from '../../services/keuanganService'
import type { KategoriTransaksi, TransaksiTipe } from '../../types/keuangan'
import { KategoriModal } from './KategoriModal'

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
  const [kategoriOpen, setKategoriOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const canAccess = hasPerm(user, 'kelola_keuangan')

  function loadKategori() {
    listKategori().then(setKategoriAll).catch(() => {})
  }

  useEffect(() => {
    if (!canAccess) return
    loadKategori()
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
    <>
    {kategoriOpen && (
      <KategoriModal
        onClose={() => setKategoriOpen(false)}
        onChanged={loadKategori}
      />
    )}
    <div className="mx-auto max-w-xl px-4 py-6 lg:px-8">
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
          <div className="flex gap-2">
            <select
              value={form.kategoriId}
              onChange={(e) => set('kategoriId', e.target.value)}
              required
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih kategori...</option>
              {kategoriFiltered.map((k) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setKategoriOpen(true)}
              title="Kelola kategori"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
            >
              <Settings2 className="h-4 w-4" />
            </button>
          </div>
          {kategoriFiltered.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Belum ada kategori. Klik <button type="button" onClick={() => setKategoriOpen(true)} className="underline font-medium">kelola kategori</button> untuk menambahkan.
            </p>
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
    </>
  )
}
