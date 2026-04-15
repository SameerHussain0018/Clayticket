import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-md mt-10">
      <h1 className="text-2xl font-bold mb-6">Create Ticket</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={2}
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter ticket title"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            required
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter ticket description"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
            className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter project name"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {submitting ? 'Submitting…' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
}