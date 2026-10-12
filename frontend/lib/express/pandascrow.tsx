// lib/express/pandascrow.ts
// ─── PandaEscrow API Client (server-side only) ────────────────────────────────
// Docs:    https://pandascrow.readme.io
// Sandbox: https://sandbox.pandascrow.io
// Live:    https://api.pandascrow.io
// Auth:    `Token: <public_key>` header (header name from the OpenAPI spec;
//          that it wants the PUBLIC key comes from the API's own error message)
//
// Required env vars:
//   PANDASCROW_PUBLIC_KEY     pk_test... (sandbox) or pk_live... (live) — API calls
//   PANDASCROW_SECRET_KEY     sktest... (sandbox) or sklive... (live) — webhook signature only
//   PANDASCROW_MERCHANT_UUID  your merchant/broker UUID from the dashboard
//   PANDASCROW_ENV            "sandbox" (default) or "live"
//   NEXT_PUBLIC_APP_URL       e.g. https://yourapp.com (used for callback_url)
//
// Never import this file from a "use client" component — it reads the secret.

import crypto from "crypto";

// Sandbox unless explicitly set to "live". Using a dedicated variable (rather
// than NODE_ENV) avoids hitting the live API from preview deployments, and
// test keys only work against the sandbox anyway.
const PANDA_BASE =
  process.env.PANDASCROW_ENV === "live"
    ? "https://api.pandascrow.io"
    : "https://sandbox.pandascrow.io";

// Env vars are read lazily (inside functions) so a missing value fails the
// request with a clear error instead of crashing `next build`.

// The `Token` header on API calls is checked against your PUBLIC key
// (Pandascrow answers "Unauthorized: Invalid public key" otherwise).
function getApiKey(): string {
  const k = process.env.PANDASCROW_PUBLIC_KEY?.trim();
  if (!k) throw new Error("PANDASCROW_PUBLIC_KEY is not set");
  return k;
}

function getMerchantUuid(): string {
  const u = process.env.PANDASCROW_MERCHANT_UUID;
  if (!u) throw new Error("PANDASCROW_MERCHANT_UUID is not set");
  return u;
}

async function pandaReq<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${PANDA_BASE}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Token: getApiKey(),
      ...(options.headers ?? {}),
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // non-JSON body — handled below
  }

  if (!res.ok || !data || data.status === false) {
    throw new Error(
      data?.data?.message ??
        data?.message ??
        `PandaEscrow error: ${res.status}`,
    );
  }
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EscrowResponse {
  status: boolean;
  data: {
    escrow_id: number;
    status: string; // "pending" | "funded" | "completed"
    type: string;
    transaction_ref: string;
    provider: string;
    payment_method: string;
    payment_url?: string; // payment_link mode
    virtual_account?: {
      // virtual_account mode
      account_number: string;
      account_name: string;
      bank_name: string;
      bank_code: string;
      expiry_date: string;
      amount: number;
      currency: string;
    };
  };
}

export interface EscrowListResponse {
  status: boolean;
  data: Array<{
    escrow: {
      _id: number;
      title: string;
      currency: string;
      amount: string;
      status: string;
      created_at: string;
    };
    participants: any[];
    activity_logs: any[];
  }>;
}

