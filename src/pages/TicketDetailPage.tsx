import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { TICKET_TYPES, type Ticket, type TicketStatus, type TicketType } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { ticketService, ApiError } from '../services/tickets/ticketService.ts';

const STATUSES: TicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Partial<Ticket>>({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user || !id) return;
      setLoading(true);
      try {
        const t = await ticketService.getById(user, id);
        if (!cancelled) {
          setTicket(t);
          if (t) setDraft(t);
        }
      } catch (err) {
        ticketService.logClientError('Load ticket failed', err);
        if (!cancelled) {
          setTicket(null);
          toast.error('Could not load ticket');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [user, id]);

  async function saveAdmin() {
    if (!user || user.role !== 'admin' || !id || !ticket) return;
    try {
      const updated = await ticketService.update(user, id, {
        title: draft.title,
        description: draft.description,
        type: draft.type as TicketType | undefined,
        status: draft.status as TicketStatus | undefined,
      });
      setTicket(updated);
      setDraft(updated);
      setEditMode(false);
      toast.success('Ticket updated');
    } catch (err) {
      ticketService.logClientError('Update ticket failed', err);
      toast.error(err instanceof Error ? err.message : 'Update failed');
    }
  }

  async function onDelete() {
    if (!user || user.role !== 'admin' || !id) return;
    if (!window.confirm('Delete this ticket?')) return;
    try {
      await ticketService.remove(user, id);
      toast.success('Ticket deleted');
      navigate('/tickets');
    } catch (err) {
      ticketService.logClientError('Delete ticket failed', err);
      toast.error(err instanceof ApiError ? err.message : 'Delete failed');
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="loading-inline page-loading" role="status">
          <FaSpinner className="loading-inline-icon" aria-hidden />
          Loading ticket…
        </p>
      </div>
    );
  }

  if (ticket === null) {
    return (
      <div className="page">
        <h1>Ticket not found</h1>
        <p className="lead">This link may be outdated or the ticket was removed.</p>
        <p>
          <Link to="/tickets">Return to my tickets</Link>
        </p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div className="page">
      <p className="breadcrumb">
        <Link to="/tickets">Tickets</Link> / {ticket.title}
      </p>
      <header className="detail-header">
        <h1>{ticket.title}</h1>
        {isAdmin && (
          <div className="detail-actions">
            {!editMode ? (
              <>
                <button type="button" className="btn-secondary" onClick={() => setEditMode(true)}>
                  Edit
                </button>
                <button type="button" className="btn-danger" onClick={() => void onDelete()}>
                  Delete
                </button>
              </>
            ) : (
              <>
                <button type="button" className="btn-primary" onClick={() => void saveAdmin()}>
                  Save
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setDraft(ticket);
                    setEditMode(false);
                  }}
                >
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </header>

      <div className="detail-grid">
        <section className="card">
          <h2>Details</h2>
          {!editMode || !isAdmin ? (
            <>
              <p>{ticket.description}</p>
              <dl className="kv">
                <dt>Type</dt>
                <dd>{ticket.type}</dd>
                <dt>Status</dt>
                <dd>{ticket.status}</dd>
                <dt>Created</dt>
                <dd>{new Date(ticket.createdAt).toLocaleString()}</dd>
                <dt>Updated</dt>
                <dd>{new Date(ticket.updatedAt).toLocaleString()}</dd>
                <dt>Created by</dt>
                <dd>{ticket.createdByEmail}</dd>
              </dl>
            </>
          ) : (
            <>
              <label className="field">
                <span>Title</span>
                <input
                  value={draft.title ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={draft.description ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  value={draft.type}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, type: e.target.value as TicketType }))
                  }
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={draft.status}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      status: e.target.value as TicketStatus,
                    }))
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
