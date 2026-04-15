import { NavLink } from 'react-router-dom';
import {
  HiArrowRightOnRectangle,
  HiOutlinePlusCircle,
  HiOutlineSquares2X2,
  HiOutlineTicket,
} from 'react-icons/hi2';
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
          <span className="sidebar-link-inner">
            <HiOutlineSquares2X2 className="sidebar-link-icon" aria-hidden />
            Dashboard
          </span>
        </NavLink>
        <NavLink to="/tickets/new" className={linkClass}>
          <span className="sidebar-link-inner">
            <HiOutlinePlusCircle className="sidebar-link-icon" aria-hidden />
            Create ticket
          </span>
        </NavLink>
        <NavLink to="/tickets" className={linkClass}>
          <span className="sidebar-link-inner">
            <HiOutlineTicket className="sidebar-link-icon" aria-hidden />
            My tickets
          </span>
        </NavLink>
      </nav>
      <button type="button" className="sidebar-logout" onClick={() => void logout()}>
        <HiArrowRightOnRectangle className="sidebar-link-icon" aria-hidden />
        Log out
      </button>
    </aside>
  );
}
