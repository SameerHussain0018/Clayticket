export type UserRole = 'admin' | 'user';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export const TICKET_TYPES = [
  'Arvind Ticket',
  'PWG Ticket',
  'Partner Support',
  'Billing',
] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdByEmail: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  type: TicketType;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  type?: TicketType;
  status?: TicketStatus;
}
