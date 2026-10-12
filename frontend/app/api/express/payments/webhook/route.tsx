// app/api/express/payments/webhook/route.ts
// POST /api/express/payments/webhook
// PandaEscrow calls this on payment events. Register this URL in the
// Pandascrow dashboard (Developers -> Webhooks).

import { NextRequest, NextResponse } from "next/server";
import { verifyPandaWebhook, PandaEvent } from "@/lib/express/pandascrow";

export const runtime = "nodejs"; // uses node:crypto
export const dynamic = "force-dynamic";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

// The Express backend's /express/payments/webhook was built for Korapay, so
// forwarding is OFF by default. Turn it on (PANDASCROW_FORWARD_TO_BACKEND=true)
// only once your backend dev has a handler that understands this payload.
const FORWARD_TO_BACKEND = process.env.PANDASCROW_FORWARD_TO_BACKEND === "true";

/** Title is created as `Booking <bookingRef>` in pandascrow.ts */
function bookingRefFromTitle(title?: string): string | null {
  if (!title) return null;
  const m = title.match(/^Booking\s+(\S+)/);
  return m ? m[1] : null;
}

/** Returns true on success. A failure makes us respond 500 so Pandascrow retries. */
async function forwardToBackend(
  payload: Record<string, unknown>,
): Promise<boolean> {
  if (!FORWARD_TO_BACKEND) return true;
  try {
    const res = await fetch(`${API_BASE}/express/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.error("[PandaEscrow] Failed to notify backend:", err);
    return false;
  }
}

export async function POST(req: NextRequest) {
  // 1. Read the RAW body — never parse and re-serialize before verifying.
  const rawBody = await req.text();
  const signature = req.headers.get("x-pandascrow-signature");
  const timestamp = req.headers.get("x-pandascrow-timestamp");

  // 2. Verification is mandatory. A missing signature is rejected, not skipped.
  if (!verifyPandaWebhook(rawBody, signature, timestamp)) {
    return NextResponse.json(
      { status: false, error: "invalid signature" },
      { status: 401 },
    );
  }

  let event: { event: PandaEvent; data: any };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { status: false, error: "invalid JSON" },
      { status: 400 },
    );
  }

  const { event: type, data } = event;
  // Don't log full payloads in production — they contain customer PII/card metadata.
  console.log(
    `[PandaEscrow Webhook] ${type} escrow_id=${data?.escrow_id ?? "-"}`,
  );

  let ok = true;

  switch (type) {
    case "escrow.created": {
      // Escrow exists and the payment link is ready. Nothing to do.
      break;
    }

    case "escrow.paid": {
      // Buyer funded the escrow. Webhooks can be delivered more than once, so
      // the receiving side must dedupe on transaction_ref.
      const transactionRef = data?.transaction?.transaction_ref;
      const bookingRef = bookingRefFromTitle(data?.escrow_data?.title);
      if (!bookingRef) {
        console.error(
          "[PandaEscrow] escrow.paid with no recoverable bookingRef",
        );
        break; // ack anyway — retrying can't fix a missing ref
      }
      ok = await forwardToBackend({
        event: "escrow.paid",
        idempotency_key: transactionRef,
        escrow_id: data.escrow_id,
        booking_ref: bookingRef,
        amount: data.escrow_data?.amount,
        amount_pay: data.escrow_data?.amount_pay,
        currency: data.escrow_data?.currency,
      });
      break;
    }

    case "escrow.completed": {
      const transactionRef = data?.transaction?.transaction_ref;
      ok = await forwardToBackend({
        event: "escrow.completed",
        idempotency_key: transactionRef,
        escrow_id: data?.escrow_id,
        booking_ref: bookingRefFromTitle(data?.escrow_data?.title),
        seller: data?.participants?.seller,
        amount: data?.escrow_data?.amount,
      });
      break;
    }

    case "escrow.dispute.opened":
    case "escrow.payout.completed":
    case "invoice.paid":
    case "wallet.deposit.success":
    default: {
      console.log(`[PandaEscrow] Unhandled event: ${type}`);
    }
  }

  if (!ok) {
    // Non-2xx makes Pandascrow retry (every 3 min x4, then hourly up to 72h).
    return NextResponse.json({ status: false }, { status: 500 });
  }

  // The docs require exactly {"status": true} — anything else counts as a failure.
  return NextResponse.json({ status: true });
}
