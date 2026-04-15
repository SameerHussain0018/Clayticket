import type { AuthUser, Ticket, TicketStatus, TicketType, UpdateTicketPayload } from '../../types/models';
import { TICKET_TYPES } from '../../types/models';
import { authStorage } from '../auth/authStorage';

const API_BASE = 'https://tmsapi.clay.in/api';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface ClayListTicket {
  ticketID: string;
  userID: string;
  projectName: string;
  description: string;
  status: string;
  createdAtUtc: string;
  updatedDate: string;
  ticketType?: string;
}

interface ClayListResponse {
  isSuccess: boolean;
  message?: string;
  data?: ClayListTicket[];
}

function authHeaders(): HeadersInit {
  const token = authStorage.getBearerTokenIfAny();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: '*/*',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function toTicketStatus(raw: string): TicketStatus {
  const s = (raw || '').toLowerCase().replace(/[\s-]+/g, '_');
  if (s === 'in_progress' || s === 'inprogress' || s === 'progress') return 'in_progress';
  if (s === 'resolved' || s === 'done') return 'resolved';
  if (s === 'closed') return 'closed';
  return 'open';
}

function toTicketType(raw: string | undefined): TicketType {
  if (raw && (TICKET_TYPES as readonly string[]).includes(raw)) return raw as TicketType;
  return 'General';
}

function mapClayRow(row: ClayListTicket, viewer: AuthUser): Ticket {
  return {
    id: row.ticketID,
    title: row.projectName?.trim() || 'Ticket',
    description: row.description ?? '',
    projectName: row.projectName,
    type: toTicketType(row.ticketType),
    status: toTicketStatus(row.status),
    createdAt: row.createdAtUtc ?? '',
    updatedAt: row.updatedDate ?? '',
    createdById: row.userID ?? viewer.id,
    createdByEmail: viewer.email,
  };
}

async function fetchTicketList(user: AuthUser): Promise<ClayListTicket[]> {
  const response = await fetch(`${API_BASE}/Ticket/Get_Ticket`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ userID: user.id }),
  });

  if (!response.ok) {
    throw new ApiError(`Could not load tickets (${response.status})`, response.status);
  }

  const result = (await response.json()) as ClayListResponse;
  if (!result.isSuccess) {
    throw new ApiError(result.message || 'Could not load tickets');
  }

  return Array.isArray(result.data) ? result.data : [];
}

export const ticketService = {
  clearSessionData(): void {
    // Hook for ticket-only caches; user + bearer are cleared in authService.logout().
  },

  logClientError(context: string, err: unknown): void {
    console.error(`[ticketService] ${context}`, err);
  },

  async getById(user: AuthUser, id: string): Promise<Ticket | null> {
    const rows = await fetchTicketList(user);
    const row = rows.find((r) => r.ticketID === id);
    if (!row) return null;
    return mapClayRow(row, user);
  },

  async update(user: AuthUser, id: string, payload: UpdateTicketPayload): Promise<Ticket> {
    const response = await fetch(`${API_BASE}/Ticket/Update_Ticket`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        ticketID: id,
        userID: user.id,
        projectName: payload.title,
        ticketDescription: payload.description,
        status: payload.status,
        ticketType: payload.type,
      }),
    });

    const result = (await response.json().catch(() => ({}))) as {
      isSuccess?: boolean;
      message?: string;
    };

    if (!response.ok || result.isSuccess === false) {
      throw new ApiError(
        result.message || `Update failed (${response.status})`,
        response.status,
      );
    }

    const next = await ticketService.getById(user, id);
    if (!next) {
      throw new ApiError('Ticket missing after update');
    }
    return next;
  },

  async remove(_user: AuthUser, id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/Ticket/Delete_Ticket/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });

    if (!response.ok) {
      let message = `Delete failed (${response.status})`;
      try {
        const body = (await response.json()) as { message?: string };
        if (body.message) message = body.message;
      } catch {
        /* ignore */
      }
      throw new ApiError(message, response.status);
    }
  },
};
