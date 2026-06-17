import axios, { type InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '../stores/authStore'
import type { RefreshResponseData } from '../types/auth'

/**
 * Base axios instance for the Smart-RT API (docs/06-API-CONTRACT.md §1.1).
 *
 * Auth interceptors: lampirkan access token ke setiap request, dan pada 401
 * coba refresh token (httpOnly cookie) sekali lalu retry — lihat
 * docs/08-CODING-STANDART.md §4.3.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // untuk httpOnly cookie (refresh token)
})

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

// 401 dari endpoint ini berarti kredensial/password salah, bukan access
// token expired — jangan dialihkan ke logika refresh-token (lihat
// docs/08-CODING-STANDART.md §4.3 catatan perbaikan).
const AUTH_REFRESH_EXCLUDED_PATHS = ['/auth/login', '/auth/password']

function isRefreshExcluded(url?: string): boolean {
  return !!url && AUTH_REFRESH_EXCLUDED_PATHS.some((path) => url.includes(path))
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (reason: unknown) => void
}> = []

function resolveQueue(token: string) {
  failedQueue.forEach(({ resolve }) => resolve(token))
  failedQueue = []
}

function rejectQueue(reason: unknown) {
  failedQueue.forEach(({ reject }) => reject(reason))
  failedQueue = []
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshExcluded(originalRequest.url)
    ) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Refresh token otomatis dikirim browser via httpOnly cookie
        const { data } = await axios.post<{ status: 'success'; data: RefreshResponseData }>(
          `${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh`,
          {},
          { withCredentials: true }
        )

        const newAccessToken = data.data.accessToken
        useAuthStore.getState().setAccessToken(newAccessToken)

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        resolveQueue(newAccessToken)

        return apiClient(originalRequest)
      } catch (refreshError) {
        useAuthStore.getState().logout()
        rejectQueue(refreshError)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
