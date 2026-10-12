"use client";

import { useState, useEffect, useCallback } from "react";
import { useSidebar } from "./SidebarContext";
import {
  deliveriesApi,
  Delivery,
  DeliveryStatus,
  ordersApi,
  Order,
} from "@/lib/dezenmart-api";
import { getProvider } from "@/lib/api";

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getOrderName(delivery: Delivery): string {
  if (typeof delivery.order === "object" && delivery.order !== null) {
    const product = (delivery.order as Order).product;
    if (typeof product === "object" && product !== null)
      return product.name ?? "Order";
  }
  return "Order";
}

const statusStyles: Record<DeliveryStatus, string> = {
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  assigned: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  picked_up: "bg-purple-500/15 text-purple-400 border border-purple-500/30",
  in_transit: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30",
  delivered: "bg-green-500/15 text-green-400 border border-green-500/30",
  cancelled: "bg-[#2a2a2a] text-[#666] border border-[#333]",
  failed: "bg-red-500/15 text-red-400 border border-red-500/30",
};

const statusIcons: Record<DeliveryStatus, string> = {
  pending: "⏳",
  assigned: "👤",
  picked_up: "📤",
  in_transit: "🚚",
  delivered: "✅",
  cancelled: "❌",
  failed: "⚠️",
};

