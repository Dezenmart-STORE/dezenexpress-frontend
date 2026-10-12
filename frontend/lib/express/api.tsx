// ─── DezenExpress API Client ──────────────────────────────────────────────────
// Base URL from env — same backend as logistics dashboard

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

// Rider JWT stored separately from logistics token
const RIDER_TOKEN_KEY = "dezenexpress_rider_token";

function getRiderToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(RIDER_TOKEN_KEY);
}

export function saveRiderToken(token: string) {
  if (typeof window !== "undefined")
    localStorage.setItem(RIDER_TOKEN_KEY, token);
}

export function clearRiderToken() {
  if (typeof window !== "undefined") localStorage.removeItem(RIDER_TOKEN_KEY);
}

async function req<T>(
  path: string,
  options: RequestInit = {},
  auth: "rider" | "none" = "none",
): Promise<T> {
  if (typeof window === "undefined") throw new Error("Client-side only");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (auth === "rider") {
    const token = getRiderToken();
    if (!token) throw new Error("Rider not authenticated");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message ?? `Request failed: ${res.status}`);
  return data as T;
}

/**
 * Same as req(), but for multipart/form-data bodies (e.g. profile updates
 * with an optional image file). Do NOT set Content-Type manually — the
 * browser needs to set it itself so it can include the multipart boundary.
 */
