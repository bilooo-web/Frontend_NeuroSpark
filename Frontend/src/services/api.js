// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }
  getToken() {
    return localStorage.getItem('token');
  }
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }
  async request(method, endpoint, data = null, params = null) {
    let url = `${this.baseURL}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.append(key, value);
        }
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }
    const options = {
      method,
      headers: this.getHeaders(),
    };
    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      options.body = JSON.stringify(data);
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      throw new Error('Unauthorized');
    }
    const json = await response.json();
    if (!response.ok) {
      const error = new Error(json.message || json.error || 'Request failed');
      error.status = response.status;
      error.data = json;
      throw error;
    }
    return json;
  }
  get(endpoint, params) {
    return this.request('GET', endpoint, null, params);
  }
  post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }
  put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }
  delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
  patch(endpoint, data) {
    return this.request('PATCH', endpoint, data);
  }

  async getChats() {
    return this.get('/chatbot/chats');
  }

  async createChat(data = {}) {
    return this.post('/chatbot/chats', data);
  }

  async getChatMessages(chatId) {
    return this.get(`/chatbot/chats/${chatId}`);
  }

  async updateChat(chatId, data) {
    return this.put(`/chatbot/chats/${chatId}`, data);
  }

  async deleteChat(chatId) {
    return this.delete(`/chatbot/chats/${chatId}`);
  }

  async sendChatMessage(data) {
    // Handle file upload with FormData
    if (data instanceof FormData) {
      const token = this.getToken();
      const url = `${this.baseURL}/chatbot/message`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: data
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      return response.json();
    }
    
    return this.post('/chatbot/message', data);
  }

}
const api = new ApiClient();

export default api;