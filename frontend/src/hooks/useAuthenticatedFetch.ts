import { useAuth0 } from '@auth0/auth0-react'
import { useCallback } from 'react'

const BASE_URL = '/api'

export function useAuthenticatedFetch() {
  const { getAccessTokenSilently } = useAuth0()

  return useCallback(
    async <T>(path: string, options: RequestInit = {}): Promise<T> => {
      const token = await getAccessTokenSilently()
      const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(
          (body as { message?: string }).message ??
            `Request failed: ${res.status}`,
        )
      }
      return res.json() as Promise<T>
    },
    [getAccessTokenSilently],
  )
}
