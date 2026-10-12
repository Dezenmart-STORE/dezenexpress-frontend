"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { riderApi, RiderWallet, RiderTransaction } from "@/lib/express/api";
import {
  PackageIcon,
  TruckIcon,
  WalletIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from "@/components/Icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function RiderDashboard() {
  const [wallet, setWallet] = useState<RiderWallet | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [txns, setTxns] = useState<RiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, reqRes, txRes] = await Promise.all([
        riderApi.getWallet(),
        riderApi.getRequests(1, 3),
        riderApi.getTransactions(1, 3),
      ]);
      setWallet(walletRes.data);
      setRequests(reqRes.data?.requests ?? []);
      setTxns(txRes.data?.transactions ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Dashboard
          </h1>
          <p className="text-[12px] text-[#555]">
            Welcome back — you're online
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-xl shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[12px] text-green-400 font-medium">
              Online
            </span>
          </div>
          <button
            onClick={load}
            className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
          >
            <RefreshIcon size={14} color="#555" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {/* Balance card */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-[#ff2d2d]/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          <p className="text-[12px] text-[#555] mb-1">Available Balance</p>
          {loading ? (
            <div className="w-36 h-9 bg-[#2a2a2a] rounded-lg animate-pulse mb-2" />
          ) : (
            <p className="font-[var(--font-syne)] font-bold text-3xl text-[#f0f0f0]">
              ₦{(wallet?.available ?? 0).toLocaleString()}
            </p>
          )}
          <p className="text-[11px] text-[#555] mt-0.5">
            ₦{(wallet?.pending ?? 0).toLocaleString()} pending in escrow
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-[10px] text-[#555]">Total earned</p>
              <p className="text-[14px] font-semibold text-[#e0e0e0]">
                ₦{(wallet?.total ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-px h-8 bg-[#2a2a2a]" />
            <div>
              <p className="text-[10px] text-[#555]">Your share</p>
              <p className="text-[14px] font-semibold text-[#ff2d2d]">85%</p>
            </div>
          </div>
          <Link
            href="/express/rider/earnings"
            className="mt-4 flex items-center gap-1 text-[12px] text-[#ff2d2d] no-underline hover:opacity-75"
          >
            View full earnings <ArrowRightIcon size={12} color="#ff2d2d" />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Requests",
            value: requests.length,
            Icon: PackageIcon,
            color: "text-[#f0f0f0]",
            bg: "bg-[#222]",
          },
          {
            label: "Completed",
            value: txns.filter((t) => t.status === "settled").length,
            Icon: CheckCircleIcon,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
          {
            label: "Pending",
            value: txns.filter((t) => t.status === "pending").length,
            Icon: WalletIcon,
            color: "text-amber-400",
            bg: "bg-amber-500/10",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3"
          >
            <div
              className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center mb-2`}
            >
              <s.Icon size={15} color="currentColor" className={s.color} />
            </div>
            <p
              className={`font-[var(--font-syne)] font-bold text-[18px] ${s.color}`}
            >
              {s.value}
            </p>
            <p className="text-[10px] text-[#555] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* New requests */}
      {requests.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
            <div className="flex items-center gap-2">
              <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                New Requests
              </h3>
              <span className="px-2 py-0.5 bg-[#ff2d2d] text-white text-[10px] font-bold rounded-full">
                {requests.length}
              </span>
            </div>
            <Link
              href="/express/rider/requests"
              className="text-[12px] text-[#ff2d2d] no-underline flex items-center gap-1"
            >
              View all <ArrowRightIcon size={12} color="#ff2d2d" />
            </Link>
          </div>
          <div className="divide-y divide-[#1e1e1e]">
            {requests.map((req) => (
              <div key={req._id} className="flex items-center gap-3 px-5 py-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                  ${req.type === "ride" ? "bg-[#ff2d2d]/10" : "bg-blue-500/10"}`}
                >
                  {req.type === "ride" ? (
                    <TruckIcon size={17} color="#ff2d2d" />
                  ) : (
                    <PackageIcon size={17} color="#3b82f6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#e0e0e0] capitalize">
                    {req.type} Request
                  </p>
                  <p className="text-[11px] text-[#555] truncate">
                    {req.pickupAddress?.address} → {req.dropoffAddress?.address}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-bold text-green-400">
                    ₦{Math.round((req.fareAmount ?? 0) * 0.85).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-[#555]">your 85%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent transactions */}
      {txns.length > 0 && (
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
            <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
              Recent Earnings
            </h3>
            <Link
              href="/express/rider/earnings"
              className="text-[12px] text-[#ff2d2d] no-underline flex items-center gap-1"
            >
              View all <ArrowRightIcon size={12} color="#ff2d2d" />
            </Link>
          </div>
          <div className="divide-y divide-[#1e1e1e]">
            {txns.map((t) => (
              <div key={t._id} className="flex items-center gap-3 px-5 py-3.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                  ${t.status === "settled" ? "bg-green-500/10" : t.status === "withdrawn" ? "bg-[#222]" : "bg-amber-500/10"}`}
                >
                  <TruckIcon
                    size={15}
                    color={
                      t.status === "settled"
                        ? "#22c55e"
                        : t.status === "withdrawn"
                          ? "#666"
                          : "#f59e0b"
                    }
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
                    {t.description}
                  </p>
                  <p className="text-[11px] text-[#555]">
                    {formatDate(t.createdAt)}
                  </p>
                </div>
                <p
                  className={`text-[13px] font-semibold shrink-0 ${t.type === "credit" ? "text-green-400" : "text-red-400"}`}
                >
                  {t.type === "credit" ? "+" : "-"}₦{t.amount.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && requests.length === 0 && txns.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-3 bg-[#1a1a1a] border border-[#222] rounded-2xl">
          <PackageIcon size={40} color="#2a2a2a" />
          <p className="text-[14px] font-medium text-[#777]">No activity yet</p>
          <p className="text-[12px] text-[#555]">
            Stay online to receive ride and delivery requests
          </p>
        </div>
      )}
    </div>
  );
}
