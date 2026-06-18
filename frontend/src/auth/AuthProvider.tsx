import { Auth0Provider } from '@auth0/auth0-react'
import type { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN as string
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID as string
  const audience = import.meta.env.VITE_AUTH0_AUDIENCE as string

  if (!domain || !clientId) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        Auth0 is not configured. Please set VITE_AUTH0_DOMAIN and
        VITE_AUTH0_CLIENT_ID in your .env file.
      </div>
    )
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
    >
      {children}
    </Auth0Provider>
  )
}
