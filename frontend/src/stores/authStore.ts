import { create } from 'zustand'
// JANGAN: import { persist } from 'zustand/middleware' — token tidak boleh
// disimpan di localStorage, lihat docs/08-CODING-STANDART.md §4.2.

import type { User } from '../types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null // In-memory only, hilang saat page refresh
  isAuthenticated: boolean
  isLoading: boolean
  login: (user: User, accessToken: string) => void
  logout: () => void
  setAccessToken: (token: string) => void
  setUser: (user: User) => void
  setLoading: (isLoading: boolean) => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  login: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
  logout: () => set({ user: null, accessToken: null, isAuthenticated: false }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}))
