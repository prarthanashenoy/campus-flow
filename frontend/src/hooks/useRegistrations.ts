import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'
import type { Registration } from '../types/registration'

export function useMyRegistrations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const authFetch = useAuthenticatedFetch()

  return useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => authFetch<Registration[]>('/me/registrations'),
    enabled: isAuthenticated && !authLoading,
  })
}

export function useRegister(opportunityId: string) {
  const authFetch = useAuthenticatedFetch()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      authFetch<Registration>(`/opportunities/${opportunityId}/register`, {
        method: 'POST',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['my-registrations'] })
      void queryClient.invalidateQueries({ queryKey: ['opportunities', opportunityId] })
    },
  })
}
