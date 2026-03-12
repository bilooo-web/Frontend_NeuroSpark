import api from './api';

const guardianService = {
  // Existing methods
  getDashboardOverview: () => api.get('/guardian/dashboard'),
  getChildren: () => api.get('/guardian/children'),
  getChildProgress: (childId) => api.get(`/guardian/children/${childId}/progress`),
  linkChild: (data) => api.post('/guardian/children/link', data),
  unlinkChild: (childId) => api.delete(`/guardian/children/${childId}/unlink`),
  
  // Insights (Therapist only)
  getChildInsights: (childId) => api.get(`/guardian/children/${childId}/insights`),
  getChildAnomalies: (childId) => api.get(`/guardian/children/${childId}/anomalies`),
  
  // Global anomalies - with fallback
  getAllAnomalies: async () => {
    try {
      const response = await api.get('/guardian/anomalies');
      return response;
    } catch (error) {
      console.warn('Global anomalies endpoint not available, using per-child fallback');
      // Fallback: get all children and their anomalies
      const childrenRes = await guardianService.getChildren();
      const children = childrenRes.data?.children || childrenRes.data || [];
      
      const anomaliesPromises = children.map(child => 
        guardianService.getChildAnomalies(child.id)
          .then(res => {
            const childAnomalies = res.data || [];
            return childAnomalies.map(a => ({
              ...a,
              child_id: child.id,
              child_name: child.name
            }));
          })
          .catch(() => [])
      );
      
      const anomaliesArrays = await Promise.all(anomaliesPromises);
      const allAnomalies = anomaliesArrays.flat();
      
      return { data: allAnomalies };
    }
  },
  
  // Invites (Therapist only)
  getPendingInvites: () => api.get('/guardian/pending-invites'),
  acceptInvite: (inviteId) => api.post(`/guardian/invites/${inviteId}/accept`),
  rejectInvite: (inviteId) => api.post(`/guardian/invites/${inviteId}/reject`),
  
  // Feedback
  submitFeedback: (feedbackData) => api.post('/guardian/feedback', {
    feedback: feedbackData.text,
    rate: feedbackData.rating
  }),
  getMyFeedback: () => api.get('/guardian/feedback'),
  getFeedbackById: (id) => api.get(`/guardian/feedback/${id}`),
  deleteFeedback: (id) => api.delete(`/guardian/feedback/${id}`),
  updateFeedback: (id, data) => api.put(`/guardian/feedback/${id}`, {
    feedback: data.text,
    rate: data.rating
  }),
  // Profile
  updateProfile: (profileData) => api.put('/guardian/profile', profileData),

};

export default guardianService;