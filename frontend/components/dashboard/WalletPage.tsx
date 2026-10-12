"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";
import { getProvider } from "@/lib/api";
import { ordersApi, Order } from "@/lib/dezenmart-api";
import {
  WalletIcon,
  DollarIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  RefreshIcon,
  PackageIcon,
  InfoIcon,
} from "@/components/Icons";

const BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://dezenmart-server.onrender.com/api/v1";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("dezenmart_logistics_token");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function getProductName(order: Order): string {
  if (typeof order.product === "object" && order.product !== null) {
    return (order.product as any).name ?? "Product";
  }
  // product is a string ID — show order ID instead
  return order.orderId ? `Order ${order.orderId.slice(-6)}` : "Order";
}

/* ─── USDT balance from contract ─────────────────────────────────────────── */
async function getUsdtBalance(address: string): Promise<string | null> {
  try {
    const token = getToken();
    const res = await fetch(`${BASE}/contracts/usdt/balance/${address}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();
    return data?.data?.balance ?? data?.balance ?? null;
  } catch {
    return null;
  }
}

/* ─── Exchange rate ───────────────────────────────────────────────────────── */
async function getUsdToNgn(): Promise<number> {
  try {
    const key = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
    if (!key) return 1600;
    const res = await fetch(
      `https://v6.exchangerate-api.com/v6/${key}/pair/USD/NGN`,
    );
    const data = await res.json();
    return data.conversion_rate ?? 1600;
  } catch {
    return 1600;
  }
}

