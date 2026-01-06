import { create } from 'zustand';
import api from '../lib/api';


export interface AuditLog {
  uuid: string;
  user?: Record<string, any>;
  action: string;
  details?: string;
  response?: Record<string, any>;
  status?: 'success' | 'failed';
  ipAddress?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuditStoreState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  fetchLogs: () => Promise<void>;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditStoreState>((set) => ({
  logs: [],
  loading: false,
  error: null,
  fetchLogs: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/audits');
      if (res.status !== 200) throw new Error('Failed to fetch audit logs');
      set({ logs: res.data, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Unknown error', loading: false });
    }
  },
  clearLogs: () => set({ logs: [] }),
}));
