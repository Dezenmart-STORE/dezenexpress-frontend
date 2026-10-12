"use client";

import { useState, useEffect } from "react";
import { useSidebar } from "./SidebarContext";
import { profileApi, locationsApi, Provider, CoverageArea } from "@/lib/api";
import { useLogout } from "@/lib/hooks/useAuth";
import LGAInput from "./LGAInput";
import {
  UserIcon,
  EditIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  MapPinIcon,
  StarIcon,
  PackageIcon,
  LogOutIcon,
  RefreshIcon,
  XIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/Icons";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-[#555] uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0]
        focus:border-[#ff2d2d] focus:outline-none transition-colors
        ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-[#3a3a3a]"}`}
    />
  );
}

function StatusBadge({ status }: { status: Provider["verificationStatus"] }) {
  const map = {
    verified: "bg-green-500/15 text-green-400 border-green-500/30",
    pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    rejected: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  const icons = {
    verified: <CheckCircleIcon size={11} color="currentColor" />,
    pending: <AlertTriangleIcon size={11} color="currentColor" />,
    rejected: <XIcon size={11} color="currentColor" />,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full border ${map[status]}`}
    >
      {icons[status]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ─── Coverage area row ───────────────────────────────────────────────────── */
function CoverageRow({
  area,
  index,
  states,
  onRemove,
  onChange,
}: {
  area: CoverageArea;
  index: number;
  states: string[];
  onRemove: () => void;
  onChange: (updated: CoverageArea) => void;
}) {
  const [lgas, setLgas] = useState<string[]>([]);

  useEffect(() => {
    if (area.state) {
      locationsApi
        .getLgas(area.state)
        .then((res) => setLgas(res.data.lgas))
        .catch(() => {});
    }
  }, [area.state]);

  return (
    <div className="bg-[#111] border border-[#2a2a2a] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPinIcon size={14} color="#ff2d2d" />
          <span className="text-[13px] font-medium text-[#aaa]">
            Coverage Area {index + 1}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="flex items-center gap-1 text-[11px] text-[#555] hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer"
        >
          <TrashIcon size={13} color="currentColor" /> Remove
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
            State
          </p>
          <select
            value={area.state}
            onChange={(e) =>
              onChange({ ...area, state: e.target.value, lgas: [] })
            }
            className="w-full bg-[#1a1a1a] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none"
          >
            <option value="">Select state</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col justify-end">
          <label className="flex items-center gap-2 cursor-pointer py-2">
            <input
              type="checkbox"
              checked={area.isStatewide}
              onChange={(e) =>
                onChange({ ...area, isStatewide: e.target.checked, lgas: [] })
              }
              className="accent-[#ff2d2d] w-4 h-4"
            />
            <span className="text-[12px] text-[#aaa]">Statewide</span>
          </label>
        </div>
      </div>

      {!area.isStatewide && area.state && (
        <div>
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1.5">
            LGAs
          </p>
          <LGAInput
            lgas={area.lgas}
            availableLgas={lgas}
            onChange={(newLgas) => onChange({ ...area, lgas: newLgas })}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { toggle } = useSidebar();
  const logout = useLogout();

  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [states, setStates] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "coverage">("info");

  // Editable fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);

  const isProfileIncomplete =
    provider && (!provider.walletAddress || !provider.phone);

  useEffect(() => {
    Promise.all([profileApi.get(), locationsApi.getStates()])
      .then(([profileRes, statesRes]) => {
        const p = profileRes.data.provider;
        setProvider(p);
        setName(p.name ?? "");
        setPhone(p.phone ?? "");
        setIsActive(p.isActive);
        setCoverageAreas(p.coverageAreas ?? []);
        setStates(statesRes.data.states);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await profileApi.update({
        name,
        phone,
        isActive,
        coverageAreas,
      });
      const updated = res.data.provider;
      setProvider(updated);
      // Update localStorage cache
      localStorage.setItem(
        "dezenmart_logistics_provider",
        JSON.stringify(updated),
      );
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const addCoverageArea = () =>
    setCoverageAreas((prev) => [
      ...prev,
      { state: "", lgas: [], isStatewide: true },
    ]);
  const removeCoverageArea = (i: number) =>
    setCoverageAreas((prev) => prev.filter((_, idx) => idx !== i));
  const updateCoverageArea = (i: number, updated: CoverageArea) =>
    setCoverageAreas((prev) => prev.map((a, idx) => (idx === i ? updated : a)));

  const initials = provider?.name
    ? provider.name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  /* ── Loading ── */
  if (loading) {
    return (
      <>
        <div className="sticky top-0 z-10 bg-[#0f0f0f] flex items-center gap-3 px-4 lg:px-7 py-4 lg:py-5 border-b border-[#1e1e1e]">
          <button
            onClick={toggle}
            className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer bg-transparent border-none shrink-0"
          >
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          </button>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Profile
          </h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#555] text-sm">Loading profile...</p>
          </div>
        </div>
      </>
    );
  }

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
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Profile
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer transition-all
            ${saving ? "bg-[#333] text-[#666]" : "bg-[#ff2d2d] text-white hover:opacity-90"}`}
        >
          {saving ? (
            <>
              <RefreshIcon size={14} color="currentColor" /> Saving...
            </>
          ) : (
            <>
              <EditIcon size={14} color="white" /> Save Changes
            </>
          )}
        </button>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
        {/* Incomplete profile banner */}
        {isProfileIncomplete && (
          <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <AlertTriangleIcon
              size={18}
              color="#f59e0b"
              className="shrink-0 mt-0.5"
            />
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-amber-400 mb-0.5">
                Complete your profile to start receiving deliveries
              </p>
              <p className="text-[12px] text-amber-400/70">
                Please add your {!provider?.phone && "phone number"}
                {!provider?.phone && !provider?.walletAddress && " and "}
                {!provider?.walletAddress && "wallet address"} below and save.
              </p>
            </div>
          </div>
        )}

        {/* Alerts */}
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
            <CheckCircleIcon size={15} color="currentColor" /> Profile updated
            successfully
          </div>
        )}

        {/* Profile header card */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 lg:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#ff2d2d]/30 shrink-0 bg-[#ff2d2d]/10 flex items-center justify-center">
            {provider?.profileImage ? (
              <img
                src={provider.profileImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-[var(--font-syne)] font-bold text-xl text-[#ff2d2d]">
                {initials}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#f0f0f0]">
                {provider?.name}
              </h2>
              {provider && <StatusBadge status={provider.verificationStatus} />}
            </div>
            <p className="text-[13px] text-[#555]">{provider?.email}</p>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-[12px] text-[#555] flex items-center gap-1">
                <StarIcon size={12} color="#f59e0b" />
                {provider?.rating.toFixed(1)} rating
              </span>
              <span className="text-[12px] text-[#555] flex items-center gap-1">
                <PackageIcon size={12} color="#555" />
                {provider?.totalDeliveries} deliveries
              </span>
              <span className="text-[12px] text-[#555] flex items-center gap-1">
                <MapPinIcon size={12} color="#555" />
                {provider?.coverageAreas?.length ?? 0} coverage area
                {(provider?.coverageAreas?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] text-[#555]">Active</span>
            <button
              onClick={() => setIsActive(!isActive)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer border-none shrink-0
                ${isActive ? "bg-[#ff2d2d]" : "bg-[#2a2a2a]"}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm
                ${isActive ? "translate-x-5" : "translate-x-0"}`}
              />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1a1a1a] border border-[#222] rounded-xl p-1 w-fit">
          {(["info", "coverage"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer border-none capitalize
                ${activeTab === tab ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#666] hover:text-[#ccc]"}`}
            >
              {tab === "info" ? (
                <UserIcon size={14} color="currentColor" />
              ) : (
                <MapPinIcon size={14} color="currentColor" />
              )}
              {tab === "info" ? "Basic Info" : "Coverage Areas"}
            </button>
          ))}
        </div>

        {/* ── Tab: Basic Info ── */}
        {activeTab === "info" && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 lg:p-6 flex flex-col gap-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[15px] text-[#e0e0e0]">
              Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Business Name">
                <TextInput
                  value={name}
                  onChange={setName}
                  placeholder="Your business name"
                />
              </Field>
              <Field label="Phone Number">
                <TextInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="+234 801 234 5678"
                  type="tel"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email (read-only)">
                <TextInput
                  value={provider?.email ?? ""}
                  onChange={() => {}}
                  disabled
                />
              </Field>
              <Field label="Wallet Address (read-only after setup)">
                <TextInput
                  value={provider?.walletAddress ?? "Not set"}
                  onChange={() => {}}
                  disabled
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Provider ID">
                <TextInput
                  value={provider?._id ?? ""}
                  onChange={() => {}}
                  disabled
                />
              </Field>
              <Field label="Member Since">
                <TextInput
                  value={
                    provider?.createdAt
                      ? new Date(provider.createdAt).toLocaleDateString(
                          "en-GB",
                          { day: "numeric", month: "short", year: "numeric" },
                        )
                      : ""
                  }
                  onChange={() => {}}
                  disabled
                />
              </Field>
              <Field label="Verification">
                <div className="flex items-center h-[42px]">
                  {provider && (
                    <StatusBadge status={provider.verificationStatus} />
                  )}
                </div>
              </Field>
            </div>

            <div className="pt-2 border-t border-[#1e1e1e]">
              <p className="text-[11px] text-[#555]">
                Email and wallet address cannot be changed. Verification status
                is managed by the admin team.
              </p>
            </div>
          </div>
        )}

        {/* ── Tab: Coverage Areas ── */}
        {activeTab === "coverage" && (
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 lg:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-[var(--font-syne)] font-semibold text-[15px] text-[#e0e0e0]">
                  Coverage Areas
                </h3>
                <p className="text-[12px] text-[#555] mt-0.5">
                  States and LGAs where you deliver
                </p>
              </div>
              <button
                onClick={addCoverageArea}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 text-[#ff2d2d] rounded-xl text-[12px] font-medium cursor-pointer hover:bg-[#ff2d2d]/20 transition-all"
              >
                <PlusIcon size={13} color="currentColor" /> Add Area
              </button>
            </div>

            {coverageAreas.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-[#555]">
                <MapPinIcon size={36} color="#2a2a2a" />
                <p className="text-[13px]">No coverage areas added yet</p>
                <button
                  onClick={addCoverageArea}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#ff2d2d] text-white rounded-xl text-[12px] font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
                >
                  <PlusIcon size={13} color="white" /> Add your first area
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {coverageAreas.map((area, i) => (
                  <CoverageRow
                    key={i}
                    area={area}
                    index={i}
                    states={states}
                    onRemove={() => removeCoverageArea(i)}
                    onChange={(updated) => updateCoverageArea(i, updated)}
                  />
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#1e1e1e]">
              <p className="text-[11px] text-[#555]">
                Enabling "Statewide" covers all LGAs in that state. Otherwise,
                type or select specific LGAs.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total Deliveries",
              value: provider?.totalDeliveries ?? 0,
              Icon: PackageIcon,
              color: "text-[#f0f0f0]",
            },
            {
              label: "Rating",
              value: `${provider?.rating.toFixed(1)} ★`,
              Icon: StarIcon,
              color: "text-amber-400",
            },
            {
              label: "Coverage Areas",
              value: coverageAreas.length,
              Icon: MapPinIcon,
              color: "text-blue-400",
            },
            {
              label: "Status",
              value: provider?.verificationStatus ?? "—",
              Icon: CheckCircleIcon,
              color:
                provider?.verificationStatus === "verified"
                  ? "text-green-400"
                  : "text-amber-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-3 lg:p-4"
            >
              <s.Icon size={14} color="#555" />
              <div
                className={`font-[var(--font-syne)] font-bold text-xl lg:text-2xl capitalize mt-2 ${s.color}`}
              >
                {s.value}
              </div>
              <p className="text-[11px] text-[#555] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
          <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-1">
            Sign Out
          </h3>
          <p className="text-[12px] text-[#555] mb-4">
            You'll need to sign in again with Google to access your dashboard.
          </p>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all"
          >
            <LogOutIcon size={16} color="currentColor" />
            Sign Out of Dezen-Express
          </button>
        </div>
      </div>
    </>
  );
}
