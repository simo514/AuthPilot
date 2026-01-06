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
  total: number;
  page: number;
  totalPages: number;
  loading: boolean;
  error: string | null;
  fetchLogs: (page?: number, limit?: number, search?: string) => Promise<void>;
  clearLogs: () => void;
}

export const useAuditStore = create<AuditStoreState>((set) => ({
  logs: [],
  total: 0,
  page: 1,
  totalPages: 0,
  loading: false,
  error: null,
  fetchLogs: async (page = 1, limit = 10, search = '') => {
    set({ loading: true, error: null });
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);

      const res = await api.get(`/audits?${params.toString()}`);
      if (res.status !== 200) throw new Error('Failed to fetch audit logs');
      
      set({ 
        logs: res.data.audits,
        total: res.data.total,
        page: res.data.page,
        totalPages: res.data.totalPages,
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message || 'Unknown error', loading: false });
    }
  },
  clearLogs: () => set({ logs: [], total: 0, page: 1, totalPages: 0 }),
}));