function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusStyles[status]}`}
    >
      {statusIcons[status]}{" "}
      {status.replace("_", " ").charAt(0).toUpperCase() +
        status.replace("_", " ").slice(1)}
    </span>
  );
}

/* ─── Create delivery modal ─────────────────────────────────────────────── */
function CreateDeliveryModal({
  orders,
  onClose,
  onCreate,
}: {
  orders: Order[];
  onClose: () => void;
  onCreate: (data: {
    order: string;
    deliveryAddress?: string;
    weight?: number;
    deliveryFee?: number;
    notes?: string;
    estimatedDeliveryDate?: string;
  }) => Promise<void>;
}) {
  const [orderId, setOrderId] = useState("");
  const [address, setAddress] = useState("");
  const [weight, setWeight] = useState("");
  const [fee, setFee] = useState("");
  const [notes, setNotes] = useState("");
  const [estDate, setEstDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show accepted orders that don't have a delivery yet
  const eligibleOrders = orders.filter((o) => o.logisticsStatus === "accepted");

  const handleCreate = async () => {
    if (!orderId) return setError("Please select an order");
    if (!address) return setError("Delivery address is required");
    setLoading(true);
    setError(null);
    try {
      await onCreate({
        order: orderId,
        deliveryAddress: address,
        weight: weight ? Number(weight) : undefined,
        deliveryFee: fee ? Number(fee) : undefined,
        notes: notes || undefined,
        estimatedDeliveryDate: estDate
          ? new Date(estDate).toISOString()
          : undefined,
      });
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create delivery",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a]">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Create Delivery
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Order (accepted only)
            </p>
            <select
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
            >
              <option value="">Select an order</option>
              {eligibleOrders.length === 0 ? (
                <option disabled>No accepted orders available</option>
              ) : (
                eligibleOrders.map((o) => (
                  <option key={o._id} value={o._id}>
                    {o.orderId ?? o._id.slice(-8).toUpperCase()} —{" "}
                    {typeof o.product === "object" && o.product
                      ? o.product.name
                      : "Product"}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Delivery Address
            </p>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12 Allen Avenue, Ikeja, Lagos"
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                Weight (kg)
              </p>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="0.5"
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                Delivery Fee (₦)
              </p>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="1500"
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Estimated Delivery Date
            </p>
            <input
              type="date"
              value={estDate}
              onChange={(e) => setEstDate(e.target.value)}
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Notes (optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special delivery instructions..."
              rows={3}
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading || !orderId}
              className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create Delivery"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Update delivery status modal ──────────────────────────────────────── */
function UpdateDeliveryModal({
  delivery,
  onClose,
  onUpdate,
}: {
  delivery: Delivery;
  onClose: () => void;
  onUpdate: (status: DeliveryStatus, tracking?: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<DeliveryStatus>(delivery.status);
  const [tracking, setTracking] = useState(delivery.trackingNumber ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flow: pending → assigned → picked_up → in_transit → delivered
  const flow: DeliveryStatus[] = [
    "pending",
    "assigned",
    "picked_up",
    "in_transit",
    "delivered",
  ];
  const currentIdx = flow.indexOf(delivery.status);
  const options = flow.filter((_, i) => i > currentIdx);

  const handleUpdate = async () => {
    setLoading(true);
    setError(null);
    try {
      await onUpdate(selected, tracking || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Update Delivery
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer text-lg"
          >
            ✕
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <p className="text-[12px] text-[#555]">Current:</p>
            <StatusBadge status={delivery.status} />
          </div>

          {options.length === 0 ? (
            <p className="text-[13px] text-[#555] text-center py-4">
              This delivery is already in its final state
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-[11px] text-[#555] uppercase tracking-wider">
                  Update to
                </p>
                {options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSelected(opt)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer text-left transition-all
                      ${
                        selected === opt
                          ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/50 text-[#e0e0e0]"
                          : "bg-transparent border-[#2a2a2a] text-[#666] hover:border-[#444] hover:text-[#aaa]"
                      }`}
                  >
                    <span className="text-lg">{statusIcons[opt]}</span>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium capitalize">
                        {opt.replace("_", " ")}
                      </p>
                    </div>
                    {selected === opt && (
                      <span className="text-[#ff2d2d]">✓</span>
                    )}
                  </button>
                ))}
              </div>

              <div>
                <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                  Tracking Number (optional)
                </p>
                <input
                  type="text"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="TRK-XXXXXXXX"
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
                />
              </div>
            </>
          )}

          {error && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all"
            >
              Cancel
            </button>
            {options.length > 0 && (
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "Update"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────── */
const STATUS_FILTERS = [
  "All",
  "pending",
  "assigned",
  "picked_up",
  "in_transit",
  "delivered",
  "cancelled",
  "failed",
] as const;
type DeliveryFilter = (typeof STATUS_FILTERS)[number];

export default function DeliveriesPage() {
  const { toggle } = useSidebar();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DeliveryFilter>("All");
  const [showCreate, setShowCreate] = useState(false);
  const [updating, setUpdating] = useState<Delivery | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      deliveriesApi.list({ limit: 100 }),
      ordersApi.getMyOrders({ limit: 100 }),
    ])
      .then(([delivRes, orderRes]) => {
        // API returns paginated response — extract the array correctly
        const delivData =
          (delivRes as any)?.data?.deliveries ??
          (delivRes as any)?.data ??
          (delivRes as any)?.deliveries ??
          [];
        setDeliveries(Array.isArray(delivData) ? delivData : []);
        setOrders(orderRes.data.orders);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // const handleCreate = async (
  //   data: Parameters<typeof deliveriesApi.create>[0],
  // ) => {
  //   // logisticsProvider is required — get from saved provider profile
  //   const provider = getProvider();
  //   const payload = {
  //     ...data,
  //     logisticsProvider: provider?._id ?? "",
  //   };
  //   console.log(
  //     "Creating delivery with payload:",
  //     JSON.stringify(payload, null, 2),
  //   );
  //   const delivery = await deliveriesApi.create(payload);
  //   setDeliveries((prev) => [delivery, ...prev]);
  //   showSuccess("Delivery created successfully");
  // };

  const handleCreate = async (
    data: Parameters<typeof deliveriesApi.create>[0],
  ) => {
    const provider = getProvider();
    if (!provider?._id) throw new Error("Provider not found. Please refresh.");

    const payload = {
      order: data.order,
      deliveryAddress: data.deliveryAddress ?? "",
      logisticsProvider: provider._id,
      ...(data.weight && { weight: data.weight }),
      ...(data.deliveryFee && { deliveryFee: data.deliveryFee }),
      ...(data.notes && { notes: data.notes }),
      ...(data.estimatedDeliveryDate && {
        estimatedDeliveryDate: data.estimatedDeliveryDate,
      }),
    };

    console.log("Delivery payload:", JSON.stringify(payload, null, 2));
    const delivery = await deliveriesApi.create(payload);
    setDeliveries((prev) => [delivery, ...prev]);
    showSuccess("Delivery created successfully");
  };

  const handleUpdate = async (
    id: string,
    status: DeliveryStatus,
    tracking?: string,
  ) => {
    await deliveriesApi.update(id, { status, trackingNumber: tracking });
    setDeliveries((prev) =>
      prev.map((d) =>
        d._id === id
          ? { ...d, status, trackingNumber: tracking ?? d.trackingNumber }
          : d,
      ),
    );
    showSuccess(`Delivery updated to ${status.replace("_", " ")}`);
  };

  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];
  const filtered = safeDeliveries.filter(
    (d) => filter === "All" || d.status === filter,
  );

  const stats = [
    {
      label: "Total",
      value: safeDeliveries.length,
      icon: "📦",
      color: "text-[#f0f0f0]",
    },
    {
      label: "In Transit",
      value: safeDeliveries.filter((d) => d.status === "in_transit").length,
      icon: "🚚",
      color: "text-blue-400",
    },
    {
      label: "Delivered",
      value: safeDeliveries.filter((d) => d.status === "delivered").length,
      icon: "✅",
      color: "text-green-400",
    },
    {
      label: "Failed",
      value: safeDeliveries.filter((d) => d.status === "failed").length,
      icon: "⚠️",
      color: "text-red-400",
    },
  ];

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
              Deliveries
            </h1>
            <p className="text-[11px] text-[#555] hidden sm:block">
              Track and manage your active deliveries
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[12px] text-[#aaa] rounded-xl hover:border-[#444] transition-all cursor-pointer"
          >
            🔄
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff2d2d] text-white border-none rounded-xl text-[13px] font-semibold font-[var(--font-syne)] cursor-pointer hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            + New Delivery
          </button>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5">
        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[13px] text-red-400 flex items-center justify-between">
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError(null)}
              className="bg-transparent border-none cursor-pointer text-red-400"
            >
              ✕
            </button>
          </div>
        )}
        {success && (
          <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
            ✅ {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4"
            >
              <span className="text-[11px] text-[#777] flex items-center gap-1.5 mb-2">
                <span>{s.icon}</span>
                <span className="truncate">{s.label}</span>
              </span>
              <div
                className={`font-[var(--font-syne)] font-bold text-2xl lg:text-3xl ${s.color}`}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* Deliveries list */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
          {/* Filter toolbar */}
          <div className="flex items-center gap-2 px-4 lg:px-5 py-3 border-b border-[#222] overflow-x-auto">
            <span className="text-[12px] text-[#555] whitespace-nowrap shrink-0">
              {filtered.length} deliveries
            </span>
            <div className="flex items-center gap-0.5 bg-[#111] border border-[#2a2a2a] rounded-xl p-1 shrink-0">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border-none whitespace-nowrap capitalize
                    ${filter === f ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
                >
                  {f.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#555] text-sm">Loading deliveries...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3 text-[#555]">
              <span className="text-5xl">🚚</span>
              <p className="text-[14px] font-medium text-[#777]">
                No deliveries yet
              </p>
              <p className="text-[12px] text-center max-w-xs">
                Accept an order first, then create a delivery record for it
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-2 px-4 py-2 bg-[#ff2d2d] text-white rounded-xl text-[12px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
              >
                + Create Delivery
              </button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#1e1e1e]">
              {filtered.map((d) => (
                <div
                  key={d._id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors"
                >
                  {/* Status icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${statusStyles[d.status].split(" ")[0]}`}
                  >
                    {statusIcons[d.status]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-[#e0e0e0]">
                        {getOrderName(d)}
                      </p>
                      <StatusBadge status={d.status} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#555]">
                      <span>📅 Created {formatDate(d.createdAt)}</span>
                      {d.estimatedDeliveryDate && (
                        <span>
                          🎯 Expected {formatDate(d.estimatedDeliveryDate)}
                        </span>
                      )}
                      {d.trackingNumber && <span>🔖 {d.trackingNumber}</span>}
                      {d.deliveryFee && (
                        <span>
                          💰 ₦{Number(d.deliveryFee).toLocaleString()}
                        </span>
                      )}
                      {d.weight && <span>⚖️ {d.weight}kg</span>}
                    </div>
                    {d.deliveryAddress && (
                      <p className="text-[11px] text-[#555] mt-1 truncate">
                        📍 {d.deliveryAddress}
                      </p>
                    )}
                  </div>

                  {/* Action */}
                  {d.status !== "delivered" &&
                    d.status !== "cancelled" &&
                    d.status !== "failed" && (
                      <button
                        onClick={() => setUpdating(d)}
                        className="shrink-0 px-3 py-1.5 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-lg text-[11px] font-semibold cursor-pointer hover:bg-[#ff2d2d]/20 transition-all whitespace-nowrap"
                      >
                        Update
                      </button>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateDeliveryModal
          orders={orders}
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}
      {updating && (
        <UpdateDeliveryModal
          delivery={updating}
          onClose={() => setUpdating(null)}
          onUpdate={async (status, tracking) => {
            await handleUpdate(updating._id, status, tracking);
            setUpdating(null);
          }}
        />
      )}
    </>
  );
}
