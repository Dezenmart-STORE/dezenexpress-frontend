// ─── DezenExpress API client ──────────────────────────────────────────────────
// Matches DEZENEXPRESS_FRONTEND_GUIDE.md (16 Oct 2026).
//   Customers: Google sign-in → `Authorization: Bearer <customer token>`
//   Riders:    email + password + emailed code → rider token
//   Admin:     the existing logistics/admin token (falls back to customer token)
// Success envelope: { status: "success", data }. Failure: { status, message, errors? }.
// Amounts are naira (3500 = ₦3,500).

import {
  getCustomerToken,
  clearCustomerToken,
  AUTH_EXPIRED_EVENT,
} from "./customerAuth";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

// ─── Rider token (stored separately from customer + logistics tokens) ─────────
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

// ─── Errors ───────────────────────────────────────────────────────────────────
export class ApiError extends Error {
  status: number;
  errors?: { field: string; message: string }[];
  constructor(
    message: string,
    status: number,
    errors?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function messageFrom(data: any, status: number): string {
  const base: string = data?.message ?? `Request failed (${status})`;
  const errs: { field: string; message: string }[] | undefined = data?.errors;
  if (Array.isArray(errs) && errs.length) {
    const detail = errs
      .map(
        (e) =>
          `${String(e.field ?? "").replace(/^body\./, "")}: ${String(
            e.message ?? "",
          ).replace(/\\?"/g, "")}`,
      )
      .join("; ");
    return `${base} — ${detail}`;
  }
  return base;
}

type Auth = "customer" | "rider" | "none";

async function request<T>(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    form?: FormData;
    auth?: Auth;
  } = {},
): Promise<T> {
  if (typeof window === "undefined") throw new Error("Client-side only");
  const { method = "GET", body, form, auth = "none" } = init;

  const headers: Record<string, string> = {};
  if (!form && body !== undefined) headers["Content-Type"] = "application/json";

  if (auth === "customer") {
    const token = getCustomerToken();
    if (!token) {
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
      throw new ApiError("Please sign in to continue", 401);
    }
    headers["Authorization"] = `Bearer ${token}`;
  } else if (auth === "rider") {
    const token = getRiderToken();
    if (!token) throw new ApiError("Rider not authenticated", 401);
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
    cache: "no-store",
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // empty / non-JSON body
  }

  if (!res.ok) {
    if (res.status === 401 && auth === "customer") {
      clearCustomerToken();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    throw new ApiError(messageFrom(data, res.status), res.status, data?.errors);
  }
  return data as T;
}

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface Address {
  label?: string;
  address: string;
  lat?: number;
  lng?: number;
}

/** pending | rider_accepted (rides: rider confirmed, customer can pay) | accepted | arrived_at_pickup
 *  | in_progress | arrived_at_dropoff | completed | cancelled */
export type BookingStatus = string;
/** unpaid | pending | paid */
export type PaymentStatus = string;

export interface AssignedRider {
  id: string;
  name: string;
  phone?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  rating?: number;
}

export interface Booking {
  id: string;
  bookingRef: string;
  type: "ride" | "delivery";
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  pickupAddress: Address;
  dropoffAddress: Address;
  distanceKm?: number;
  fareAmount: number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  package?: {
    description: string;
    sizeCategory?: string;
    weightKg?: number;
    value?: number;
  };
  recipientName?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  notes?: string;
  rideType?: string;
  passengerCount?: number;
  assignedRider?: AssignedRider;
  riderAcceptedAt?: string;
  arrivedAtPickupAt?: string;
  startedAt?: string;
  arrivedAtDropoffAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  refund?: { status: "pending" | "completed"; amount: number };
  /** Set when status is cancelled: "rider" (declined a ride), "customer" or the system. */
  cancelledBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStatusSnapshot {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  refundStatus?: string;
  assignedRider?: AssignedRider;
  [key: string]: any;
}

export interface CustomerProfile {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

/** The profile wrapper isn't documented — accept data.user, data, or the root. */
export function normalizeProfile(res: any): CustomerProfile {
  const u = res?.data?.user ?? res?.data ?? res?.user ?? res ?? {};
  return {
    name: u.name ?? u.fullName,
    email: u.email,
    phoneNumber: u.phoneNumber ?? u.phone,
  };
}

/** Booking responses sit directly under `data` (older docs said data.order). */
export function normalizeBooking(res: any): Booking {
  return (res?.data?.booking ??
    res?.data?.order ??
    res?.data ??
    res) as Booking;
}

// ─── Customer: account ────────────────────────────────────────────────────────

export const customerApi = {
  /** GET /users/profile */
  getProfile: () => request<any>("/users/profile", { auth: "customer" }),

  /** PUT /users/profile — e.g. save a phone number once on the account */
  updateProfile: (body: { phoneNumber?: string; name?: string }) =>
    request<any>("/users/profile", { method: "PUT", body, auth: "customer" }),
};

// ─── Customer: bookings ───────────────────────────────────────────────────────

export interface RideBookingInput {
  /** The rider the customer picked (id from GET /express/riders/available). Required. */
  requestedRiderId: string;
  customerPhone?: string;
  customerName?: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  distanceKm?: number;
  fareAmount: number;
  rideType?: "standard" | "premium";
  passengerCount?: number;
  notes?: string;
}

export interface DeliveryBookingInput {
  customerPhone?: string;
  customerName?: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  distanceKm?: number;
  fareAmount: number;
  package: {
    description: string;
    sizeCategory: "small" | "medium" | "large";
    weightKg?: number;
    value?: number;
  };
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  notes?: string;
}

export const expressBookingApi = {
  /** POST /express/rides/book — never send customerEmail; the account's is used */
  bookRide: (body: RideBookingInput) =>
    request<{ status: string; data: Booking }>("/express/rides/book", {
      method: "POST",
      body: {
        currency: "NGN",
        rideType: "standard",
        passengerCount: 1,
        ...body,
      },
      auth: "customer",
    }),

  /** POST /express/deliveries/book */
  bookDelivery: (body: DeliveryBookingInput) =>
    request<{ status: string; data: Booking }>("/express/deliveries/book", {
      method: "POST",
      body: { currency: "NGN", ...body },
      auth: "customer",
    }),

  /** GET /express/orders — the signed-in customer's bookings, newest first */
  listOrders: (page = 1, limit = 10) =>
    request<{
      status: string;
      data: { bookings: Booking[]; total: number; page: number; limit: number };
    }>(`/express/orders?page=${page}&limit=${limit}`, { auth: "customer" }),

  /** GET /express/orders/:bookingRef — 404 if it isn't this customer's */
  getOrder: (bookingRef: string) =>
    request<any>(`/express/orders/${encodeURIComponent(bookingRef)}`, {
      auth: "customer",
    }),

  /** GET /express/orders/:bookingRef/status — light object for polling */
  getOrderStatus: (bookingRef: string) =>
    request<{ status: string; data: BookingStatusSnapshot }>(
      `/express/orders/${encodeURIComponent(bookingRef)}/status`,
      { auth: "customer" },
    ),

  /** PATCH /express/orders/:bookingRef/cancel — only while status is pending */
  cancelOrder: (bookingRef: string, reason?: string) =>
    request<any>(`/express/orders/${encodeURIComponent(bookingRef)}/cancel`, {
      method: "PATCH",
      body: reason ? { reason } : {},
      auth: "customer",
    }),
};

// ─── Customer: payments (bank transfer into a one-time account) ──────────────

export interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
  expiresAt: string;
}

export interface PaymentInit {
  reference: string;
  subjectRef?: string;
  provider?: string;
  virtualAccount?: VirtualAccount;
  amount: number;
  currency: string;
}

/** pending | success | expired | failed */
export interface PaymentStatusInfo {
  status: string;
  subjectRef?: string;
  subjectStatus?: string;
  amount?: number;
  currency?: string;
}

export function normalizeInitialize(res: any): PaymentInit {
  const d = res?.data && typeof res.data === "object" ? res.data : res;
  return d as PaymentInit;
}

/**
 * The payment's own `status` (pending|success|expired|failed) collides with the
 * envelope's `status: "success"`. If the body is wrapped, read data.status;
 * otherwise read the root.
 */
export function normalizePaymentStatus(res: any): PaymentStatusInfo {
  const d = res?.data && typeof res.data === "object" ? res.data : res;
  return {
    status: String(d?.status ?? "pending"),
    subjectRef: d?.subjectRef,
    subjectStatus: d?.subjectStatus,
    amount: d?.amount,
    currency: d?.currency,
  };
}

export const paymentApi = {
  /** GET /payments/methods?product=dezenexpress */
  methods: () => request<any>("/payments/methods?product=dezenexpress"),

  /**
   * POST /express/payments/initiate — the Express payment call. For rides it works
   * once the rider has confirmed (status rider_accepted); the shared
   * /payments/fiat/initialize rejected rider_accepted with
   * 'Cannot pay for a booking with status "rider_accepted"'.
   * Safe to call again while the account is open (returns the same account).
   * Response: data.reference, data.virtualAccount, data.amount, data.currency.
   */
  initialize: (bookingRef: string) =>
    request<any>("/express/payments/initiate", {
      method: "POST",
      body: { bookingRef },
      auth: "customer",
    }),

  /** GET /payments/:reference/status */
  status: (reference: string) =>
    request<any>(`/payments/${encodeURIComponent(reference)}/status`, {
      auth: "customer",
    }),
};

// ─── Public: available riders (online + verified) ────────────────────────────

export interface AvailableRider {
  id: string;
  name: string;
  phone?: string;
  vehicleType: string;
  vehiclePlateNumber?: string;
  rating?: number;
  totalTrips?: number;
  availabilityStatus?: "online" | "offline" | "on_trip";
}

export const expressRiderPublicApi = {
  /** GET /express/riders/available */
  getAvailable: (params?: { page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    return request<{
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
    request<{ status: string; data: AvailableRider }>(
      `/express/riders/${riderId}`,
    ),
};

// ─── Rider types ──────────────────────────────────────────────────────────────

export interface PayoutAccount {
  bankCode: string;
  bankName: string;
  accountName: string;
  accountNumberMasked: string;
  verifiedAt?: string;
}

export interface RiderFullProfile {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  vehicleType?: string;
  vehiclePlateNumber?: string;
  driverLicenseNumber?: string;
  profileImage?: string;
  payoutAccount?: PayoutAccount;
  // Old profile bank fields (removed from the API; kept optional so old screens compile)
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  availabilityStatus?: "online" | "offline" | "on_trip";
  verificationStatus?: "pending" | "verified" | "rejected";
  createdAt?: string;
}

/** A paid request on offer — no contact details until accepted. */
export interface RiderRequest {
  id: string;
  bookingRef: string;
  type: "ride" | "delivery";
  /** Ride requests assigned to you may carry the customer's name (not guaranteed). */
  customerName?: string;
  notes?: string;
  pickupAddress: Address;
  dropoffAddress: Address;
  distanceKm?: number;
  fareAmount: number;
  rideType?: string;
  passengerCount?: number;
  package?: { description: string; sizeCategory?: string; weightKg?: number };
}

/** An accepted job — now includes contact details (never emails). */
export interface RiderJob extends RiderRequest {
  status: BookingStatus;
  customerName?: string;
  customerPhone?: string;
  recipientName?: string;
  recipientPhone?: string;
  notes?: string;
}

export interface RiderWallet {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  currency: string;
}

export interface RiderTransaction {
  id: string;
  type: "credit" | "debit";
  /** booking_earning | withdrawal | adjustment */
  reason: string;
  amount: number;
  balanceAfter?: number;
  description?: string;
  createdAt: string;
}

export interface RiderWithdrawal {
  id?: string;
  withdrawalId?: string;
  /** completed | processing | failed | reversed | pending | rejected */
  status: string;
  amount: number;
  automatic?: boolean;
  accountNumberMasked?: string;
  createdAt?: string;
}

// ─── Rider auth ───────────────────────────────────────────────────────────────

export const riderAuthApi = {
  /** POST /express/rider/register — bank fields were removed; use the payout account */
  register: (body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    vehicleType: string;
    vehiclePlateNumber: string;
    driverLicenseNumber?: string;
    /** @deprecated no longer accepted; ignored */
    bankName?: string;
    /** @deprecated no longer accepted; ignored */
    bankAccountNumber?: string;
    /** @deprecated no longer accepted; ignored */
    bankAccountName?: string;
  }) => {
    const clean = { ...body };
    delete clean.bankName;
    delete clean.bankAccountNumber;
    delete clean.bankAccountName;
    return request<{ status: string }>("/express/rider/register", {
      method: "POST",
      body: clean,
    });
  },

  /** POST /express/rider/auth/login — emails a 6-digit code (valid 5 min) */
  login: (email: string, password: string) =>
    request<{ status: string }>("/express/rider/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  /** POST /express/rider/auth/verify-otp → rider JWT (401 wrong, 410 expired, 429 too many) */
  verifyOtp: (email: string, code: string) =>
    request<{ status: string; data: { token: string; rider: any } }>(
      "/express/rider/auth/verify-otp",
      { method: "POST", body: { email, code } },
    ),
};

// ─── Rider app (rider token) ──────────────────────────────────────────────────

export const riderApi = {
  /** GET /express/rider/profile */
  getProfile: () =>
    request<{ status: string; data: RiderFullProfile }>(
      "/express/rider/profile",
      { auth: "rider" },
    ),

  /** PUT /express/rider/profile — multipart; only send changed fields */
  updateProfile: (body: {
    name?: string;
    phone?: string;
    vehicleType?: string;
    vehiclePlateNumber?: string;
    driverLicenseNumber?: string;
    profileImage?: File;
  }) => {
    const form = new FormData();
    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "")
        form.append(key, value as string | Blob);
    });
    return request<{ status: string }>("/express/rider/profile", {
      method: "PUT",
      form,
      auth: "rider",
    });
  },

  /** PATCH /express/rider/availability — 403 unverified, 409 active booking */
  setAvailability: (availabilityStatus: "online" | "offline") =>
    request<{ status: string }>("/express/rider/availability", {
      method: "PATCH",
      body: { availabilityStatus },
      auth: "rider",
    }),

  /** GET /express/rider/requests — paid requests on offer, oldest first */
  getRequests: (page = 1, limit = 10) =>
    request<{
      status: string;
      data: {
        bookings: RiderRequest[];
        total: number;
        page: number;
        limit: number;
      };
    }>(`/express/rider/requests?page=${page}&limit=${limit}`, {
      auth: "rider",
    }),

  /** PATCH /express/rider/requests/:id/accept — 409 messages are meant to be shown as-is */
  acceptRequest: (id: string) =>
    request<{ status: string; data: RiderJob }>(
      `/express/rider/requests/${id}/accept`,
      { method: "PATCH", auth: "rider" },
    ),

  /** PATCH /express/rider/requests/:id/reject */
  rejectRequest: (id: string) =>
    request<{ status: string; data: { bookingRef: string; status: string } }>(
      `/express/rider/requests/${id}/reject`,
      { method: "PATCH", auth: "rider" },
    ),

  /** GET /express/rider/ride-requests — rides a customer assigned to THIS rider,
   *  waiting for the rider to confirm or decline. Shape of each item isn't fully
   *  documented, so callers should read fields defensively. */
  getRideRequests: (page = 1, limit = 10) =>
    request<{
      status: string;
      data: {
        bookings?: RiderRequest[];
        requests?: RiderRequest[];
        total?: number;
      };
    }>(`/express/rider/ride-requests?page=${page}&limit=${limit}`, {
      auth: "rider",
    }),

  /** PATCH /express/rider/ride-requests/:id/confirm — status becomes rider_accepted and
   *  the customer can pay. 409: no longer available, rider offline, or another active job. */
  confirmRideRequest: (id: string) =>
    request<{ status: string; data?: any }>(
      `/express/rider/ride-requests/${id}/confirm`,
      { method: "PATCH", auth: "rider" },
    ),

  /** PATCH /express/rider/ride-requests/:id/reject — booking is cancelled (no payment yet),
   *  so the customer can book a different rider. */
  rejectRideRequest: (id: string) =>
    request<{ status: string; data?: any }>(
      `/express/rider/ride-requests/${id}/reject`,
      { method: "PATCH", auth: "rider" },
    ),

  /** GET /express/rider/bookings — current jobs with contact details */
  getJobs: () =>
    request<{ status: string; data: { bookings: RiderJob[] } }>(
      "/express/rider/bookings",
      { auth: "rider" },
    ),

  /** PATCH /express/rider/bookings/:id/status — next trip step.
   *  in_progress emails the completion code (response has completionCodeSent). */
  updateStatus: (
    id: string,
    status: "arrived_at_pickup" | "in_progress" | "arrived_at_dropoff",
  ) =>
    request<{ status: string; data: any }>(
      `/express/rider/bookings/${id}/status`,
      { method: "PATCH", body: { status }, auth: "rider" },
    ),

  /** POST /express/rider/bookings/:id/resend-otp — 429 if too soon / too many */
  resendOtp: (id: string) =>
    request<{ status: string; data?: any }>(
      `/express/rider/bookings/${id}/resend-otp`,
      { method: "POST", auth: "rider" },
    ),

  /** PATCH /express/rider/bookings/:id/verify-otp — completes the job (6-digit code) */
  verifyOtp: (id: string, code: string) =>
    request<{ status: string; data: RiderJob }>(
      `/express/rider/bookings/${id}/verify-otp`,
      { method: "PATCH", body: { code }, auth: "rider" },
    ),

  /** GET /express/rider/wallet */
  getWallet: () =>
    request<{ status: string; data: RiderWallet }>("/express/rider/wallet", {
      auth: "rider",
    }),

  /** GET /express/rider/transactions */
  getTransactions: (page = 1, limit = 20) =>
    request<{
      status: string;
      data: {
        items: RiderTransaction[];
        total: number;
        page: number;
        limit: number;
      };
    }>(`/express/rider/transactions?page=${page}&limit=${limit}`, {
      auth: "rider",
    }),

  /** GET /express/rider/banks */
  getBanks: () =>
    request<{
      status: string;
      data: { banks: { code: string; name: string }[] };
    }>("/express/rider/banks", { auth: "rider" }),

  /** PUT /express/rider/payout-account — needs the rider's password */
  setPayoutAccount: (body: {
    bankCode: string;
    accountNumber: string;
    password: string;
  }) =>
    request<{ status: string; data: RiderFullProfile }>(
      "/express/rider/payout-account",
      { method: "PUT", body, auth: "rider" },
    ),

  /** POST /express/rider/withdraw — minimum ₦1,000 */
  withdraw: (amount: number) =>
    request<{
      status: string;
      data: {
        withdrawalId: string;
        status: string;
        amount: number;
        automatic: boolean;
        message: string;
      };
    }>("/express/rider/withdraw", {
      method: "POST",
      body: { amount },
      auth: "rider",
    }),

  /** GET /express/rider/withdrawals */
  getWithdrawals: (page = 1, limit = 10) =>
    request<{
      status: string;
      data: {
        items?: RiderWithdrawal[];
        withdrawals?: RiderWithdrawal[];
        total?: number;
      };
    }>(`/express/rider/withdrawals?page=${page}&limit=${limit}`, {
      auth: "rider",
    }),
};

// ─── Admin: rider approval ────────────────────────────────────────────────────
// Admin endpoints need an account with the `admin` role. The dashboard signs in
// with the logistics token; if the backend rejects that (401/403) we retry with
// a customer (shared Dezenmart) token, in case the admin signed in that way.

function getLogisticsToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dezenmart_logistics_token");
}

async function adminReq<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  if (typeof window === "undefined") throw new Error("Client-side only");
  const tokens = [getLogisticsToken(), getCustomerToken()].filter(
    (t): t is string => !!t,
  );
  if (tokens.length === 0)
    throw new ApiError("Authentication token required", 401);

  let lastError: ApiError | null = null;
  for (const token of tokens) {
    const res = await fetch(`${BASE}${path}`, {
      method: init.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    let data: any = null;
    try {
      data = await res.json();
    } catch {}
    if (res.ok) return data as T;
    lastError = new ApiError(
      messageFrom(data, res.status),
      res.status,
      data?.errors,
    );
    if (res.status !== 401 && res.status !== 403) break;
  }
  throw lastError ?? new ApiError("Request failed", 500);
}

/** GET /express/rider/all?status=pending|verified|rejected — admin only */
function listAdminRiders(
  status: "pending" | "verified" | "rejected",
  page = 1,
  limit = 10,
) {
  return adminReq<{
    status: string;
    data: { riders: any[]; total: number; page: number; limit: number };
  }>(`/express/rider/all?status=${status}&page=${page}&limit=${limit}`);
}

export const adminRiderApi = {
  listRiders: listAdminRiders,

  /** Kept for older callers; same as listRiders("pending"). */
  getPending: (page = 1, limit = 10) => listAdminRiders("pending", page, limit),

  /** PATCH /express/rider/:riderId/verify */
  verifyRider: (riderId: string, status: "verified" | "rejected") =>
    adminReq<{ status: string }>(`/express/rider/${riderId}/verify`, {
      method: "PATCH",
      body: { status },
    }),
};
