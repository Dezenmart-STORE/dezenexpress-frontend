"use client";

import { useState, useEffect, useCallback } from "react";
import { useSidebar } from "./SidebarContext";
import { ordersApi, Order, LogisticsStatus } from "@/lib/dezenmart-api";
import {
  PackageIcon,
  ClockIcon,
  CheckCircleIcon,
  TruckIcon,
  AlertTriangleIcon,
  RefreshIcon,
  SearchIcon,
  XIcon,
  ChevronRightIcon,
} from "@/components/Icons";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function getImage(order: Order): string | null {
  const p =
    typeof order.product === "object" && order.product !== null
      ? order.product
      : null;
  if (!p?.images?.length) return null;
  return p.images[0].startsWith("http") ? p.images[0] : null;
}
function getProductName(order: Order): string {
  if (typeof order.product === "object" && order.product !== null)
    return order.product.name ?? "Product";
  if (order.orderId) return `Order ${order.orderId.slice(-6)}`;
  return "Order";
}
function getProductPrice(order: Order): number {
  if (typeof order.product === "object" && order.product !== null)
    return order.product.price ?? order.amount;
  return order.amount;
}
function getBuyer(order: Order) {
  return typeof order.buyer === "object" && order.buyer !== null
    ? order.buyer
    : null;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
function getActions(order: Order): {
  value: string;
  label: string;
  variant: "primary" | "danger" | "purple";
}[] {
  const o = order as any;
  // If order is already delivered (by status or logisticsStatus), no more actions
  if (
    o.status === "delivered" ||
    o.status === "delivery_confirmed" ||
    order.logisticsStatus === "delivered"
  )
    return [];
  if (order.logisticsStatus === "pending")
    return [
      { value: "accepted", label: "Accept", variant: "primary" },
      { value: "rejected", label: "Reject", variant: "danger" },
    ];
  if (order.logisticsStatus === "accepted")
    return [{ value: "ship", label: "Ship", variant: "primary" }];
  if (order.logisticsStatus === "shipped")
    return [{ value: "deliver", label: "Mark Delivered", variant: "purple" }];
  return [];
}

const lsStyles: Record<string, { bg: string; text: string }> = {
  pending: { bg: "bg-amber-500/15", text: "text-amber-400" },
  accepted: { bg: "bg-blue-500/15", text: "text-blue-400" },
  rejected: { bg: "bg-red-500/15", text: "text-red-400" },
  shipped: { bg: "bg-purple-500/15", text: "text-purple-400" },
  delivered: { bg: "bg-green-500/15", text: "text-green-400" },
};

function getEffectiveStatus(order: Order): LogisticsStatus | undefined {
  const o = order as any;
  // If order.status is "delivered", show as delivered regardless of logisticsStatus
  if (o.status === "delivered" || o.status === "delivery_confirmed")
    return "delivered";
  return order.logisticsStatus;
}

function LogisticsBadge({
  status,
  order,
}: {
  status?: LogisticsStatus;
  order?: Order;
}) {
  const effective = order ? getEffectiveStatus(order) : status;
  if (!effective) return null;
  const { bg, text } = lsStyles[effective] ?? lsStyles.pending;
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${bg} ${text}`}
    >
      {effective.charAt(0).toUpperCase() + effective.slice(1)}
    </span>
  );
}

function actionBtnClass(variant: "primary" | "danger" | "purple") {
  if (variant === "danger")
    return "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20";
  if (variant === "purple")
    return "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20";
  return "bg-[#ff2d2d]/10 border-[#ff2d2d]/30 text-[#ff2d2d] hover:bg-[#ff2d2d]/20";
}

function OrderStatusNote({ order }: { order: Order }) {
  const o = order as any;
  const isDelivered =
    order.logisticsStatus === "delivered" ||
    o.status === "delivered" ||
    o.status === "delivery_confirmed";
  if (isDelivered)
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-[12px] text-green-400">
        <CheckCircleIcon size={13} color="currentColor" />
        Delivered — funds released to your wallet
      </div>
    );
  if (order.logisticsStatus === "rejected")
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
        <XIcon size={13} color="currentColor" />
        Order rejected
      </div>
    );
  return null;
}

/* ─── Ship modal ──────────────────────────────────────────────────────────── */
function ShipModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (
    tracking?: string,
    notes?: string,
    date?: string,
  ) => Promise<void>;
}) {
  const [tracking, setTracking] = useState("");
  const [notes, setNotes] = useState("");
  const [estDate, setEstDate] = useState(
    (order as any).expectedDeliveryDate
      ? new Date((order as any).expectedDeliveryDate)
          .toISOString()
          .split("T")[0]
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Mark as Shipped
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
          >
            <XIcon size={18} color="currentColor" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-[#111] rounded-xl p-3">
            <p className="text-[12px] font-medium text-[#e0e0e0]">
              {getProductName(order)}
            </p>
            <p className="text-[11px] text-[#555]">
              {order.orderId ?? order._id.slice(-8).toUpperCase()}
            </p>
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
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none"
            />
          </div>
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Expected Delivery Date (optional)
            </p>
            <input
              type="date"
              value={estDate}
              onChange={(e) => setEstDate(e.target.value)}
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none"
            />
          </div>
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Notes (optional)
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Delivery notes..."
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none resize-none"
            />
          </div>
          {error && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setError(null);
                try {
                  await onConfirm(
                    tracking || undefined,
                    notes || undefined,
                    estDate ? new Date(estDate).toISOString() : undefined,
                  );
                  onClose();
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : "Failed");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "Updating..." : "Confirm Shipped"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Reject modal ────────────────────────────────────────────────────────── */
function RejectModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Reject Order
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
          >
            <XIcon size={18} color="currentColor" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="bg-[#111] rounded-xl p-3">
            <p className="text-[12px] font-medium text-[#e0e0e0]">
              {getProductName(order)}
            </p>
            <p className="text-[11px] text-[#555]">
              {order.orderId ?? order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Reason for rejection
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Outside coverage area..."
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none resize-none"
            />
          </div>
          {error && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading || !reason.trim()}
              onClick={async () => {
                if (!reason.trim()) return setError("Please provide a reason");
                setLoading(true);
                setError(null);
                try {
                  await onConfirm(reason.trim());
                  onClose();
                } catch (e: unknown) {
                  setError(e instanceof Error ? e.message : "Failed");
                } finally {
                  setLoading(false);
                }
              }}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:bg-red-600 disabled:opacity-30"
            >
              {loading ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dispute modal ───────────────────────────────────────────────────────── */
function DisputeModal({
  order,
  onClose,
  onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Raise a Dispute
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
          >
            <XIcon size={18} color="currentColor" />
          </button>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangleIcon size={14} color="#f59e0b" />
            <p className="text-[12px] text-amber-400">
              Disputes are reviewed by the platform admin team
            </p>
          </div>
          <div className="bg-[#111] rounded-xl p-3">
            <p className="text-[12px] font-medium text-[#e0e0e0]">
              {getProductName(order)}
            </p>
            <p className="text-[11px] text-[#555]">
              {order.orderId ?? order._id.slice(-8).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
              Reason for dispute (min 10 characters)
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              placeholder="Describe the issue in detail..."
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none resize-none"
            />
            <p className="text-[10px] text-[#555] mt-1">
              {reason.length}/10 minimum characters
            </p>
          </div>
          {error && (
            <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] transition-all"
            >
              Cancel
            </button>
            <button
              disabled={loading || reason.trim().length < 10}
              onClick={async () => {
                if (reason.trim().length < 10)
                  return setError("Please provide at least 10 characters");
                setLoading(true);
                setError(null);
                try {
                  await onConfirm(reason.trim());
                  onClose();
                } catch (e: unknown) {
                  setError(
                    e instanceof Error ? e.message : "Failed to raise dispute",
                  );
                } finally {
                  setLoading(false);
                }
              }}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:bg-amber-600 disabled:opacity-30"
            >
              {loading ? "Submitting..." : "Submit Dispute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Order detail modal ──────────────────────────────────────────────────── */
function OrderDetailModal({
  order,
  onClose,
  onAction,
}: {
  order: Order;
  onClose: () => void;
  onAction: (a: string) => void;
}) {
  const o = order as any;
  const image = getImage(order);
  const buyer = getBuyer(order);
  const seller =
    typeof order.seller === "object" && order.seller !== null
      ? (order.seller as any)
      : null;
  const actions = getActions(order);
  const addr =
    typeof o.deliveryAddress === "object" && o.deliveryAddress !== null
      ? o.deliveryAddress
      : null;
  const addrStr = addr
    ? [addr.street, addr.lga, addr.state, addr.country]
        .filter(Boolean)
        .join(", ")
    : null;
  const hasDispute = !!o.dispute;
  const canDispute =
    ["accepted", "shipped", "delivered"].includes(
      order.logisticsStatus ?? "",
    ) && !hasDispute;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#222] shrink-0">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Order Details
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
          >
            <XIcon size={18} color="currentColor" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {/* Product */}
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-[#222] flex items-center justify-center shrink-0 overflow-hidden border border-[#2a2a2a]">
              {image ? (
                <img
                  src={image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <PackageIcon size={24} color="#444" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-[#e0e0e0] truncate">
                {getProductName(order)}
              </p>
              <p className="text-[12px] text-[#555]">
                ${getProductPrice(order).toLocaleString()} · Qty:{" "}
                {order.quantity ?? 1}
              </p>
            </div>
            <LogisticsBadge status={order.logisticsStatus} order={order} />
          </div>

          {/* Order ID */}
          <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
              Order ID
            </p>
            <p className="text-[13px] text-[#e0e0e0] font-mono break-all">
              {order.orderId ?? order._id}
            </p>
          </div>

          {/* Delivery address */}
          {addr && (
            <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                Delivery Address
              </p>
              <p className="text-[13px] font-semibold text-[#e0e0e0]">
                {addr.fullName}
              </p>
              <p className="text-[12px] text-[#aaa] mt-0.5">{addr.phone}</p>
              <p className="text-[12px] text-[#aaa]">{addrStr}</p>
              {addr.zipCode && (
                <p className="text-[11px] text-[#555] mt-0.5">
                  ZIP: {addr.zipCode}
                </p>
              )}
            </div>
          )}

          {/* Key details — single column list (no grid, prevents overflow) */}
          <div className="bg-[#111] border border-[#222] rounded-xl divide-y divide-[#1e1e1e]">
            {[
              { label: "Amount", value: `$${order.amount.toLocaleString()}` },
              {
                label: "Delivery Fee",
                value: o.deliveryFee ? `$${o.deliveryFee}` : "—",
              },
              { label: "Quantity", value: String(order.quantity ?? 1) },
              { label: "Date Placed", value: formatDate(order.createdAt) },
              ...(o.expectedDeliveryDate
                ? [
                    {
                      label: "Expected By",
                      value: formatDate(o.expectedDeliveryDate),
                    },
                  ]
                : []),
              ...(o.shippedAt
                ? [{ label: "Shipped At", value: formatDate(o.shippedAt) }]
                : []),
              ...(o.trackingNumber
                ? [{ label: "Tracking", value: o.trackingNumber }]
                : []),
              { label: "Last Updated", value: formatDate(order.updatedAt) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-4 py-2.5 gap-4"
              >
                <p className="text-[11px] text-[#555] shrink-0">{label}</p>
                <p className="text-[12px] text-[#e0e0e0] font-medium text-right truncate max-w-[60%]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Shipping notes */}
          {o.shippingNotes && (
            <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
                Shipping Notes
              </p>
              <p className="text-[12px] text-[#aaa] leading-relaxed">
                {o.shippingNotes}
              </p>
            </div>
          )}

          {/* Buyer */}
          {buyer && (
            <div className="bg-[#111] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3">
              {buyer.profileImage ? (
                <img
                  src={buyer.profileImage}
                  alt=""
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#222] flex items-center justify-center shrink-0">
                  <PackageIcon size={14} color="#555" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-0.5">
                  Buyer
                </p>
                <p className="text-[13px] text-[#e0e0e0] font-medium truncate">
                  {buyer.name}
                </p>
                {buyer.email && (
                  <p className="text-[11px] text-[#555] truncate">
                    {buyer.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Dispute info */}
          {hasDispute && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangleIcon size={13} color="#f59e0b" />
                <p className="text-[11px] text-amber-400 font-semibold">
                  Dispute Raised
                </p>
              </div>
              <p className="text-[12px] text-[#aaa]">{o.dispute.reason}</p>
              <p className="text-[10px] text-[#555] mt-1">
                {o.dispute.resolved ? "Resolved" : "Pending resolution"}
              </p>
            </div>
          )}

          {/* Status note */}
          <OrderStatusNote order={order} />
        </div>

        {/* Actions — pinned to bottom */}
        {(actions.length > 0 || canDispute) && (
          <div className="shrink-0 px-5 py-4 border-t border-[#1e1e1e] flex flex-col gap-2">
            {actions.map((action) => (
              <button
                key={action.value}
                onClick={() => {
                  onClose();
                  onAction(action.value);
                }}
                className={`w-full py-2.5 rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border cursor-pointer transition-all ${actionBtnClass(action.variant)}`}
              >
                {action.label}
              </button>
            ))}
            {canDispute && (
              <button
                onClick={() => {
                  onClose();
                  onAction("dispute");
                }}
                className="w-full py-2.5 rounded-xl text-[13px] font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 cursor-pointer transition-all"
              >
                Raise a Dispute
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Mobile card ─────────────────────────────────────────────────────────── */
function OrderCard({
  order,
  onClick,
  onAction,
}: {
  order: Order;
  onClick: () => void;
  onAction: (a: string) => void;
}) {
  const image = getImage(order);
  const buyer = getBuyer(order);
  const actions = getActions(order);

  return (
    <div className="bg-[#141414] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
      <div onClick={onClick} className="flex gap-3 cursor-pointer">
        <div className="w-12 h-12 rounded-xl bg-[#222] flex items-center justify-center shrink-0 overflow-hidden border border-[#2a2a2a]">
          {image ? (
            <img src={image} alt="" className="w-full h-full object-cover" />
          ) : (
            <PackageIcon size={22} color="#444" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="text-[13px] font-semibold text-[#e0e0e0] truncate">
              {getProductName(order)}
            </p>
            <LogisticsBadge status={order.logisticsStatus} />
          </div>
          <p className="text-[12px] text-[#aaa] font-semibold">
            ${order.amount.toLocaleString()}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {buyer?.name && (
              <p className="text-[11px] text-[#555] truncate">{buyer.name}</p>
            )}
            <p className="text-[11px] text-[#555] shrink-0">
              {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
      </div>
      {actions.length > 0 ? (
        <div className="flex gap-2">
          {actions.map((action) => (
            <button
              key={action.value}
              onClick={() => onAction(action.value)}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold cursor-pointer transition-all border ${actionBtnClass(action.variant)}`}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : (
        <OrderStatusNote order={order} />
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
const FILTERS = [
  "All",
  "pending",
  "accepted",
  "shipped",
  "delivered",
  "rejected",
] as const;
type Filter = (typeof FILTERS)[number];

export default function OrdersPage() {
  const { toggle } = useSidebar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("All");
  const [visible, setVisible] = useState(20);
  const [selected, setSelected] = useState<Order | null>(null);
  const [shipOrder, setShipOrder] = useState<Order | null>(null);
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null);
  const [disputeOrder, setDisputeOrder] = useState<Order | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    ordersApi
      .getMyOrders({ limit: 100 })
      .then((res) => setOrders(res.data.orders ?? []))
      .catch((err) => {
        // Ignore SSR errors — component will retry on client
        if (err.message?.includes("client-side")) return;
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (order: Order, action: string) => {
    try {
      if (action === "accepted") {
        await ordersApi.accept(order._id);
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id
              ? { ...o, logisticsStatus: "accepted" as LogisticsStatus }
              : o,
          ),
        );
        showSuccess("Order accepted");
      } else if (action === "ship") {
        setShipOrder(order);
      } else if (action === "rejected") {
        setRejectOrder(order);
      } else if (action === "deliver") {
        await ordersApi.deliver(order._id);
        setOrders((prev) =>
          prev.map((o) =>
            o._id === order._id
              ? {
                  ...o,
                  status: "delivered" as any,
                  logisticsStatus: "delivered" as LogisticsStatus,
                }
              : o,
          ),
        );
        showSuccess("Order marked as delivered");
      } else if (action === "dispute") {
        setDisputeOrder(order);
      }
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    }
  };

  const handleShip = async (
    tracking?: string,
    notes?: string,
    date?: string,
  ) => {
    if (!shipOrder) return;
    await ordersApi.ship(shipOrder._id, {
      trackingNumber: tracking,
      notes,
      expectedDeliveryDate: date,
    });
    setOrders((prev) =>
      prev.map((o) =>
        o._id === shipOrder._id
          ? { ...o, logisticsStatus: "shipped" as LogisticsStatus }
          : o,
      ),
    );
    showSuccess("Order marked as shipped");
    setShipOrder(null);
  };

  const handleReject = async (reason: string) => {
    if (!rejectOrder) return;
    await ordersApi.reject(rejectOrder._id, reason);
    setOrders((prev) =>
      prev.map((o) =>
        o._id === rejectOrder._id
          ? { ...o, logisticsStatus: "rejected" as LogisticsStatus }
          : o,
      ),
    );
    showSuccess("Order rejected");
    setRejectOrder(null);
  };

  const handleDispute = async (reason: string) => {
    if (!disputeOrder) return;
    await ordersApi.raiseDispute(disputeOrder._id, reason);
    setOrders((prev) =>
      prev.map((o) =>
        o._id === disputeOrder._id
          ? { ...o, dispute: { raisedBy: "provider", reason, resolved: false } }
          : o,
      ),
    );
    showSuccess("Dispute submitted successfully");
    setDisputeOrder(null);
  };

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    const matchSearch =
      getProductName(o).toLowerCase().includes(q) ||
      (o.orderId ?? o._id).toLowerCase().includes(q) ||
      (getBuyer(o)?.name.toLowerCase() ?? "").includes(q);
    const effectiveStatus = getEffectiveStatus(o) ?? o.logisticsStatus;
    const matchFilter = filter === "All" || effectiveStatus === filter;
    return matchSearch && matchFilter;
  });

  const shown = filtered.slice(0, visible);

  const stats = [
    {
      label: "Assigned",
      value: orders.length,
      Icon: PackageIcon,
      color: "text-[#f0f0f0]",
    },
    {
      label: "Pending",
      value: orders.filter((o) => o.logisticsStatus === "pending").length,
      Icon: ClockIcon,
      color: "text-amber-400",
    },
    {
      label: "Shipped",
      value: orders.filter((o) => o.logisticsStatus === "shipped").length,
      Icon: TruckIcon,
      color: "text-purple-400",
    },
    {
      label: "Delivered",
      value: orders.filter(
        (o) =>
          o.logisticsStatus === "delivered" ||
          (o as any).status === "delivered",
      ).length,
      Icon: CheckCircleIcon,
      color: "text-green-400",
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
              Orders
            </h1>
            <p className="text-[11px] text-[#555] hidden sm:block">
              Orders assigned to your account
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[12px] text-[#aaa] hover:border-[#444] transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshIcon size={13} color="currentColor" /> Refresh
        </button>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5">
        {(error || actionError) && (
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[13px] text-red-400 gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon size={15} color="currentColor" />
              {error || actionError}
            </div>
            <button
              onClick={() => {
                setError(null);
                setActionError(null);
              }}
              className="bg-transparent border-none cursor-pointer shrink-0"
            >
              <XIcon size={14} color="currentColor" />
            </button>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
            <CheckCircleIcon size={15} color="currentColor" />
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4 hover:border-[#333] transition-colors"
            >
              <s.Icon size={15} color="#555" />
              <div
                className={`font-[var(--font-syne)] font-bold text-2xl lg:text-3xl ${s.color} mt-2`}
              >
                {s.value}
              </div>
              <p className="text-[11px] text-[#555] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 lg:px-5 py-3 lg:py-4 border-b border-[#222]">
            <div className="flex items-center gap-2 overflow-x-auto shrink-0">
              <span className="text-[12px] text-[#555] whitespace-nowrap shrink-0">
                {filtered.length} orders
              </span>
              <div className="flex items-center gap-0.5 bg-[#111] border border-[#2a2a2a] rounded-xl p-1 shrink-0">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setVisible(20);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border-none whitespace-nowrap capitalize
                      ${filter === f ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 gap-2 w-full sm:w-[240px] lg:w-[300px] focus-within:border-[#ff2d2d] transition-colors shrink-0">
              <SearchIcon size={13} color="#555" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search order, product, buyer..."
                className="bg-transparent border-none outline-none text-[#aaa] text-[13px] w-full placeholder:text-[#444]"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="bg-transparent border-none cursor-pointer shrink-0"
                >
                  <XIcon size={12} color="#555" />
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#555] text-sm">Loading your orders...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <PackageIcon size={48} color="#2a2a2a" />
              <p className="text-[14px] font-medium text-[#777]">
                {orders.length === 0
                  ? "No orders assigned yet"
                  : "No orders match your filter"}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-[#1e1e1e] bg-[#141414]">
                    <tr>
                      {[
                        "Order ID",
                        "Product",
                        "Buyer",
                        "Amount",
                        "Qty",
                        "Status",
                        "Date",
                        "Actions",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="text-left text-[11px] font-medium text-[#555] py-3 px-4 whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((o, i) => {
                      const image = getImage(o);
                      const buyer = getBuyer(o);
                      const actions = getActions(o);
                      return (
                        <tr
                          key={o._id}
                          className={`border-b border-[#1e1e1e] hover:bg-white/[0.02] transition-colors ${i % 2 !== 0 ? "bg-[#141414]/40" : ""}`}
                        >
                          <td
                            className="px-4 py-3.5 text-[12px] text-[#555] font-mono whitespace-nowrap cursor-pointer"
                            onClick={() => setSelected(o)}
                          >
                            {o.orderId ?? o._id.slice(-8).toUpperCase()}
                          </td>
                          <td
                            className="px-4 py-3.5 cursor-pointer"
                            onClick={() => setSelected(o)}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-[#222] flex items-center justify-center shrink-0 overflow-hidden border border-[#2a2a2a]">
                                {image ? (
                                  <img
                                    src={image}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <PackageIcon size={14} color="#444" />
                                )}
                              </div>
                              <span className="text-[13px] text-[#e0e0e0] font-medium truncate max-w-[150px]">
                                {getProductName(o)}
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-4 py-3.5 cursor-pointer"
                            onClick={() => setSelected(o)}
                          >
                            <div className="flex items-center gap-2">
                              {buyer?.profileImage && (
                                <img
                                  src={buyer.profileImage}
                                  alt=""
                                  className="w-6 h-6 rounded-full object-cover shrink-0"
                                />
                              )}
                              <span className="text-[12px] text-[#aaa] truncate max-w-[120px]">
                                {buyer?.name ?? "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-[13px] font-semibold text-[#e0e0e0] whitespace-nowrap">
                            ${o.amount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3.5 text-[13px] text-[#aaa]">
                            {o.quantity ?? 1}
                          </td>
                          <td className="px-4 py-3.5">
                            <LogisticsBadge status={o.logisticsStatus} />
                          </td>
                          <td className="px-4 py-3.5 text-[12px] text-[#555] whitespace-nowrap">
                            {formatDate(o.createdAt)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              {actions.map((action) => (
                                <button
                                  key={action.value}
                                  onClick={() => handleAction(o, action.value)}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all whitespace-nowrap border ${actionBtnClass(action.variant)}`}
                                >
                                  {action.label}
                                </button>
                              ))}
                              {actions.length === 0 && (
                                <button
                                  onClick={() => setSelected(o)}
                                  className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
                                >
                                  <ChevronRightIcon
                                    size={16}
                                    color="currentColor"
                                  />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="lg:hidden flex flex-col gap-3 p-4 pb-6">
                {shown.map((o) => (
                  <OrderCard
                    key={o._id}
                    order={o}
                    onClick={() => setSelected(o)}
                    onAction={(a) => handleAction(o, a)}
                  />
                ))}
              </div>
            </>
          )}

          {visible < filtered.length && (
            <div className="flex justify-center py-4 border-t border-[#1e1e1e]">
              <button
                onClick={() => setVisible((v) => v + 20)}
                className="text-[13px] text-[#666] hover:text-[#aaa] transition-colors cursor-pointer border-none bg-transparent"
              >
                Load more ({filtered.length - visible} remaining)
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <OrderDetailModal
          order={selected}
          onClose={() => setSelected(null)}
          onAction={(a) => {
            setSelected(null);
            handleAction(selected, a);
          }}
        />
      )}
      {shipOrder && (
        <ShipModal
          order={shipOrder}
          onClose={() => setShipOrder(null)}
          onConfirm={handleShip}
        />
      )}
      {rejectOrder && (
        <RejectModal
          order={rejectOrder}
          onClose={() => setRejectOrder(null)}
          onConfirm={handleReject}
        />
      )}
      {disputeOrder && (
        <DisputeModal
          order={disputeOrder}
          onClose={() => setDisputeOrder(null)}
          onConfirm={handleDispute}
        />
      )}
    </>
  );
}
