import { Link, NavLink } from 'react-router-dom'
import { useAuth0 } from '@auth0/auth0-react'

export function Navbar() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } =
    useAuth0()

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        CampusFlow
      </Link>

      <ul className="navbar-links">
        <li>
          <NavLink
            to="/opportunities"
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            Opportunities
          </NavLink>
        </li>
        {isAuthenticated && (
          <li>
            <NavLink
              to="/my-registrations"
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              My Registrations
            </NavLink>
          </li>
        )}
      </ul>

      <div className="navbar-auth">
        {isLoading ? null : isAuthenticated ? (
          <>
            <span className="navbar-user">{user?.name ?? user?.email}</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                logout({ logoutParams: { returnTo: window.location.origin } })
              }
            >
              Log out
            </button>
          </>
        ) : (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => loginWithRedirect()}
          >
            Log in
          </button>
        )}
      </div>
    </nav>
  )
}