async function reqForm<T>(
  path: string,
  options: { method: string; body: FormData },
  auth: "rider" | "none" = "none",
): Promise<T> {
  if (typeof window === "undefined") throw new Error("Client-side only");

  const headers: Record<string, string> = {};

  if (auth === "rider") {
    const token = getRiderToken();
    if (!token) throw new Error("Rider not authenticated");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method: options.method,
    body: options.body,
    headers,
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message ?? `Request failed: ${res.status}`);
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BookingResponse {
  status: string;
  data?: {
    bookingRef?: string;
    checkoutUrl?: string;
    [key: string]: any;
  };
}

// Confirmed fields from live GET /express/riders/{riderId} (public profile):
// id, name, vehicleType, vehiclePlateNumber, rating, totalTrips, availabilityStatus
// phone is unconfirmed on this endpoint — treat as optional.
export interface AvailableRider {
  id: string;
  name: string;
  phone?: string;
  vehicleType: string;
  vehiclePlateNumber?: string;
  rating?: number;
  totalTrips?: number;
  availabilityStatus?: "online" | "offline";
}

// GET /express/rider/profile — confirmed real shape, fields directly under
// `data` (no `rider` wrapper):
// { id, name, email, phone, vehicleType, vehiclePlateNumber,
//   driverLicenseNumber, bankName, bankAccountNumber, bankAccountName,
//   verificationStatus, availabilityStatus, rating, totalTrips, totalEarnings }
// profileImage wasn't present on the confirmed response (this rider may not
// have uploaded one) — kept optional since the PUT endpoint accepts it.
export interface RiderFullProfile {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  driverLicenseNumber?: string;
  profileImage?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  availabilityStatus?: "online" | "offline";
  verificationStatus?: "pending" | "verified" | "rejected";
  createdAt?: string;
}

export interface RiderWallet {
  pending: number;
  available: number;
  total: number;
}

export interface RiderTransaction {
  _id: string;
  type: "credit" | "debit";
  amount: number;
  status: "pending" | "settled" | "withdrawn";
  description: string;
  createdAt: string;
}

// ─── Customer Booking APIs ────────────────────────────────────────────────────

export const expressBookingApi = {
  /** POST /express/rides/book */
  bookRide: (body: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    pickupAddress: {
      label?: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    dropoffAddress: {
      label?: string;
      address: string;
      lat?: number;
      lng?: number;
    };
    rideType?: string;
    passengerCount?: number;
    distanceKm?: number;
    fareAmount: number;
    currency?: string;
    notes?: string;
  }) =>
    req<BookingResponse>("/express/rides/book", {
      method: "POST",
      body: JSON.stringify({
        currency: "NGN",
        rideType: "standard",
        passengerCount: 1,
        ...body,
      }),
    }),

  /** POST /express/deliveries/book */
  bookDelivery: (body: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    pickupAddress: { address: string; lat?: number; lng?: number };
    dropoffAddress: { address: string; lat?: number; lng?: number };
    package: {
      description: string;
      sizeCategory: "small" | "medium" | "large" | "bulky";
      weightKg?: number;
      value?: number;
    };
    recipientName: string;
    recipientPhone: string;
    distanceKm?: number;
    fareAmount: number;
    currency?: string;
    notes?: string;
  }) =>
    req<BookingResponse>("/express/deliveries/book", {
      method: "POST",
      body: JSON.stringify({ currency: "NGN", ...body }),
    }),

  /** GET /express/orders?email=&phone= */
  lookupOrders: (params: {
    email?: string;
    phone?: string;
    page?: number;
    limit?: number;
  }) => {
    const q = new URLSearchParams();
    if (params.email) q.set("email", params.email);
    if (params.phone) q.set("phone", params.phone);
    if (params.page) q.set("page", String(params.page));
    if (params.limit) q.set("limit", String(params.limit));
    // Confirmed real response: { status, data: { bookings: [...], total, page,
    // limit } } — the list key is `bookings`, not `orders`. Each booking has
    // id (not _id), bookingRef, type, status, paymentStatus, pickupAddress,
    // dropoffAddress, fareAmount, currency, createdAt, updatedAt.
    return req<{
      status: string;
      data: {
        bookings?: any[];
        orders?: any[]; // legacy name, kept as a fallback
        total?: number;
        page?: number;
        limit?: number;
      };
    }>(`/express/orders?${q}`);
  },

  /** GET /express/orders/:bookingRef
   *  Confirmed real response: { status, data: { id, bookingRef, type, status,
   *  customerName, customerEmail, customerPhone, pickupAddress, dropoffAddress,
   *  rideType, passengerCount, fareAmount, currency, paymentStatus, createdAt,
   *  updatedAt } } — the order is directly under `data`, NOT `data.order`. */
  getOrder: (bookingRef: string) =>
    req<{ status: string; data: any }>(`/express/orders/${bookingRef}`),

  /** GET /express/orders/:bookingRef/status */
  getOrderStatus: (bookingRef: string) =>
    req<{ status: string; data: { status: string; [key: string]: any } }>(
      `/express/orders/${bookingRef}/status`,
    ),

  /** PATCH /express/orders/:bookingRef/cancel */
  cancelOrder: (bookingRef: string, reason: string) =>
    req<{ status: string }>(`/express/orders/${bookingRef}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),
};

// ─── Payment APIs ─────────────────────────────────────────────────────────────

export const expressPaymentApi = {
  /** POST /express/payments/initiate — just needs bookingRef */
  initiate: (bookingRef: string) =>
    req<{ status: string; data: { checkoutUrl: string; reference: string } }>(
      "/express/payments/initiate",
      { method: "POST", body: JSON.stringify({ bookingRef }) },
    ),

  /** GET /express/payments/:reference/verify */
  verify: (reference: string) =>
    req<{ status: string; data: { status: string; amount: number } }>(
      `/express/payments/${reference}/verify`,
    ),
};

// ─── Available Riders API ─────────────────────────────────────────────────────

export const expressRiderPublicApi = {
  /** GET /express/riders/available */
  getAvailable: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return req<{
      status: string;
      data: {
        riders: AvailableRider[];
        total: number;
        page: number;
        limit: number;
      };
    }>(`/express/riders/available?${q}`);
  },

  /** GET /express/riders/:riderId */
  getProfile: (riderId: string) =>
    req<{ status: string; data: AvailableRider }>(`/express/riders/${riderId}`),
};

// ─── Rider Auth APIs ──────────────────────────────────────────────────────────

export const riderAuthApi = {
  /** POST /express/rider/register */
  register: (body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    vehicleType: string;
    vehiclePlateNumber: string;
    driverLicenseNumber: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
  }) =>
    req<{ status: string }>("/express/rider/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  /** POST /express/rider/auth/login */
  login: (email: string, password: string) =>
    req<{ status: string }>("/express/rider/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  /** POST /express/rider/auth/verify-otp → returns JWT */
  verifyOtp: (email: string, code: string) =>
    req<{ status: string; data: { token: string; rider: any } }>(
      "/express/rider/auth/verify-otp",
      { method: "POST", body: JSON.stringify({ email, code }) },
    ),
};

// ─── Rider Dashboard APIs (all need rider JWT) ────────────────────────────────

export const riderApi = {
  /** GET /express/rider/requests */
  getRequests: (page = 1, limit = 10) =>
    req<{ status: string; data: { requests: any[] } }>(
      `/express/rider/requests?page=${page}&limit=${limit}`,
      {},
      "rider",
    ),

  /** PATCH /express/rider/requests/:id/accept */
  acceptRequest: (id: string) =>
    req<{ status: string }>(
      `/express/rider/requests/${id}/accept`,
      { method: "PATCH" },
      "rider",
    ),

  /** PATCH /express/rider/requests/:id/reject */
  rejectRequest: (id: string) =>
    req<{ status: string }>(
      `/express/rider/requests/${id}/reject`,
      { method: "PATCH" },
      "rider",
    ),

  /** PATCH /express/rider/bookings/:id/status {status:"in_progress"} */
  updateStatus: (id: string, status: "in_progress") =>
    req<{ status: string }>(
      `/express/rider/bookings/${id}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
      "rider",
    ),

  /** PATCH /express/rider/bookings/:id/verify-otp → completes booking */
  verifyOtp: (id: string, code: string) =>
    req<{ status: string }>(
      `/express/rider/bookings/${id}/verify-otp`,
      { method: "PATCH", body: JSON.stringify({ code }) },
      "rider",
    ),

  /** GET /express/rider/profile — confirmed real: full profile with
   *  contact, vehicle, and bank details. Confirmed response shape:
   *  { status, data: { id, name, email, phone, vehicleType,
   *  vehiclePlateNumber, driverLicenseNumber, bankName, bankAccountNumber,
   *  bankAccountName, verificationStatus, availabilityStatus, rating,
   *  totalTrips, totalEarnings } } — fields sit directly under `data`,
   *  with NO extra `rider` wrapper. */
  getProfile: () =>
    req<{ status: string; data: RiderFullProfile }>(
      "/express/rider/profile",
      {},
      "rider",
    ),

  /** PUT /express/rider/profile — confirmed real, multipart/form-data.
   *  Only send fields that are actually changing — the backend returns 400
   *  "No profile fields provided" if the form is empty. profileImage, when
   *  provided, must be a File (from an <input type="file">). */
  updateProfile: (body: {
    name?: string;
    phone?: string;
    vehicleType?: string;
    vehiclePlateNumber?: string;
    driverLicenseNumber?: string;
    profileImage?: File;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  }) => {
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        form.append(key, value as string | Blob);
      }
    });
    return reqForm<{ status: string }>(
      "/express/rider/profile",
      { method: "PUT", body: form },
      "rider",
    );
  },

  /** PATCH /express/rider/availability — confirmed real. Can fail with
   *  403 (rider not verified) or 409 (an active booking is in progress). */
  setAvailability: (availabilityStatus: "online" | "offline") =>
    req<{ status: string }>(
      "/express/rider/availability",
      { method: "PATCH", body: JSON.stringify({ availabilityStatus }) },
      "rider",
    ),

  /** GET /express/rider/wallet */
  getWallet: () =>
    req<{ status: string; data: RiderWallet }>(
      "/express/rider/wallet",
      {},
      "rider",
    ),

  /** GET /express/rider/transactions */
  getTransactions: (page = 1, limit = 20) =>
    req<{ status: string; data: { transactions: RiderTransaction[] } }>(
      `/express/rider/transactions?page=${page}&limit=${limit}`,
      {},
      "rider",
    ),

  /** POST /express/rider/withdraw */
  withdraw: (amount: number) =>
    req<{ status: string }>(
      "/express/rider/withdraw",
      { method: "POST", body: JSON.stringify({ amount }) },
      "rider",
    ),
};

// ─── Admin Rider APIs ─────────────────────────────────────────────────────────
// These use the logistics provider token (dezenmart_logistics_token)
// since only verified providers/admins can approve riders

function getLogisticsToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dezenmart_logistics_token");
}

async function adminReq<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (typeof window === "undefined") throw new Error("Client-side only");
  const token = getLogisticsToken();
  if (!token) throw new Error("Authentication token required");
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message ?? `Request failed: ${res.status}`);
  return data as T;
}

export const adminRiderApi = {
  /** GET /express/rider/pending — list riders awaiting verification (admin only) */
  getPending: (page = 1, limit = 10) =>
    adminReq<{ status: string; data: { riders: any[]; total: number } }>(
      `/express/rider/pending?page=${page}&limit=${limit}`,
    ),

  /** PATCH /express/rider/:riderId/verify — approve or reject a rider (admin only) */
  verifyRider: (riderId: string, status: "verified" | "rejected") =>
    adminReq<{ status: string }>(`/express/rider/${riderId}/verify`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
