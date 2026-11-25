"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { expressBookingApi, Booking } from "@/lib/express/api";
import {
  TruckIcon,
  PackageIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

const LIMIT = 10;

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
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  accepted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  rider_accepted: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  arrived_at_pickup: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  arrived_at_dropoff: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
};

export default function ServiceHistory() {
  const [orders, setOrders] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await expressBookingApi.listOrders(1, LIMIT);
      setOrders(res.data?.bookings ?? []);
      setTotal(res.data?.total ?? 0);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await expressBookingApi.listOrders(next, LIMIT);
      setOrders((prev) => [...prev, ...(res.data?.bookings ?? [])]);
      setTotal(res.data?.total ?? total);
      setPage(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Order History
          </h1>
          <p className="text-[12px] text-[#555]">
            Your past rides and deliveries
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
          aria-label="Refresh"
        >
          <RefreshIcon size={14} color="#555" />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading your bookings...</p>
        </div>
      ) : orders.length === 0 && !error ? (
        <div className="flex flex-col items-center py-16 gap-3 text-[#555]">
          <p className="text-[14px] font-medium text-[#777]">No bookings yet</p>
          <Link
            href="/express/customer/book-ride"
            className="px-5 py-2 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-xl text-[12px] font-semibold no-underline hover:bg-[#ff2d2d]/20"
          >
            Book a ride →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-[#555]">
            {total} booking{total !== 1 ? "s" : ""}
          </p>
          {orders.map((order) => {
            const isRide = order.type === "ride";
            // Rides open for payment once the rider confirms; deliveries right after booking.
            const payable = isRide
              ? order.status === "rider_accepted"
              : order.status === "pending";
            const unpaid = payable && order.paymentStatus !== "paid";
            const waitingForRider = isRide && order.status === "pending";
            const finished = ["completed", "cancelled"].includes(order.status);
            return (
              <div
                key={order.id}
                className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e]">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isRide ? "bg-[#ff2d2d]/10" : "bg-blue-500/10"}`}
                  >
                    {isRide ? (
                      <TruckIcon size={16} color="#ff2d2d" />
                    ) : (
                      <PackageIcon size={16} color="#3b82f6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#e0e0e0] capitalize">
                      {order.type}
                    </p>
                    <p className="text-[11px] text-[#555] truncate">
                      <span className="font-mono">{order.bookingRef}</span> ·{" "}
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_STYLES[order.status] ?? "bg-[#222] text-[#666] border-[#333]"}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

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
                </div>

                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div>
                    <p className="text-[14px] font-bold text-[#f0f0f0] font-[var(--font-syne)]">
                      {formatNGN(order.fareAmount ?? 0)}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize
                      ${order.paymentStatus === "paid" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}
                    >
                      {order.paymentStatus}
                    </span>
                    {waitingForRider && (
                      <span className="ml-2 text-[10px] text-amber-400">
                        Waiting for rider
                      </span>
                    )}
                    {order.refund && (
                      <span className="ml-2 text-[10px] text-blue-400">
                        Refund{" "}
                        {order.refund.status === "completed"
                          ? "paid"
                          : "on its way"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unpaid && (
                      <Link
                        href={`/express/customer/track?booking=${encodeURIComponent(order.bookingRef)}`}
                        className="px-3 py-1.5 bg-[#ff2d2d] border border-[#ff2d2d] text-white rounded-lg text-[11px] font-semibold no-underline hover:opacity-90"
                      >
                        Pay now
                      </Link>
                    )}
                    {!finished && !unpaid && (
                      <Link
                        href={`/express/customer/track?booking=${encodeURIComponent(order.bookingRef)}`}
                        className="px-3 py-1.5 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-lg text-[11px] font-semibold no-underline hover:bg-[#ff2d2d]/20"
                      >
                        Track →
                      </Link>
                    )}
                    <Link
                      href={
                        isRide
                          ? "/express/customer/book-ride"
                          : "/express/customer/book-delivery"
                      }
                      className="px-3 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] rounded-lg text-[11px] font-semibold no-underline hover:border-[#333]"
                    >
                      Rebook
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {orders.length < total && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-2.5 bg-[#1a1a1a] border border-[#222] text-[#aaa] rounded-xl text-[13px] cursor-pointer hover:border-[#333] disabled:opacity-40"
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
