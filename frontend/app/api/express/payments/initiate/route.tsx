// app/api/express/payments/initiate/route.ts
// POST /api/express/payments/initiate
// Temporary Next.js route that calls PandaEscrow directly, for end-to-end
// testing until the backend dev wires PandaEscrow into the Express API.

import { NextRequest, NextResponse } from "next/server";
import { pandaEscrowApi } from "@/lib/express/pandascrow";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  try {
    const {
      bookingRef,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      riderName,
      riderEmail,
      riderPhone,
      description,
    } = await req.json();

    const fare = Number(amount);
    if (!bookingRef || !Number.isFinite(fare) || fare <= 0) {
      return NextResponse.json(
        { error: "bookingRef and a positive amount are required" },
        { status: 400 },
      );
    }

    const escrow = await pandaEscrowApi.initiate({
      bookingRef,
      description: description ?? `Payment for booking ${bookingRef}`,
      amount: fare, // Naira
      currency: "NGN",
      buyer: {
        name: customerName || "Customer",
        email: customerEmail || `${customerPhone}@dezenexpress.com`,
        phone: customerPhone || "+2340000000000",
      },
      seller: {
        name: riderName || "Rider",
        // Placeholder until riders' real emails are available to the frontend.
        // If Pandascrow keys participants by email, every rider sharing this
        // address would collide — replace as soon as you can.
        email: riderEmail || "rider@dezenexpress.com",
        phone: riderPhone || "+2340000000000",
      },
      // Pandascrow appends its own ?ref=<escrowId>&type=escrow&checkout_id=...
      // on redirect, which overwrites a `ref` param — so ours is named `booking`.
      callbackUrl: `${APP_URL}/express/customer/track?booking=${bookingRef}`,
      paymentGateway: "payment_link",
    });

    return NextResponse.json({
      paymentUrl: escrow.data.payment_url ?? null,
      escrowId: escrow.data.escrow_id ?? null,
      transactionRef: escrow.data.transaction_ref ?? null,
      virtualAccount: escrow.data.virtual_account ?? null,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Payment initiation failed";
    console.error("[PandaEscrow Initiate Error]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
