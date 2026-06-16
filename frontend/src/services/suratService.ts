import apiClient from '@/services/apiClient'
import type {
  CreatePermohonanPayload,
  JenisSurat,
  PengaturanRT,
  PermohonanSurat,
  ReviewPermohonanPayload,
} from '@/types/surat'

interface ApiOk<T> {
  status: string
  data: T
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

export async function listJenisSurat(): Promise<JenisSurat[]> {
  const { data } = await apiClient.get<ApiOk<JenisSurat[]>>('/surat/jenis/')
  return data.data
}

export async function listPermohonan(params?: {
  status?: string
  jenis?: string
}): Promise<{ data: PermohonanSurat[]; pagination?: ApiOk<unknown>['pagination'] }> {
  const { data } = await apiClient.get<ApiOk<PermohonanSurat[]>>('/surat/permohonan/', { params })
  return { data: data.data, pagination: data.pagination }
}

export async function getPermohonan(id: string): Promise<PermohonanSurat> {
  const { data } = await apiClient.get<ApiOk<PermohonanSurat>>(`/surat/permohonan/${id}/`)
  return data.data
}

export async function createPermohonan(payload: CreatePermohonanPayload): Promise<PermohonanSurat> {
  const { data } = await apiClient.post<ApiOk<PermohonanSurat>>('/surat/permohonan/', payload)
  return data.data
}

export async function reviewPermohonan(id: string, payload: ReviewPermohonanPayload): Promise<PermohonanSurat> {
  const { data } = await apiClient.patch<ApiOk<PermohonanSurat>>(`/surat/permohonan/${id}/review/`, payload)
  return data.data
}

export async function deletePermohonan(id: string): Promise<void> {
  await apiClient.delete(`/surat/permohonan/${id}/`)
}

export async function downloadSuratPDF(id: string): Promise<Blob> {
  const { data } = await apiClient.get(`/surat/permohonan/${id}/pdf/`, {
    responseType: 'blob',
  })
  return data as Blob
}

export async function getPengaturanRT(): Promise<PengaturanRT> {
  const { data } = await apiClient.get<ApiOk<PengaturanRT>>('/surat/pengaturan/')
  return data.data
}

export async function updatePengaturanRT(payload: Partial<PengaturanRT>): Promise<PengaturanRT> {
  const body = {
    namaRT: payload.namaRT,
    namaRW: payload.namaRW,
    kelurahan: payload.kelurahan,
    kecamatan: payload.kecamatan,
    kota: payload.kota,
    provinsi: payload.provinsi,
    kodePOS: payload.kodePOS,
    namaKetuaRT: payload.namaKetuaRT,
    nikKetuaRT: payload.nikKetuaRT,
  }
  const { data } = await apiClient.patch<ApiOk<PengaturanRT>>('/surat/pengaturan/', body)
  return data.data
}

export async function uploadTTD(file: File): Promise<{ hasTTD: boolean }> {
  const form = new FormData()
  form.append('tanda_tangan', file)
  const { data } = await apiClient.post<ApiOk<{ hasTTD: boolean }>>('/surat/pengaturan/ttd/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteTTD(): Promise<void> {
  await apiClient.delete('/surat/pengaturan/ttd/')
}

export async function uploadLogo(file: File): Promise<{ hasLogo: boolean }> {
  const form = new FormData()
  form.append('logo', file)
  const { data } = await apiClient.post<ApiOk<{ hasLogo: boolean }>>('/surat/pengaturan/logo/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function deleteLogo(): Promise<void> {
  await apiClient.delete('/surat/pengaturan/logo/')
}
