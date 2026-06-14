import apiClient from './apiClient'
import type { PollDetail, PollDetailResponse, PollListItem, PollListResponse } from '../types/polling'

export async function listPolls(params: { status?: 'aktif' | 'expired' } = {}): Promise<PollListItem[]> {
  const res = await apiClient.get<PollListResponse>('/polling/', { params })
  return res.data.data
}

export async function getPoll(id: string): Promise<PollDetail> {
  const res = await apiClient.get<PollDetailResponse>(`/polling/${id}/`)
  return res.data.data
}

export async function createPoll(data: {
  pertanyaan: string
  opsi: string[]
  deadline: string
}): Promise<PollDetail> {
  const res = await apiClient.post<PollDetailResponse>('/polling/', data)
  return res.data.data
}

export async function deletePoll(id: string): Promise<void> {
  await apiClient.delete(`/polling/${id}/`)
}

export async function votePoll(id: string, opsiIndex: number): Promise<void> {
  await apiClient.post(`/polling/${id}/vote/`, { opsiIndex })
}
