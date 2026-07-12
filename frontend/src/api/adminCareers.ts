import { client } from './client';

export interface AdminCareerFilters {
  page?: number;
  limit?: number;
  category_code?: string;
  backfill_status?: string;
  needs_enrichment?: string;
  is_active?: string;
  search?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface AdminCareerListResponse {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const adminCareersApi = {
  list: async (filters: AdminCareerFilters = {}): Promise<AdminCareerListResponse> => {
    const params = new URLSearchParams();
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    if (filters.category_code) params.set('category_code', filters.category_code);
    if (filters.backfill_status) params.set('backfill_status', filters.backfill_status);
    if (filters.needs_enrichment) params.set('needs_enrichment', filters.needs_enrichment);
    if (filters.is_active) params.set('is_active', filters.is_active);
    if (filters.search) params.set('search', filters.search);
    if (filters.sort_by) params.set('sort_by', filters.sort_by);
    if (filters.sort_order) params.set('sort_order', filters.sort_order);
    return client.get(`/careers/admin/careers?${params.toString()}`);
  },

  get: async (careerCode: string): Promise<any> => {
    return client.get(`/careers/admin/careers/${careerCode}`);
  },

  update: async (careerCode: string, data: Record<string, any>): Promise<any> => {
    return client.put(`/careers/admin/careers/${careerCode}`, data);
  },

  publishDraft: async (careerCode: string): Promise<any> => {
    return client.post(`/careers/admin/careers/${careerCode}/publish-draft`);
  },

  rejectDraft: async (careerCode: string): Promise<any> => {
    return client.post(`/careers/admin/careers/${careerCode}/reject-draft`);
  },

  bulkPublish: async (filter: Record<string, any> = {}): Promise<any> => {
    return client.post('/careers/admin/careers/bulk-publish', { filter });
  },

  importAudit: async (): Promise<any> => {
    return client.get('/careers/admin/careers/import-audit');
  },

  toggleActive: async (careerCode: string): Promise<any> => {
    return client.patch(`/careers/admin/careers/${careerCode}/toggle-active`);
  },
};
