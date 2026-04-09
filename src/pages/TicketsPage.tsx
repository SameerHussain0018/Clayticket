import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';
import type { Ticket } from '../types/models';
import { ticketService, ApiError } from '../services/tickets/ticketService';

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const data = await ticketService.list(user);
        if (!cancelled) setTickets(data);
      } catch (err) {
        ticketService.logClientError('Load tickets failed', err);
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Network error. Please try again.',
          );
          toast.error('Failed to load tickets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onDelete(id: string) {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('Delete this ticket permanently?')) return;
    try {
      await ticketService.remove(user, id);
      setTickets((prev) => prev.filter((t) => t.id !== id));
      toast.success('Ticket deleted');
    } catch (err) {
      ticketService.logClientError('Delete ticket failed', err);
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Delete failed';
      toast.error(msg);
    }
  }

  if (!user) return null;

  return (
    <div className="page">
      <h1>Tickets</h1>
      {loading && <p role="status">Loading tickets…</p>}
      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && tickets.length === 0 && (
        <p className="muted">No tickets yet. Create one to get started.</p>
      )}
      <ul className="ticket-list">
        {tickets.map((t) => (
          <li key={t.id} className="ticket-row">
            <div>
              <Link to={`/tickets/${t.id}`} className="ticket-title-link">
                {t.title}
              </Link>
              <div className="ticket-meta">
                <span className="pill">{t.type}</span>
                <span className="pill pill-muted">{t.status}</span>
                <span className="muted small">{new Date(t.createdAt).toLocaleString()}</span>
              </div>
            </div>
            {user.role === 'admin' && (
              <button
                type="button"
                className="btn-danger btn-small"
                onClick={() => void onDelete(t.id)}
              >
                Delete
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
