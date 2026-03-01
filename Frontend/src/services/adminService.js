import api from './api';
const adminService = {
  // ==================== DASHBOARD ====================
  getDashboard() {
    return api.get('/admin/dashboard');
  },
  // ==================== USERS ====================
  getUsers(params = {}) {
    return api.get('/admin/users', params);
  },
  getUser(id) {
    return api.get(`/admin/users/${id}`);
  },
  createUser(data) {
    return api.post('/admin/users', data);
  },
  updateUser(id, data) {
    return api.put(`/admin/users/${id}`, data);
  },
  deleteUser(id) {
    return api.delete(`/admin/users/${id}`);
  },
  activateUser(id) {
    return api.post(`/admin/users/${id}/activate`);
  },
  suspendUser(id) {
    return api.post(`/admin/users/${id}/suspend`);
  },
  // ==================== GAMES ====================
  getGames(params = {}) {
    return api.get('/admin/games', params);
  },
  createGame(data) {
    return api.post('/admin/games', data);
  },
  updateGame(id, data) {
    return api.put(`/admin/games/${id}`, data);
  },
  deleteGame(id) {
    return api.delete(`/admin/games/${id}`);
  },
  // ==================== VOICE INSTRUCTIONS ====================
  getVoiceInstructions(params = {}) {
    return api.get('/admin/voice-instructions', params);
  },
  createVoiceInstruction(data) {
    return api.post('/admin/voice-instructions', data);
  },
  updateVoiceInstruction(id, data) {
    return api.put(`/admin/voice-instructions/${id}`, data);
  },
  deleteVoiceInstruction(id) {
    return api.delete(`/admin/voice-instructions/${id}`);
  },
  // ==================== CHILDREN ====================
  getChildren(params = {}) {
    return api.get('/admin/children', params);
  },
  getChild(id) {
    return api.get(`/admin/children/${id}`);
  },
  updateChild(id, data) {
    return api.put(`/admin/children/${id}`, data);
  },
  deleteChild(id) {
    return api.delete(`/admin/children/${id}`);
  },
  getChildGameSessions(childId) {
    return api.get(`/admin/children/${childId}/game-sessions`);
  },
  getChildVoiceAttempts(childId) {
    return api.get(`/admin/children/${childId}/voice-attempts`);
  },
  linkGuardianToChild(childId, data) {
    return api.post(`/admin/children/${childId}/link-guardian`, data);
  },
  unlinkGuardianFromChild(childId, guardianId) {
    return api.delete(`/admin/children/${childId}/unlink-guardian/${guardianId}`);
  },
  // ==================== GUARDIANS ====================
  getGuardians(params = {}) {
    return api.get('/admin/guardians', params);
  },
  getGuardian(id) {
    return api.get(`/admin/guardians/${id}`);
  },
  updateGuardian(id, data) {
    return api.put(`/admin/guardians/${id}`, data);
  },
  deleteGuardian(id) {
    return api.delete(`/admin/guardians/${id}`);
  },
  getGuardianChildren(guardianId) {
    return api.get(`/admin/guardians/${guardianId}/children`);
  },
  // ==================== SYSTEM ====================
  getSystemMetrics() {
    return api.get('/admin/system-metrics');
  },
  getSecurityLogs() {
    return api.get('/admin/security-logs');
  },
  // ==================== INVITATIONS ====================
  getInvitations(params = {}) {
    return api.get('/admin/invitations', params);
  },
  resendInvitation(id) {
    return api.post(`/admin/invitations/${id}/resend`);
  },
  // ==================== NOTIFICATIONS ====================
  // Send notification to a specific user
  sendNotification(userId, data) {
    return api.post(`/admin/notifications/send/${userId}`, data);
  },
  // Broadcast notification to a group of users
  broadcastNotification(data) {
    return api.post('/admin/notifications/broadcast', data);
  },
  // Get all sent notifications
  getNotifications(params = {}) {
    return api.get('/admin/notifications', params);
  },
};
export default adminService;