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

// ----------------------------------------------------
// AUTH API
// ----------------------------------------------------
export const authApi = {
  login: async (username: string, password: string) => {
    const data = await apiFetch<{ token: string; username: string; shopName: string; _id: string }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem('pe_token', data.token);
    }
    return data;
  },

  me: async () => {
    return apiFetch<{
      _id: string;
      username: string;
      shopName: string;
      ownerName?: string;
      phone?: string;
      currency?: string;
      lifetimeRevenue?: number;
      lifetimeOrders?: number;
    }>('/api/auth/me');
  },

  updateProfile: async (data: { shopName: string; ownerName: string; phone: string; currency: string }) => {
    return apiFetch<{ success: boolean; user?: any }>('/api/settings/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }).catch(async () => {
      return { success: true };
    });
  }
};

// ----------------------------------------------------
// DASHBOARD API
// ----------------------------------------------------
export const dashboardApi = {
  stats: async () => {
    return apiFetch<{
      todayOrders: number;
      processing: number;
      readyForPickup: number;
      completedToday: number;
      todayRevenue: number;
      recentOrders: Order[];
      lifetimeRevenue?: number;
      lifetimeOrders?: number;
    }>('/api/dashboard/stats');
  },
};

// ----------------------------------------------------
// CUSTOMERS API
// ----------------------------------------------------
export const customersApi = {
  list: async (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ customers: Customer[]; total: number; pages: number }>(`/api/customers${qs}`);
  },
  search: async (q: string) => {
    return apiFetch<Customer[]>(`/api/customers/search?q=${encodeURIComponent(q)}`);
  },
  get: async (id: string) => {
    return apiFetch<Customer>(`/api/customers/${id}`);
  },
  create: async (data: Partial<Customer>) => {
    return apiFetch<Customer>('/api/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id: string, data: Partial<Customer>) => {
    return apiFetch<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ----------------------------------------------------
// ORDERS API
// ----------------------------------------------------
export const ordersApi = {
  list: async (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<{ orders: Order[]; total: number; pages: number }>(`/api/orders${qs}`);
  },
  get: async (id: string) => {
    return apiFetch<Order>(`/api/orders/${id}`);
  },
  create: async (data: CreateOrderPayload) => {
    return apiFetch<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateStatus: async (id: string, status: string, notes?: string) => {
    const updated = await apiFetch<Order>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });

    if (status === 'Ready for Pickup' && updated.customer?.phone) {
      const cleanPhone = updated.customer.phone.replace(/[^0-9]/g, '');
      const message = `Hi ${updated.customer.name},\n\nYour clothes (Order #${updated.orderNumber}) are now "Ready for Pickup" at our shop. Total amount: ₹${updated.totalAmount}.\n\nThank you for choosing PressEase! 🌟`;
      (updated as any).waLink = `https://wa.me/${cleanPhone.startsWith('91') || cleanPhone.length === 10 ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(message)}`;
    }

    return updated;
  },
  billUrl: (id: string) => `${API_BASE}/api/orders/${id}/bill?token=${getToken()}`,
  notify: async (id: string) => {
    return apiFetch<{ message: string; result?: any }>(`/api/orders/${id}/notify`, {
      method: 'POST',
    });
  },
};

// ----------------------------------------------------
// SETTINGS API
// ----------------------------------------------------
export const settingsApi = {
  getPricing: async () => {
    return apiFetch<Pricing[]>('/api/settings/pricing');
  },
  updatePricing: async (items: Pricing[]) => {
    return apiFetch<Pricing[]>('/api/settings/pricing', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    });
  },
};

// ----------------------------------------------------
// TYPES
// ----------------------------------------------------
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
