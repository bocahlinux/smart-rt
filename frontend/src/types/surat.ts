export interface JenisSurat {
  id: string
  kode: string
  nama: string
  deskripsi: string
  fieldTambahan: string[]
  isActive: boolean
  urutan: number
}

export type StatusPermohonan = 'diajukan' | 'diproses' | 'disetujui' | 'ditolak' | 'selesai'

export interface PermohonanSurat {
  id: string
  jenisNama: string
  jenisKode: string
  pemohonEmail: string
  pemohonNama: string
  dataForm: Record<string, string>
  keperluan: string
  status: StatusPermohonan
  catatanAdmin: string
  noSurat: string | null
  reviewedBy: string | null
  createdAt: string
  reviewedAt: string | null
}

export interface CreatePermohonanPayload {
  jenisId: string
  dataForm: Record<string, string>
  keperluan: string
}

export interface ReviewPermohonanPayload {
  status: 'diproses' | 'disetujui' | 'ditolak' | 'selesai'
  catatan_admin?: string
  no_surat?: string
}
