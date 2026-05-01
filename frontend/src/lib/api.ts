const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('pe_token');
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data as T;
}

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    apiFetch<{ token: string; username: string; shopName: string; _id: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => apiFetch<{ _id: string; username: string; shopName: string }>('/api/auth/me'),
};

// Dashboard
export const dashboardApi = {
  stats: () => apiFetch<{
    todayOrders: number;
    processing: number;
    readyForPickup: number;
    completedToday: number;
    todayRevenue: number;
    recentOrders: Order[];
  }>('/api/dashboard/stats'),
};

// Customers
export const customersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ customers: Customer[]; total: number; pages: number }>(`/api/customers${qs}`);
  },
  search: (q: string) => apiFetch<Customer[]>(`/api/customers/search?q=${encodeURIComponent(q)}`),
  get: (id: string) => apiFetch<Customer>(`/api/customers/${id}`),
  create: (data: Partial<Customer>) =>
    apiFetch<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Customer>) =>
    apiFetch<Customer>(`/api/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// Orders
export const ordersApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ orders: Order[]; total: number; pages: number }>(`/api/orders${qs}`);
  },
  get: (id: string) => apiFetch<Order>(`/api/orders/${id}`),
  create: (data: CreateOrderPayload) =>
    apiFetch<Order>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: string, status: string, notes?: string) =>
    apiFetch<Order>(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status, notes }) }),
  billUrl: (id: string) => `${API_BASE}/api/orders/${id}/bill?token=${getToken()}`,
  notify: (id: string) =>
    apiFetch<{ message: string; result?: any }>(`/api/orders/${id}/notify`, { method: 'POST' }),
};

// Settings
export const settingsApi = {
  getPricing: () => apiFetch<Pricing[]>('/api/settings/pricing'),
  updatePricing: (items: Pricing[]) =>
    apiFetch<Pricing[]>('/api/settings/pricing', { method: 'PUT', body: JSON.stringify({ items }) }),
};

// Types
export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface OrderItem {
  _id?: string;
  clothType: string;
  serviceType: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  status: 'Received' | 'Processing' | 'Ready for Pickup' | 'Delivered';
  totalAmount: number;
  billFileUrl: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pricing {
  _id?: string;
  clothType: string;
  serviceType: string;
  price: number;
}

export interface CreateOrderPayload {
  customerId: string;
  items: Omit<OrderItem, '_id' | 'subtotal'>[];
  notes?: string;
}
