import api from './api';

const guardianService = {
  // ── Core ────────────────────────────────────────────────────────────────
  getDashboardOverview: () => api.get('/guardian/dashboard'),
  getChildren:          () => api.get('/guardian/children'),
  getChildProgress:  (childId) => api.get(`/guardian/children/${childId}/progress`),
  linkChild:         (data)    => api.post('/guardian/children/link', data),
  unlinkChild:       (childId) => api.delete(`/guardian/children/${childId}/unlink`),

  // ── Insights / anomalies ────────────────────────────────────────────────
  getChildInsights:  (childId) => api.get(`/guardian/children/${childId}/insights`),
  getChildAnomalies: (childId) => api.get(`/guardian/children/${childId}/anomalies`),

  // ── Voice ───────────────────────────────────────────────────────────────
  getChildVoiceAttempts: (childId) => api.get(`/guardian/children/${childId}/voice-attempts`),
  addVoiceNote: (attemptId, note) =>
    api.post(`/guardian/voice-attempts/${attemptId}/note`, { guardian_note: note }),

  // ── Therapist helpers ───────────────────────────────────────────────────
  /**
   * Invite a therapist to become a child's therapist.
   * Sends POST /guardian/invite-therapist { child_id, therapist_id }
   * The resulting invite will appear in the therapist's PendingInvites page.
   */
  inviteTherapist: (childId, therapistId) =>
    api.post('/guardian/invite-therapist', { child_id: childId, therapist_id: therapistId }),

  /**
   * Get all therapists for the directory page.
   * Returns a normalised array regardless of API shape.
   * Backend should return therapist profiles with:
   *   id, user { full_name }, bio, specialties[], years_experience,
   *   rating, rating_count, patients_count, sessions_count
   */
  getTherapists: async () => {
    const res = await api.get('/guardian/therapists');
    // Normalise: API may return { therapists: [] }, { data: [] }, or []
    if (Array.isArray(res))                return res;
    if (Array.isArray(res.therapists))     return res.therapists;
    if (Array.isArray(res.data))           return res.data;
    if (Array.isArray(res.data?.therapists)) return res.data.therapists;
    return [];
  },

  // ── Anomalies (robust — never crashes the dashboard) ────────────────────
  getAllAnomalies: async () => {
    // 1. Try the fast global endpoint first
    try {
      const response = await api.get('/guardian/anomalies');
      const list =
        Array.isArray(response)            ? response :
        Array.isArray(response.data)       ? response.data :
        Array.isArray(response.anomalies)  ? response.anomalies :
        [];
      return { data: list };
    } catch (globalErr) {
      console.warn('Global anomalies endpoint failed (500), using per-child fallback');
    }

    // 2. Fall back to per-child fetch
    try {
      const childrenRes = await guardianService.getChildren();
      const children =
        childrenRes.children      ||
        childrenRes.data?.children ||
        (Array.isArray(childrenRes) ? childrenRes : []);

      if (!children.length) return { data: [] };

      const anomaliesArrays = await Promise.all(
        children.map(child =>
          guardianService.getChildAnomalies(child.id)
            .then(res => {
              const list =
                Array.isArray(res)           ? res :
                Array.isArray(res.data)      ? res.data :
                Array.isArray(res.anomalies) ? res.anomalies :
                [];
              return list.map(a => ({
                ...a,
                child_id:   child.id,
                child_name: child.user?.full_name || child.name || `Child ${child.id}`,
              }));
            })
            .catch(() => [])
        )
      );

      return { data: anomaliesArrays.flat() };
    } catch (fallbackErr) {
      console.warn('Anomaly fallback also failed:', fallbackErr);
      return { data: [] };
    }
  },

  // ── Invites ─────────────────────────────────────────────────────────────
  /** Used by THERAPIST: get invites sent by parents waiting for response */
  getPendingInvites: () => api.get('/guardian/pending-invites'),
  /** Therapist accepts a parent's invite */
  acceptInvite: (inviteId) => api.post(`/guardian/invites/${inviteId}/accept`),
  /** Therapist rejects a parent's invite */
  rejectInvite: (inviteId) => api.post(`/guardian/invites/${inviteId}/reject`),

  // ── Feedback ────────────────────────────────────────────────────────────
  submitFeedback: (feedbackData) =>
    api.post('/guardian/feedback', { feedback: feedbackData.text, rate: feedbackData.rating }),
  getMyFeedback:      ()     => api.get('/guardian/feedback'),
  getFeedbackById:    (id)   => api.get(`/guardian/feedback/${id}`),
  deleteFeedback:          (id)  => api.delete(`/guardian/feedback/${id}`),
  softDeleteFeedback:      (id)  => api.patch(`/guardian/feedback/${id}/soft-delete`),
  bulkSoftDeleteFeedback:  (ids) => api.post('/guardian/feedback/bulk-soft-delete', { ids }),
  updateFeedback:     (id, data) =>
    api.put(`/guardian/feedback/${id}`, { feedback: data.text, rate: Math.round(Number(data.rating)) }),

  // ── Profile ─────────────────────────────────────────────────────────────
  updateProfile: (profileData) => api.put('/guardian/profile', profileData),
};

export default guardianService;