import { Link } from 'react-router-dom';
import { HiOutlinePlusCircle, HiOutlineTicket } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="lead">
        Welcome back, {user?.name}. You are signed in as{' '}
        <strong>{user?.role}</strong>.
      </p>
      <div className="card-grid">
        <Link to="/tickets/new" className="card tile">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <HiOutlinePlusCircle style={{ width: '1.35rem', height: '1.35rem', color: '#2563eb' }} aria-hidden />
            Create ticket
          </h2>
          <p>Report an issue or request help for your project.</p>
        </Link>
        <Link to="/tickets" className="card tile">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <HiOutlineTicket style={{ width: '1.35rem', height: '1.35rem', color: '#2563eb' }} aria-hidden />
            My tickets
          </h2>
          <p>See status updates and open any ticket for full details.</p>
        </Link>
      </div>
      {user?.role === 'admin' && (
        <p className="muted">
          As an admin you can update status and delete tickets from the ticket detail
          page.
        </p>
      )}
    </div>
  );
}
