import { useAuth0 } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import { LoadingState } from '../components/LoadingState'

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) {
    return <LoadingState message="Checking authentication…" />
  }

  if (!isAuthenticated) {
    void loginWithRedirect({
      appState: { returnTo: window.location.pathname },
    })
    return <LoadingState message="Redirecting to login…" />
  }

  return <>{children}</>
}
