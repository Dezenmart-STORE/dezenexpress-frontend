"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { riderApi, RiderRequest } from "@/lib/express/api";
import {
  TruckIcon,
  PackageIcon,
  MapPinIcon,
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

const POLL_MS = 20000;

function RequestCard({
  req,
  onAccept,
  onReject,
  loading,
  acceptLabel = "Accept",
  rejectLabel = "Reject",
}: {
  req: RiderRequest;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
  acceptLabel?: string;
  rejectLabel?: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${req.type === "ride" ? "bg-[#ff2d2d]/10" : "bg-blue-500/10"}`}
            >
              {req.type === "ride" ? (
                <TruckIcon size={16} color="#ff2d2d" />
              ) : (
                <PackageIcon size={16} color="#3b82f6" />
              )}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#e0e0e0] capitalize">
                {req.type} request
              </p>
              <p className="text-[11px] text-[#555] font-mono">
                {req.bookingRef}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-bold text-green-400 font-[var(--font-syne)]">
              ₦{(req.fareAmount ?? 0).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#555]">
              fare · you earn it minus the platform fee
            </p>
          </div>
        </div>

        <div className="bg-[#111] border border-[#2a2a2a] rounded-xl divide-y divide-[#1e1e1e]">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0" />
            <p className="text-[12px] text-[#aaa] truncate">
              {req.pickupAddress?.address}
            </p>
          </div>
          <div className="flex items-center gap-3 px-3 py-2.5">
            <MapPinIcon size={12} color="#ff2d2d" className="shrink-0" />
            <p className="text-[12px] text-[#aaa] truncate">
              {req.dropoffAddress?.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-[#555]">
          {req.distanceKm ? (
            <span className="flex items-center gap-1">
              <MapPinIcon size={11} color="#555" />
              {req.distanceKm} km
            </span>
          ) : null}
          {req.type === "ride" && (
            <span className="capitalize">
              {req.rideType ?? "standard"} · {req.passengerCount ?? 1} passenger
              {(req.passengerCount ?? 1) !== 1 ? "s" : ""}
            </span>
          )}
          {req.customerName && <span>Customer: {req.customerName}</span>}
        </div>

        {req.package && (
          <div className="flex items-start gap-2 px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-xl">
            <AlertTriangleIcon
              size={13}
              color="#3b82f6"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-blue-400">
              {req.package.sizeCategory} package · {req.package.description}
              {req.package.weightKg ? ` · ${req.package.weightKg} kg` : ""}
            </p>
          </div>
        )}

        {req.notes && (
          <p className="text-[11px] text-[#777]">Note: {req.notes}</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all disabled:opacity-40"
          >
            <XIcon size={14} color="currentColor" /> {rejectLabel}
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-[#ff2d2d] text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <CheckCircleIcon size={14} color="white" />
            {loading ? "Working…" : acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RiderRequests() {
  const [rides, setRides] = useState<RiderRequest[]>([]);
  const [deliveries, setDeliveries] = useState<RiderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actId, setActId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showActiveLink, setShowActiveLink] = useState(false);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    // Load both lists independently so one failing doesn't hide the other.
    Promise.allSettled([riderApi.getRideRequests(), riderApi.getRequests()])
      .then(([rideRes, delRes]) => {
        if (rideRes.status === "fulfilled") {
          const d = rideRes.value.data;
          setRides(d?.bookings ?? d?.requests ?? []);
        }
        if (delRes.status === "fulfilled") {
          setDeliveries(delRes.value.data?.bookings ?? []);
        }
        if (!silent) {
          const failed = [rideRes, delRes].find(
            (r) => r.status === "rejected",
          ) as PromiseRejectedResult | undefined;
          setError(
            failed
              ? (failed.reason?.message ?? "Could not load requests")
              : null,
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const run = async (
    id: string,
    action: () => Promise<unknown>,
    after: () => void,
    successNotice?: string,
    activeLink = false,
  ) => {
    setActId(id);
    setError(null);
    try {
      await action();
      after();
      if (successNotice) {
        setNotice(successNotice);
        setShowActiveLink(activeLink);
      }
    } catch (err: unknown) {
      // 409 messages (no longer available, you're offline, you have another job…)
      // are written to be shown as-is.
      setError(err instanceof Error ? err.message : "That didn't work");
      load(true);
    } finally {
      setActId(null);
    }
  };

  const total = rides.length + deliveries.length;

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Requests
          </h1>
          <p className="text-[12px] text-[#555]">
            {total} request{total !== 1 ? "s" : ""} waiting for you
          </p>
        </div>
        <button
          onClick={() => load()}
          className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333] text-[#555] hover:text-[#aaa]"
          aria-label="Refresh"
        >
          <RefreshIcon size={14} color="currentColor" />
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon size={13} color="currentColor" />
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            className="bg-transparent border-none cursor-pointer"
          >
            <XIcon size={12} color="currentColor" />
          </button>
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
          <span className="flex items-center gap-2">
            <CheckCircleIcon size={15} color="currentColor" />
            {notice}
          </span>
          {showActiveLink && (
            <Link
              href="/express/rider/active"
              className="text-[12px] font-semibold text-green-300 no-underline hover:underline shrink-0"
            >
              Open →
            </Link>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading requests...</p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-[#555]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
            <PackageIcon size={28} color="#333" />
          </div>
          <p className="text-[15px] font-medium text-[#777]">
            No requests right now
          </p>
          <p className="text-[12px] text-center max-w-xs">
            Go online from your profile. Ride requests chosen for you and paid
            delivery requests show up here automatically.
          </p>
        </div>
      ) : (
        <>
          {rides.length > 0 && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                  Ride requests for you
                </h2>
                <p className="text-[11px] text-[#555]">
                  A customer picked you. Confirm so they can pay. If you
                  decline, they can choose another rider.
                </p>
              </div>
              {rides.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  loading={actId === req.id}
                  acceptLabel="Confirm ride"
                  rejectLabel="Decline"
                  onAccept={() =>
                    run(
                      req.id,
                      () => riderApi.confirmRideRequest(req.id),
                      () =>
                        setRides((prev) => prev.filter((r) => r.id !== req.id)),
                      "Confirmed. The customer can pay now, and the ride shows up in your active jobs once they do.",
                    )
                  }
                  onReject={() =>
                    run(
                      req.id,
                      () => riderApi.rejectRideRequest(req.id),
                      () =>
                        setRides((prev) => prev.filter((r) => r.id !== req.id)),
                    )
                  }
                />
              ))}
            </section>
          )}

          {deliveries.length > 0 && (
            <section className="flex flex-col gap-3">
              <div>
                <h2 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                  Delivery requests
                </h2>
                <p className="text-[11px] text-[#555]">
                  Paid deliveries open to every rider. First to accept gets it.
                </p>
              </div>
              {deliveries.map((req) => (
                <RequestCard
                  key={req.id}
                  req={req}
                  loading={actId === req.id}
                  onAccept={() =>
                    run(
                      req.id,
                      () => riderApi.acceptRequest(req.id),
                      () =>
                        setDeliveries((prev) =>
                          prev.filter((r) => r.id !== req.id),
                        ),
                      "Accepted! Customer details are now in your active jobs.",
                      true,
                    )
                  }
                  onReject={() =>
                    run(
                      req.id,
                      () => riderApi.rejectRequest(req.id),
                      () =>
                        setDeliveries((prev) =>
                          prev.filter((r) => r.id !== req.id),
                        ),
                    )
                  }
                />
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
