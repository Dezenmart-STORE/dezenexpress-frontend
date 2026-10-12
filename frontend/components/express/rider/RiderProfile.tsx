"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { VEHICLE_TYPES, VehicleType } from "@/lib/express/types";
import { riderApi, clearRiderToken, RiderFullProfile } from "@/lib/express/api";
import {
  CheckCircleIcon,
  EditIcon,
  LogOutIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from "@/components/Icons";

export default function RiderProfile() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<RiderFullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Availability toggle has its own loading/error state since it hits a
  // separate endpoint with its own failure modes (403 unverified, 409 active booking).
  const [availabilitySaving, setAvailabilitySaving] = useState(false);

  // Editable form fields — only fields confirmed to exist on PUT /express/rider/profile
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleType: "motorcycle" as VehicleType,
    vehiclePlateNumber: "",
    driverLicenseNumber: "",
    bankName: "",
    bankAccountNumber: "",
    bankAccountName: "",
  });
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );

  const populateForm = (rider: RiderFullProfile) => {
    setForm({
      name: rider.name ?? "",
      phone: rider.phone ?? "",
      vehicleType: (rider.vehicleType as VehicleType) ?? "motorcycle",
      vehiclePlateNumber: rider.vehiclePlateNumber ?? "",
      driverLicenseNumber: rider.driverLicenseNumber ?? "",
      bankName: rider.bankName ?? "",
      bankAccountNumber: rider.bankAccountNumber ?? "",
      bankAccountName: rider.bankAccountName ?? "",
    });
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riderApi.getProfile();
      // Confirmed shape: fields sit directly under res.data, no `rider` wrapper.
      const rider = res.data;
      if (!rider) throw new Error("No profile returned");
      setProfile(rider);
      populateForm(rider);
    } catch (err) {
      console.error("getProfile failed:", err);
      // Fallback: decode whatever identity info is in the rider's own JWT.
      const token = localStorage.getItem("dezenexpress_rider_token");
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const fallback: RiderFullProfile = {
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
          };
          setProfile(fallback);
          populateForm(fallback);
        } catch {
          setProfile(null);
        }
      }
      setError(
        "Couldn't load your live profile — showing cached session data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfileImageFile(file);
    setProfileImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      // Only send fields that actually changed (or are non-empty), since
      // the backend returns 400 if no fields are provided, and we don't
      // want to overwrite real values with blanks the user didn't touch.
      const payload: Parameters<typeof riderApi.updateProfile>[0] = {};
      if (form.name !== (profile?.name ?? "")) payload.name = form.name;
      if (form.phone !== (profile?.phone ?? "")) payload.phone = form.phone;
      if (form.vehicleType !== (profile?.vehicleType ?? ""))
        payload.vehicleType = form.vehicleType;
      if (form.vehiclePlateNumber !== (profile?.vehiclePlateNumber ?? ""))
        payload.vehiclePlateNumber = form.vehiclePlateNumber;
      if (form.driverLicenseNumber !== (profile?.driverLicenseNumber ?? ""))
        payload.driverLicenseNumber = form.driverLicenseNumber;
      if (form.bankName !== (profile?.bankName ?? ""))
        payload.bankName = form.bankName;
      if (form.bankAccountNumber !== (profile?.bankAccountNumber ?? ""))
        payload.bankAccountNumber = form.bankAccountNumber;
      if (form.bankAccountName !== (profile?.bankAccountName ?? ""))
        payload.bankAccountName = form.bankAccountName;
      if (profileImageFile) payload.profileImage = profileImageFile;

      if (Object.keys(payload).length === 0) {
        setEditing(false);
        setSaving(false);
        return;
      }

      await riderApi.updateProfile(payload);
      setSuccess("Profile updated successfully");
      setEditing(false);
      setProfileImageFile(null);
      await load();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    const next = profile.availabilityStatus === "online" ? "offline" : "online";
    setAvailabilitySaving(true);
    setError(null);
    try {
      await riderApi.setAvailability(next);
      setProfile((prev) =>
        prev ? { ...prev, availabilityStatus: next } : prev,
      );
    } catch (err: unknown) {
      // Surface the real reason — the backend returns specific messages for
      // 403 (verification required) and 409 (active booking in progress).
      setError(
        err instanceof Error ? err.message : "Could not change availability",
      );
    } finally {
      setAvailabilitySaving(false);
    }
  };

  const handleSignOut = () => {
    if (!confirm("Sign out of your rider account?")) return;
    clearRiderToken();
    router.push("/express/rider/auth");
  };

  const initials = profile?.name
    ? profile.name
        .split(" ")
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "R";

  const isOnline = profile?.availabilityStatus === "online";

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
            Rider Profile
          </h1>
          <p className="text-[12px] text-[#555]">
            Manage your details and availability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333]"
          >
            <RefreshIcon size={14} color="#555" />
          </button>
          <button
            onClick={() => (editing ? handleSave() : setEditing(true))}
            disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-semibold border-none cursor-pointer transition-all
              ${editing ? "bg-[#ff2d2d] text-white hover:opacity-90" : "bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] hover:border-[#444]"}`}
          >
            {saving ? (
              "Saving..."
            ) : editing ? (
              <>
                <CheckCircleIcon size={14} color="white" /> Save
              </>
            ) : (
              <>
                <EditIcon size={14} color="currentColor" /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[12px] text-amber-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-xl text-[13px] text-green-400">
          <CheckCircleIcon size={15} color="currentColor" />
          {success}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile header */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 flex items-center gap-4">
            <div
              onClick={() => editing && fileInputRef.current?.click()}
              className={`w-16 h-16 rounded-full bg-[#ff2d2d]/10 border-2 border-[#ff2d2d]/30 flex items-center justify-center font-bold text-2xl text-[#ff2d2d] font-[var(--font-syne)] shrink-0 overflow-hidden ${editing ? "cursor-pointer" : ""}`}
            >
              {profileImagePreview || profile?.profileImage ? (
                <img
                  src={profileImagePreview ?? profile?.profileImage}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </div>
            {editing && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            )}
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Full name"
                  className="w-full bg-[#111] border border-[#2a2a2a] rounded-lg px-3 py-1.5 text-[15px] font-semibold text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none mb-1"
                />
              ) : (
                <h2 className="font-[var(--font-syne)] font-bold text-[18px] text-[#f0f0f0]">
                  {profile?.name ?? "Rider"}
                </h2>
              )}
              <p className="text-[12px] text-[#555]">
                {profile?.email ?? ""}
                {profile?.phone ? " · " + profile.phone : ""}
              </p>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                {profile?.rating != null && (
                  <span className="text-[11px] text-amber-400">
                    ⭐ {profile.rating} rating
                  </span>
                )}
                {profile?.totalTrips != null && (
                  <span className="text-[11px] text-[#555]">
                    {profile.totalTrips} trips
                  </span>
                )}
                {profile?.totalEarnings != null && (
                  <span className="text-[11px] text-[#555]">
                    ₦{profile.totalEarnings.toLocaleString()} earned
                  </span>
                )}
                {profile?.verificationStatus && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-semibold
                    ${profile.verificationStatus === "verified" ? "bg-green-500/15 text-green-400" : "bg-amber-500/15 text-amber-400"}`}
                  >
                    {profile.verificationStatus}
                  </span>
                )}
              </div>
            </div>
            {/* Online toggle — PATCH /express/rider/availability */}
            <div className="flex flex-col items-center gap-1 shrink-0">
              <button
                onClick={toggleAvailability}
                disabled={
                  availabilitySaving ||
                  profile?.verificationStatus !== "verified"
                }
                title={
                  profile?.verificationStatus !== "verified"
                    ? "Verification required before going online"
                    : undefined
                }
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed ${isOnline ? "bg-green-500" : "bg-[#2a2a2a]"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${isOnline ? "translate-x-6" : "translate-x-0"}`}
                />
              </button>
              <span
                className={`text-[10px] font-medium ${isOnline ? "text-green-400" : "text-[#555]"}`}
              >
                {availabilitySaving ? "..." : isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-3">
              Contact
            </h3>
            <div>
              <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                Phone
              </p>
              <input
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                disabled={!editing}
                placeholder="08012345678"
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Vehicle */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-3">
              Vehicle
            </h3>
            {editing ? (
              <div className="grid grid-cols-3 gap-2 mb-4">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.value}
                    onClick={() =>
                      setForm((p) => ({ ...p, vehicleType: v.value }))
                    }
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all cursor-pointer hover:border-[#333]
                      ${form.vehicleType === v.value ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40" : "bg-[#111] border-[#2a2a2a]"}`}
                  >
                    <span className="text-xl">{v.icon}</span>
                    <p
                      className={`text-[11px] font-medium ${form.vehicleType === v.value ? "text-[#ff2d2d]" : "text-[#555]"}`}
                    >
                      {v.label}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-[#e0e0e0] capitalize mb-3">
                {profile?.vehicleType ?? "—"}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                  Plate Number
                </p>
                <input
                  value={form.vehiclePlateNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      vehiclePlateNumber: e.target.value,
                    }))
                  }
                  disabled={!editing}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none disabled:opacity-60"
                />
              </div>
              <div>
                <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                  License Number
                </p>
                <input
                  value={form.driverLicenseNumber}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      driverLicenseNumber: e.target.value,
                    }))
                  }
                  disabled={!editing}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Bank details */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-3">
              Bank Details
            </h3>
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                  Bank Name
                </p>
                <input
                  value={form.bankName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, bankName: e.target.value }))
                  }
                  disabled={!editing}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none disabled:opacity-60"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                    Account Number
                  </p>
                  <input
                    value={form.bankAccountNumber}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        bankAccountNumber: e.target.value,
                      }))
                    }
                    disabled={!editing}
                    className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none disabled:opacity-60"
                  />
                </div>
                <div>
                  <p className="text-[11px] text-[#555] uppercase tracking-wider mb-1.5">
                    Account Name
                  </p>
                  <input
                    value={form.bankAccountName}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        bankAccountName: e.target.value,
                      }))
                    }
                    disabled={!editing}
                    className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none disabled:opacity-60"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Not-yet-available notice — these fields were in the original
              UI but have no backing endpoint yet. */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
            <h3 className="font-[var(--font-syne)] font-semibold text-[14px] text-[#e0e0e0] mb-1">
              Service Preferences
            </h3>
            <p className="text-[12px] text-[#555]">
              Coverage areas, availability schedule, max distance, and package
              preferences aren't configurable yet — only online/offline status
              and the fields above are currently supported by the API.
            </p>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-transparent border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/10 transition-all"
          >
            <LogOutIcon size={15} color="currentColor" />
            Sign Out
          </button>
        </>
      )}
    </div>
  );
}
