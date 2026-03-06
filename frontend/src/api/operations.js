import { api } from './client.js'

export async function listOperations(params = {}) {
  const { data } = await api.get('/api/operations/', { params })
  return data
}

export async function createOperation(payload) {
  const { data } = await api.post('/api/operations/', payload)
  return data
}

export async function deleteOperation(id) {
  await api.delete(`/api/operations/${id}`)
}
