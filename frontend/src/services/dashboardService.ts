import apiClient from './apiClient'
import type { DashboardPengurus, DashboardWarga } from '../types/dashboard'

export async function getDashboardPengurus(): Promise<DashboardPengurus> {
  const res = await apiClient.get<DashboardPengurus>('/dashboard/pengurus/')
  return res.data
}

export async function getDashboardWarga(): Promise<DashboardWarga> {
  const res = await apiClient.get<DashboardWarga>('/dashboard/warga/')
  return res.data
}
