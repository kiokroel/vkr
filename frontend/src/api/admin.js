import { api } from './client.js'

// Управление пользователями
export async function getAllUsers(skip = 0, limit = 100) {
  const { data } = await api.get('/api/admin/users', { params: { skip, limit } })
  return data
}

export async function getUserById(userId) {
  const { data } = await api.get(`/api/admin/users/${userId}`)
  return data
}

export async function updateUser(userId, payload) {
  const { data } = await api.put(`/api/admin/users/${userId}`, payload)
  return data
}

export async function deleteUser(userId) {
  await api.delete(`/api/admin/users/${userId}`)
}

export async function toggleAdminStatus(userId, isAdmin) {
  const { data } = await api.patch(`/api/admin/users/${userId}/admin-status?is_admin=${isAdmin}`)
  return data
}

// Статистика из users_api
export async function getUsersStats() {
  const { data } = await api.get('/api/admin/stats')
  return data
}

// Системная аналитика
export async function getSystemStats() {
  const { data } = await api.get('/api/analytics/admin/system-stats')
  return data
}
