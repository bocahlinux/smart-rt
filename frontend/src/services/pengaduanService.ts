import apiClient from './apiClient'
import type {
  PengaduanDetail,
  PengaduanDetailResponse,
  PengaduanKategori,
  PengaduanListResponse,
  PengaduanStatus,
} from '../types/pengaduan'

export interface ListPengaduanParams {
  page?: number
  limit?: number
  status?: PengaduanStatus
  kategori?: PengaduanKategori
}

/** List semua pengaduan (role-scoped di backend) */
export async function listPengaduan(
  params: ListPengaduanParams = {},
): Promise<PengaduanListResponse> {
  const res = await apiClient.get<PengaduanListResponse>('/pengaduan/', { params })
  return res.data
}

/** Detail satu pengaduan */
export async function getPengaduan(id: string): Promise<PengaduanDetail> {
  const res = await apiClient.get<PengaduanDetailResponse>(`/pengaduan/${id}/`)
  return res.data.data
}

/** Buat pengaduan baru (multipart/form-data untuk foto) */
export async function createPengaduan(data: {
  judul: string
  deskripsi: string
  kategori: PengaduanKategori
  foto?: File | null
}): Promise<PengaduanDetail> {
  const formData = new FormData()
  formData.append('judul', data.judul)
  formData.append('deskripsi', data.deskripsi)
  formData.append('kategori', data.kategori)
  if (data.foto) {
    formData.append('foto', data.foto)
  }
  const res = await apiClient.post<PengaduanDetailResponse>('/pengaduan/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data.data
}

/** Update status pengaduan (pengurus only) */
export async function updateStatusPengaduan(
  id: string,
  data: { status: PengaduanStatus; keterangan?: string },
): Promise<{ id: string; status: PengaduanStatus }> {
  const res = await apiClient.put<{
    status: string
    data: { id: string; status: PengaduanStatus }
  }>(`/pengaduan/${id}/status/`, data)
  return res.data.data
}

/** Hapus pengaduan (pemilik / admin) */
export async function deletePengaduan(id: string): Promise<void> {
  await apiClient.delete(`/pengaduan/${id}/`)
}

/** List pengaduan milik user yang login */
export async function getPengaduanSaya(
  params: { page?: number; limit?: number } = {},
): Promise<PengaduanListResponse> {
  const res = await apiClient.get<PengaduanListResponse>('/pengaduan/saya/', { params })
  return res.data
}
