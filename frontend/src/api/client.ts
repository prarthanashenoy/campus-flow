import type { Opportunity } from '../types/opportunity'

const BASE_URL = '/api'

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(
      (body as { message?: string }).message ?? `Request failed: ${res.status}`,
    )
  }
  return res.json() as Promise<T>
}

export const api = {
  getOpportunities: () => request<Opportunity[]>('/opportunities'),
  getOpportunity: (id: string) => request<Opportunity>(`/opportunities/${id}`),
}
