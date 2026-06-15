import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createPoll } from '../../services/pollingService'

export function PollingFormPage() {
  const navigate = useNavigate()
  const [pertanyaan, setPertanyaan] = useState('')
  const [opsi, setOpsi] = useState<string[]>(['', ''])
  const [deadline, setDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function addOpsi() {
    if (opsi.length >= 10) return
    setOpsi([...opsi, ''])
  }

  function removeOpsi(idx: number) {
    if (opsi.length <= 2) return
    setOpsi(opsi.filter((_, i) => i !== idx))
  }

  function updateOpsi(idx: number, value: string) {
    setOpsi(opsi.map((o, i) => (i === idx ? value : o)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const filledOpsi = opsi.filter((o) => o.trim())
    if (!pertanyaan.trim()) { setError('Pertanyaan wajib diisi.'); return }
    if (filledOpsi.length < 2) { setError('Minimal 2 opsi jawaban.'); return }
    if (!deadline) { setError('Deadline wajib diisi.'); return }
    if (new Date(deadline) <= new Date()) { setError('Deadline harus di masa depan.'); return }

    setLoading(true)
    setError('')
    try {
      const result = await createPoll({
        pertanyaan,
        opsi: filledOpsi,
        deadline: new Date(deadline).toISOString(),
      })
      navigate(`/polling/${result.id}`)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      const detail = axiosErr.response?.data?.errors
      if (detail) {
        setError(Object.values(detail).flat().join(' '))
      } else {
        setError(axiosErr.response?.data?.message ?? 'Gagal membuat polling.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6 lg:px-8">
      <div className="mb-6">
        <button onClick={() => navigate('/polling')} className="text-sm text-gray-500 hover:text-gray-700">
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold text-gray-800 mt-3">Buat Polling</h1>
        <p className="text-sm text-gray-500 mt-0.5">Kumpulkan suara warga untuk keputusan bersama</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
        {/* Pertanyaan */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Pertanyaan <span className="text-red-500">*</span>
          </label>
          <textarea
            id="pertanyaan-poll"
            value={pertanyaan}
            onChange={(e) => setPertanyaan(e.target.value)}
            required
            maxLength={500}
            rows={3}
            placeholder="Contoh: Kapan waktu yang paling cocok untuk kerja bakti?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        {/* Opsi jawaban */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opsi Jawaban <span className="text-red-500">*</span>{' '}
            <span className="text-gray-400 font-normal">(min 2, maks 10)</span>
          </label>
          <div className="space-y-2">
            {opsi.map((o, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={o}
                  onChange={(e) => updateOpsi(idx, e.target.value)}
                  placeholder={`Opsi ${idx + 1}`}
                  maxLength={255}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {opsi.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpsi(idx)}
                    className="text-red-400 hover:text-red-600 text-xs px-2"
                    title="Hapus opsi"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          {opsi.length < 10 && (
            <button
              type="button"
              onClick={addOpsi}
              className="mt-2 text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1"
            >
              + Tambah Opsi
            </button>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Deadline Voting <span className="text-red-500">*</span>
          </label>
          <input
            id="deadline-poll"
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            min={new Date().toISOString().slice(0, 16)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <p className="text-xs text-gray-400 mt-1">
            Setelah deadline, hasil voting akan ditampilkan kepada semua warga.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/polling')}
            className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            id="submit-poll"
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Membuat...' : 'Buat Polling'}
          </button>
        </div>
      </form>
    </div>
  )
}
