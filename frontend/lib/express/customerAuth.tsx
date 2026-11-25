// Customer session helpers for DezenExpress.
// Customers sign in with Google through the shared Dezenmart login
// (GET /auth/google), NOT the logistics-provider login. The token is stored
// under its own key so it never clashes with the admin/logistics token.

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

const TOKEN_KEY = "dezenexpress_customer_token";
const USER_KEY = "dezenexpress_customer_user";
const RETURN_KEY = "dezenexpress_return_to";

/** Fired on window when a customer call comes back 401 (token expired/invalid). */
export const AUTH_EXPIRED_EVENT = "dezenexpress-auth-expired";

export interface CustomerUser {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export function getCustomerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveCustomerToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearCustomerToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function saveCustomerUser(user: CustomerUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getCustomerUser(): CustomerUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as CustomerUser) : null;
  } catch {
    return null;
  }
}

/** Remember where to send the customer after Google sign-in. */
export function setReturnTo(path: string) {
  try {
    sessionStorage.setItem(RETURN_KEY, path);
  } catch {}
}

export function popReturnTo(): string | null {
  try {
    const v = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    return v;
  } catch {
    return null;
  }
}

/**
 * Redirect flow: the backend sends the browser to Google, then back to
 * `<origin>/auth/google?token=<JWT>&userId=<id>` (or ?error=…&message=…).
 * `origin` must be on the backend's allowlist (DEZENEXPRESS_FRONTEND_URL), so we
 * use the exact origin the customer is on right now.
 */
const PENDING_KEY = "dezenexpress_signin_pending";

/**
 * The return page accepts a token only if this same tab started the sign-in a
 * moment ago. Otherwise someone could send a victim a crafted link
 * (/auth/google?token=<attacker's token>) and silently log them into the
 * attacker's account ("login CSRF").
 */
export function consumeSignInPending(): boolean {
  try {
    const v = sessionStorage.getItem(PENDING_KEY);
    sessionStorage.removeItem(PENDING_KEY);
    return !!v && Date.now() - Number(v) < 10 * 60 * 1000;
  } catch {
    return false;
  }
}

export function startGoogleSignIn() {
  try {
    sessionStorage.setItem(PENDING_KEY, String(Date.now()));
  } catch {}
  const origin = window.location.origin;
  window.location.href = `${BASE}/auth/google?origin=${encodeURIComponent(origin)}`;
}
