"use client";

import { useState, useEffect, useCallback } from "react";
import { riderApi } from "@/lib/express/api";
import {
  TruckIcon,
  PackageIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

function RequestCard({
  req,
  onAccept,
  onReject,
  loading,
}: {
  req: any;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
              ${req.type === "ride" ? "bg-[#ff2d2d]/10" : "bg-blue-500/10"}`}
            >
              {req.type === "ride" ? (
                <TruckIcon size={16} color="#ff2d2d" />
              ) : (
                <PackageIcon size={16} color="#3b82f6" />
              )}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#e0e0e0] capitalize">
                {req.type} Request
              </p>
              <p className="text-[11px] text-[#555]">from {req.customerName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[16px] font-bold text-green-400 font-[var(--font-syne)]">
              ₦{Math.round((req.fareAmount ?? 0) * 0.85).toLocaleString()}
            </p>
            <p className="text-[10px] text-[#555]">your 85%</p>
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
          {req.distanceKm && (
            <span className="flex items-center gap-1">
              <MapPinIcon size={11} color="#555" />
              {req.distanceKm} km
            </span>
          )}
          <span className="text-[#444]">
            Total: ₦{(req.fareAmount ?? 0).toLocaleString()}
          </span>
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
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onReject}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all disabled:opacity-40"
          >
            <XIcon size={14} color="currentColor" /> Reject
          </button>
          <button
            onClick={onAccept}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-1.5 py-2.5 bg-[#ff2d2d] text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <CheckCircleIcon size={14} color="white" /> Accept — ₦
            {Math.round((req.fareAmount ?? 0) * 0.85).toLocaleString()}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RiderRequests() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actId, setActId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    riderApi
      .getRequests()
      .then((res) => setRequests(res.data?.requests ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const accept = async (id: string) => {
    setActId(id);
    try {
      await riderApi.acceptRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setSuccess("Request accepted! Head to pickup location.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setActId(null);
    }
  };

  const reject = async (id: string) => {
    setActId(id);
    try {
      await riderApi.rejectRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Requests
          </h1>
          <p className="text-[12px] text-[#555]">
            {requests.length} available near you
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[12px] text-green-400 font-medium">
              Online
            </span>
          </div>
          <button
            onClick={load}
            className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333] text-[#555] hover:text-[#aaa]"
          >
            <RefreshIcon size={14} color="currentColor" />
          </button>
        </div>
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

      {success && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
          <CheckCircleIcon size={15} color="currentColor" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center py-20 gap-3">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#555] text-sm">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-[#555]">
          <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
            <PackageIcon size={28} color="#333" />
          </div>
          <p className="text-[15px] font-medium text-[#777]">
            No requests right now
          </p>
          <p className="text-[12px] text-center max-w-xs">
            Stay online and new requests will appear here
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {requests.map((req) => (
            <RequestCard
              key={req._id}
              req={req}
              onAccept={() => accept(req._id)}
              onReject={() => reject(req._id)}
              loading={actId === req._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
