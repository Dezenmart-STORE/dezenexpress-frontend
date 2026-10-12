"use client";

import { useState, useEffect, useCallback } from "react";
import { riderApi, RiderWallet, RiderTransaction } from "@/lib/express/api";
import {
  DollarIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  PackageIcon,
  WalletIcon,
  RefreshIcon,
  AlertTriangleIcon,
  XIcon,
} from "@/components/Icons";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const RIDER_PERCENTAGE = 0.85;

export default function RiderEarnings() {
  const [wallet, setWallet] = useState<RiderWallet | null>(null);
  const [transactions, setTransactions] = useState<RiderTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"overview" | "history">("overview");
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState("");
  const [wLoading, setWLoading] = useState(false);
  const [wError, setWError] = useState<string | null>(null);
  const [wDone, setWDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, txRes] = await Promise.all([
        riderApi.getWallet(),
        riderApi.getTransactions(),
      ]);
      setWallet(walletRes.data);
      setTransactions(txRes.data?.transactions ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleWithdraw = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return setWError("Enter a valid amount");
    if (wallet && amt > wallet.available)
      return setWError(`Max available: ₦${wallet.available.toLocaleString()}`);
    setWLoading(true);
    setWError(null);
    try {
      await riderApi.withdraw(amt);
      setWDone(true);
      load(); // refresh balance
    } catch (err: unknown) {
      setWError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setWLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Earnings
          </h1>
          <p className="text-[12px] text-[#555]">Your DezenExpress wallet</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
          >
            <RefreshIcon size={14} color="#555" />
          </button>
          {wallet && wallet.available > 0 && (
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#ff2d2d] text-white border-none rounded-xl text-[13px] font-semibold cursor-pointer hover:opacity-90"
            >
              Withdraw
            </button>
          )}
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
          <p className="text-[12px] text-[#555] mb-1">Available to Withdraw</p>
          {loading ? (
            <div className="w-32 h-9 bg-[#2a2a2a] rounded-lg animate-pulse mb-2" />
          ) : (
            <p className="font-[var(--font-syne)] font-bold text-3xl text-[#f0f0f0]">
              ₦{(wallet?.available ?? 0).toLocaleString()}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <div>
              <p className="text-[10px] text-[#555]">Pending</p>
              <p className="text-[13px] font-semibold text-amber-400">
                ₦{(wallet?.pending ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-px h-6 bg-[#2a2a2a]" />
            <div>
              <p className="text-[10px] text-[#555]">Total earned</p>
              <p className="text-[13px] font-semibold text-[#e0e0e0]">
                ₦{(wallet?.total ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="w-px h-6 bg-[#2a2a2a]" />
            <div>
              <p className="text-[10px] text-[#555]">Your cut</p>
              <p className="text-[13px] font-semibold text-green-400">
                {RIDER_PERCENTAGE * 100}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            label: "Total Earned",
            value: `₦${(wallet?.total ?? 0).toLocaleString()}`,
            Icon: WalletIcon,
            color: "text-[#ff2d2d]",
          },
          {
            label: "Available",
            value: `₦${(wallet?.available ?? 0).toLocaleString()}`,
            Icon: CheckCircleIcon,
            color: "text-green-400",
          },
          {
            label: "Pending",
            value: `₦${(wallet?.pending ?? 0).toLocaleString()}`,
            Icon: ClockIcon,
            color: "text-amber-400",
          },
          {
            label: "Transactions",
            value: String(transactions.length),
            Icon: TruckIcon,
            color: "text-blue-400",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4"
          >
            <s.Icon size={14} color="#555" />
            <p
              className={`font-[var(--font-syne)] font-bold text-xl mt-2 ${s.color}`}
            >
              {s.value}
            </p>
            <p className="text-[11px] text-[#555] mt-0.5">{s.label}</p>
          </div>
        ))}
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

      {tab === "overview" && (
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
          <p className="text-[12px] font-semibold text-[#aaa] mb-3">
            Earnings Split
          </p>
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-2 bg-[#111] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#ff2d2d] rounded-full"
                style={{ width: "85%" }}
              />
            </div>
            <span className="text-[11px] text-[#aaa] shrink-0">85% / 15%</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#ff2d2d]">● You (85%)</span>
            <span className="text-[#555]">● Platform (15%)</span>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e1e]">
            <p className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
              {transactions.length} transactions
            </p>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <PackageIcon size={36} color="#2a2a2a" />
              <p className="text-[13px] text-[#555]">No transactions yet</p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e1e]">
              {transactions.map((t) => (
                <div
                  key={t._id}
                  className="flex items-center gap-3 px-5 py-3.5"
                >
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
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize
                        ${t.status === "settled" ? "bg-green-500/15 text-green-400" : t.status === "withdrawn" ? "bg-[#222] text-[#666]" : "bg-amber-500/15 text-amber-400"}`}
                      >
                        {t.status}
                      </span>
                      <span className="text-[11px] text-[#555]">
                        {formatDate(t.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`text-[13px] font-semibold ${t.type === "credit" ? "text-green-400" : "text-red-400"}`}
                    >
                      {t.type === "credit" ? "+" : "-"}₦
                      {t.amount.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Withdraw modal */}
      {showWithdraw && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
              <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
                {wDone ? "Withdrawal Submitted" : "Withdraw Earnings"}
              </h3>
              <button
                onClick={() => {
                  setShowWithdraw(false);
                  setWDone(false);
                  setAmount("");
                  setWError(null);
                }}
                className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {wDone ? (
                <div className="flex flex-col items-center py-6 gap-3 text-center">
                  <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                    <CheckCircleIcon size={28} color="#22c55e" />
                  </div>
                  <p className="text-[15px] font-semibold text-[#e0e0e0]">
                    Request Submitted!
                  </p>
                  <p className="text-[12px] text-[#555]">
                    ₦{Number(amount).toLocaleString()} will be sent to your
                    registered bank account.
                  </p>
                  <button
                    onClick={() => {
                      setShowWithdraw(false);
                      setWDone(false);
                      setAmount("");
                    }}
                    className="mt-2 px-6 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#2a2a2a] rounded-xl">
                    <WalletIcon size={13} color="#555" />
                    <p className="text-[12px] text-[#555]">
                      Available:{" "}
                      <strong className="text-[#e0e0e0]">
                        ₦{(wallet?.available ?? 0).toLocaleString()}
                      </strong>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
                      Amount (₦)
                    </p>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`Max ₦${(wallet?.available ?? 0).toLocaleString()}`}
                      className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none"
                    />
                  </div>
                  <div className="bg-[#111] border border-[#2a2a2a] rounded-xl px-4 py-3">
                    <p className="text-[11px] text-[#555]">
                      Paid to your registered bank account on file. Processing
                      within 24 hours.
                    </p>
                  </div>
                  {wError && (
                    <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                      {wError}
                    </p>
                  )}
                  <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
                    <button
                      onClick={() => setShowWithdraw(false)}
                      className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleWithdraw}
                      disabled={wLoading || !amount}
                      className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
                    >
                      {wLoading ? "Processing..." : "Withdraw"}
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
