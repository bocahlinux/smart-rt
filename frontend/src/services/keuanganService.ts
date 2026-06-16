// Service untuk Keuangan endpoints — lihat docs/06-API-CONTRACT.md §4

import apiClient from './apiClient'
import type {
  BukuKasData,
  DashboardKeuangan,
  IuranKonfirmasiPayload,
  IuranUploadPayload,
  IuranWarga,
  JenisIuran,
  JenisIuranFormPayload,
  KategoriTransaksi,
  MyIuran,
  Pagination,
  PengaturanIuran,
  Transaksi,
  TransaksiFormPayload,
} from '../types/keuangan'

interface ApiSuccess<T> {
  status: 'success'
  data: T
  message?: string
  pagination?: Pagination
}

// ─── Jenis Iuran ─────────────────────────────────────────────

export async function listJenisIuran(aktifOnly = false): Promise<JenisIuran[]> {
  const { data } = await apiClient.get<ApiSuccess<JenisIuran[]>>('/iuran/jenis/', {
    params: aktifOnly ? { aktif: '1' } : {},
  })
  return data.data
}

export async function createJenisIuran(payload: JenisIuranFormPayload): Promise<JenisIuran> {
  const { data } = await apiClient.post<ApiSuccess<JenisIuran>>('/iuran/jenis/', payload)
  return data.data
}

export async function updateJenisIuran(id: string, payload: Partial<JenisIuranFormPayload>): Promise<JenisIuran> {
  const { data } = await apiClient.put<ApiSuccess<JenisIuran>>(`/iuran/jenis/${id}/`, payload)
  return data.data
}

export async function deleteJenisIuran(id: string): Promise<void> {
  await apiClient.delete(`/iuran/jenis/${id}/`)
}

// ─── Kategori Transaksi ───────────────────────────────────────

export async function listKategori(): Promise<KategoriTransaksi[]> {
  const { data } = await apiClient.get<ApiSuccess<KategoriTransaksi[]>>('/keuangan/kategori/')
  return data.data
}

export async function createKategori(payload: { nama: string; tipe: string }): Promise<KategoriTransaksi> {
  const { data } = await apiClient.post<ApiSuccess<KategoriTransaksi>>('/keuangan/kategori/', payload)
  return data.data
}

export async function deleteKategori(id: string): Promise<void> {
  await apiClient.delete(`/keuangan/kategori/${id}/`)
}

// ─── Transaksi ────────────────────────────────────────────────

export interface TransaksiListParams {
  page?: number
  limit?: number
  tipe?: string
  status?: string
  dari?: string
  sampai?: string
  kategori?: string
}

export async function listTransaksi(
  params: TransaksiListParams = {}
): Promise<{ data: Transaksi[]; pagination?: Pagination }> {
  const { data } = await apiClient.get<ApiSuccess<Transaksi[]>>('/keuangan/', { params })
  return { data: data.data, pagination: data.pagination }
}

export async function getTransaksi(id: string): Promise<Transaksi> {
  const { data } = await apiClient.get<ApiSuccess<Transaksi>>(`/keuangan/${id}/`)
  return data.data
}

export async function createTransaksi(payload: TransaksiFormPayload): Promise<{ id: string }> {
  const { data } = await apiClient.post<ApiSuccess<{ id: string; jumlah: string }>>('/keuangan/', payload)
  return data.data
}

export async function updateTransaksi(id: string, payload: Partial<TransaksiFormPayload>): Promise<void> {
  await apiClient.put(`/keuangan/${id}/`, payload)
}

export async function deleteTransaksi(id: string): Promise<void> {
  await apiClient.delete(`/keuangan/${id}/`)
}

export async function downloadLaporan(params: { dari?: string; sampai?: string } = {}): Promise<void> {
  const response = await apiClient.get('/keuangan/laporan/', {
    params: { ...params, fmt: 'pdf' },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = 'laporan-keuangan.pdf'
  a.click()
  window.URL.revokeObjectURL(url)
}

// ─── Dashboard ────────────────────────────────────────────────

export async function getDashboardKeuangan(tahun?: number): Promise<DashboardKeuangan> {
  const { data } = await apiClient.get<ApiSuccess<DashboardKeuangan>>('/keuangan/dashboard/', {
    params: tahun ? { tahun } : {},
  })
  return data.data
}

// ─── Iuran Warga ──────────────────────────────────────────────

export interface IuranListParams {
  page?: number
  limit?: number
  tahun?: number
  bulan?: number
  status?: string
  warga?: string
}

export async function listIuran(
  params: IuranListParams = {}
): Promise<{ data: IuranWarga[]; pagination?: Pagination }> {
  const { data } = await apiClient.get<ApiSuccess<IuranWarga[]>>('/iuran/', { params })
  return { data: data.data, pagination: data.pagination }
}

export async function getIuran(id: string): Promise<IuranWarga> {
  const { data } = await apiClient.get<ApiSuccess<IuranWarga>>(`/iuran/${id}/`)
  return data.data
}

export async function uploadIuran(payload: IuranUploadPayload): Promise<{ id: string; status: string }> {
  const formData = new FormData()
  formData.append('jenisId', payload.jenisId)
  formData.append('bulan', String(payload.bulan))
  formData.append('tahun', String(payload.tahun))
  formData.append('jumlah', String(payload.jumlah))
  formData.append('bukti_transfer', payload.bukti_transfer)
  const { data } = await apiClient.post<ApiSuccess<{ id: string; status: string }>>('/iuran/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

// ─── Buku Kas ─────────────────────────────────────────────────

export async function getBukuKas(params: { tahun?: number; bulan?: number } = {}): Promise<BukuKasData> {
  const { data } = await apiClient.get<{ status: string; data: BukuKasData }>('/keuangan/buku-kas/', { params })
  return data.data
}

// ─── Pengaturan Iuran ─────────────────────────────────────────

export async function getPengaturanIuran(): Promise<PengaturanIuran> {
  const { data } = await apiClient.get<ApiSuccess<PengaturanIuran>>('/keuangan/pengaturan-iuran/')
  return data.data
}

export async function updatePengaturanIuran(payload: { nominalDefault: number; saldoAwal?: number; keterangan?: string }): Promise<PengaturanIuran> {
  const { data } = await apiClient.put<ApiSuccess<PengaturanIuran>>('/keuangan/pengaturan-iuran/', payload)
  return data.data
}

export async function konfirmasiIuran(id: string, payload: IuranKonfirmasiPayload): Promise<void> {
  await apiClient.put(`/iuran/${id}/confirm/`, payload)
}

export async function getMyIuran(tahun?: number): Promise<MyIuran[]> {
  const { data } = await apiClient.get<ApiSuccess<MyIuran[]>>('/iuran/saya/', {
    params: tahun ? { tahun } : {},
  })
  return data.data
}
