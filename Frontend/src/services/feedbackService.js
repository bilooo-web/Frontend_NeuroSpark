// feedbackService.js
// Connected to real backend API

import api from './api';

const feedbackService = {

  // ========== PUBLIC ENDPOINTS (for homepage) ==========

  getHomepageFeedback: async (limit = 6) => {
    const res = await api.get(`/guardian/feedback`);
    const all = res.data || res || [];
    return all.filter(f => f.is_approved).slice(0, limit);
  },

  getFeaturedFeedback: async (limit = 3) => {
    const res = await api.get(`/guardian/feedback`);
    const all = res.data || res || [];
    return all.filter(f => f.is_featured).slice(0, limit);
  },

  // ========== GUARDIAN ENDPOINTS ==========

  submitFeedback: (feedbackData) =>
    api.post('/guardian/feedback', {
      feedback: feedbackData.text,
      rate: feedbackData.rating,
    }),

  getMyFeedback: () => api.get('/guardian/feedback'),
  getFeedbackById: (id) => api.get(`/guardian/feedback/${id}`),
  deleteFeedback: (id) => api.delete(`/guardian/feedback/${id}`),
  updateFeedback: (id, data) =>
    api.put(`/guardian/feedback/${id}`, {
      feedback: data.text,
      rate: data.rating,
    }),

  // ========== ADMIN ENDPOINTS ==========

  /**
   * Get all feedback with pagination and filters
   * Filters: { sentiment, search, min_rating, max_rating, page, limit }
   */
  getAllFeedback: async (page = 1, limit = 20, filters = {}) => {
    const res = await api.get('/admin/feedback/all', {
      page,
      limit,
      ...filters,
    });
    return {
      feedback: res.data || [],
      total: res.pagination?.total || 0,
      page: res.pagination?.current_page || page,
      limit: res.pagination?.per_page || limit,
      totalPages: res.pagination?.last_page || 1,
    };
  },

  /**
   * Get feedback statistics
   */
  getFeedbackStats: async () => {
    const res = await api.get('/admin/feedback/stats');
    return res.stats || res;
  },

  /**
   * Get feedback trends
   */
  getFeedbackTrends: async (period = 'week') => {
    const res = await api.get('/admin/feedback/trends', { period });
    return res.trends || res.data || res;
  },

  /**
   * Approve a feedback
   */
  approveFeedback: async (id, isFeatured = false) => {
    return api.put(`/admin/feedback/${id}/approve`, { is_featured: isFeatured });
  },

  /**
   * Reject a feedback
   */
  rejectFeedback: async (id, reason = '') => {
    return api.put(`/admin/feedback/${id}/reject`, { rejection_reason: reason });
  },

  /**
   * Delete a feedback
   */
  adminDeleteFeedback: async (id) => {
    return api.delete(`/admin/feedback/${id}`);
  },

  /**
   * Bulk approve multiple feedbacks
   */
  bulkApprove: async (ids) => {
    return api.post('/admin/feedback/bulk-approve', { ids });
  },

  /**
   * Export feedback as CSV (opens download)
   */
  exportFeedback: async (filters = {}) => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({ format: 'csv', ...filters });
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const response = await fetch(`${API_BASE_URL}/admin/feedback/export?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Export failed');
    return await response.blob();
  },
};

export default feedbackService;