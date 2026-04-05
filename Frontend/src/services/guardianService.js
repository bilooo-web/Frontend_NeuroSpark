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
  // Fetch voice attempts for a child
  getChildVoiceAttempts: async (childId) => {
    const res = await api.get(`/guardian/children/${childId}/voice-attempts`);
    return res;
  },

  // Add note to voice attempt
  addVoiceNote: async (attemptId, note) => {
    const res = await api.post(`/guardian/voice-attempts/${attemptId}/note`, { guardian_note: note });
    return res;
  },

  // Invite therapist
  inviteTherapist: async (childId, therapistId) => {
    const res = await api.post('/guardian/invite-therapist', { child_id: childId, therapist_id: therapistId });
    return res;
  },

  // Get list of therapists
  getTherapists: async () => {
    const res = await api.get('/guardian/therapists');
    return res.therapists;
  },
  // Global anomalies - with fallback
  getAllAnomalies: async () => {
    try {
      const response = await api.get('/guardian/anomalies');
      return response;
    } catch (error) {
      console.warn('Global anomalies endpoint not available, using per-child fallback');
      // Fallback: get all children and their anomalies
      // api.js unwraps body, so response IS { children: [...] } or { success, data: { children: [...] } }
      const childrenRes = await guardianService.getChildren();
      const children = childrenRes.children || childrenRes.data?.children || [];

      const anomaliesPromises = children.map(child =>
        guardianService.getChildAnomalies(child.id)
          .then(res => {
            // api.js unwraps body, so res might be { anomalies: [...] } or { data: [...] }
            const childAnomalies = Array.isArray(res) ? res : (res.data || res.anomalies || []);
            return childAnomalies.map(a => ({
              ...a,
              child_id: child.id,
              child_name: child.user?.full_name || child.name
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