import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'

export function useOpportunities() {
  return useQuery({
    queryKey: ['opportunities'],
    queryFn: () => api.getOpportunities(),
  })
}

export function useOpportunity(id: string) {
  return useQuery({
    queryKey: ['opportunities', id],
    queryFn: () => api.getOpportunity(id),
    enabled: !!id,
  })
}
