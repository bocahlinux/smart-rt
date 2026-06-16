import apiClient from '@/services/apiClient'
import type {
  CreatePermohonanPayload,
  JenisSurat,
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
