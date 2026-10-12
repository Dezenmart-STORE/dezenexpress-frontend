"use client";

import { useState, useEffect, useCallback } from "react";
import { useSidebar } from "./SidebarContext";
import { providersApi, adminApi, Provider } from "@/lib/api";
import { adminRiderApi } from "@/lib/express/api";
import {
  CheckCircleIcon,
  XIcon,
  AlertTriangleIcon,
  SearchIcon,
  UserIcon,
  MapPinIcon,
  StarIcon,
  PackageIcon,
  RefreshIcon,
  ShieldIcon,
  ChevronRightIcon,
  ToggleRightIcon,
  ToggleLeftIcon,
} from "@/components/Icons";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const statusStyles: Record<Provider["verificationStatus"], string> = {
  pending: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
  verified: "bg-green-500/15 text-green-400 border border-green-500/30",
  rejected: "bg-red-500/15 text-red-400 border border-red-500/30",
};

function StatusBadge({
  status,
}: {
  status: Provider["verificationStatus"] | undefined | null;
}) {
  const safeStatus: Provider["verificationStatus"] = status ?? "pending";
  const Icon =
    safeStatus === "verified"
      ? CheckCircleIcon
      : safeStatus === "rejected"
        ? XIcon
        : AlertTriangleIcon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap ${statusStyles[safeStatus] ?? statusStyles.pending}`}
    >
      <Icon size={11} color="currentColor" />
      {safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1)}
    </span>
  );
}

function StarRating({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <StarIcon
          key={i}
          size={12}
          color={i < filled ? "#f59e0b" : "#2a2a2a"}
        />
      ))}
      <span className="text-[11px] text-[#555] ml-0.5">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/* ─── Provider detail modal ───────────────────────────────────────────────── */
function ProviderModal({
  provider,
  onClose,
  onVerify,
  onReject,
  loading,
}: {
  provider: Provider;
  onClose: () => void;
  onVerify: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const initials = provider.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const safeVerificationStatus: Provider["verificationStatus"] =
    provider.verificationStatus ?? "pending";

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a] z-10">
          <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
            Provider Details
          </h3>
          <button
            onClick={onClose}
            className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
          >
            <XIcon size={18} color="currentColor" />
          </button>
        </div>

        <div className="flex flex-col gap-5 p-6">
          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#ff2d2d]/10 border-2 border-[#ff2d2d]/20 flex items-center justify-center text-xl font-bold text-[#ff2d2d] font-[var(--font-syne)] shrink-0 overflow-hidden">
              {provider.profileImage ? (
                <img
                  src={provider.profileImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h4 className="font-[var(--font-syne)] font-bold text-[15px] text-[#f0f0f0]">
                  {provider.name}
                </h4>
                <StatusBadge status={provider.verificationStatus} />
              </div>
              <p className="text-[13px] text-[#555]">{provider.email}</p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Phone", value: provider.phone },
              {
                label: "Rating",
                value: <StarRating rating={provider.rating} />,
              },
              {
                label: "Deliveries",
                value: provider.totalDeliveries.toLocaleString(),
              },
              {
                label: "Active",
                value: (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${provider.isActive ? "text-green-400" : "text-[#555]"}`}
                  >
                    {provider.isActive ? (
                      <ToggleRightIcon size={16} color="#22c55e" />
                    ) : (
                      <ToggleLeftIcon size={16} color="#555" />
                    )}
                    {provider.isActive ? "Active" : "Inactive"}
                  </span>
                ),
              },
              {
                label: "Member Since",
                value: provider.createdAt
                  ? new Date(provider.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
              {
                label: "Provider ID",
                value: (
                  <span className="font-mono text-[10px] truncate">
                    {provider._id}
                  </span>
                ),
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-[#111] rounded-xl p-3">
                <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
                  {label}
                </p>
                <div className="text-[13px] text-[#e0e0e0]">{value}</div>
              </div>
            ))}
          </div>

          {/* Wallet */}
          <div className="bg-[#111] rounded-xl p-3">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
              Wallet Address
            </p>
            <p className="text-[12px] text-[#e0e0e0] font-mono break-all">
              {provider.walletAddress}
            </p>
          </div>

          {/* Coverage areas */}
          {provider.coverageAreas?.length > 0 && (
            <div className="bg-[#111] rounded-xl p-3">
              <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
                Coverage Areas
              </p>
              <div className="flex flex-col gap-2">
                {provider.coverageAreas.map((area, i) => (
                  <div key={i} className="flex items-start gap-2 text-[12px]">
                    <MapPinIcon
                      size={13}
                      color="#ff2d2d"
                      className="shrink-0 mt-0.5"
                    />
                    <span className="text-[#aaa]">
                      <span className="text-[#e0e0e0] font-medium">
                        {area.state}
                      </span>
                      {area.isStatewide
                        ? " — Statewide"
                        : area.lgas.length > 0
                          ? ` — ${area.lgas.join(", ")}`
                          : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {safeVerificationStatus === "pending" && (
            <div className="flex gap-3 pt-2 border-t border-[#1e1e1e]">
              <button
                onClick={onReject}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all disabled:opacity-40"
              >
                <XIcon size={14} color="currentColor" />
                {loading ? "Processing..." : "Reject"}
              </button>
              <button
                onClick={onVerify}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-green-500/20 transition-all disabled:opacity-40"
              >
                <CheckCircleIcon size={14} color="currentColor" />
                {loading ? "Processing..." : "Verify"}
              </button>
            </div>
          )}

          {safeVerificationStatus === "verified" && (
            <button
              onClick={onReject}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all disabled:opacity-40"
            >
              <XIcon size={14} color="currentColor" />
              {loading ? "Processing..." : "Revoke Verification"}
            </button>
          )}

          {safeVerificationStatus === "rejected" && (
            <button
              onClick={onVerify}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-green-500/20 transition-all disabled:opacity-40"
            >
              <CheckCircleIcon size={14} color="currentColor" />
              {loading ? "Processing..." : "Re-verify Provider"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Desktop table row ───────────────────────────────────────────────────── */
function ProviderRow({
  provider,
  onClick,
}: {
  provider: Provider;
  onClick: () => void;
}) {
  const initials = provider.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <tr
      onClick={onClick}
      className="border-b border-[#1e1e1e] hover:bg-white/[0.02] transition-colors cursor-pointer group"
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center text-[11px] font-bold text-[#ff2d2d] shrink-0 overflow-hidden">
            {provider.profileImage ? (
              <img
                src={provider.profileImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-medium text-[#e0e0e0] truncate">
              {provider.name}
            </p>
            <p className="text-[11px] text-[#555] truncate">{provider.email}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 text-[12px] text-[#aaa]">{provider.phone}</td>
      <td className="px-4 py-3.5">
        <StatusBadge status={provider.verificationStatus} />
      </td>
      <td className="px-4 py-3.5">
        <StarRating rating={provider.rating} />
      </td>
      <td className="px-4 py-3.5 text-[12px] text-[#aaa]">
        {provider.totalDeliveries}
      </td>
      <td className="px-4 py-3.5">
        {provider.isActive ? (
          <ToggleRightIcon size={18} color="#22c55e" />
        ) : (
          <ToggleLeftIcon size={18} color="#555" />
        )}
      </td>
      <td className="px-4 py-3.5 text-[12px] text-[#555] whitespace-nowrap">
        {provider.createdAt
          ? new Date(provider.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : "—"}
      </td>
      <td className="px-4 py-3.5">
        <ChevronRightIcon size={16} color="#555" />
      </td>
    </tr>
  );
}

/* ─── Mobile card ─────────────────────────────────────────────────────────── */
function ProviderCard({
  provider,
  onClick,
}: {
  provider: Provider;
  onClick: () => void;
}) {
  const initials = provider.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      onClick={onClick}
      className="bg-[#141414] border border-[#222] rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#333] transition-colors"
    >
      <div className="w-11 h-11 rounded-xl bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center text-[13px] font-bold text-[#ff2d2d] shrink-0 overflow-hidden">
        {provider.profileImage ? (
          <img
            src={provider.profileImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-[13px] font-semibold text-[#e0e0e0] truncate">
            {provider.name}
          </p>
          <StatusBadge status={provider.verificationStatus} />
        </div>
        <p className="text-[11px] text-[#555] truncate">{provider.email}</p>
        <div className="flex items-center gap-3 mt-1">
          <StarRating rating={provider.rating} />
          <span className="text-[11px] text-[#555] flex items-center gap-1">
            <PackageIcon size={11} color="#555" />
            {provider.totalDeliveries}
          </span>
        </div>
      </div>
      <ChevronRightIcon size={16} color="#555" />
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
type FilterStatus = "all" | Provider["verificationStatus"];
const LIMIT = 20;

// Rider shape — matches the real API response confirmed via console log:
// { status: 'success', data: { riders: [...], total, page, limit } }
// Each rider has: id, name, email, phone, vehicleType, vehiclePlateNumber,
// driverLicenseNumber, rating, totalTrips, totalEarnings, availabilityStatus,
// verificationStatus ("pending" | "verified" | "rejected" | "approved").
interface PendingRider {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  vehicleType: string;
  vehiclePlateNumber?: string;
  driverLicenseNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  status?: "pending" | "approved" | "rejected";
  verificationStatus?: "pending" | "verified" | "rejected" | "approved";
  rating?: number;
  totalTrips?: number;
  totalEarnings?: number;
  availabilityStatus?: string;
  createdAt?: string;
}

const VEHICLE_ICONS: Record<string, string> = {
  bicycle: "🚲",
  motorcycle: "🏍",
  tricycle: "🛺",
  car: "🚗",
  van: "🚐",
  truck: "🚛",
};

export default function AdminPage() {
  const { toggle } = useSidebar();
  const [adminTab, setAdminTab] = useState<"providers" | "riders">("providers");

  // ── Providers state ──────────────────────────────────────────────────────
  const [providers, setProviders] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Riders state ─────────────────────────────────────────────────────────
  const [riders, setRiders] = useState<PendingRider[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [riderFilter, setRiderFilter] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [riderSearch, setRiderSearch] = useState("");
  const [selectedRider, setSelectedRider] = useState<PendingRider | null>(null);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    const params = {
      page,
      limit: LIMIT,
      ...(filterStatus !== "all"
        ? { verificationStatus: filterStatus as Provider["verificationStatus"] }
        : {}),
    };
    providersApi
      .list(params)
      .then((res) => {
        setProviders(res.data.providers);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, filterStatus]);

  // Load riders — real API: GET /express/rider/pending
  // Confirmed runtime shape: { status: 'success', data: { riders: [...], total, page, limit } }
  // The adminRiderApi.getPending() TS return type doesn't match this runtime
  // shape (declared without the `data` wrapper), so we cast and read defensively.
  const loadRiders = useCallback(async () => {
    setRidersLoading(true);
    try {
      const res = await adminRiderApi.getPending();
      const raw = res as any;
      const list: PendingRider[] = Array.isArray(raw?.data?.riders)
        ? raw.data.riders
        : Array.isArray(raw?.riders)
          ? raw.riders
          : Array.isArray(raw)
            ? raw
            : [];
      setRiders(list);
    } catch {
      // Fall back to mock if API not ready
      setRiders([
        {
          _id: "r1",
          name: "Emeka Obi",
          email: "emeka@email.com",
          phone: "08012345678",
          vehicleType: "motorcycle",
          vehiclePlateNumber: "LAG-234-KA",
          driverLicenseNumber: "FRN-1234567890",
          bankName: "First Bank",
          bankAccountNumber: "3012345678",
          bankAccountName: "Emeka Obi",
          verificationStatus: "pending",
          createdAt: new Date().toISOString(),
        },
        {
          _id: "r2",
          name: "Chioma Nwosu",
          email: "chioma@email.com",
          phone: "08098765432",
          vehicleType: "bicycle",
          vehiclePlateNumber: "N/A",
          driverLicenseNumber: "FRN-9876543210",
          bankName: "GTBank",
          bankAccountNumber: "0123456789",
          bankAccountName: "Chioma Nwosu",
          verificationStatus: "pending",
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setRidersLoading(false);
    }
  }, []);

  // PATCH /express/rider/:id/verify { status: "verified" }
  const approveRider = async (id: string | undefined) => {
    if (!id) return;
    try {
      await adminRiderApi.verifyRider(id, "verified");
      setRiders((prev) =>
        prev.map((r) =>
          (r.id ?? r._id) === id ? { ...r, verificationStatus: "verified" } : r,
        ),
      );
      setSelectedRider((prev) =>
        prev && (prev.id ?? prev._id) === id
          ? { ...prev, verificationStatus: "verified" }
          : prev,
      );
      showSuccess("Rider approved successfully");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to approve rider");
    }
  };

  // PATCH /express/rider/:id/verify { status: "rejected" }
  const rejectRider = async (id: string | undefined) => {
    if (!id) return;
    try {
      await adminRiderApi.verifyRider(id, "rejected");
      setRiders((prev) =>
        prev.map((r) =>
          (r.id ?? r._id) === id ? { ...r, verificationStatus: "rejected" } : r,
        ),
      );
      setSelectedRider((prev) =>
        prev && (prev.id ?? prev._id) === id
          ? { ...prev, verificationStatus: "rejected" }
          : prev,
      );
      showSuccess("Rider rejected");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to reject rider");
    }
  };

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadRiders();
  }, [loadRiders]);

  const handleVerify = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminApi.verifyProvider(selected._id, "verified");
      setProviders((prev) =>
        prev.map((p) =>
          p._id === selected._id ? { ...p, verificationStatus: "verified" } : p,
        ),
      );
      setSelected((prev) =>
        prev ? { ...prev, verificationStatus: "verified" } : null,
      );
      showSuccess(`${selected.name} has been verified`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to verify provider",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setActionLoading(true);
    try {
      await adminApi.verifyProvider(selected._id, "rejected");
      setProviders((prev) =>
        prev.map((p) =>
          p._id === selected._id ? { ...p, verificationStatus: "rejected" } : p,
        ),
      );
      setSelected((prev) =>
        prev ? { ...prev, verificationStatus: "rejected" } : null,
      );
      showSuccess(`${selected.name} has been rejected`);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to reject provider",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const pendingCount = providers.filter(
    (p) => (p.verificationStatus ?? "pending") === "pending",
  ).length;
  const verifiedCount = providers.filter(
    (p) => p.verificationStatus === "verified",
  ).length;
  const rejectedCount = providers.filter(
    (p) => p.verificationStatus === "rejected",
  ).length;

  const filtered = providers.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch =
      p.name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      (p.phone ?? "").includes(q);
    const matchesStatus =
      filterStatus === "all" ||
      (p.verificationStatus ?? "pending") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      label: "Total",
      value: total,
      color: "text-[#f0f0f0]",
      Icon: UserIcon,
      filter: "all",
    },
    {
      label: "Pending",
      value: pendingCount,
      color: "text-amber-400",
      Icon: AlertTriangleIcon,
      filter: "pending",
    },
    {
      label: "Verified",
      value: verifiedCount,
      color: "text-green-400",
      Icon: CheckCircleIcon,
      filter: "verified",
    },
    {
      label: "Rejected",
      value: rejectedCount,
      color: "text-red-400",
      Icon: XIcon,
      filter: "rejected",
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
            {["a", "b", "c"].map((k) => (
              <span key={k} className="w-5 h-0.5 bg-[#aaa] rounded block" />
            ))}
          </button>
          <div>
            <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
              Admin
            </h1>
            <p className="text-[11px] text-[#555] hidden sm:block">
              Manage and verify providers and riders
            </p>
          </div>
        </div>
        <button
          onClick={() => (adminTab === "providers" ? load() : loadRiders())}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[12px] text-[#aaa] hover:border-[#444] transition-all cursor-pointer"
        >
          <RefreshIcon size={13} color="currentColor" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-4 lg:gap-5">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#222] rounded-xl p-1 w-fit">
          <button
            onClick={() => setAdminTab("providers")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer border-none
              ${adminTab === "providers" ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
          >
            <ShieldIcon size={14} color="currentColor" /> Providers
          </button>
          <button
            onClick={() => setAdminTab("riders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer border-none relative
              ${adminTab === "riders" ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
          >
            <UserIcon size={14} color="currentColor" /> Riders
            {riders.filter(
              (r) => (r.verificationStatus ?? r.status) === "pending",
            ).length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-[#111] text-[9px] font-bold rounded-full flex items-center justify-center">
                {
                  riders.filter(
                    (r) => (r.verificationStatus ?? r.status) === "pending",
                  ).length
                }
              </span>
            )}
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[13px] text-red-400 gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangleIcon size={15} color="currentColor" />
              {error}
            </div>
            <button
              onClick={() => setError(null)}
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

        {/* ── RIDERS TAB ─────────────────────────────────────────────────── */}
        {adminTab === "riders" && (
          <div className="flex flex-col gap-4">
            {/* Filter */}
            <div className="flex gap-1 bg-[#1a1a1a] border border-[#222] rounded-xl p-1 w-fit">
              {(["all", "pending", "approved", "rejected"] as const).map(
                (f) => (
                  <button
                    key={f}
                    onClick={() => setRiderFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer border-none capitalize
                    ${riderFilter === f ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
                  >
                    {f}
                  </button>
                ),
              )}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2 bg-[#1a1a1a] border border-[#222] rounded-xl px-3 py-2.5 focus-within:border-[#ff2d2d] transition-colors">
              <SearchIcon size={14} color="#555" />
              <input
                value={riderSearch}
                onChange={(e) => setRiderSearch(e.target.value)}
                placeholder="Search riders by name, email or phone..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-[#e0e0e0] placeholder:text-[#444]"
              />
            </div>

            {/* Pending alert */}
            {riders.filter(
              (r) => (r.verificationStatus ?? r.status) === "pending",
            ).length > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <AlertTriangleIcon
                  size={16}
                  color="#f59e0b"
                  className="shrink-0"
                />
                <p className="text-[13px] text-amber-400">
                  {
                    riders.filter(
                      (r) => (r.verificationStatus ?? r.status) === "pending",
                    ).length
                  }{" "}
                  rider
                  {riders.filter(
                    (r) => (r.verificationStatus ?? r.status) === "pending",
                  ).length !== 1
                    ? "s"
                    : ""}{" "}
                  awaiting verification
                </p>
              </div>
            )}

            {/* Rider cards */}
            {ridersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {riders
                  .filter(
                    (r) =>
                      riderFilter === "all" ||
                      (r.verificationStatus ?? r.status) === riderFilter,
                  )
                  .filter((r) => {
                    const q = riderSearch.toLowerCase();
                    return (
                      r.name?.toLowerCase().includes(q) ||
                      r.email?.toLowerCase().includes(q) ||
                      r.phone?.includes(q)
                    );
                  })
                  .map((r) => (
                    <div
                      key={r.id ?? r._id}
                      onClick={() => setSelectedRider(r)}
                      className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex items-center gap-3 cursor-pointer hover:border-[#333] transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center text-xl shrink-0">
                        {VEHICLE_ICONS[r.vehicleType] ?? "🏍"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[13px] font-semibold text-[#e0e0e0] truncate">
                            {r.name}
                          </p>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize
                            ${
                              (r.verificationStatus ?? r.status) === "pending"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : (r.verificationStatus ?? r.status) ===
                                      "verified" ||
                                    (r.verificationStatus ?? r.status) ===
                                      "approved"
                                  ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                  : "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {r.verificationStatus ?? r.status ?? "pending"}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#555] truncate">
                          {r.email} · {r.phone}
                        </p>
                        <p className="text-[11px] text-[#555] capitalize">
                          {r.vehicleType} · {r.vehiclePlateNumber}
                        </p>
                      </div>
                      <ChevronRightIcon size={16} color="#555" />
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Rider detail modal */}
        {selectedRider && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#222] sticky top-0 bg-[#1a1a1a] z-10">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {VEHICLE_ICONS[selectedRider.vehicleType] ?? "🏍"}
                  </span>
                  <div>
                    <h3 className="font-[var(--font-syne)] font-bold text-[16px] text-[#f0f0f0]">
                      {selectedRider.name}
                    </h3>
                    <p className="text-[11px] text-[#555] capitalize">
                      {selectedRider.vehicleType} rider · ID:{" "}
                      {(selectedRider.id ?? selectedRider._id ?? "").slice(-8)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRider(null)}
                  className="text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer"
                >
                  <XIcon size={18} color="currentColor" />
                </button>
              </div>
              <div className="p-6 flex flex-col gap-4">
                {/* Details */}
                <div className="bg-[#111] border border-[#2a2a2a] rounded-xl divide-y divide-[#1e1e1e]">
                  {[
                    { label: "Email", value: selectedRider.email },
                    { label: "Phone", value: selectedRider.phone },
                    { label: "Vehicle", value: selectedRider.vehicleType },
                    {
                      label: "Plate Number",
                      value: selectedRider.vehiclePlateNumber ?? "—",
                    },
                    {
                      label: "License Number",
                      value: selectedRider.driverLicenseNumber ?? "—",
                    },
                    { label: "Rating", value: selectedRider.rating ?? 0 },
                    {
                      label: "Total Trips",
                      value: selectedRider.totalTrips ?? 0,
                    },
                    {
                      label: "Total Earnings",
                      value:
                        selectedRider.totalEarnings != null
                          ? `₦${Number(selectedRider.totalEarnings).toLocaleString()}`
                          : "₦0",
                    },
                    {
                      label: "Availability",
                      value: selectedRider.availabilityStatus ?? "—",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between px-4 py-2.5 gap-4"
                    >
                      <p className="text-[11px] text-[#555] shrink-0">
                        {label}
                      </p>
                      <p className="text-[12px] text-[#e0e0e0] font-medium text-right truncate max-w-[60%]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-[13px] font-semibold
                  ${
                    (selectedRider.verificationStatus ??
                      selectedRider.status) === "pending"
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                      : (selectedRider.verificationStatus ??
                            selectedRider.status) === "verified" ||
                          (selectedRider.verificationStatus ??
                            selectedRider.status) === "approved"
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                  }`}
                >
                  {(selectedRider.verificationStatus ??
                    selectedRider.status) === "pending" ? (
                    <AlertTriangleIcon size={15} color="currentColor" />
                  ) : (selectedRider.verificationStatus ??
                      selectedRider.status) === "verified" ||
                    (selectedRider.verificationStatus ??
                      selectedRider.status) === "approved" ? (
                    <CheckCircleIcon size={15} color="currentColor" />
                  ) : (
                    <XIcon size={15} color="currentColor" />
                  )}
                  Status:{" "}
                  {(
                    selectedRider.verificationStatus ??
                    selectedRider.status ??
                    "pending"
                  )
                    .charAt(0)
                    .toUpperCase() +
                    (
                      selectedRider.verificationStatus ??
                      selectedRider.status ??
                      "pending"
                    ).slice(1)}
                </div>

                {/* Actions */}
                {(selectedRider.verificationStatus ?? selectedRider.status) ===
                  "pending" && (
                  <div className="flex gap-3">
                    <button
                      onClick={() =>
                        rejectRider(selectedRider.id ?? selectedRider._id)
                      }
                      className="flex-1 py-2.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() =>
                        approveRider(selectedRider.id ?? selectedRider._id)
                      }
                      className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      Approve Rider
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── PROVIDERS TAB ──────────────────────────────────────────────── */}
        {adminTab === "providers" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.map((s) => (
                <button
                  key={s.label}
                  onClick={() => {
                    setFilterStatus(s.filter as FilterStatus);
                    setPage(1);
                  }}
                  className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4 hover:border-[#333] transition-colors cursor-pointer text-left"
                >
                  <s.Icon size={15} color="#555" />
                  <div
                    className={`font-[var(--font-syne)] font-bold text-2xl lg:text-3xl mt-2 ${s.color}`}
                  >
                    {s.value}
                  </div>
                  <p className="text-[11px] text-[#555] mt-0.5">{s.label}</p>
                </button>
              ))}
            </div>

            {/* Pending alert */}
            {pendingCount > 0 && (
              <button
                onClick={() => {
                  setFilterStatus("pending");
                  setPage(1);
                }}
                className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl cursor-pointer hover:bg-amber-500/15 transition-colors w-full text-left"
              >
                <AlertTriangleIcon
                  size={18}
                  color="#f59e0b"
                  className="shrink-0"
                />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-amber-400">
                    {pendingCount} provider{pendingCount !== 1 ? "s" : ""}{" "}
                    awaiting verification
                  </p>
                  <p className="text-[11px] text-amber-400/60">
                    Click to filter pending providers
                  </p>
                </div>
                <ChevronRightIcon
                  size={16}
                  color="#f59e0b"
                  className="shrink-0"
                />
              </button>
            )}

            {/* Table */}
            <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden flex flex-col">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 lg:px-5 py-3 lg:py-4 border-b border-[#222]">
                <div className="flex items-center gap-2 overflow-x-auto shrink-0">
                  <span className="text-[12px] text-[#555] whitespace-nowrap shrink-0">
                    {filtered.length} providers
                  </span>
                  <div className="flex items-center gap-0.5 bg-[#111] border border-[#2a2a2a] rounded-xl p-1 shrink-0">
                    {(
                      [
                        "all",
                        "pending",
                        "verified",
                        "rejected",
                      ] as FilterStatus[]
                    ).map((val) => (
                      <button
                        key={val}
                        onClick={() => {
                          setFilterStatus(val);
                          setPage(1);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border-none whitespace-nowrap capitalize
                      ${filterStatus === val ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center bg-[#111] border border-[#2a2a2a] rounded-xl px-3 py-2 gap-2 w-full sm:w-[240px] lg:w-[280px] focus-within:border-[#ff2d2d] transition-colors shrink-0">
                  <SearchIcon size={13} color="#555" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email, phone..."
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
                  <p className="text-[#555] text-sm">Loading providers...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <ShieldIcon size={40} color="#2a2a2a" />
                  <p className="text-[14px] font-medium text-[#777]">
                    No providers found
                  </p>
                  {search && (
                    <p className="text-[12px] text-[#555]">
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b border-[#1e1e1e] bg-[#141414]">
                        <tr>
                          {[
                            "Provider",
                            "Phone",
                            "Status",
                            "Rating",
                            "Deliveries",
                            "Active",
                            "Joined",
                            "",
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
                        {filtered.map((p) => (
                          <ProviderRow
                            key={p._id}
                            provider={p}
                            onClick={() => setSelected(p)}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="lg:hidden flex flex-col gap-3 p-4">
                    {filtered.map((p) => (
                      <ProviderCard
                        key={p._id}
                        provider={p}
                        onClick={() => setSelected(p)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#1e1e1e]">
                  <span className="text-[12px] text-[#555]">
                    Page {page} of {Math.ceil(total / LIMIT)}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 bg-[#111] border border-[#2a2a2a] text-[12px] text-[#666] rounded-lg cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ← Prev
                    </button>
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page >= Math.ceil(total / LIMIT)}
                      className="px-3 py-1.5 bg-[#111] border border-[#2a2a2a] text-[12px] text-[#666] rounded-lg cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {selected && (
        <ProviderModal
          provider={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          onReject={handleReject}
          loading={actionLoading}
        />
      )}
    </>
  );
}
