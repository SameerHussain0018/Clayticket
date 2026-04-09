import { create } from 'zustand';
import type { Ticket } from '../types/models';

interface TicketState {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
  upsertTicket: (ticket: Ticket) => void;
  removeTicket: (id: string) => void;
  clear: () => void;
}

export const useTicketStore = create<TicketState>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  upsertTicket: (ticket) =>
    set((state) => {
      const idx = state.tickets.findIndex((t) => t.id === ticket.id);
      if (idx === -1) {
        return { tickets: [ticket, ...state.tickets] };
      }
      const next = [...state.tickets];
      next[idx] = ticket;
      return { tickets: next };
    }),
  removeTicket: (id) =>
    set((state) => ({
      tickets: state.tickets.filter((t) => t.id !== id),
    })),
  clear: () => set({ tickets: [] }),
}));
