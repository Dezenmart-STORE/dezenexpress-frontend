"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  expressBookingApi,
  normalizeBooking,
  Booking,
  ApiError,
} from "@/lib/express/api";
import StatusTracker from "../shared/StatusTracker";
import MapPlaceholder from "../shared/MapPlaceholder";
import BankTransferPayment from "./BankTransferPayment";
import {
  MapPinIcon,
  SearchIcon,
  TruckIcon,
  PackageIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

const FINISHED = ["completed", "cancelled"];
const POLL_MS = 10000;

function formatNGN(n: number) {
  return `₦${Number(n).toLocaleString("en-NG")}`;
}

export default function TrackService() {
  const searchParams = useSearchParams();
  // Links use ?booking=<ref>; the old ?ref= is still accepted. Anything after a
  // stray "?" is dropped.
  const refFromUrl = (
    searchParams.get("booking") ??
    searchParams.get("ref") ??
    ""
  )
    .split("?")[0]
    .trim();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookup, setLookup] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected?.bookingRef ?? null;

  const select = (b: Booking | null) => {
    setSelected(b);
    setShowPay(false);
  };

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await expressBookingApi.listOrders(1, 20);
      const list = res.data?.bookings ?? [];
      setBookings(list);

      let chosen: Booking | null = null;
      if (refFromUrl) {
        chosen = list.find((b) => b.bookingRef === refFromUrl) ?? null;
        if (!chosen) {
          try {
            chosen = normalizeBooking(
              await expressBookingApi.getOrder(refFromUrl),
            );
          } catch (err) {
            setError(
              err instanceof ApiError && err.status === 404
                ? "We couldn't find that booking on your account."
                : err instanceof Error
                  ? err.message
                  : "Could not load that booking",
            );
          }
        }
      }
      select(
        chosen ??
          list.find((b) => !FINISHED.includes(b.status)) ??
          list[0] ??
          null,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load your bookings",
      );
    } finally {
      setLoading(false);
    }
  }, [refFromUrl]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Light status polling while a booking is still moving.
  const refreshSelected = useCallback(async () => {
    const ref = selectedRef.current;
    if (!ref) return;
    try {
      const res = await expressBookingApi.getOrderStatus(ref);
      const snap = res.data ?? {};
      const merge = (b: Booking): Booking =>
        b.bookingRef === ref
          ? {
              ...b,
              status: snap.status ?? b.status,
              paymentStatus: snap.paymentStatus ?? b.paymentStatus,
              assignedRider: snap.assignedRider ?? b.assignedRider,
              cancelledBy:
                (snap.cancelledBy as string | undefined) ?? b.cancelledBy,
              refund:
                snap.refundStatus && b.refund
                  ? {
                      ...b.refund,
                      status: snap.refundStatus as "pending" | "completed",
                    }
                  : b.refund,
            }
          : b;
      setSelected((prev) => (prev ? merge(prev) : prev));
      setBookings((prev) => prev.map(merge));
    } catch {}
  }, []);

  useEffect(() => {
    if (!selected || FINISHED.includes(selected.status)) return;
    const id = setInterval(refreshSelected, POLL_MS);
    return () => clearInterval(id);
  }, [selected, refreshSelected]);

  const handleLookup = async () => {
    const ref = lookup.trim();
    if (!ref) return;
    setLookingUp(true);
    setError(null);
    try {
      const b = normalizeBooking(await expressBookingApi.getOrder(ref));
      select(b);
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 404
          ? "No booking with that reference on your account."
          : err instanceof Error
            ? err.message
            : "Lookup failed",
      );
    } finally {
      setLookingUp(false);
    }
  };

  const handleCancel = async () => {
    if (!selected) return;
    if (!confirm("Cancel this booking?")) return;
    setCancelling(true);
    setError(null);
    try {
      await expressBookingApi.cancelOrder(
        selected.bookingRef,
        "Cancelled by customer",
      );
    } catch (err) {
      // 400/409: a rider got there first — refresh and show the new status.
      setError(err instanceof Error ? err.message : "Could not cancel");
    } finally {
      await loadAll();
      setCancelling(false);
    }
  };

  const status = selected?.status ?? "";
  const paymentStatus = selected?.paymentStatus ?? "";
  const isPaid = paymentStatus === "paid";
  const isActive = !!selected && !FINISHED.includes(status);
  const isRide = selected?.type === "ride";
  // Rides: the customer picked a rider who must confirm first; payment opens after that.
  const awaitingRider = !!selected && isRide && status === "pending";
  const needsPayment =
    !!selected &&
    !isPaid &&
    (isRide ? status === "rider_accepted" : status === "pending");
  const declinedByRider =
    !!selected && status === "cancelled" && selected.cancelledBy === "rider";
  const rider = selected?.assignedRider;
  const codeSent = status === "in_progress" || status === "arrived_at_dropoff";

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Track Your Order
          </h1>
          <p className="text-[12px] text-[#555]">
            Your rides and deliveries, live
          </p>
        </div>
        <button
          onClick={loadAll}
          className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
          aria-label="Refresh"
        >
          <RefreshIcon size={14} color="#555" />
        </button>
      </div>

      {/* Look up by reference */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 gap-2 focus-within:border-[#ff2d2d] transition-colors">
          <SearchIcon size={15} color="#555" />
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder="Booking reference e.g. RID-20261016-ABC123"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e0e0e0] placeholder:text-[#444]"
          />
        </div>
        <button
          onClick={handleLookup}
          disabled={lookingUp}
          className="px-5 py-3 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
        >
          {lookingUp ? "..." : "Find"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Booking selector */}
      {!loading && bookings.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {bookings.map((b) => (
            <button
              key={b.id}
              onClick={() => select(b)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] cursor-pointer transition-all whitespace-nowrap shrink-0
                ${selected?.bookingRef === b.bookingRef ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40 text-[#ff2d2d]" : "bg-[#1a1a1a] border-[#222] text-[#666] hover:border-[#333]"}`}
            >
              {b.type === "ride" ? (
                <TruckIcon size={12} color="currentColor" />
              ) : (
                <PackageIcon size={12} color="currentColor" />
              )}
              {b.type === "ride" ? "Ride" : "Delivery"} ·{" "}
              {b.bookingRef.slice(-6)}
            </button>
          ))}
        </div>
      )}

      {!loading && !selected && !error && (
        <div className="flex flex-col items-center py-16 gap-3 text-[#555]">
          <p className="text-[14px] font-medium text-[#777]">No bookings yet</p>
          <p className="text-[12px] text-center max-w-xs">
            Book a ride or a delivery and it will show up here.
          </p>
        </div>
      )}

      {selected && (
        <>
          <MapPlaceholder
            pickup={selected.pickupAddress?.address}
            destination={selected.dropoffAddress?.address}
            height="h-44"
          />

          {/* Status banner */}
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-xl border
            ${status === "completed" ? "bg-green-500/10 border-green-500/30" : status === "cancelled" ? "bg-red-500/10 border-red-500/30" : "bg-[#ff2d2d]/10 border-[#ff2d2d]/20"}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 ${isActive ? "animate-pulse" : ""}
                ${status === "completed" ? "bg-green-400" : status === "cancelled" ? "bg-red-400" : "bg-[#ff2d2d]"}`}
              />
              <div className="min-w-0">
                <p
                  className={`text-[13px] font-semibold capitalize
                  ${status === "completed" ? "text-green-400" : status === "cancelled" ? "text-red-400" : "text-[#ff2d2d]"}`}
                >
                  {status.replace(/_/g, " ")}
                </p>
                <p className="text-[11px] text-[#555] truncate">
                  {selected.type === "ride" ? "Ride" : "Delivery"} ·{" "}
                  <span className="font-mono">{selected.bookingRef}</span>
                </p>
              </div>
            </div>
            {isActive && (
              <button
                onClick={refreshSelected}
                className="bg-transparent border-none cursor-pointer text-[#555] hover:text-[#aaa]"
                aria-label="Refresh status"
              >
                <RefreshIcon size={14} color="currentColor" />
              </button>
            )}
          </div>

          {/* Ride sent to a specific rider who hasn't answered yet */}
          {awaitingRider && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[12px] text-amber-400">
                Waiting for {selected.assignedRider?.name ?? "your rider"} to
                confirm your ride. You can pay as soon as they do. If they
                decline, you can book a different rider.
              </p>
            </div>
          )}

          {/* The rider said no */}
          {declinedByRider && (
            <div className="flex items-center justify-between gap-3 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-[12px] text-red-400">
                {selected.assignedRider?.name ?? "The rider"} declined this
                ride. You haven't been charged.
              </p>
              <Link
                href="/express/customer/book-ride"
                className="shrink-0 px-3 py-1.5 bg-[#ff2d2d] text-white rounded-lg text-[11px] font-semibold no-underline hover:opacity-90"
              >
                Pick another rider
              </Link>
            </div>
          )}

          {/* Payment needed */}
          {needsPayment && (
            <div className="bg-[#1a1a1a] border border-amber-500/30 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon
                  size={14}
                  color="#f59e0b"
                  className="shrink-0 mt-0.5"
                />
                <p className="text-[12px] text-amber-400">
                  {isRide
                    ? "Your rider confirmed your ride. Pay now to lock it in."
                    : "This booking hasn't been paid yet. A rider can only take it once it's paid."}{" "}
                  Unpaid bookings are cancelled after 24 hours.
                </p>
              </div>
              {showPay ? (
                <BankTransferPayment
                  bookingRef={selected.bookingRef}
                  onPaid={() => {
                    setShowPay(false);
                    refreshSelected();
                  }}
                  onCancelled={loadAll}
                />
              ) : (
                <button
                  onClick={() => setShowPay(true)}
                  className="w-full py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
                >
                  Pay {formatNGN(selected.fareAmount)} by bank transfer
                </button>
              )}
            </div>
          )}

          {/* Rider */}
          {rider ? (
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center font-bold text-[#ff2d2d] font-[var(--font-syne)] shrink-0">
                {(rider.name ?? "R")
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#e0e0e0]">
                  {rider.name}
                </p>
                <p className="text-[11px] text-[#555] capitalize">
                  {rider.rating ? `⭐ ${rider.rating} · ` : ""}
                  {rider.vehicleType}
                  {rider.vehiclePlateNumber
                    ? ` · ${rider.vehiclePlateNumber}`
                    : ""}
                </p>
              </div>
              {rider.phone && (
                <a
                  href={`tel:${rider.phone}`}
                  className="px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[12px] font-semibold no-underline hover:bg-green-500/20"
                >
                  Call
                </a>
              )}
            </div>
          ) : (
            isActive &&
            isPaid &&
            !isRide &&
            status === "pending" && (
              <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <TruckIcon size={16} color="#f59e0b" />
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#e0e0e0]">
                    Finding you a rider…
                  </p>
                  <p className="text-[11px] text-[#555]">
                    Payment received. This page updates when a rider accepts.
                  </p>
                </div>
                <div className="w-5 h-5 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin shrink-0" />
              </div>
            )
          )}

          {/* Completion code notice */}
          {codeSent && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-400">
                A 6-digit completion code was emailed to you
                {selected.recipientEmail
                  ? ` and ${selected.recipientEmail}`
                  : ""}
                . Give it to the rider only when you've arrived and everything
                is delivered. It expires after 5 minutes; the rider can send a
                new one.
              </p>
            </div>
          )}

          {/* Refund */}
          {selected.refund && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-[12px] text-blue-400">
                {selected.refund.status === "completed"
                  ? `Refund of ${formatNGN(selected.refund.amount)} has been paid back.`
                  : `Refund of ${formatNGN(selected.refund.amount)} is on its way.`}
              </p>
            </div>
          )}

          {/* Route + fare */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="w-3 h-3 rounded-full bg-green-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] text-[#555] uppercase tracking-wider">
                  Pickup
                </p>
                <p className="text-[13px] text-[#e0e0e0]">
                  {selected.pickupAddress?.address}
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
                  {selected.dropoffAddress?.address}
                </p>
              </div>
            </div>
            {selected.package && (
              <div className="flex items-center justify-between px-4 py-3 gap-4">
                <p className="text-[12px] text-[#555]">Package</p>
                <p className="text-[12px] text-[#aaa] text-right capitalize">
                  {selected.package.sizeCategory} ·{" "}
                  {selected.package.description}
                </p>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[12px] text-[#555]">Fare</p>
              <p className="text-[14px] font-bold text-[#f0f0f0] font-[var(--font-syne)]">
                {formatNGN(selected.fareAmount ?? 0)}
              </p>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-[12px] text-[#555]">Payment</p>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize
                ${isPaid ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}
              >
                {paymentStatus || "unpaid"}
              </span>
            </div>
          </div>

          {/* Progress */}
          {status !== "cancelled" && (
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
              <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-4">
                {selected.type === "ride"
                  ? "Trip Progress"
                  : "Delivery Progress"}
              </h3>
              <StatusTracker
                status={status}
                paymentStatus={paymentStatus}
                type={selected.type}
              />
            </div>
          )}

          {/* Cancel — while pending, or after the rider confirmed a ride but before you pay */}
          {(status === "pending" ||
            (status === "rider_accepted" && !isPaid)) && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-2.5 bg-transparent border border-red-500/30 text-red-400 rounded-xl text-[13px] font-medium cursor-pointer hover:bg-red-500/10 disabled:opacity-40"
            >
              {cancelling ? "Cancelling…" : "Cancel booking"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
