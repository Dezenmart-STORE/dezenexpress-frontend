"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { expressBookingApi } from "@/lib/express/api";
import StatusTracker from "../shared/StatusTracker";
import ETADisplay from "../shared/ETADisplay";
import MapPlaceholder from "../shared/MapPlaceholder";
import {
  MapPinIcon,
  SearchIcon,
  CheckCircleIcon,
  TruckIcon,
  PackageIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

function PhoneIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  );
}

export default function TrackService() {
  const searchParams = useSearchParams();

  // Pandascrow redirects back to our callback URL with its own params appended:
  //   ?booking=RID-...?status=success&type=escrow&ref=<escrowId>&checkout_id=...
  // Two consequences:
  //   1. `booking` can arrive as "RID-...?status=success" (it appends "?" blindly),
  //      so we cut everything after a "?".
  //   2. `ref` is then Pandascrow's numeric escrow ID, NOT a booking ref.
  const bookingFromCallback = (searchParams.get("booking") ?? "")
    .split("?")[0]
    .trim();
  const isPandaReturn = searchParams.get("type") === "escrow";
  const refFromUrl =
    bookingFromCallback ||
    (isPandaReturn ? "" : (searchParams.get("ref") ?? ""));

  const [lookup, setLookup] = useState(refFromUrl);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (refFromUrl) handleSearch(refFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refFromUrl]);

  const handleSearch = async (query = lookup) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);
    setError(null);
    try {
      let found: any[] = [];

      // Booking reference (no "@", not a phone number)
      if (!q.includes("@") && !q.match(/^\d{10,}$/)) {
        const res = await expressBookingApi.getOrder(q);
        // Real response: { status, data: { id, bookingRef, ... } } — the order
        // sits directly under `data`, with no `order` wrapper.
        const order = res.data?.order ?? res.data;
        found = order?.bookingRef ? [order] : [];
      } else {
        // Email or phone lookup
        const params = q.includes("@") ? { email: q } : { phone: q };
        const res = await expressBookingApi.lookupOrders(params);
        // Real response: { status, data: { bookings: [...], total, page, limit } }
        found = res.data?.bookings ?? res.data?.orders ?? [];
      }

      // The API returns `id`; the rest of this screen keys on `_id`.
      found = found.map((o) => ({ ...o, _id: o._id ?? o.id }));

      setOrders(found);
      setSelected(found[0] ?? null);
      if (found.length === 0)
        setError("No orders found. Check your details and try again.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not find orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    if (!selected?.bookingRef) return;
    try {
      const res = await expressBookingApi.getOrderStatus(selected.bookingRef);
      setSelected((prev: any) => ({
        ...prev,
        status: res.data?.status ?? prev.status,
        paymentStatus: res.data?.paymentStatus ?? prev.paymentStatus,
      }));
    } catch {}
  };

  const isActive = ![
    "completed",
    "cancelled",
    "delivered",
    "trip_completed",
  ].includes(selected?.status ?? "");

  const paymentStatus: string | undefined = selected?.paymentStatus;
  const isPaid = paymentStatus === "paid";

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Track Your Order
        </h1>
        <p className="text-[12px] text-[#555]">
          Enter your email, phone or booking reference — no account needed
        </p>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 gap-2 focus-within:border-[#ff2d2d] transition-colors">
            <SearchIcon size={15} color="#555" />
            <input
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Email, phone or booking reference..."
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e0e0e0] placeholder:text-[#444]"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-3 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? "..." : "Track"}
          </button>
        </div>
        <p className="text-[10px] text-[#444] px-1">
          Use the email/phone from your booking, or your booking reference (e.g.
          RID-20261010-ABC123)
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {/* Multiple orders selector */}
      {searched && orders.length > 1 && (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] text-[#555]">
            {orders.length} orders found
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {orders.map((req: any) => (
              <button
                key={req._id ?? req.bookingRef}
                onClick={() => setSelected(req)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] cursor-pointer transition-all whitespace-nowrap shrink-0
                  ${selected?._id === req._id ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40 text-[#ff2d2d]" : "bg-[#1a1a1a] border-[#222] text-[#666] hover:border-[#333]"}`}
              >
                {req.type === "ride" ? (
                  <TruckIcon size={12} color="currentColor" />
                ) : (
                  <PackageIcon size={12} color="currentColor" />
                )}
                {req.type === "ride" ? "Ride" : "Delivery"} ·{" "}
                {(req.bookingRef ?? req._id ?? "").slice(-6).toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order detail */}
      {selected && (
        <>
          <MapPlaceholder
            pickup={selected.pickupAddress?.address ?? selected.pickup?.address}
            destination={
              selected.dropoffAddress?.address ?? selected.destination?.address
            }
            height="h-48"
          />

          {/* Returned from checkout but the booking isn't marked paid (yet) */}
          {isPandaReturn && !isPaid && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-400">
                Just paid? It can take a few moments for payment confirmation to
                show here. Use the refresh button on the status card to check
                again.
              </p>
            </div>
          )}

          {/* Status */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border
            ${
              selected.status === "completed" || selected.status === "delivered"
                ? "bg-green-500/10 border-green-500/30"
                : selected.status === "cancelled"
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-[#ff2d2d]/10 border-[#ff2d2d]/20"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? "animate-pulse" : ""}
                ${
                  selected.status === "completed" ||
                  selected.status === "delivered"
                    ? "bg-green-400"
                    : selected.status === "cancelled"
                      ? "bg-red-400"
                      : "bg-[#ff2d2d]"
                }`}
              />
              <div>
                <p
                  className={`text-[13px] font-semibold capitalize
                  ${
                    selected.status === "completed" ||
                    selected.status === "delivered"
                      ? "text-green-400"
                      : selected.status === "cancelled"
                        ? "text-red-400"
                        : "text-[#ff2d2d]"
                  }`}
                >
                  {(selected.status ?? "").replace(/_/g, " ")}
                </p>
                <p className="text-[11px] text-[#555]">
                  {selected.type === "ride" ? "Ride" : "Delivery"} · Ref:{" "}
                  <span className="font-mono">{selected.bookingRef ?? ""}</span>
                </p>
              </div>
            </div>
            {isActive && (
              <button
                onClick={refreshStatus}
                className="bg-transparent border-none cursor-pointer text-[#555] hover:text-[#aaa]"
              >
                <RefreshIcon size={14} color="currentColor" />
              </button>
            )}
          </div>

          {/* Rider info */}
          {selected.rider ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center font-bold text-[#ff2d2d] font-[var(--font-syne)] shrink-0">
                {(selected.rider.name ?? "R")
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#e0e0e0]">
                  {selected.rider.name}
                </p>
                <p className="text-[11px] text-[#555]">
                  {selected.rider.rating
                    ? `⭐ ${selected.rider.rating} · `
                    : ""}
                  {selected.rider.vehiclePlateNumber ??
                    selected.rider.vehicleType}
                </p>
              </div>
              {selected.rider.phone && (
                <a
                  href={`tel:${selected.rider.phone}`}
                  className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400 no-underline hover:bg-green-500/20 transition-colors"
                >
                  <PhoneIcon />
                </a>
              )}
            </div>
          ) : isActive ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <TruckIcon size={16} color="#f59e0b" />
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-medium text-[#e0e0e0]">
                  Finding a rider...
                </p>
                <p className="text-[11px] text-[#555]">
                  You'll be matched with an available rider shortly
                </p>
              </div>
              <div className="w-5 h-5 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin shrink-0" />
            </div>
          ) : null}

          {/* Route */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-3 h-3 rounded-full bg-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider">
                  Pickup
                </p>
                <p className="text-[13px] text-[#e0e0e0]">
                  {selected.pickupAddress?.address ?? selected.pickup?.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-4 py-3">
              <MapPinIcon
                size={13}
                color="#ff2d2d"
                className="mt-0.5 shrink-0"
              />
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider">
                  Destination
                </p>
                <p className="text-[13px] text-[#e0e0e0]">
                  {selected.dropoffAddress?.address ??
                    selected.destination?.address}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[12px] text-[#555]">Fare</p>
              <p className="text-[14px] font-bold text-[#f0f0f0] font-[var(--font-syne)]">
                ₦{(selected.fareAmount ?? selected.price ?? 0).toLocaleString()}
              </p>
            </div>
            {paymentStatus && (
              <div className="flex items-center justify-between px-4 py-3">
                <p className="text-[12px] text-[#555]">Payment</p>
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize
                  ${
                    isPaid
                      ? "bg-green-500/15 text-green-400"
                      : paymentStatus === "refunded"
                        ? "bg-blue-500/15 text-blue-400"
                        : "bg-amber-500/15 text-amber-400"
                  }`}
                >
                  {paymentStatus}
                </span>
              </div>
            )}
          </div>

          {/* ETA — only when the API actually supplies one (no invented numbers) */}
          {isActive && selected.rider?.estimatedArrival != null && (
            <ETADisplay
              arrivalMinutes={selected.rider.estimatedArrival}
              deliveryMinutes={
                selected.estimatedDuration != null
                  ? selected.rider.estimatedArrival + selected.estimatedDuration
                  : undefined
              }
              type={selected.type ?? "delivery"}
              status={selected.status}
            />
          )}

          {/* Progress tracker */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-4">
              {selected.type === "ride" ? "Trip Progress" : "Delivery Progress"}
            </h3>
            <StatusTracker
              status={selected.status ?? "requested"}
              type={selected.type ?? "delivery"}
            />
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
            <AlertTriangleIcon
              size={13}
              color="#555"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-[#444]">
              Having issues? Use booking ref{" "}
              <strong className="text-[#666] font-mono">
                {selected.bookingRef ?? ""}
              </strong>{" "}
              to contact support.
            </p>
          </div>
        </>
      )}

      {/* Empty state */}
      {!searched && (
        <div className="flex flex-col items-center py-16 gap-4 text-[#555]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
            <SearchIcon size={28} color="#2a2a2a" />
          </div>
          <p className="text-[14px] font-medium text-[#777]">
            Enter your details above to track
          </p>
          <p className="text-[12px] text-center max-w-xs">
            Use the email, phone or booking reference from your confirmation
          </p>
        </div>
      )}
    </div>
  );
}
