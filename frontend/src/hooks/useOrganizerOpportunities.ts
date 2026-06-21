import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'
import type { Opportunity } from '../types/opportunity'
import type { Registration } from '../types/registration'

export interface CreateOpportunityDto {
  title: string
  description: string
  category: string
  location: string
  startDate: string
  endDate?: string | null
  capacity?: number | null
}

export type UpdateOpportunityDto = Partial<CreateOpportunityDto> & {
  isPublished?: boolean
}

export function useMyOpportunities() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const authFetch = useAuthenticatedFetch()

  return useQuery({
    queryKey: ['my-opportunities'],
    queryFn: () => authFetch<Opportunity[]>('/opportunities/mine/list'),
    enabled: isAuthenticated && !authLoading,
  })
}

export function useCreateOpportunity() {
  const authFetch = useAuthenticatedFetch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: CreateOpportunityDto) =>
      authFetch<Opportunity>('/opportunities', {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useUpdateOpportunity(id: string) {
  const authFetch = useAuthenticatedFetch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (dto: UpdateOpportunityDto) =>
      authFetch<Opportunity>(`/opportunities/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(dto),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities', id] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useDeleteOpportunity() {
  const authFetch = useAuthenticatedFetch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      authFetch<void>(`/opportunities/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-opportunities'] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities'] })
    },
  })
}

export function useOpportunityRegistrations(opportunityId: string) {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const authFetch = useAuthenticatedFetch()

  return useQuery({
    queryKey: ['opportunity-registrations', opportunityId],
    queryFn: () =>
      authFetch<(Registration & { user: { id: string; name: string; email: string } })[]>(
        `/opportunities/${opportunityId}/registrations`,
      ),
    enabled: isAuthenticated && !authLoading && !!opportunityId,
  })
}
