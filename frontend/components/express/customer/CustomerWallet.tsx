"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { expressBookingApi } from "@/lib/express/api";
import {
  AlertTriangleIcon,
  RefreshIcon,
  CheckCircleIcon,
  WalletIcon,
  ArrowRightIcon,
} from "@/components/Icons";

// ─── Types ────────────────────────────────────────────────────────────────────
interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

interface WalletTransaction {
  _id: string;
  type: "credit" | "debit" | "refund" | "escrow_hold" | "escrow_release";
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  description: string;
  reference?: string;
  createdAt: string;
}

// ─── API calls (swap these with real endpoints when backend delivers them) ───
const customerWalletApi = {
  getBalance: async (
    phone: string,
  ): Promise<{ status: string; data: WalletBalance }> => {
    const BASE =
      process.env.NEXT_PUBLIC_API_URL ??
      "https://dezenmart-server.onrender.com/api/v1";
    const res = await fetch(
      `${BASE}/express/customer/wallet?phone=${encodeURIComponent(phone)}`,
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message ?? "Failed to load wallet");
    return data;
  },
  getTransactions: async (
    phone: string,
    page = 1,
  ): Promise<{
    status: string;
    data: { transactions: WalletTransaction[]; total: number };
  }> => {
    const BASE =
      process.env.NEXT_PUBLIC_API_URL ??
      "https://dezenmart-server.onrender.com/api/v1";
    const res = await fetch(
      `${BASE}/express/customer/wallet/transactions?phone=${encodeURIComponent(phone)}&page=${page}&limit=20`,
    );
    const data = await res.json();
    if (!res.ok)
      throw new Error(data?.message ?? "Failed to load transactions");
    return data;
  },
};

