import { api } from './client.js'

export async function listCategories() {
  const { data } = await api.get('/api/categories/')
  return data
}

export async function createCategory(payload) {
  const { data } = await api.post('/api/categories/', payload)
  return data
}
