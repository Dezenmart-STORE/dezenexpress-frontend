const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

const KEYS = {
  token: "dezenmart_logistics_token",
  provider: "dezenmart_logistics_provider",
} as const;

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.token);
}

export function saveToken(token: string) {
  localStorage.setItem(KEYS.token, token);
  document.cookie = `dezenmart_logistics_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}

export function clearToken() {
  localStorage.removeItem(KEYS.token);
  localStorage.removeItem(KEYS.provider);
  document.cookie = "dezenmart_logistics_token=; path=/; max-age=0";
}

export function saveProvider(provider: object) {
  localStorage.setItem(KEYS.provider, JSON.stringify(provider));
}

export function getProvider() {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.provider);
  return raw ? JSON.parse(raw) : null;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.message ?? `Request failed: ${res.status}`);
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Provider {
  _id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  walletAddress: string;
  coverageAreas: CoverageArea[];
  rating: number;
  totalDeliveries: number;
  verificationStatus: "pending" | "verified" | "rejected";
  isActive: boolean;
  onboardingComplete?: boolean;
  profileImage?: string;
  authProvider?: "local" | "google";
  createdAt?: string;
  updatedAt?: string;
}

export interface CoverageArea {
  state: string;
  lgas: string[];
  isStatewide: boolean;
}

export interface WeightTier {
  minWeight: number;
  maxWeight: number;
  price: number;
}

export interface PricingRule {
  _id: string;
  providerId: string;
  deliveryType: "intra_lga" | "inter_lga_same_state" | "inter_state";
  fromState: string;
  fromLga?: string;
  toState: string;
  toLga?: string;
  weightTiers: WeightTier[];
  insuranceFee: number;
  packagingFee: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
}

export interface AvailableProvider {
  provider: Pick<
    Provider,
    "_id" | "name" | "phone" | "rating" | "totalDeliveries"
  >;
  pricingRule: Pick<
    PricingRule,
    "deliveryType" | "fromState" | "fromLga" | "toState" | "toLga"
  >;
  breakdown: {
    basePrice: number;
    insuranceFee: number;
    packagingFee: number;
    totalPrice: number;
  };
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface OnboardingPayload {
  name: string;
  phone: string;
  walletAddress: string;
  coverageAreas: CoverageArea[];
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: {
    name: string;
    email: string;
    phone: string;
    password: string;
    walletAddress: string;
    coverageAreas: CoverageArea[];
  }) =>
    request<{ status: string; token: string; data: { provider: Provider } }>(
      "/logistics/auth/register",
      { method: "POST", body: JSON.stringify(body) },
    ),
  login: (body: { email: string; password: string }) =>
    request<{ status: string; token: string; data: { provider: Provider } }>(
      "/logistics/auth/login",
      { method: "POST", body: JSON.stringify(body) },
    ),
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────
export const googleAuthApi = {
  getAuthUrl: () => `${BASE_URL}/logistics/auth/google`,
  redirectToGoogle: () => {
    if (typeof window !== "undefined") {
      const origin = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
      window.location.href = `${BASE_URL}/logistics/auth/google?origin=${encodeURIComponent(origin)}`;
    }
  },
};

// ─── Onboarding ───────────────────────────────────────────────────────────────
export const onboardingApi = {
  complete: (body: OnboardingPayload) =>
    request<{ status: string; data: { provider: Provider } }>(
      "/logistics/me/onboarding",
      { method: "POST", body: JSON.stringify(body) },
    ),
};

// ─── Profile ──────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () =>
    request<{ status: string; data: { provider: Provider } }>("/logistics/me"),
  update: (
    body: Partial<
      Pick<Provider, "name" | "phone" | "coverageAreas" | "isActive">
    >,
  ) =>
    request<{ status: string; data: { provider: Provider } }>("/logistics/me", {
      method: "PUT",
      body: JSON.stringify(body),
    }),
};

// ─── Pricing Rules ────────────────────────────────────────────────────────────
// NOTE: GET /logistics/providers/me/pricing-rules is a PUBLIC endpoint.
// It requires providerId or userId as a query param — NOT a Bearer token.
// POST/PUT/DELETE/PATCH still require Bearer token (provider must be authenticated).
export const pricingApi = {
  list: (deliveryType?: PricingRule["deliveryType"]) => {
    const provider = getProvider();
    const qs = new URLSearchParams();
    // Pass providerId so the backend knows whose rules to return
    if (provider?._id) qs.set("providerId", provider._id);
    else if (provider?.userId) qs.set("userId", provider.userId);
    if (deliveryType) qs.set("deliveryType", deliveryType);
    return request<{
      status: string;
      results: number;
      data: { rules: PricingRule[] };
    }>(`/logistics/providers/me/pricing-rules?${qs}`);
  },

  create: (body: Omit<PricingRule, "_id" | "providerId" | "isActive">) =>
    request<{ status: string; data: { rule: PricingRule } }>(
      "/logistics/providers/me/pricing-rules",
      { method: "POST", body: JSON.stringify(body) },
    ),

  update: (
    ruleId: string,
    body: Partial<Omit<PricingRule, "_id" | "providerId">>,
  ) =>
    request<{ status: string; data: { rule: PricingRule } }>(
      `/logistics/providers/me/pricing-rules/${ruleId}`,
      { method: "PUT", body: JSON.stringify(body) },
    ),

  toggle: (ruleId: string) =>
    request<{
      status: string;
      data: { rule: Pick<PricingRule, "_id" | "isActive"> };
    }>(`/logistics/providers/me/pricing-rules/${ruleId}/toggle`, {
      method: "PATCH",
    }),

  delete: (ruleId: string) =>
    request<undefined>(`/logistics/providers/me/pricing-rules/${ruleId}`, {
      method: "DELETE",
    }),
};

// ─── Provider Directory ───────────────────────────────────────────────────────
export const providersApi = {
  list: (params?: {
    verificationStatus?: Provider["verificationStatus"];
    isActive?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.verificationStatus)
      qs.set("verificationStatus", params.verificationStatus);
    if (params?.isActive !== undefined)
      qs.set("isActive", String(params.isActive));
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return request<{
      status: string;
      results: number;
      total: number;
      data: { providers: Provider[] };
    }>(`/logistics/providers?${qs}`);
  },
  getById: (id: string) =>
    request<{ status: string; data: { provider: Provider } }>(
      `/logistics/providers/${id}`,
    ),
  getAvailable: (params: {
    fromState: string;
    fromLga: string;
    toState: string;
    toLga: string;
    weight: number;
    sort?: "price" | "days" | "rating";
  }) => {
    const qs = new URLSearchParams({
      fromState: params.fromState,
      fromLga: params.fromLga,
      toState: params.toState,
      toLga: params.toLga,
      weight: String(params.weight),
      ...(params.sort ? { sort: params.sort } : {}),
    });
    return request<{
      status: string;
      results: number;
      data: { providers: AvailableProvider[] };
    }>(`/logistics/available?${qs}`);
  },
};

// ─── Admin ────────────────────────────────────────────────────────────────────
export const adminApi = {
  verifyProvider: (providerId: string, status: "verified" | "rejected") =>
    request<{ status: string; data: { provider: Partial<Provider> } }>(
      `/logistics/providers/${providerId}/verify`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    ),
};

// ─── Locations ────────────────────────────────────────────────────────────────
export const locationsApi = {
  getStates: () =>
    request<{ status: string; results: number; data: { states: string[] } }>(
      "/logistics/locations/states",
    ),
  getLgas: (state: string) =>
    request<{ status: string; results: number; data: { lgas: string[] } }>(
      `/logistics/locations/states/${encodeURIComponent(state)}/lgas`,
    ),
};
