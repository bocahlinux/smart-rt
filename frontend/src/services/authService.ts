import apiClient from './apiClient'
import type {
  ChangePasswordPayload,
  LoginPayload,
  LoginResponseData,
  RegisterPayload,
  User,
} from '../types/auth'

// Pemanggil endpoint /auth/* — lihat docs/06-API-CONTRACT.md §2.

interface ApiSuccess<T> {
  status: 'success'
  data: T
  message?: string
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<ApiSuccess<User>>('/auth/register', payload)
  return data.data
}

export async function login(payload: LoginPayload): Promise<LoginResponseData> {
  const { data } = await apiClient.post<ApiSuccess<LoginResponseData>>('/auth/login', payload)
  return data.data
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<ApiSuccess<User>>('/auth/me')
  return data.data
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.put('/auth/password', payload)
}
