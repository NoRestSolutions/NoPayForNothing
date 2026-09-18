const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_BASE;
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP error ${response.status}`);
    }

    return response.json();
  }

  async getNonce(address?: string) {
    const params = address ? `?address=${encodeURIComponent(address)}` : '';
    return this.request<{ nonce: string }>(`/api/v1/auth/nonce${params}`);
  }

  async signInWithEthereum(message: string, signature: string) {
    return this.request<{ token: string; user: any }>('/api/v1/auth/siwe', {
      method: 'POST',
      body: JSON.stringify({ message, signature }),
    });
  }

  async getMe() {
    return this.request<any>('/api/v1/auth/me');
  }

  async updateRole(role: 'customer' | 'provider') {
    return this.request<any>('/api/v1/auth/role', {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async getProviders(page = 1, perPage = 20, category?: string) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (category) params.set('category', category);
    return this.request<any>(`/api/v1/providers?${params}`);
  }

  async getProvider(id: string) {
    return this.request<any>(`/api/v1/providers/${id}`);
  }

  async createProvider(data: { business_name: string; category: string; description: string }) {
    return this.request<any>('/api/v1/providers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProvider(id: string, data: { business_name: string; category: string; description: string }) {
    return this.request<any>(`/api/v1/providers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getServices(page = 1, perPage = 20, category?: string) {
    const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    if (category) params.set('category', category);
    return this.request<any>(`/api/v1/services?${params}`);
  }

  async getService(id: string) {
    return this.request<any>(`/api/v1/services/${id}`);
  }

  async createService(data: any) {
    return this.request<any>('/api/v1/services', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateService(id: string, data: any) {
    return this.request<any>(`/api/v1/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteService(id: string) {
    return this.request<any>(`/api/v1/services/${id}`, {
      method: 'DELETE',
    });
  }

  async getContracts(role?: string) {
    const params = role ? `?role=${role}` : '';
    return this.request<any[]>(`/api/v1/contracts${params}`);
  }

  async getContract(id: string) {
    return this.request<any>(`/api/v1/contracts/${id}`);
  }

  async createContract(serviceId: string) {
    return this.request<any>('/api/v1/contracts', {
      method: 'POST',
      body: JSON.stringify({ service_id: serviceId }),
    });
  }

  async terminateContract(id: string) {
    return this.request<any>(`/api/v1/contracts/${id}/terminate`, {
      method: 'POST',
    });
  }

  async getClaims(role?: string) {
    const params = role ? `?role=${role}` : '';
    return this.request<any[]>(`/api/v1/claims${params}`);
  }

  async createClaim(contractId: string, data: { amount: number; description: string; evidence_urls: string[] }) {
    return this.request<any>(`/api/v1/claims/${contractId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async approveClaim(id: string) {
    return this.request<any>(`/api/v1/claims/${id}/approve`, {
      method: 'PUT',
    });
  }

  async rejectClaim(id: string) {
    return this.request<any>(`/api/v1/claims/${id}/reject`, {
      method: 'PUT',
    });
  }
}

export const api = new ApiClient();
