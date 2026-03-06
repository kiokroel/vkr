import { api } from './client.js'

export async function registerUser(payload) {
  const { data } = await api.post('/api/users/', payload)
  return data
}

export async function loginUser(payload) {
  const { data } = await api.post('/api/users/login', payload)
  return data
}

export async function getMe() {
  const { data } = await api.get('/api/users/me')
  return data
}
