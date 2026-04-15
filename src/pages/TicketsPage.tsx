import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
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

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;

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
          body: JSON.stringify({ userID: user.id }),
        });

        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        const result = await response.json();

        if (!result.isSuccess) throw new Error(result.message || 'Failed to load tickets');

     const mappedTickets: Ticket[] = result.data.map((t: ApiTicket) => ({
  id: t.ticketID,              // map ticketID to id
  projectName: t.projectName || '',
  description: t.description || '',
  status: t.status || '',
  createdAt: t.createdAtUtc || '',
  updatedAt: t.updatedDate || '',
  type: 'General',             // default type
}));

        if (!cancelled) setTickets(mappedTickets);
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Network error');
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
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  }

  if (!user) return null;

  const filteredTickets = tickets.filter((t) =>
    (t.projectName || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page">
      <h1>Tickets Details</h1>

      <input
        type="text"
        placeholder="Search by project..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: '1rem', padding: '0.5rem', width: '100%' }}
      />

      {loading && <p role="status">Loading tickets…</p>}
      {error && (
        <div className="banner banner-error" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && filteredTickets.length === 0 && (
        <p className="muted">No tickets found.</p>
      )}

      {!loading && !error && filteredTickets.length > 0 && (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Project Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Updated At</th>
              {user.role === 'admin' && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{t.id} </td>
                <td>
                  <Link to={`/tickets/${t.id}`}>{t.projectName}</Link>
                </td>
                <td>{t.description}</td>
                <td>{t.status}</td>
                <td>{t.createdAt ? new Date(t.createdAt).toLocaleString() : '-'}</td>
                <td>{t.updatedAt ? new Date(t.updatedAt).toLocaleString() : '-'}</td>
                {user.role === 'admin' && (
                  <td>
                    <button
                      type="button"
                      onClick={() => void onDelete(t.id)}
                      style={{ background: 'red', color: 'white', padding: '0.3rem 0.6rem' }}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}