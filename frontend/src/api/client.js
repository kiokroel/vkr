import axios from 'axios'
import { getAccessToken, clearAccessToken } from '../auth/token.js'

export const api = axios.create({
  baseURL: ''
})

api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      clearAccessToken()

      try {
        if (window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
      } catch {
        // ignore
      }
    }
    return Promise.reject(error)
  }
)
