import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `sidebar-link${isActive ? ' sidebar-link-active' : ''}`;

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">Ticket Desk</div>
      <p className="sidebar-user">
        {user?.name}
        <span className="sidebar-role">{user?.role}</span>
      </p>
      <nav className="sidebar-nav" aria-label="Main">
        <NavLink to="/dashboard" className={linkClass} end>
          Dashboard
        </NavLink>
        <NavLink to="/tickets/new" className={linkClass}>
          Create Ticket
        </NavLink>
        <NavLink to="/tickets" className={linkClass}>
          View Tickets
        </NavLink>
      </nav>
      <button type="button" className="sidebar-logout" onClick={() => void logout()}>
        Logout
      </button>
    </aside>
  );
}
