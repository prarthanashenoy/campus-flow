import { useQuery } from '@tanstack/react-query'
import { useAuth0 } from '@auth0/auth0-react'
import { useAuthenticatedFetch } from './useAuthenticatedFetch'

export interface CurrentUser {
  id: string
  auth0Id: string
  email: string
  name: string
  role: 'STUDENT' | 'ORGANIZER'
  createdAt: string
  updatedAt: string
}

export function useCurrentUser() {
  const { isAuthenticated, isLoading: authLoading } = useAuth0()
  const authFetch = useAuthenticatedFetch()

  return useQuery({
    queryKey: ['me'],
    queryFn: () => authFetch<CurrentUser>('/me'),
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60_000,
  })
}
