const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

const TOKEN_KEY = "dezenmart_logistics_token";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Prevent SSR fetches — all API calls must happen client-side
  if (typeof window === "undefined") {
    throw new Error("API calls must be made client-side");
  }

  const token = getToken();

  if (!token) {
    throw new Error("Not authenticated — please sign in");
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) {
    console.error(
      `API Error [${options.method ?? "GET"} ${path}]:`,
      JSON.stringify(data, null, 2),
    );
    throw new Error(
      data?.message ?? data?.error ?? `Request failed: ${res.status}`,
    );
  }
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface DezenmartProduct {
  _id: string;
  name: string;
  price: number;
  images: string[];
  category?: string;
}

export interface DezenmartUser {
  _id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  profileImage?: string;
  rating?: number;
}

// Overall order lifecycle status
export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "disputed"
  | "refunded"
  | "shipped"
  | "delivered"
  | "delivery_confirmed";

// Logistics-specific status — what the PROVIDER sees/acts on
export type LogisticsStatus =
  | "pending" // assigned to provider, awaiting acceptance
  | "accepted" // provider accepted
  | "rejected" // provider rejected
  | "shipped" // provider marked as shipped
  | "delivered"; // delivered

// Delivery tracking status
export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "cancelled"
  | "failed";

export interface DeliveryAddress {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  lga: string;
  street: string;
  zipCode?: string;
  isDefault: boolean;
  user: string;
}

export interface Order {
  _id: string;
  orderId?: string;
  product: DezenmartProduct | string | null;
  buyer: DezenmartUser | string;
  seller: DezenmartUser | string;
  amount: number;
  quantity?: number;
  status: OrderStatus;
  logisticsStatus?: LogisticsStatus;
  deliveryAddress?: DeliveryAddress | string;
  deliveryFee?: number;
  expectedDeliveryDate?: string;
  shippedAt?: string;
  shippingNotes?: string;
  trackingNumber?: string;
  sellerWalletAddress?: string;
  logisticsProviderWalletAddress?: string;
  logisticsProvider?:
    | { _id: string; name: string; walletAddress?: string }
    | string;
  dispute?: { raisedBy: string; reason: string; resolved: boolean };
  purchaseId?: string;
  stock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrders {
  status: string;
  results: number;
  data: { orders: Order[] };
}

export interface Delivery {
  _id: string;
  order: Order | string;
  deliveryAddress?: string;
  logisticsProvider?: string;
  status: DeliveryStatus;
  trackingNumber?: string;
  notes?: string;
  weight?: number;
  deliveryFee?: number;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Orders API ───────────────────────────────────────────────────────────────
export const ordersApi = {
  // ✅ Get ALL orders (admin view — 84 orders)
  getAllOrders: () => request<PaginatedOrders>("/orders"),

  // ✅ Get orders assigned to the logged-in logistics provider specifically
  getMyOrders: (params?: {
    logisticsStatus?: LogisticsStatus;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.logisticsStatus)
      qs.set("logisticsStatus", params.logisticsStatus);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<PaginatedOrders>(`/orders/logistics/me?${qs}`);
  },

  getById: (id: string) => request<Order>(`/orders/${id}`),

  // ✅ Accept a pending order
  accept: (orderId: string) =>
    request<Order>(`/orders/logistics/me/${orderId}/accept`, {
      method: "PATCH",
    }),

  // ✅ Reject a pending order
  reject: (orderId: string, reason?: string) =>
    request<Order>(`/orders/logistics/me/${orderId}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason: reason ?? "" }),
    }),

  // ✅ Mark accepted order as shipped
  ship: (
    orderId: string,
    params?: {
      trackingNumber?: string;
      expectedDeliveryDate?: string;
      notes?: string;
    },
  ) =>
    request<Order>(`/orders/logistics/me/${orderId}/ship`, {
      method: "PATCH",
      body: JSON.stringify(params ?? {}),
    }),

  // ✅ Mark order as delivered — PUT /orders/:id { status: "delivered" }
  deliver: (orderId: string) =>
    request<{ status: string; data: { order: Partial<Order> } }>(
      `/orders/${orderId}`,
      { method: "PUT", body: JSON.stringify({ status: "delivered" }) },
    ),

  // General update (fallback)
  update: (id: string, body: object) =>
    request<Order>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  raiseDispute: (id: string, reason: string) =>
    request<Order>(`/orders/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
};

// ─── Deliveries API ───────────────────────────────────────────────────────────
export const deliveriesApi = {
  list: (params?: {
    page?: number;
    limit?: number;
    status?: DeliveryStatus;
  }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    if (params?.status) qs.set("status", params.status);
    return request<{ data: Delivery[]; total: number }>(`/deliveries?${qs}`);
  },

  getById: (id: string) => request<Delivery>(`/deliveries/${id}`),

  create: (body: {
    order: string;
    deliveryAddress?: string;
    logisticsProvider?: string;
    weight?: number;
    deliveryFee?: number;
    notes?: string;
    estimatedDeliveryDate?: string;
  }) =>
    request<Delivery>("/deliveries", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (
    id: string,
    body: {
      status?: DeliveryStatus;
      trackingNumber?: string;
      notes?: string;
      weight?: number;
      deliveryFee?: number;
      estimatedDeliveryDate?: string;
    },
  ) =>
    request<Delivery>(`/deliveries/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  cancel: (id: string) =>
    request<void>(`/deliveries/${id}`, { method: "DELETE" }),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => request<unknown[]>("/notifications"),
  getUnreadCount: () =>
    request<{ count: number }>("/notifications/unread-count"),
  markRead: (notificationIds: string[]) =>
    request<{ success: boolean }>("/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify({ notificationIds }),
    }),
};
