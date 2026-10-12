"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { expressBookingApi } from "@/lib/express/api";
import {
  SearchIcon,
  TruckIcon,
  PackageIcon,
  AlertTriangleIcon,
  StarIcon,
} from "@/components/Icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNGN(n: number) {
  return `₦${Number(n).toLocaleString("en-NG")}`;
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  delivered: "bg-green-500/15 text-green-400 border-green-500/30",
  trip_completed: "bg-green-500/15 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function ServiceHistory() {
  const [lookup, setLookup] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const load = useCallback(
    async (query = lookup) => {
      const q = query.trim();
      if (!q) return setError("Enter your email or phone number");
      setLoading(true);
      setSearched(true);
      setError(null);
      try {
        const params = q.includes("@") ? { email: q } : { phone: q };
        const res = await expressBookingApi.lookupOrders(params);
        // Real response: { status, data: { bookings: [...], total, page, limit } }
        const list: any[] = [
          ...(res.data?.bookings ?? res.data?.orders ?? []),
        ].map((o) => ({ ...o, _id: o._id ?? o.id }));
        // Sort newest first
        list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        );
        setOrders(list);
        if (list.length === 0) setError("No orders found for this contact");
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Could not load history");
        setOrders([]);
      } finally {
        setLoading(false);
      }
    },
    [lookup],
  );

  const handleRating = (orderId: string, stars: number) => {
    setRatings((prev) => ({ ...prev, [orderId]: stars }));
    // TODO: POST /express/orders/:id/rate { rating: stars } — no such endpoint in the API docs yet
  };

  const isCompleted = (status: string) =>
    ["completed", "delivered", "trip_completed"].includes(status ?? "");

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Order History
        </h1>
        <p className="text-[12px] text-[#555]">
          Look up past rides and deliveries by email or phone
        </p>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex items-center bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 gap-2 focus-within:border-[#ff2d2d] transition-colors">
          <SearchIcon size={15} color="#555" />
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Email or phone number..."
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e0e0e0] placeholder:text-[#444]"
          />
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="px-5 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
        >
          {loading ? "..." : "Search"}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading orders...</p>
        </div>
      ) : searched && orders.length > 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-[#555]">
            {orders.length} order{orders.length !== 1 ? "s" : ""} found
          </p>
          {orders.map((order) => {
            const status = order.status ?? "pending";
            const type = order.type ?? (order.package ? "delivery" : "ride");
            const completed = isCompleted(status);
            const key = order._id ?? order.bookingRef;
            const rated = ratings[key];
            const paymentStatus: string | undefined = order.paymentStatus;

            return (
              <div
                key={key}
                className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e]">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                    ${type === "ride" ? "bg-[#ff2d2d]/10" : "bg-blue-500/10"}`}
                  >
                    {type === "ride" ? (
                      <TruckIcon size={16} color="#ff2d2d" />
                    ) : (
                      <PackageIcon size={16} color="#3b82f6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#e0e0e0] capitalize">
                      {type}
                    </p>
                    <p className="text-[11px] text-[#555] truncate">
                      <span className="font-mono">
                        {order.bookingRef ?? "—"}
                      </span>
                      {order.createdAt
                        ? ` · ${formatDate(order.createdAt)}`
                        : ""}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize
                    ${STATUS_STYLES[status] ?? "bg-[#222] text-[#666] border-[#333]"}`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Route */}
                <div className="px-4 py-3 flex flex-col gap-1.5 border-b border-[#1e1e1e]">
                  <div className="flex items-center gap-2 text-[12px]">
                    <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                    <span className="text-[#aaa] truncate">
                      {order.pickupAddress?.address ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px]">
                    <div className="w-2 h-2 rounded-full bg-[#ff2d2d] shrink-0" />
                    <span className="text-[#aaa] truncate">
                      {order.dropoffAddress?.address ?? "—"}
                    </span>
                  </div>
                  {order.package && (
                    <div className="flex items-center gap-2 text-[11px] text-[#555] mt-0.5">
                      <PackageIcon size={11} color="#555" />
                      <span className="capitalize">
                        {order.package.sizeCategory} package ·{" "}
                        {order.package.description}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#f0f0f0] font-[var(--font-syne)]">
                      {formatNGN(order.fareAmount ?? 0)}
                    </p>
                    <div className="flex items-center gap-2">
                      {paymentStatus && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize
                          ${
                            paymentStatus === "paid"
                              ? "bg-green-500/15 text-green-400"
                              : paymentStatus === "refunded"
                                ? "bg-blue-500/15 text-blue-400"
                                : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      )}
                      {order.rider?.name && (
                        <p className="text-[11px] text-[#555]">
                          Rider: {order.rider.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Star rating for completed orders */}
                    {completed && (
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRating(key, star)}
                            className="bg-transparent border-none cursor-pointer p-0.5"
                          >
                            <StarIcon
                              size={16}
                              color={
                                star <= (rated ?? 0) ? "#f59e0b" : "#2a2a2a"
                              }
                            />
                          </button>
                        ))}
                      </div>
                    )}
                    {/* Track if active */}
                    {!completed && status !== "cancelled" && (
                      <Link
                        href={`/express/customer/track?booking=${order.bookingRef}`}
                        className="px-3 py-1.5 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-lg text-[11px] font-semibold no-underline hover:bg-[#ff2d2d]/20"
                      >
                        Track →
                      </Link>
                    )}
                    {/* Rebook */}
                    <Link
                      href={
                        type === "ride"
                          ? "/express/customer/book-ride"
                          : "/express/customer/book-delivery"
                      }
                      className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] rounded-lg text-[11px] font-semibold no-underline hover:border-[#333]"
                    >
                      Rebook
                    </Link>
                  </div>
                </div>

                {/* Rating thanks */}
                {rated && (
                  <div className="px-4 py-2 bg-amber-500/5 border-t border-amber-500/20 text-[11px] text-amber-400">
                    ⭐ Thanks for rating this {type}!
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : !searched ? (
        <div className="flex flex-col items-center py-16 gap-4 text-[#555]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
            <ClockIcon size={28} color="#2a2a2a" />
          </div>
          <p className="text-[14px] font-medium text-[#777]">
            Enter your details to view history
          </p>
          <p className="text-[12px] text-center max-w-xs">
            Use the email or phone number from your bookings
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ClockIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
