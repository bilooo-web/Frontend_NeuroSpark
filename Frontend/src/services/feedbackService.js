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
    // Only send params the backend understands — sentiment and search
    const params = { page, limit };
    if (filters.sentiment && filters.sentiment !== 'all' && filters.sentiment !== '') {
      params.sentiment = filters.sentiment;
    }
    if (filters.search) params.search = filters.search;

    const res = await api.get('/admin/feedback/all', params);

    // Backend returns raw Feedback model rows under res.data
    // Normalize to what FeedbackDashboard expects
    const raw = Array.isArray(res.data) ? res.data : [];

    const normalize = (item) => ({
      id:          item.id,
      text:        item.text        || '',
      sentiment:   item.type        || 'neutral',   // DB column is 'type'
      isApproved:  item.is_approved ?? false,        // DB column is 'is_approved'
      rating:      item.rate        || 0,            // DB column is 'rate'
      userName:    item.guardian?.user?.full_name || item.guardian?.user?.name || 'Anonymous',
      userType:    item.guardian?.guardian_type   || 'user',
      childName:   null,
      timestamp:   item.created_at  || new Date().toISOString(),
      confidence:  item.confidence  || 0.75,
      scores: {
        positive: item.type === 'positive' ? 0.9  : 0.1,
        neutral:  item.type === 'neutral'  ? 0.8  : 0.15,
        negative: item.type === 'negative' ? 0.85 : 0.05,
      },
    });

    let normalized = raw.map(normalize);

    // Approval filter — backend doesn't support this, do it client-side
    if (filters.approvalStatus && filters.approvalStatus !== 'all') {
      normalized = normalized.filter(f =>
        filters.approvalStatus === 'approved' ? f.isApproved : !f.isApproved
      );
    }

    return {
      feedback:   normalized,
      total:      res.pagination?.total        || normalized.length,
      page:       res.pagination?.current_page || page,
      limit:      res.pagination?.per_page     || limit,
      totalPages: res.pagination?.last_page    || 1,
    };
  },

  /**
   * Get feedback statistics
   */
  getFeedbackStats: async () => {
    const res = await api.get('/admin/feedback/stats');
    const s = res.stats || res.data || res;

    // Normalize to what FeedbackDashboard stat cards expect
    return {
      total:    s.total    || 0,
      approved: s.approved || 0,
      pending:  s.pending  || (s.total - (s.approved || 0)) || 0,
      breakdown: {
        positive: s.positive || 0,
        neutral:  s.neutral  || 0,
        negative: s.negative || 0,
      },
      percentages: {
        positive: s.positive_percentage || 0,
        neutral:  s.neutral_percentage  || 0,
        negative: s.negative_percentage || 0,
      },
      averageRating: s.average_rating || 0,
    };
  },

  /**
   * Get feedback trends
   */
  getFeedbackTrends: async (period = 'week') => {
    const res = await api.get('/admin/feedback/trends', { period });
    const trends = res.trends || res.data || [];
    // Backend returns: { date, total, positive, neutral, negative, avg_rating }
    // Component expects same keys — pass through directly
    return Array.isArray(trends) ? trends : [];
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