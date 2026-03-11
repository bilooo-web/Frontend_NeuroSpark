// feedbackService.js
// This service handles both public and admin feedback operations

// Mock data for development
const MOCK_FEEDBACK = [
  {
    id: 1,
    text: "I used to struggle to keep my son focused for even ten minutes. With NeuroSpark, he actually asks to do his challenges every day!",
    sentiment: "positive",
    confidence: 0.89,
    scores: { positive: 0.89, neutral: 0.08, negative: 0.03 },
    timestamp: "2024-03-15T10:30:00Z",
    userName: "Fatima Al-Hassan",
    userType: "parent",
    childName: "Adam",
    childAge: 9,
    avatar: "dino-blue",
    backgroundColor: "blue",
    isApproved: true,
    isFeatured: true,
    approvedAt: "2024-03-16T09:00:00Z",
    approvedBy: "admin@neurospark.com"
  },
  {
    id: 2,
    text: "My daughter used to get frustrated easily. Now she's more confident and excited to learn. I can see real progress in her focus.",
    sentiment: "positive",
    confidence: 0.92,
    scores: { positive: 0.92, neutral: 0.05, negative: 0.03 },
    timestamp: "2024-03-14T14:20:00Z",
    userName: "Omar Khaled",
    userType: "parent",
    childName: "Lina",
    childAge: 10,
    avatar: "dino-pink",
    backgroundColor: "pink",
    isApproved: true,
    isFeatured: true,
    approvedAt: "2024-03-15T11:30:00Z",
    approvedBy: "admin@neurospark.com"
  },
  {
    id: 3,
    text: "Finally something that feels fun and educational at the same time! NeuroSpark turned learning into a game my child loves.",
    sentiment: "positive",
    confidence: 0.87,
    scores: { positive: 0.87, neutral: 0.10, negative: 0.03 },
    timestamp: "2024-03-13T09:15:00Z",
    userName: "Rania Mansour",
    userType: "parent",
    childName: "Youssef",
    childAge: 8,
    avatar: "dino-green",
    backgroundColor: "green",
    isApproved: true,
    isFeatured: true,
    approvedAt: "2024-03-14T10:00:00Z",
    approvedBy: "admin@neurospark.com"
  },
  {
    id: 4,
    text: "The therapy sessions have been incredibly helpful. My son's speech has improved dramatically!",
    sentiment: "positive",
    confidence: 0.94,
    scores: { positive: 0.94, neutral: 0.04, negative: 0.02 },
    timestamp: "2024-03-12T16:45:00Z",
    userName: "Dr. Sarah Chen",
    userType: "therapist",
    childName: "Multiple",
    childAge: null,
    avatar: "dino-blue",
    backgroundColor: "blue",
    isApproved: false,
    isFeatured: false,
    notes: "Awaiting approval"
  },
  {
    id: 5,
    text: "Great platform but would love to see more games for older children.",
    sentiment: "neutral",
    confidence: 0.45,
    scores: { positive: 0.30, neutral: 0.45, negative: 0.25 },
    timestamp: "2024-03-11T11:30:00Z",
    userName: "Michael Johnson",
    userType: "parent",
    childName: "Emma",
    childAge: 12,
    avatar: "dino-pink",
    backgroundColor: "pink",
    isApproved: false,
    isFeatured: false
  },
  {
    id: 6,
    text: "The app crashes sometimes during voice exercises. Please fix this issue.",
    sentiment: "negative",
    confidence: 0.88,
    scores: { positive: 0.05, neutral: 0.07, negative: 0.88 },
    timestamp: "2024-03-10T13:20:00Z",
    userName: "Lisa Thompson",
    userType: "parent",
    childName: "Noah",
    childAge: 7,
    avatar: "dino-green",
    backgroundColor: "green",
    isApproved: false,
    isFeatured: false
  }
];

// Mock stats
const MOCK_STATS = {
  total: 156,
  approved: 42,
  pending: 89,
  rejected: 25,
  breakdown: {
    positive: 89,
    neutral: 34,
    negative: 33
  },
  percentages: {
    positive: 57.1,
    neutral: 21.8,
    negative: 21.1
  }
};

// Mock trends
const MOCK_TRENDS = [
  { date: "2024-03-07", positive: 8, neutral: 3, negative: 2, total: 13 },
  { date: "2024-03-08", positive: 10, neutral: 4, negative: 3, total: 17 },
  { date: "2024-03-09", positive: 7, neutral: 2, negative: 1, total: 10 },
  { date: "2024-03-10", positive: 12, neutral: 5, negative: 4, total: 21 },
  { date: "2024-03-11", positive: 15, neutral: 6, negative: 5, total: 26 },
  { date: "2024-03-12", positive: 11, neutral: 4, negative: 3, total: 18 },
  { date: "2024-03-13", positive: 13, neutral: 5, negative: 4, total: 22 },
  { date: "2024-03-14", positive: 9, neutral: 3, negative: 2, total: 14 },
  { date: "2024-03-15", positive: 4, neutral: 2, negative: 1, total: 7 }
];

// Flag to use mock data (set to false when connecting to real backend)
const USE_MOCK_DATA = true;

