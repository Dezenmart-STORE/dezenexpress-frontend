"use client";

import { useEffect, useState } from "react";
import { useSidebar } from "./SidebarContext";
import { ordersApi, Order } from "@/lib/dezenmart-api";
import { getProvider } from "@/lib/api";
import {
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  AlertTriangleIcon,
  DollarIcon,
  SearchIcon,
  ArrowRightIcon,
  RefreshIcon,
  StarIcon,
  UserIcon,
} from "@/components/Icons";

function formatNaira(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function getProductName(order: Order): string {
  if (typeof order.product === "object" && order.product !== null)
    return order.product.name ?? "Product";
  return "Product";
}
function getImage(order: Order): string | null {
  const p =
    typeof order.product === "object" && order.product !== null
      ? order.product
      : null;
  if (!p?.images?.length) return null;
  return p.images[0].startsWith("http") ? p.images[0] : null;
}
function getBuyerName(order: Order): string {
  if (typeof order.buyer === "object" && order.buyer !== null)
    return order.buyer.name ?? "—";
  return "—";
}

/* ── Mini donut chart ── */
function DonutChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const R = 50;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segments = data.map((d) => {
    const dash = (d.value / total) * C;
    const seg = { ...d, dash, gap: C - dash, offset };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <svg width="120" height="120" viewBox="0 0 120 120" className="shrink-0">
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="#1e1e1e"
          strokeWidth="18"
        />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={-s.offset}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "60px 60px",
            }}
          />
        ))}
        <text
          x="60"
          y="56"
          textAnchor="middle"
          fill="#e0e0e0"
          fontSize="18"
          fontWeight="bold"
        >
          {total}
        </text>
        <text x="60" y="70" textAnchor="middle" fill="#555" fontSize="9">
          orders
        </text>
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: d.color }}
              />
              <span className="text-[12px] text-[#aaa] truncate">
                {d.label}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[12px] font-semibold text-[#e0e0e0]">
                {d.value}
              </span>
              <span className="text-[10px] text-[#555] w-7 text-right">
                {Math.round((d.value / total) * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sparkline chart ── */
function Sparkline({
  data,
  color = "#ff2d2d",
}: {
  data: number[];
  color?: string;
}) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const W = 200;
  const H = 50;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - (v / max) * H}`)
    .join(" ");
  const area = `0,${H} ${pts} ${W},${H}`;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="overflow-visible"
    >
      <defs>
        <linearGradient
          id={`sg-${color.replace("#", "")}`}
          x1="0"
          y1="0"
          x2="0"
          y2="1"
        >
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace("#", "")})`} />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Dashboard() {
  const { toggle } = useSidebar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [usdToLocal, setUsdToLocal] = useState<{
    rate: number;
    symbol: string;
    code: string;
  } | null>(null);
  const provider = getProvider();

  const load = () => {
    setLoading(true);
    ordersApi
      .getMyOrders({ limit: 100 })
      .then((res) => setOrders(res.data.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  // Fetch exchange rate — USD to local currency based on provider's coverage area
  useEffect(() => {
    load();
    const key = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
    if (!key) return;
    // Detect country from coverage areas — default to NGN for Nigeria
    const states = provider?.coverageAreas?.map((a: any) => a.state) ?? [];
    const isNigeria = states.length > 0; // All states are Nigerian for now
    const targetCurrency = isNigeria ? "NGN" : "USD";
    const symbol = isNigeria ? "₦" : "$";

    if (targetCurrency === "USD") {
      setUsdToLocal({ rate: 1, symbol: "$", code: "USD" });
      return;
    }

    fetch(
      `https://v6.exchangerate-api.com/v6/${key}/pair/USD/${targetCurrency}`,
    )
      .then((r) => r.json())
      .then((d) => {
        if (d.conversion_rate) {
          setUsdToLocal({
            rate: d.conversion_rate,
            symbol,
            code: targetCurrency,
          });
        }
      })
      .catch(() => {});
  }, []);

  function formatRevenue(usd: number): string {
    if (!usdToLocal) return `$${usd.toFixed(2)}`;
    const local = usd * usdToLocal.rate;
    return `$${usd.toFixed(2)} (${usdToLocal.symbol}${local.toLocaleString("en-NG", { maximumFractionDigits: 0 })})`;
  }

  // ── Stats derived from real order data ──
  // Check both logisticsStatus and status for delivered (backend inconsistency)
  const isDelivered = (o: Order) => {
    const o2 = o as any;
    return (
      o.logisticsStatus === "delivered" ||
      o2.status === "delivered" ||
      o2.status === "delivery_confirmed"
    );
  };

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.logisticsStatus === "pending").length,
    accepted: orders.filter((o) => o.logisticsStatus === "accepted").length,
    shipped: orders.filter(
      (o) => o.logisticsStatus === "shipped" && !isDelivered(o),
    ).length,
    delivered: orders.filter(isDelivered).length,
    rejected: orders.filter((o) => o.logisticsStatus === "rejected").length,
    revenue: orders
      .filter(isDelivered)
      .reduce((s, o) => s + ((o as any).deliveryFee ?? 0), 0),
  };

  // ── Recent orders (last 5) ──
  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // ── Orders by day (last 7 days) ──
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    return {
      label: d.toLocaleDateString("en-GB", { weekday: "short" }),
      count: orders.filter((o) => {
        const c = new Date(o.createdAt);
        return c >= d && c < next;
      }).length,
    };
  });

  // ── Donut data ──
  const donutData = [
    { label: "Pending", value: stats.pending, color: "#f59e0b" },
    { label: "Accepted", value: stats.accepted, color: "#3b82f6" },
    { label: "Shipped", value: stats.shipped, color: "#8b5cf6" },
    { label: "Delivered", value: stats.delivered, color: "#22c55e" },
    { label: "Rejected", value: stats.rejected, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const statCards: {
    label: string;
    value: string | number;
    sub?: string;
    Icon: React.FC<any>;
    color: string;
    bg: string;
    spark: number[] | null;
  }[] = [
    {
      label: "Total Assigned",
      value: stats.total,
      Icon: PackageIcon,
      color: "text-[#f0f0f0]",
      bg: "bg-[#222]",
      spark: last7.map((d) => d.count),
    },
    {
      label: "Pending",
      value: stats.pending,
      Icon: ClockIcon,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      spark: null,
    },
    {
      label: "Accepted",
      value: stats.accepted,
      Icon: CheckCircleIcon,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      spark: null,
    },
    {
      label: "Shipped",
      value: stats.shipped,
      Icon: TruckIcon,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      spark: null,
    },
    {
      label: "Delivered",
      value: stats.delivered,
      Icon: CheckCircleIcon,
      color: "text-green-400",
      bg: "bg-green-500/10",
      spark: null,
    },
    {
      label: "Revenue (delivered)",
      value: `$${stats.revenue.toFixed(2)}`,
      sub:
        usdToLocal && stats.revenue > 0
          ? `≈ ${usdToLocal.symbol}${(stats.revenue * usdToLocal.rate).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`
          : undefined,
      Icon: DollarIcon,
      color: "text-[#ff2d2d]",
      bg: "bg-[#ff2d2d]/10",
      spark: null,
    },
  ];

  const logisticsBadge: Record<string, string> = {
    pending: "bg-amber-500/15 text-amber-400",
    accepted: "bg-blue-500/15 text-blue-400",
    shipped: "bg-purple-500/15 text-purple-400",
    delivered: "bg-green-500/15 text-green-400",
    rejected: "bg-red-500/15 text-red-400",
  };

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
              Dashboard
            </h1>
            <p className="text-[11px] text-[#555] hidden sm:block">
              Welcome back, {provider?.name ?? "Provider"}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[12px] text-[#aaa] hover:border-[#444] transition-all cursor-pointer"
        >
          <RefreshIcon size={13} color="currentColor" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5">
        {/* Incomplete profile warning */}
        {provider && (!provider.walletAddress || !provider.phone) && (
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertTriangleIcon size={18} color="#f59e0b" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-amber-400">
                Complete your profile
              </p>
              <p className="text-[11px] text-amber-400/70">
                Add your {!provider.phone && "phone"}
                {!provider.phone && !provider.walletAddress && " & "}
                {!provider.walletAddress && "wallet address"} to start receiving
                deliveries
              </p>
            </div>
            <a
              href="/profile"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-[11px] font-semibold no-underline hover:bg-amber-500/30 transition-colors whitespace-nowrap"
            >
              Profile <ArrowRightIcon size={11} color="currentColor" />
            </a>
          </div>
        )}

        {/* Provider summary card */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center shrink-0 overflow-hidden">
            {provider?.profileImage ? (
              <img
                src={provider.profileImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon size={24} color="#ff2d2d" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0] truncate">
              {provider?.name ?? "Provider"}
            </p>
            <p className="text-[12px] text-[#555] truncate">
              {provider?.email}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  provider?.verificationStatus === "verified"
                    ? "bg-green-500/15 text-green-400"
                    : "bg-amber-500/15 text-amber-400"
                }`}
              >
                {provider?.verificationStatus === "verified"
                  ? "Verified"
                  : "Pending verification"}
              </span>
              <span className="text-[11px] text-[#555] flex items-center gap-1">
                <StarIcon size={11} color="#f59e0b" />
                {provider?.rating?.toFixed(1) ?? "0.0"} rating
              </span>
              <span className="text-[11px] text-[#555]">
                {provider?.totalDeliveries ?? 0} deliveries
              </span>
            </div>
          </div>
          <div className="shrink-0 text-right hidden sm:block">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
              Coverage
            </p>
            <p className="text-[13px] font-semibold text-[#e0e0e0]">
              {provider?.coverageAreas?.length ?? 0} state
              {(provider?.coverageAreas?.length ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4 flex flex-col gap-2 hover:border-[#333] transition-colors"
            >
              <div
                className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}
              >
                <s.Icon size={15} color="currentColor" className={s.color} />
              </div>
              <div>
                <div
                  className={`font-[var(--font-syne)] font-bold text-2xl ${s.color}`}
                >
                  {loading ? (
                    <div className="w-10 h-6 bg-[#2a2a2a] rounded animate-pulse" />
                  ) : (
                    s.value
                  )}
                </div>
                {s.sub && !loading && (
                  <p className="text-[10px] text-[#555] mt-0.5">{s.sub}</p>
                )}
                <p className="text-[11px] text-[#555] mt-0.5">{s.label}</p>
              </div>
              {s.spark && !loading && (
                <div className="mt-1 h-8">
                  <Sparkline data={s.spark} color="#ff2d2d" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Order status donut */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-[var(--font-syne)] font-semibold text-[15px] text-[#e0e0e0]">
                Order Status
              </h3>
              <span className="text-[11px] text-[#555]">
                {orders.length} total
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : donutData.length === 0 ? (
              <div className="flex flex-col items-center py-8 gap-2">
                <PackageIcon size={36} color="#2a2a2a" />
                <p className="text-[13px] text-[#555]">No orders yet</p>
              </div>
            ) : (
              <DonutChart data={donutData} />
            )}
          </div>

          {/* 7-day activity bar chart */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-[var(--font-syne)] font-semibold text-[15px] text-[#e0e0e0]">
                Last 7 Days
              </h3>
              <span className="text-[11px] text-[#555]">
                {last7.reduce((s, d) => s + d.count, 0)} orders
              </span>
            </div>
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex items-end justify-between gap-2 h-28">
                {last7.map((d, i) => {
                  const max = Math.max(...last7.map((x) => x.count), 1);
                  const pct = d.count / max;
                  return (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-1.5 flex-1"
                    >
                      <span className="text-[10px] text-[#555]">
                        {d.count > 0 ? d.count : ""}
                      </span>
                      <div
                        className="w-full rounded-t-lg transition-all"
                        style={{
                          height: `${Math.max(pct * 80, d.count > 0 ? 8 : 3)}px`,
                          background: d.count > 0 ? "#ff2d2d" : "#1e1e1e",
                          opacity: 0.4 + pct * 0.6,
                        }}
                      />
                      <span className="text-[10px] text-[#555]">{d.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Recent orders */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e1e]">
            <h3 className="font-[var(--font-syne)] font-semibold text-[15px] text-[#e0e0e0]">
              Recent Orders
            </h3>
            <a
              href="/orderpage"
              className="flex items-center gap-1 text-[12px] text-[#ff2d2d] no-underline hover:opacity-75 transition-opacity"
            >
              View all <ArrowRightIcon size={12} color="currentColor" />
            </a>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-10 gap-3">
              <div className="w-7 h-7 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-12 gap-3">
              <PackageIcon size={40} color="#2a2a2a" />
              <p className="text-[14px] text-[#555]">No orders assigned yet</p>
              <p className="text-[12px] text-[#444] text-center max-w-xs">
                Orders will appear here when customers select your logistics
                service
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#1e1e1e]">
              {recentOrders.map((order) => {
                const image = getImage(order);
                const ls = order.logisticsStatus ?? "pending";
                return (
                  <a
                    key={order._id}
                    href="/orderpage"
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/[0.02] transition-colors no-underline"
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#222] flex items-center justify-center shrink-0 overflow-hidden border border-[#2a2a2a]">
                      {image ? (
                        <img
                          src={image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <PackageIcon size={18} color="#444" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
                        {getProductName(order)}
                      </p>
                      <p className="text-[11px] text-[#555]">
                        {getBuyerName(order)} · {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[13px] font-semibold text-[#e0e0e0]">
                        {formatNaira(order.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${logisticsBadge[ls] ?? "bg-[#222] text-[#666]"}`}
                      >
                        {ls.charAt(0).toUpperCase() + ls.slice(1)}
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        {/* Coverage areas */}
        {provider?.coverageAreas && provider.coverageAreas.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[15px] text-[#e0e0e0] mb-4">
              Coverage Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {provider.coverageAreas.map((area: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#2a2a2a] rounded-xl"
                >
                  <div className="w-2 h-2 rounded-full bg-[#ff2d2d] shrink-0" />
                  <span className="text-[12px] text-[#e0e0e0] font-medium">
                    {area.state}
                  </span>
                  <span className="text-[11px] text-[#555]">
                    {area.isStatewide
                      ? "Statewide"
                      : `${area.lgas?.length ?? 0} LGA${(area.lgas?.length ?? 0) !== 1 ? "s" : ""}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
