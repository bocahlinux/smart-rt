import apiClient from './apiClient'
import type { Kegiatan, KegiatanDetail, KegiatanDetailResponse, KegiatanListResponse, RSVPStatus } from '../types/kegiatan'

export interface ListKegiatanParams {
  dari?: string   // YYYY-MM-DD
  sampai?: string // YYYY-MM-DD
}

export async function listKegiatan(params: ListKegiatanParams = {}): Promise<Kegiatan[]> {
  const res = await apiClient.get<KegiatanListResponse>('/kegiatan/', { params })
  return res.data.data
}

export async function getKegiatan(id: string): Promise<KegiatanDetail> {
  const res = await apiClient.get<KegiatanDetailResponse>(`/kegiatan/${id}/`)
  return res.data.data
}

export async function createKegiatan(data: {
  nama: string
  deskripsi?: string
  tanggal: string
  tanggal_selesai?: string | null
  lokasi?: string
  kuota_peserta?: number | null
  penanggungJawabId?: string | null
}): Promise<KegiatanDetail> {
  const res = await apiClient.post<KegiatanDetailResponse>('/kegiatan/', data)
  return res.data.data
}

export async function updateKegiatan(id: string, data: Partial<{
  nama: string
  deskripsi: string
  tanggal: string
  tanggal_selesai: string | null
  lokasi: string
  kuota_peserta: number | null
}>): Promise<KegiatanDetail> {
  const res = await apiClient.put<KegiatanDetailResponse>(`/kegiatan/${id}/`, data)
  return res.data.data
}

export async function deleteKegiatan(id: string): Promise<void> {
  await apiClient.delete(`/kegiatan/${id}/`)
}

export async function rsvpKegiatan(id: string, rsvpStatus: RSVPStatus): Promise<{ rsvpStatus: RSVPStatus }> {
  const res = await apiClient.post<{ status: string; data: { rsvpStatus: RSVPStatus } }>(
    `/kegiatan/${id}/rsvp/`,
    { status: rsvpStatus },
  )
  return res.data.data
}
