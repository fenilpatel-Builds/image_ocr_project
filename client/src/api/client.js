const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('ocr_auth_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('ocr_auth_token', token);
    } else {
      localStorage.removeItem('ocr_auth_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('ocr_auth_token');
  }

  async request(endpoint, options = {}) {
    const headers = options.headers || {};
    const token = this.getToken();

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    if (response.status === 401) {
      this.setToken(null);
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      const errorMsg = data?.error || (typeof data === 'string' ? data : 'API Request Failed');
      throw new Error(errorMsg);
    }

    return data;
  }

  // Auth Endpoints
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async register(name, email, password) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    this.setToken(data.token);
    return data;
  }

  async demoLogin(role) {
    const data = await this.request(`/auth/demo/${role}`, {
      method: 'POST'
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return await this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Document Endpoints
  async uploadDocument(file, documentType = 'general') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);

    return await this.request('/documents/upload', {
      method: 'POST',
      body: formData
    });
  }

  async listDocuments({ status, search } = {}) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    return await this.request(`/documents?${params.toString()}`);
  }

  async getDocument(id) {
    return await this.request(`/documents/${id}`);
  }

  async updateStatus(id, { status, documentType, note }) {
    return await this.request(`/documents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, documentType, note })
    });
  }

  async saveOCR(id, { rawText, ocrEngine, ocrLanguage, processingTimeMs, confidenceAvg, wordCount }) {
    return await this.request(`/documents/${id}/ocr`, {
      method: 'POST',
      body: JSON.stringify({ rawText, ocrEngine, ocrLanguage, processingTimeMs, confidenceAvg, wordCount })
    });
  }

  async saveFields(id, { fields, documentType, isUserEdited }) {
    return await this.request(`/documents/${id}/fields`, {
      method: 'POST',
      body: JSON.stringify({ fields, documentType, isUserEdited })
    });
  }

  async verifyDocument(id, { fields, documentType }) {
    return await this.request(`/documents/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ fields, documentType })
    });
  }

  async deleteDocument(id) {
    return await this.request(`/documents/${id}`, {
      method: 'DELETE'
    });
  }

  // Audit & Analytics
  async getAuditStats() {
    return await this.request('/audit/stats');
  }

  async getAuditLogs(limit = 100) {
    return await this.request(`/audit/logs?limit=${limit}`);
  }
}

export const api = new ApiClient();
