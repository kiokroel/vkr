import { api } from './client.js'

export async function getAnalyticsOverview(params = {}) {
  const { data } = await api.get('/api/analytics/overview', { params })
  return data
}
