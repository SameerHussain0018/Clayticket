import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { TICKET_TYPES, type TicketType } from '../types/models';
import { useAuth } from '../hooks/useAuth';
import { ticketService } from '../services/tickets/ticketService';

export function CreateTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TicketType>(TICKET_TYPES[0]);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const ticket = await ticketService.create(user, {
        title,
        description,
        type,
      });
      toast.success('Ticket created');
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      ticketService.logClientError('Create ticket failed', err);
      toast.error(
        err instanceof Error ? err.message : 'Could not create ticket. Try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Create ticket</h1>
      <form onSubmit={(e) => void onSubmit(e)} className="form-panel">
        <label className="field">
          <span>Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
          />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
          />
        </label>
        <label className="field">
          <span>Ticket type</span>
          <select value={type} onChange={(e) => setType(e.target.value as TicketType)}>
            {TICKET_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit ticket'}
        </button>
      </form>
    </div>
  );
}