export interface Party {
  name: string;
  email: string;
  phone: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Tomorrow's date in YYYY-MM-DD for delivery_date */
function tomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

// ─── Escrow API ───────────────────────────────────────────────────────────────

export const pandaEscrowApi = {
  /**
   * POST /escrow/initialize
   * Creates a one-time escrow for a ride/delivery booking.
   * DezenExpress is the BROKER — customer is buyer, rider is seller.
   *
   * AMOUNT: pass NAIRA (e.g. 1500). The webhook samples show the escrow amount
   * as "350.00" (Naira) while the gateway amount is 35000 (kobo), so the
   * escrow API takes the major unit. Confirm with one ₦1,500 sandbox escrow
   * and check the checkout page before going live.
   *
   * FEES: with who_pay_fees "buyer" the customer is charged MORE than `amount`
   * (sample payloads show amount 20000 -> amount_pay 21400). Surface that in
   * the UI or set whoPaysFees to "seller".
   *
   * The title is always `Booking <bookingRef>` so the webhook can recover the
   * ref without parsing free text.
   */
  initiate: (params: {
    bookingRef: string;
    description: string;
    amount: number; // Naira
    currency?: string; // default NGN
    buyer: Party;
    seller: Party;
    callbackUrl?: string;
    paymentGateway?: "payment_link" | "virtual_account"; // default payment_link
    whoPaysFees?: "buyer" | "seller" | "both"; // default buyer
  }) => {
    const merchantUuid = getMerchantUuid();
    return pandaReq<EscrowResponse>("/escrow/initialize", {
      method: "POST",
      body: JSON.stringify({
        uuid: merchantUuid,
        escrow_type: "onetime",
        initiator_role: "broker",
        initiator_id: merchantUuid,
        title: `Booking ${params.bookingRef}`,
        currency: params.currency ?? "NGN",
        description: params.description,
        acceptance_criteria:
          "Service completed with OTP verification by customer",
        inspection_period: "1",
        delivery_date: tomorrowDate(),
        how_dispute_is_handled: "platform",
        who_pay_fees: params.whoPaysFees ?? "buyer",
        amount: params.amount,
        dispute_window: "1",
        callback_url:
          params.callbackUrl ??
          `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/express/customer/track?booking=${params.bookingRef}`,
        buyer_details: params.buyer,
        seller_details: params.seller,
        payment_gateway: params.paymentGateway ?? "payment_link",
        // Not sent (not in the documented schema): receiver_id, set_payout,
        // no_reviews, partner_escrow_fee, prd_url.
        // OPEN QUESTION: no `payout` object is sent, so how the rider's share
        // reaches them on completion is undecided — ask Pandascrow/backend.
      }),
    });
  },

  /**
   * POST /escrow/complete
   * Releases funds to the seller. `uuid` is the user confirming (not
   * necessarily the merchant) and `otp` is the code Pandascrow sends to that
   * party — see "Resend Release OTP". Unverified whether this is the same code
   * as the Express trip OTP; confirm before wiring.
   */
  complete: (params: {
    confirmerUuid?: string;
    escrowId: number;
    otp: string;
  }) =>
    pandaReq<{ status: boolean }>("/escrow/complete", {
      method: "POST",
      body: JSON.stringify({
        uuid: params.confirmerUuid ?? getMerchantUuid(),
        escrow_id: params.escrowId,
        otp: params.otp,
      }),
    }),

  /**
   * GET /escrow/single?uuid=&escrow_id=   (confirmed from the docs)
   */
  fetchOne: (escrowId: number) =>
    pandaReq<EscrowListResponse>(
      `/escrow/single?uuid=${encodeURIComponent(getMerchantUuid())}&escrow_id=${escrowId}`,
    ),

  /**
   * UNVERIFIED path — I never saw the "Fetch all Escrow" page. Check it before use.
   */
  fetchAll: (email?: string) => {
    const q = new URLSearchParams({ uuid: getMerchantUuid() });
    if (email) q.set("email", email);
    return pandaReq<EscrowListResponse>(`/escrow?${q}`);
  },
};

// ─── Webhook Verification ─────────────────────────────────────────────────────

/**
 * Verifies a Pandascrow webhook.
 *
 * Per the docs: HMAC-SHA256 (hex, lowercase, no prefix) of the RAW request
 * body, keyed with your secret key. Never re-serialize the JSON — pass the
 * exact string from `await req.text()`.
 *
 * Headers sent: X-Pandascrow-Signature, X-Pandascrow-Timestamp (unix seconds),
 * X-Pandascrow-Event.
 */
export function verifyPandaWebhook(
  rawBody: string,
  signature: string | null | undefined,
  timestamp?: string | null,
): boolean {
  const secret = process.env.PANDASCROW_SECRET_KEY;
  if (!secret || !signature) return false;

  // Replay protection: reject anything more than 5 minutes off our clock.
  if (timestamp) {
    const age = Math.abs(Date.now() / 1000 - Number(timestamp));
    if (!Number.isFinite(age) || age > 300) return false;
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Webhook event types from PandaEscrow */
export type PandaEvent =
  | "escrow.created" // escrow initialized, payment_url available
  | "escrow.paid" // buyer funded the escrow
  | "escrow.completed" // funds released to seller
  | "escrow.dispute.opened"
  | "escrow.payout.completed"
  | "invoice.paid"
  | "wallet.deposit.success";
