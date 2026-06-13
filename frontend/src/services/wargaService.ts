// Service untuk Warga endpoints — lihat docs/06-API-CONTRACT.md §3.

import apiClient from './apiClient'
import type {
  ImportResult,
  Pagination,
  VerifyPayload,
  WargaAny,
  WargaFull,
  WargaFormPayload,
} from '../types/warga'

interface ApiSuccess<T> {
  status: 'success'
  data: T
  message?: string
  pagination?: Pagination
}

export interface WargaListParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  blok?: string
  ordering?: string
}

export async function listWarga(params: WargaListParams = {}): Promise<{ data: WargaAny[]; pagination?: Pagination }> {
  const { data } = await apiClient.get<ApiSuccess<WargaAny[]>>('/warga/', { params })
  return { data: data.data, pagination: data.pagination }
}

export async function getWarga(id: string): Promise<WargaFull> {
  const { data } = await apiClient.get<ApiSuccess<WargaFull>>(`/warga/${id}/`)
  return data.data
}

export async function createWarga(payload: WargaFormPayload): Promise<{ id: string; namaLengkap: string }> {
  const { data } = await apiClient.post<ApiSuccess<{ id: string; namaLengkap: string }>>('/warga/', payload)
  return data.data
}

export async function updateWarga(id: string, payload: Partial<WargaFormPayload>): Promise<{ id: string; namaLengkap: string }> {
  const { data } = await apiClient.put<ApiSuccess<{ id: string; namaLengkap: string }>>(`/warga/${id}/`, payload)
  return data.data
}

export async function deleteWarga(id: string): Promise<void> {
  await apiClient.delete(`/warga/${id}/`)
}

export async function verifyWarga(id: string, payload: VerifyPayload): Promise<void> {
  await apiClient.put(`/warga/${id}/verify/`, payload)
}

export async function exportWarga(fmt: 'excel' | 'pdf', params: Omit<WargaListParams, 'page' | 'limit'> & { fullData?: boolean }): Promise<Blob> {
  const { data } = await apiClient.get('/warga/export/', {
    params: { fmt, ...params },
    responseType: 'blob',
  })
  return data as Blob
}

export async function importWarga(file: File): Promise<ImportResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await apiClient.post<ApiSuccess<ImportResult>>('/warga/import/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
