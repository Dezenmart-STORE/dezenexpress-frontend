"use client";

import { useState, useEffect, useCallback } from "react";
import { riderApi } from "@/lib/express/api";
import StatusTracker from "../shared/StatusTracker";
import MapPlaceholder from "../shared/MapPlaceholder";
import {
  MapPinIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

export default function ActiveService() {
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [actLoading, setActLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load active booking — first accepted request becomes active
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riderApi.getRequests(1, 10);
      const active = (res.data?.requests ?? []).find((r: any) =>
        [
          "accepted",
          "arrived",
          "picked_up",
          "in_transit",
          "trip_started",
        ].includes(r.status),
      );
      setBooking(active ?? null);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to load active service",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async () => {
    if (!booking) return;
    setActLoading(true);
    setError(null);
    try {
      await riderApi.updateStatus(booking._id, "in_progress");
      setBooking((prev: any) => ({ ...prev, status: "in_progress" }));
      setSuccess("Status updated successfully");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (!booking || !otp.trim()) return setOtpError("Enter the OTP");
    setActLoading(true);
    setOtpError(null);
    try {
      await riderApi.verifyOtp(booking._id, otp.trim());
      setBooking((prev: any) => ({ ...prev, status: "delivered" }));
      setSuccess("Service completed! Earnings will be credited shortly.");
      setOtp("");
    } catch (err: unknown) {
      setOtpError(
        err instanceof Error
          ? err.message
          : "Invalid OTP — ask the customer again",
      );
    } finally {
      setActLoading(false);
    }
  };

  const isCompleted = ["delivered", "trip_completed", "completed"].includes(
    booking?.status ?? "",
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading active service...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Active Service
          </h1>
          <p className="text-[12px] text-[#555]">
            Your current ride or delivery
          </p>
        </div>
        <div className="flex flex-col items-center py-20 gap-4 text-[#555] bg-[#1a1a1a] border border-[#222] rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#111] border border-[#222] flex items-center justify-center">
            <RefreshIcon size={28} color="#2a2a2a" />
          </div>
          <p className="text-[15px] font-medium text-[#777]">
            No active service
          </p>
          <p className="text-[12px] text-center max-w-xs">
            Accept a request from the Requests tab to start
          </p>
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-xl text-[12px] cursor-pointer hover:bg-[#ff2d2d]/20"
          >
            <RefreshIcon size={13} color="currentColor" /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Active Service
          </h1>
          <p className="text-[12px] text-[#555]">
            Manage your current {booking.type}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
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
      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[12px] text-green-400">
          <CheckCircleIcon size={13} color="currentColor" />
          {success}
        </div>
      )}

      {/* Map */}
      <MapPlaceholder
        pickup={booking.pickupAddress?.address}
        destination={booking.dropoffAddress?.address}
        height="h-48"
      />

      {/* Customer info */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center font-bold text-[#ff2d2d] font-[var(--font-syne)] shrink-0">
          {(booking.customerName ?? "C")
            .split(" ")
            .map((w: string) => w[0])
            .join("")
            .toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-[#e0e0e0]">
            {booking.customerName}
          </p>
          <p className="text-[12px] text-[#555]">{booking.customerPhone}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-bold text-green-400">
            ₦{Math.round((booking.fareAmount ?? 0) * 0.85).toLocaleString()}
          </p>
          <p className="text-[10px] text-[#555]">your earnings</p>
        </div>
      </div>

      {/* Route */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
        <div className="flex items-start gap-3 px-4 py-3">
          <div className="w-3 h-3 rounded-full bg-green-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Pickup
            </p>
            <p className="text-[13px] text-[#e0e0e0]">
              {booking.pickupAddress?.address}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 px-4 py-3">
          <MapPinIcon size={13} color="#ff2d2d" className="mt-0.5 shrink-0" />
          <div>
            <p className="text-[10px] text-[#555] uppercase tracking-wider">
              Destination
            </p>
            <p className="text-[13px] text-[#e0e0e0]">
              {booking.dropoffAddress?.address}
            </p>
          </div>
        </div>
        {booking.package && (
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[12px] text-[#555]">Package</p>
            <p className="text-[12px] text-[#aaa]">
              {booking.package.sizeCategory} · {booking.package.description}
            </p>
          </div>
        )}
      </div>

      {/* Status tracker */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
        <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-4">
          Progress
        </h3>
        <StatusTracker
          status={booking.status ?? "accepted"}
          type={booking.type ?? "delivery"}
        />
      </div>

      {/* Completed */}
      {isCompleted ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center bg-[#1a1a1a] border border-[#222] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
            <CheckCircleIcon size={32} color="#22c55e" />
          </div>
          <div>
            <p className="font-[var(--font-syne)] font-bold text-[18px] text-[#f0f0f0]">
              Service Completed!
            </p>
            <p className="text-[13px] text-[#555] mt-1">
              ₦{Math.round((booking.fareAmount ?? 0) * 0.85).toLocaleString()}{" "}
              will be credited to your wallet
            </p>
          </div>
        </div>
      ) : (
        /* Next action */
        <div className="flex flex-col gap-3 bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
          <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
            Next Action
          </h3>

          {/* OTP input — needed for arrival and delivery */}
          <div className="flex flex-col gap-2">
            <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-400">
                Ask the customer for their OTP to proceed
              </p>
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="Enter OTP from customer"
              maxLength={4}
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[18px] text-[#e0e0e0] font-mono text-center tracking-widest focus:border-[#ff2d2d] focus:outline-none"
            />
            {otpError && <p className="text-[11px] text-red-400">{otpError}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={updateStatus}
              disabled={actLoading}
              className="flex-1 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] rounded-xl text-[13px] cursor-pointer hover:border-[#444] hover:text-[#e0e0e0] transition-all disabled:opacity-30"
            >
              {actLoading ? "..." : "Update Status"}
            </button>
            <button
              onClick={verifyOtp}
              disabled={actLoading || otp.length < 4}
              className="flex-[2] py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {actLoading ? "Verifying..." : "Verify OTP & Complete"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
