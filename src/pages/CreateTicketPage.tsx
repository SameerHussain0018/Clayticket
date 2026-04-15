import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSpinner } from 'react-icons/fa';
import { HiOutlinePaperAirplane } from 'react-icons/hi2';
import { useAuth } from '../hooks/useAuth';

export function CreateTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectName, setProjectName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to create a ticket');
      return;
    }

    if (!projectName) {
      toast.error('Project name is required');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('https://tmsapi.clay.in/api/Ticket/Create_Ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
        },
        body: JSON.stringify({
          userID: user.id, // Assuming `user.id` is the correct identifier
          ticketDescription: description,
          projectName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.isSuccess) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      toast.success(data.message || 'Ticket created successfully');
      navigate('/tickets'); // Navigate to ticket list or modify as needed
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create ticket. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h1>Create ticket</h1>
      <p className="lead">
        Add a clear title and description so your team can help you faster.
      </p>

      <section className="card" style={{ marginTop: '1.25rem' }}>
        <form className="form-panel" onSubmit={onSubmit} style={{ marginTop: 0 }}>
          <label className="field">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={2}
              placeholder="Short summary of the issue"
              disabled={submitting}
            />
          </label>

          <label className="field">
            <span>Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
              placeholder="What happened, what you expected, and any steps to reproduce"
              disabled={submitting}
            />
          </label>

          <label className="field">
            <span>Project name</span>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              placeholder="e.g. Arvind, PWG, or internal project code"
              disabled={submitting}
            />
          </label>

          <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: '0.25rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {submitting ? (
                <>
                  <FaSpinner className="loading-inline-icon" style={{ width: '1rem', height: '1rem' }} aria-hidden />
                  Sending…
                </>
              ) : (
                <>
                  <HiOutlinePaperAirplane style={{ width: '1.1rem', height: '1.1rem' }} aria-hidden />
                  Submit ticket
                </>
              )}
            </span>
          </button>
        </form>
      </section>
    </div>
  );
}