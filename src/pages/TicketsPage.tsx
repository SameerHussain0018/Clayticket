import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { HiMagnifyingGlass, HiOutlineInbox, HiOutlineTicket } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';
import type { Ticket } from '../types/models';

interface ApiTicket {
  ticketID: string;
  userID: string;
  projectName: string;
  description: string;
  status: string;
  createdAtUtc: string;
  updatedDate: string;
}

function statusPillClass(status: string): string {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const known: Record<string, string> = {
    open: 'pill-status-open',
    new: 'pill-status-new',
    in_progress: 'pill-status-in_progress',
    progress: 'pill-status-progress',
    pending: 'pill-status-progress',
    resolved: 'pill-status-resolved',
    done: 'pill-status-done',
    closed: 'pill-status-closed',
  };
  return known[key] ?? 'pill-status-default';
}

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    let cancelled = false;

    async function loadTickets() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://tmsapi.clay.in/api/Ticket/Get_Ticket', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
          },
          body: JSON.stringify({ userID: userId }),
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();

        if (!result.isSuccess) throw new Error(result.message || 'Failed to load tickets');

        const mappedTickets: Ticket[] = result.data.map((t: ApiTicket) => ({
          id: t.ticketID,
          projectName: t.projectName || '',
          description: t.description || '',
          status: t.status || '',
          createdAt: t.createdAtUtc || '',
          updatedAt: t.updatedDate || '',
          type: 'General',
        }));

        if (!cancelled) setTickets(mappedTickets);
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Network error';
          setError(message);
          toast.error('Failed to load tickets');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadTickets();

    return () => {
      cancelled = true;
    };
  }, [user]);

  async function onDelete(id: string) {
    if (!user || user.role !== 'admin') return;
    if (!window.confirm('Delete this ticket permanently?')) return;

    try {
      const response = await fetch(`https://tmsapi.clay.in/api/Ticket/Delete_Ticket/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      toast.success('Ticket deleted');
      setTickets((prev) => prev.filter((t) => t.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      toast.error(message);
    }
  }

  if (!user) return null;

  const filteredTickets = tickets.filter((t) =>
    (t.projectName || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page">
      <h1>My tickets</h1>
      <p className="lead muted" style={{ marginTop: '-0.25rem' }}>
        Open a ticket to see full details. Use search to filter by project name.
      </p>

      <div className="tickets-toolbar">
        <div className="search-field">
          <HiMagnifyingGlass className="search-field-icon" aria-hidden />
          <input
            type="search"
            placeholder="Search by project name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search tickets by project"
            disabled={loading}
          />
        </div>
        {!loading && !error && (
          <p className="small muted" style={{ margin: 0 }}>
            {filteredTickets.length} ticket{filteredTickets.length === 1 ? '' : 's'}
            {search.trim() ? ' match your search' : ''}
          </p>
        )}
      </div>

      {loading && (
        <p className="loading-inline page-loading" role="status">
          <FaSpinner className="loading-inline-icon" aria-hidden />
          Loading your tickets…
        </p>
      )}

      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && filteredTickets.length === 0 && tickets.length > 0 && (
        <div className="empty-state" role="status">
          <HiOutlineInbox className="empty-state-icon" aria-hidden />
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>No tickets match this search</p>
          <p className="small" style={{ margin: '0.35rem 0 0' }}>
            Try another project name or clear the search box.
          </p>
        </div>
      )}

      {!loading && !error && tickets.length === 0 && (
        <div className="empty-state">
          <HiOutlineTicket className="empty-state-icon" aria-hidden />
          <p style={{ margin: 0, fontWeight: 600, color: '#334155' }}>You do not have any tickets yet</p>
          <p className="small" style={{ margin: '0.35rem 0 0' }}>
            <Link to="/tickets/new">Create your first ticket</Link> to get started.
          </p>
        </div>
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <ul className="ticket-list">
          {filteredTickets.map((t, index) => (
            <li key={t.id} className="ticket-row">
              <div className="ticket-row-main">
                <span className="pill pill-muted" title="Row number">
                  #{index + 1}
                </span>{' '}
                <Link className="ticket-title-link" to={`/tickets/${t.id}`}>
                  {t.projectName || 'Untitled project'}
                </Link>
                {t.description ? (
                  <p className="ticket-desc-preview">{t.description}</p>
                ) : null}
                <div className="ticket-row-meta">
                  <span>
                    Created: {t.createdAt ? new Date(t.createdAt).toLocaleString() : '—'}
                  </span>
                  <span>
                    Updated: {t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '—'}
                  </span>
                </div>
              </div>
              <div className="ticket-meta" style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                <span className={`pill-status ${statusPillClass(t.status)}`}>{t.status || 'Unknown'}</span>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    className="btn-danger btn-small"
                    style={{ marginTop: '0.5rem' }}
                    onClick={() => void onDelete(t.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
