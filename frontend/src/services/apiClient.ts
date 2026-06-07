import axios from 'axios'

/**
 * Base axios instance for the Smart-RT API (docs/06-API-CONTRACT.md §1.1).
 *
 * Auth-related interceptors (attach access token, 401 → refresh-token retry,
 * see docs/08-CODING-STANDART.md §4.3) are wired up in Phase 2 once
 * `authStore` exists.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // untuk httpOnly cookie (refresh token)
})

export default apiClient