// Base API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const feedbackService = {
  // ========== PUBLIC ENDPOINTS (for homepage) ==========
  
  /**
   * Get approved feedback for homepage display
   * Returns only feedback with isApproved = true
   */
  getHomepageFeedback: async (limit = 6) => {
    if (USE_MOCK_DATA) {
      console.log('Using mock homepage feedback');
      const approvedFeedbacks = MOCK_FEEDBACK.filter(f => f.isApproved === true);
      return approvedFeedbacks.slice(0, limit);
    }
    
    try {
      const response = await fetch(`${API_URL}/public/feedback/approved?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch homepage feedback');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Get featured feedback (for special sections)
   */
  getFeaturedFeedback: async (limit = 3) => {
    if (USE_MOCK_DATA) {
      console.log('Using mock featured feedback');
      return MOCK_FEEDBACK.filter(f => f.isFeatured === true).slice(0, limit);
    }
    
    try {
      const response = await fetch(`${API_URL}/public/feedback/featured?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch featured feedback');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // ========== ADMIN ENDPOINTS (for dashboard) ==========

  /**
   * Get all feedback with pagination and filters
   */
  getAllFeedback: async (page = 1, limit = 20, filters = {}) => {
    if (USE_MOCK_DATA) {
      console.log('Using mock feedback data');
      
      let filteredData = [...MOCK_FEEDBACK];
      
      // Apply filters
      if (filters.sentiment && filters.sentiment !== 'all') {
        filteredData = filteredData.filter(item => item.sentiment === filters.sentiment);
      }
      
      if (filters.approvalStatus && filters.approvalStatus !== 'all') {
        if (filters.approvalStatus === 'approved') {
          filteredData = filteredData.filter(item => item.isApproved === true);
        } else if (filters.approvalStatus === 'pending') {
          filteredData = filteredData.filter(item => item.isApproved === false);
        } else if (filters.approvalStatus === 'rejected') {
          filteredData = filteredData.filter(item => item.isApproved === false); // Add rejected logic
        }
      }
      
      if (filters.userType && filters.userType !== 'all') {
        filteredData = filteredData.filter(item => item.userType === filters.userType);
      }
      
      // Paginate
      const start = (page - 1) * limit;
      const paginatedData = filteredData.slice(start, start + limit);
      
      return {
        feedback: paginatedData,
        total: filteredData.length,
        page: page,
        limit: limit,
        totalPages: Math.ceil(filteredData.length / limit),
        stats: {
          total: MOCK_FEEDBACK.length,
          approved: MOCK_FEEDBACK.filter(f => f.isApproved).length,
          pending: MOCK_FEEDBACK.filter(f => !f.isApproved).length
        }
      };
    }
    
    try {
      const params = new URLSearchParams({ page, limit, ...filters });
      const response = await fetch(`${API_URL}/admin/feedback?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch feedback');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Approve a feedback for homepage display
   */
  approveFeedback: async (id, isFeatured = false) => {
    if (USE_MOCK_DATA) {
      console.log('Mock approve - feedback approved:', id);
      return { 
        success: true, 
        message: 'Feedback approved successfully',
        feedback: {
          ...MOCK_FEEDBACK.find(f => f.id === id),
          isApproved: true,
          isFeatured: isFeatured,
          approvedAt: new Date().toISOString(),
          approvedBy: 'admin@neurospark.com'
        }
      };
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/feedback/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured })
      });
      
      if (!response.ok) throw new Error('Failed to approve feedback');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Reject a feedback (remove from homepage)
   */
  rejectFeedback: async (id, reason = '') => {
    if (USE_MOCK_DATA) {
      console.log('Mock reject - feedback rejected:', id);
      return { 
        success: true, 
        message: 'Feedback rejected successfully',
        feedback: {
          ...MOCK_FEEDBACK.find(f => f.id === id),
          isApproved: false,
          isFeatured: false,
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
          rejectedBy: 'admin@neurospark.com'
        }
      };
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/feedback/${id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (!response.ok) throw new Error('Failed to reject feedback');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Toggle featured status
   */
  toggleFeatured: async (id, isFeatured) => {
    if (USE_MOCK_DATA) {
      console.log('Mock toggle featured - feedback:', id, 'featured:', isFeatured);
      return { 
        success: true, 
        message: `Feedback ${isFeatured ? 'featured' : 'unfeatured'} successfully`
      };
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/feedback/${id}/feature`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFeatured })
      });
      
      if (!response.ok) throw new Error('Failed to update featured status');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Bulk approve multiple feedbacks
   */
  bulkApprove: async (ids) => {
    if (USE_MOCK_DATA) {
      console.log('Mock bulk approve - ids:', ids);
      return { 
        success: true, 
        message: `${ids.length} feedbacks approved successfully`
      };
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/feedback/bulk-approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });
      
      if (!response.ok) throw new Error('Failed to bulk approve');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Get feedback statistics (with approval stats)
   */
  getFeedbackStats: async () => {
    if (USE_MOCK_DATA) {
      console.log('Using mock stats data');
      return MOCK_STATS;
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/feedback/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Get feedback trends
   */
  getFeedbackTrends: async (period = 'week') => {
    if (USE_MOCK_DATA) {
      console.log('Using mock trends data');
      return MOCK_TRENDS;
    }
    
    try {
      const response = await fetch(`${API_URL}/admin/feedback/trends?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch trends');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  /**
   * Export feedback data
   */
  exportFeedback: async (format = 'csv', filters = {}) => {
    if (USE_MOCK_DATA) {
      console.log('Mock export - creating sample CSV');
      
      const headers = ['ID', 'User', 'Type', 'Feedback', 'Sentiment', 'Approved', 'Featured', 'Date'];
      const rows = MOCK_FEEDBACK.map(item => [
        item.id,
        item.userName,
        item.userType,
        item.text,
        item.sentiment,
        item.isApproved ? 'Yes' : 'No',
        item.isFeatured ? 'Yes' : 'No',
        item.timestamp
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return new Blob([csvContent], { type: 'text/csv' });
    }
    
    try {
      const params = new URLSearchParams({ format, ...filters });
      const response = await fetch(`${API_URL}/admin/feedback/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to export feedback');
      return await response.blob();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

export default feedbackService;