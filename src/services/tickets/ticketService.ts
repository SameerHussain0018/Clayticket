import type {
  AuthUser,
  CreateTicketPayload,
  Ticket,
  UpdateTicketPayload,
} from '../../types/models';
import { apiClient } from '../api/client';
import { appLogger } from '../logger';
import { useTicketStore } from '../../store/ticketStore';

function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK !== 'false';
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

/** In-memory mock DB keyed in module scope; synced with Zustand for UI */
const mockDb = {
  list: [] as Ticket[],
  seeded: false,
};

function seedMock(user: AuthUser): void {
  if (mockDb.seeded) return;
  mockDb.seeded = true;
  const t = nowIso();
  mockDb.list = [
    {
      id: 'demo-1',
      title: 'Sample Arvind Ticket',
      description: 'Example ticket for Arvind workflow.',
      type: 'Arvind Ticket',
      status: 'open',
      createdAt: t,
      updatedAt: t,
      createdById: user.id,
      createdByEmail: user.email,
    },
    {
      id: 'demo-2',
      title: 'PWG billing question',
      description: 'Question about PWG wallet top-up.',
      type: 'PWG Ticket',
      status: 'in_progress',
      createdAt: t,
      updatedAt: t,
      createdById: user.id,
      createdByEmail: user.email,
    },
  ];
  useTicketStore.getState().setTickets([...mockDb.list]);
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

function assertAdmin(user: AuthUser): void {
  if (user.role !== 'admin') {
    throw new ApiError('Forbidden: admin role required', 403);
  }
}

export const ticketService = {
  async list(user: AuthUser): Promise<Ticket[]> {
    if (isMockMode()) {
      seedMock(user);
      await delay(200);
      return [...mockDb.list];
    }
    const { data } = await apiClient.get<Ticket[]>('/tickets');
    useTicketStore.getState().setTickets(data);
    return data;
  },

  async getById(user: AuthUser, id: string): Promise<Ticket | null> {
    if (isMockMode()) {
      seedMock(user);
      await delay(150);
      return mockDb.list.find((x) => x.id === id) ?? null;
    }
    try {
      const { data } = await apiClient.get<Ticket>(`/tickets/${id}`);
      return data;
    } catch (e: unknown) {
      if (isNotFound(e)) return null;
      throw e;
    }
  },

  async create(user: AuthUser, payload: CreateTicketPayload): Promise<Ticket> {
    if (isMockMode()) {
      seedMock(user);
      await delay(250);
      const ticket: Ticket = {
        id: crypto.randomUUID(),
        title: payload.title.trim(),
        description: payload.description.trim(),
        type: payload.type,
        status: 'open',
        createdAt: nowIso(),
        updatedAt: nowIso(),
        createdById: user.id,
        createdByEmail: user.email,
      };
      mockDb.list.unshift(ticket);
      useTicketStore.getState().upsertTicket(ticket);
      return ticket;
    }
    const { data } = await apiClient.post<Ticket>('/tickets', payload);
    useTicketStore.getState().upsertTicket(data);
    return data;
  },

  async update(
    user: AuthUser,
    id: string,
    patch: UpdateTicketPayload,
  ): Promise<Ticket> {
    assertAdmin(user);
    if (isMockMode()) {
      await delay(200);
      const idx = mockDb.list.findIndex((x) => x.id === id);
      if (idx === -1) throw new ApiError('Ticket not found', 404);
      const prev = mockDb.list[idx]!;
      const next: Ticket = {
        ...prev,
        ...patch,
        updatedAt: nowIso(),
      };
      mockDb.list[idx] = next;
      useTicketStore.getState().upsertTicket(next);
      return next;
    }
    const { data } = await apiClient.put<Ticket>(`/tickets/${id}`, patch);
    useTicketStore.getState().upsertTicket(data);
    return data;
  },

  async remove(user: AuthUser, id: string): Promise<void> {
    assertAdmin(user);
    if (isMockMode()) {
      await delay(200);
      const idx = mockDb.list.findIndex((x) => x.id === id);
      if (idx === -1) throw new ApiError('Ticket not found', 404);
      mockDb.list.splice(idx, 1);
      useTicketStore.getState().removeTicket(id);
      return;
    }
    await apiClient.delete(`/tickets/${id}`);
    useTicketStore.getState().removeTicket(id);
  },

  syncStoreFromList(tickets: Ticket[]): void {
    useTicketStore.getState().setTickets(tickets);
  },

  clearSessionData(): void {
    useTicketStore.getState().clear();
    if (isMockMode()) {
      mockDb.list = [];
      mockDb.seeded = false;
    }
  },

  logClientError(context: string, err: unknown): void {
    appLogger.error(context, err);
  },
};

function isNotFound(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'response' in e &&
    (e as { response?: { status?: number } }).response?.status === 404
  );
}