function formatNGN(n: number) {
  return `₦${Number(n).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TX_ICONS: Record<string, string> = {
  credit: "↓",
  debit: "↑",
  refund: "↩",
  escrow_hold: "🔒",
  escrow_release: "🔓",
};

const TX_COLORS: Record<string, string> = {
  credit: "text-green-400",
  debit: "text-red-400",
  refund: "text-blue-400",
  escrow_hold: "text-amber-400",
  escrow_release: "text-green-400",
};

export default function CustomerWallet() {
  const [phone, setPhone] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [showFund, setShowFund] = useState(false);
  const [fundAmount, setFundAmount] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundDone, setFundDone] = useState(false);

  const load = useCallback(async (p: string) => {
    if (!p.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const [balRes, txRes] = await Promise.all([
        customerWalletApi.getBalance(p),
        customerWalletApi.getTransactions(p),
      ]);
      setBalance(balRes.data);
      setTransactions(txRes.data?.transactions ?? []);
      setSearched(true);
    } catch (err: unknown) {
      // Wallet endpoint not ready yet — show placeholder
      setBalance({ available: 0, pending: 0, currency: "NGN" });
      setTransactions([]);
      setSearched(true);
      if (err instanceof Error && err.message.includes("404")) {
        setError("Wallet endpoint not available yet — coming soon");
      } else {
        setError(err instanceof Error ? err.message : "Could not load wallet");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    if (!phone.trim()) return setError("Enter your phone number");
    load(phone.trim());
  };

  const handleFund = async () => {
    const amt = Number(fundAmount);
    if (!amt || amt < 100) return setError("Minimum fund amount is ₦100");
    setFundLoading(true);
    try {
      // TODO: call POST /express/customer/wallet/fund when endpoint is ready
      await new Promise((r) => setTimeout(r, 1500)); // placeholder
      setFundDone(true);
      setTimeout(() => {
        setShowFund(false);
        setFundDone(false);
        setFundAmount("");
        load(phone);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not fund wallet");
    } finally {
      setFundLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          My Wallet
        </h1>
        <p className="text-[12px] text-[#555]">
          Your DezenExpress wallet balance and history
        </p>
      </div>

      {/* Phone lookup */}
      {!searched && (
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center shrink-0">
              <WalletIcon size={22} color="#ff2d2d" />
            </div>
            <div>
              <p className="text-[14px] font-semibold text-[#e0e0e0]">
                Access your wallet
              </p>
              <p className="text-[12px] text-[#555]">
                Use the phone number from your bookings
              </p>
            </div>
          </div>
          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Phone Number
            </p>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="e.g. 08012345678"
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
              <AlertTriangleIcon size={13} color="currentColor" />
              {error}
            </div>
          )}
          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
          >
            {loading ? "Loading..." : "View Wallet"}
          </button>
        </div>
      )}

      {/* Wallet content */}
      {searched && (
        <>
          {/* Balance card */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-36 h-36 bg-[#ff2d2d]/5 rounded-full pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-[12px] text-[#555]">Available Balance</p>
                  {loading ? (
                    <div className="w-36 h-9 bg-[#2a2a2a] rounded-lg animate-pulse mt-1" />
                  ) : (
                    <p className="font-[var(--font-syne)] font-bold text-3xl text-[#f0f0f0] mt-1">
                      {formatNGN(balance?.available ?? 0)}
                    </p>
                  )}
                  {(balance?.pending ?? 0) > 0 && (
                    <p className="text-[12px] text-amber-400 mt-1">
                      {formatNGN(balance!.pending)} in escrow
                    </p>
                  )}
                </div>
                <button
                  onClick={() => load(phone)}
                  className="p-2 bg-[#111] border border-[#2a2a2a] rounded-xl cursor-pointer hover:border-[#333]"
                >
                  <RefreshIcon size={14} color="#555" />
                </button>
              </div>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 mb-4">
                  <AlertTriangleIcon
                    size={12}
                    color="currentColor"
                    className="shrink-0 mt-0.5"
                  />
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFund(true)}
                  className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
                >
                  + Fund Wallet
                </button>
                <Link
                  href="/express/customer/track"
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#111] border border-[#2a2a2a] text-[#aaa] rounded-xl text-[13px] no-underline hover:border-[#333]"
                >
                  Track Order <ArrowRightIcon size={12} color="currentColor" />
                </Link>
              </div>
            </div>
          </div>

          {/* Info banner */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
            <AlertTriangleIcon
              size={13}
              color="#555"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-[#555]">
              Your wallet is funded via PandaEscrow. Payments for bookings are
              held securely in escrow and released to riders only after delivery
              is confirmed. Refunds from cancelled orders are returned to your
              wallet.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#1a1a1a] border border-[#222] rounded-xl p-1 w-fit">
            {(["overview", "history"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer border-none capitalize
                  ${tab === t ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
              >
                {t === "overview" ? "Overview" : "History"}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div className="flex flex-col gap-3">
              {[
                {
                  label: "Available",
                  value: formatNGN(balance?.available ?? 0),
                  color: "text-green-400",
                  icon: "✅",
                },
                {
                  label: "In Escrow",
                  value: formatNGN(balance?.pending ?? 0),
                  color: "text-amber-400",
                  icon: "🔒",
                },
                {
                  label: "Currency",
                  value: balance?.currency ?? "NGN",
                  color: "text-[#e0e0e0]",
                  icon: "💱",
                },
                {
                  label: "Phone",
                  value: phone,
                  color: "text-[#aaa]",
                  icon: "📱",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#1a1a1a] border border-[#222] rounded-2xl px-5 py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <p className="text-[13px] text-[#555]">{item.label}</p>
                  </div>
                  <p
                    className={`text-[14px] font-semibold font-[var(--font-syne)] ${item.color}`}
                  >
                    {item.value}
                  </p>
                </div>
              ))}

              <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
                <p className="text-[12px] font-semibold text-[#aaa] mb-3">
                  How your wallet works
                </p>
                {[
                  {
                    icon: "🔒",
                    title: "Escrow Protection",
                    desc: "Payment held safely until service is complete",
                  },
                  {
                    icon: "↩",
                    title: "Automatic Refunds",
                    desc: "Cancelled orders are refunded to your wallet",
                  },
                  {
                    icon: "⚡",
                    title: "Instant Checkout",
                    desc: "Pay for future bookings directly from wallet",
                  },
                  {
                    icon: "🏦",
                    title: "Bank Withdrawal",
                    desc: "Withdraw your balance to your bank — coming soon",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="flex items-start gap-3 py-2.5 border-b border-[#1e1e1e] last:border-0"
                  >
                    <span className="text-lg shrink-0">{f.icon}</span>
                    <div>
                      <p className="text-[13px] font-medium text-[#e0e0e0]">
                        {f.title}
                      </p>
                      <p className="text-[11px] text-[#555]">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* History tab */}
          {tab === "history" && (
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#1e1e1e]">
                <p className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                  {transactions.length} transaction
                  {transactions.length !== 1 ? "s" : ""}
                </p>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-7 h-7 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <WalletIcon size={40} color="#2a2a2a" />
                  <p className="text-[13px] text-[#555]">No transactions yet</p>
                  <p className="text-[11px] text-[#444] text-center max-w-xs">
                    Your transaction history will appear here after your first
                    booking
                  </p>
                  <Link
                    href="/express/customer"
                    className="mt-2 px-5 py-2 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-xl text-[12px] font-semibold no-underline hover:bg-[#ff2d2d]/20"
                  >
                    Book a Ride or Delivery →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#1e1e1e]">
                  {transactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-[16px] shrink-0
                        ${
                          tx.type === "credit" ||
                          tx.type === "escrow_release" ||
                          tx.type === "refund"
                            ? "bg-green-500/10"
                            : tx.type === "escrow_hold"
                              ? "bg-amber-500/10"
                              : "bg-red-500/10"
                        }`}
                      >
                        {TX_ICONS[tx.type] ?? "•"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize
                            ${
                              tx.status === "completed"
                                ? "bg-green-500/15 text-green-400"
                                : tx.status === "pending"
                                  ? "bg-amber-500/15 text-amber-400"
                                  : "bg-red-500/15 text-red-400"
                            }`}
                          >
                            {tx.status}
                          </span>
                          <span className="text-[11px] text-[#555]">
                            {formatDate(tx.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p
                        className={`text-[13px] font-semibold shrink-0 ${TX_COLORS[tx.type] ?? "text-[#aaa]"}`}
                      >
                        {tx.type === "debit" || tx.type === "escrow_hold"
                          ? "-"
                          : "+"}
                        {formatNGN(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Switch phone */}
          <button
            onClick={() => {
              setSearched(false);
              setBalance(null);
              setTransactions([]);
              setError(null);
              setPhone("");
            }}
            className="text-[12px] text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-center"
          >
            Use a different phone number
          </button>
        </>
      )}

      {/* Fund Wallet Modal */}
      {showFund && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
              <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
                {fundDone ? "Wallet Funded!" : "Fund Your Wallet"}
              </h3>
              <button
                onClick={() => {
                  setShowFund(false);
                  setFundDone(false);
                  setFundAmount("");
                }}
                className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {fundDone ? (
                <div className="flex flex-col items-center py-6 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <CheckCircleIcon size={28} color="#22c55e" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#e0e0e0]">
                    {formatNGN(Number(fundAmount))} added to your wallet!
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
                    <AlertTriangleIcon
                      size={13}
                      color="#555"
                      className="shrink-0 mt-0.5"
                    />
                    <p className="text-[11px] text-[#555]">
                      Funds are secured by PandaEscrow and only used when you
                      make a booking.
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
                      Amount (₦)
                    </p>
                    <input
                      type="number"
                      value={fundAmount}
                      onChange={(e) => setFundAmount(e.target.value)}
                      placeholder="e.g. 5000"
                      className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-[14px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[1000, 2000, 5000, 10000].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setFundAmount(String(amt))}
                        className={`py-2 rounded-xl text-[12px] font-semibold border transition-all cursor-pointer
                          ${fundAmount === String(amt) ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40 text-[#ff2d2d]" : "bg-[#111] border-[#2a2a2a] text-[#666] hover:border-[#333]"}`}
                      >
                        ₦{(amt / 1000).toFixed(0)}k
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
                    <button
                      onClick={() => setShowFund(false)}
                      className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleFund}
                      disabled={fundLoading || !fundAmount}
                      className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
                    >
                      {fundLoading
                        ? "Processing..."
                        : `Fund ${fundAmount ? `₦${Number(fundAmount).toLocaleString()}` : ""}`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
