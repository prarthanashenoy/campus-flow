import { Link, NavLink } from 'react-router-dom'

export function Navbar() {
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
      </ul>
    </nav>
  )
}