/* ─── Stats card ──────────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  sub,
  Icon,
  color,
  bg,
}: {
  label: string;
  value: string;
  sub?: string;
  Icon: React.FC<any>;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
      <div
        className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}
      >
        <Icon size={17} color="currentColor" className={color} />
      </div>
      <div>
        <p
          className={`font-[var(--font-syne)] font-bold text-xl lg:text-2xl ${color}`}
        >
          {value}
        </p>
        {sub && <p className="text-[11px] text-[#555] mt-0.5">{sub}</p>}
      </div>
      <p className="text-[11px] text-[#555]">{label}</p>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function WalletPage() {
  const { toggle } = useSidebar();
  const provider = getProvider();

  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState<string | null>(null);
  const [usdToNgn, setUsdToNgn] = useState(1600);
  const [loading, setLoading] = useState(true);
  const [balLoading, setBalLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "history">("overview");

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, rate] = await Promise.all([
        ordersApi.getMyOrders({ limit: 100 }),
        getUsdToNgn(),
      ]);
      setOrders(ordersRes.data.orders);
      setUsdToNgn(rate);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const loadBalance = async () => {
    if (!provider?.walletAddress) {
      setBalLoading(false);
      return;
    }
    setBalLoading(true);
    const bal = await getUsdtBalance(provider.walletAddress);
    setBalance(bal);
    setBalLoading(false);
  };

  useEffect(() => {
    load();
    loadBalance();
  }, []);

  // Derive earnings from orders — check both logisticsStatus and status
  // because PUT /orders/:id sets status="delivered" but logisticsStatus stays "shipped"
  const shipped = orders.filter((o) => {
    const o2 = o as any;
    return (
      o.logisticsStatus === "shipped" &&
      o2.status !== "delivered" &&
      o2.status !== "delivery_confirmed"
    );
  });
  const delivered = orders.filter((o) => {
    const o2 = o as any;
    return (
      o.logisticsStatus === "delivered" ||
      o2.status === "delivered" ||
      o2.status === "delivery_confirmed"
    );
  });

  const pendingEarnings = shipped.reduce((s, o) => s + (o.deliveryFee ?? 0), 0);
  const releasedEarnings = delivered.reduce(
    (s, o) => s + (o.deliveryFee ?? 0),
    0,
  );
  const totalEarnings = pendingEarnings + releasedEarnings;

  const pendingNgn = pendingEarnings * usdToNgn;
  const releasedNgn = releasedEarnings * usdToNgn;
  const totalNgn = totalEarnings * usdToNgn;

  const earnedOrders = orders
    .filter((o) => {
      const o2 = o as any;
      return (
        o.logisticsStatus === "shipped" ||
        o.logisticsStatus === "delivered" ||
        o2.status === "delivered" ||
        o2.status === "delivery_confirmed"
      );
    })
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  return (
    <>
      {/* Topbar */}
      <div className="sticky top-0 z-10 bg-[#0f0f0f] flex items-center justify-between px-4 lg:px-7 py-4 lg:py-5 border-b border-[#1e1e1e] shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer bg-transparent border-none shrink-0"
          >
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          </button>
          <div>
            <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
              Wallet
            </h1>
            <p className="text-[11px] text-[#555] hidden sm:block">
              Your earnings and on-chain balance
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            load();
            loadBalance();
          }}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[12px] text-[#aaa] hover:border-[#444] transition-all cursor-pointer"
        >
          <RefreshIcon size={13} color="currentColor" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
        {/* Main balance card */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 w-40 h-40 bg-[#ff2d2d]/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-[#ff2d2d]/3 rounded-full pointer-events-none" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] text-[#555] mb-2">
                  On-chain USDT Balance
                </p>
                {balLoading ? (
                  <div className="w-36 h-9 bg-[#2a2a2a] rounded-lg animate-pulse" />
                ) : balance !== null ? (
                  <div>
                    <p className="font-[var(--font-syne)] font-bold text-3xl text-[#f0f0f0]">
                      ${Number(balance).toFixed(4)}
                    </p>
                    <p className="text-[12px] text-[#555] mt-0.5">
                      ≈ ₦
                      {(Number(balance) * usdToNgn).toLocaleString("en-NG", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      NGN
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-[var(--font-syne)] font-bold text-2xl text-[#555]">
                      —
                    </p>
                    <p className="text-[11px] text-[#444] mt-0.5">
                      Balance unavailable · Check your wallet address
                    </p>
                  </div>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center shrink-0">
                <WalletIcon size={22} color="#ff2d2d" />
              </div>
            </div>

            {/* Wallet address */}
            {provider?.walletAddress ? (
              <div className="bg-black/20 border border-[#2a2a2a] rounded-xl px-3 py-2.5 flex items-center gap-2">
                <p className="text-[11px] text-[#555] shrink-0">Address</p>
                <p className="text-[11px] text-[#aaa] font-mono truncate flex-1">
                  {provider.walletAddress}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <AlertTriangleIcon size={13} color="#f59e0b" />
                <p className="text-[12px] text-amber-400 flex-1">
                  No wallet address — go to Profile to add one
                </p>
                <a
                  href="/profile"
                  className="text-[11px] text-amber-400 font-semibold underline shrink-0"
                >
                  Set up
                </a>
              </div>
            )}

            {/* Total pending summary */}
            {pendingEarnings > 0 && (
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <ClockIcon size={14} color="#f59e0b" />
                  <p className="text-[12px] text-amber-400">
                    Pending in escrow
                  </p>
                </div>
                <p className="text-[13px] font-semibold text-amber-400">
                  ${pendingEarnings.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Escrow flow explanation */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <InfoIcon size={14} color="#555" />
            <p className="text-[12px] font-semibold text-[#aaa]">
              How earnings work
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              {
                label: "Order placed",
                sub: "Buyer funds locked in escrow",
                color: "text-[#555]",
                bg: "bg-[#111]",
                dot: "bg-[#333]",
              },
              {
                label: "You ship",
                sub: "Funds still in escrow",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
                dot: "bg-purple-400",
              },
              {
                label: "Buyer confirms",
                sub: "Funds released to everyone",
                color: "text-green-400",
                bg: "bg-green-500/10",
                dot: "bg-green-400",
              },
              {
                label: "You receive",
                sub: "Delivery fee → your wallet",
                color: "text-[#ff2d2d]",
                bg: "bg-[#ff2d2d]/10",
                dot: "bg-[#ff2d2d]",
              },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2 shrink-0">
                <div
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl ${step.bg} min-w-[110px]`}
                >
                  <div className={`w-2 h-2 rounded-full ${step.dot}`} />
                  <p
                    className={`text-[11px] font-semibold ${step.color} text-center`}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-[#555] text-center">
                    {step.sub}
                  </p>
                </div>
                {i < 3 && (
                  <ArrowRightIcon size={14} color="#333" className="shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Earning stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            label="Total Earnings"
            value={`$${totalEarnings.toFixed(2)}`}
            sub={`≈ ₦${totalNgn.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            Icon={DollarIcon}
            color="text-[#ff2d2d]"
            bg="bg-[#ff2d2d]/10"
          />
          <StatCard
            label="Released (delivered)"
            value={`$${releasedEarnings.toFixed(2)}`}
            sub={`≈ ₦${releasedNgn.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            Icon={CheckCircleIcon}
            color="text-green-400"
            bg="bg-green-500/10"
          />
          <StatCard
            label="Pending (shipped)"
            value={`$${pendingEarnings.toFixed(2)}`}
            sub={`≈ ₦${pendingNgn.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            Icon={ClockIcon}
            color="text-amber-400"
            bg="bg-amber-500/10"
          />
          <StatCard
            label="Total Deliveries"
            value={String(delivered.length + shipped.length)}
            sub={`${shipped.length} in transit`}
            Icon={TruckIcon}
            color="text-blue-400"
            bg="bg-blue-500/10"
          />
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
              {t === "overview" ? "Overview" : "Earning History"}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {tab === "overview" && (
          <div className="flex flex-col gap-4">
            {/* Pending earnings detail */}
            {shipped.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
                  <div>
                    <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                      Pending Earnings
                    </h3>
                    <p className="text-[11px] text-[#555] mt-0.5">
                      Waiting for buyer to confirm delivery
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    ${pendingEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="divide-y divide-[#1e1e1e]">
                  {shipped.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <TruckIcon size={15} color="#a855f7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
                          {getProductName(order)}
                        </p>
                        <p className="text-[11px] text-[#555]">
                          {order.orderId} · Shipped{" "}
                          {formatDate(order.updatedAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold text-amber-400">
                          ${(order.deliveryFee ?? 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-[#555]">
                          ≈ ₦
                          {((order.deliveryFee ?? 0) * usdToNgn).toLocaleString(
                            "en-NG",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Released earnings */}
            {delivered.length > 0 && (
              <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
                  <div>
                    <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                      Released Earnings
                    </h3>
                    <p className="text-[11px] text-[#555] mt-0.5">
                      Funds sent to your wallet
                    </p>
                  </div>
                  <span className="text-[12px] font-semibold text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
                    ${releasedEarnings.toFixed(2)}
                  </span>
                </div>
                <div className="divide-y divide-[#1e1e1e]">
                  {delivered.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                        <CheckCircleIcon size={15} color="#22c55e" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
                          {getProductName(order)}
                        </p>
                        <p className="text-[11px] text-[#555]">
                          {order.orderId} · Delivered{" "}
                          {formatDate(order.updatedAt)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-semibold text-green-400">
                          ${(order.deliveryFee ?? 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-[#555]">
                          ≈ ₦
                          {((order.deliveryFee ?? 0) * usdToNgn).toLocaleString(
                            "en-NG",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {shipped.length === 0 && delivered.length === 0 && !loading && (
              <div className="flex flex-col items-center py-12 gap-3 bg-[#1a1a1a] border border-[#222] rounded-2xl">
                <DollarIcon size={40} color="#2a2a2a" />
                <p className="text-[14px] font-medium text-[#777]">
                  No earnings yet
                </p>
                <p className="text-[12px] text-[#555] text-center max-w-xs">
                  Accept and ship orders to start earning delivery fees
                </p>
              </div>
            )}
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e1e1e]">
              <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0]">
                All Earning Activity
              </h3>
              <p className="text-[11px] text-[#555] mt-0.5">
                {earnedOrders.length} transactions
              </p>
            </div>
            {loading ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <div className="w-7 h-7 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : earnedOrders.length === 0 ? (
              <div className="flex flex-col items-center py-12 gap-3">
                <PackageIcon size={36} color="#2a2a2a" />
                <p className="text-[13px] text-[#555]">No activity yet</p>
              </div>
            ) : (
              <div className="divide-y divide-[#1e1e1e]">
                {earnedOrders.map((order) => {
                  const o2 = order as any;
                  const isReleased =
                    order.logisticsStatus === "delivered" ||
                    o2.status === "delivered" ||
                    o2.status === "delivery_confirmed";
                  const isPending = !isReleased;
                  return (
                    <div
                      key={order._id}
                      className="flex items-center gap-3 px-5 py-3.5"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                        ${isReleased ? "bg-green-500/10" : "bg-amber-500/10"}`}
                      >
                        {isReleased ? (
                          <CheckCircleIcon size={15} color="#22c55e" />
                        ) : (
                          <ClockIcon size={15} color="#f59e0b" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
                          {getProductName(order)}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full
                            ${isReleased ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}
                          >
                            {isReleased ? "Released" : "Pending"}
                          </span>
                          <span className="text-[11px] text-[#555]">
                            {order.orderId}
                          </span>
                          <span className="text-[11px] text-[#555]">
                            {formatDate(order.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-[13px] font-semibold ${isReleased ? "text-green-400" : "text-amber-400"}`}
                        >
                          +${(order.deliveryFee ?? 0).toFixed(2)}
                        </p>
                        <p className="text-[10px] text-[#555]">
                          ≈ ₦
                          {((order.deliveryFee ?? 0) * usdToNgn).toLocaleString(
                            "en-NG",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            },
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
