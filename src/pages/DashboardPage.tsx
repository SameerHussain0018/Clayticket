import { Link } from 'react-router-dom';
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
          <h2>Create ticket</h2>
          <p>Open a new Arvind, PWG, or other ticket type.</p>
        </Link>
        <Link to="/tickets" className="card tile">
          <h2>View tickets</h2>
          <p>Browse and open ticket details.</p>
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
