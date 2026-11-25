"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  expressBookingApi,
  expressRiderPublicApi,
  AvailableRider,
} from "@/lib/express/api";
import { useCustomerProfile } from "@/lib/hooks/useCustomerProfile";
import RiderCard from "../shared/RiderCard";
import MapPlaceholder from "../shared/MapPlaceholder";
import { MapPinIcon, AlertTriangleIcon, RefreshIcon } from "@/components/Icons";

// Ride flow: choose a rider → they confirm → you pay (on the Track page) → trip.
type Step = "route" | "rider" | "details";

const inputCls =
  "w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]";
const labelCls =
  "text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5";

export default function BookRide() {
  const router = useRouter();
  const profile = useCustomerProfile();

  const [step, setStep] = useState<Step>("route");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  // Online, verified riders (GET /express/riders/available)
  const [riders, setRiders] = useState<AvailableRider[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [ridersError, setRidersError] = useState<string | null>(null);
  const [selectedRider, setSelectedRider] = useState<AvailableRider | null>(
    null,
  );

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [rideType, setRideType] = useState<"standard" | "premium">("standard");
  const [passengerCount, setPassengerCount] = useState("1");
  const [fareAmount, setFareAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCustomerName((v) => v || profile.name || "");
    setCustomerPhone((v) => v || profile.phoneNumber || "");
  }, [profile]);

  const loadRiders = useCallback(async () => {
    setRidersLoading(true);
    setRidersError(null);
    try {
      const res = await expressRiderPublicApi.getAvailable({ limit: 50 });
      const list = res.data?.riders ?? [];
      setRiders(list);
      // Drop the selection if that rider went offline in the meantime.
      setSelectedRider((cur) =>
        cur && list.some((r) => r.id === cur.id) ? cur : null,
      );
    } catch (err) {
      setRidersError(
        err instanceof Error ? err.message : "Could not load riders",
      );
    } finally {
      setRidersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "rider") loadRiders();
  }, [step, loadRiders]);

  const validate = () => {
    if (!selectedRider) return (setError("Choose a rider first"), false);
    if (!customerPhone.trim())
      return (setError("Enter a phone number your rider can call"), false);
    const fare = Number(fareAmount);
    if (!fareAmount || Number.isNaN(fare) || fare <= 0)
      return (setError("Enter a valid fare amount"), false);
    const pax = Number(passengerCount);
    if (!Number.isInteger(pax) || pax < 1)
      return (setError("Passengers must be at least 1"), false);
    setError(null);
    return true;
  };

  // Sends the ride request to the chosen rider. Payment opens after they confirm.
  const handleRequest = async () => {
    if (!validate() || !selectedRider) return;
    setLoading(true);
    setError(null);
    try {
      const res = await expressBookingApi.bookRide({
        requestedRiderId: selectedRider.id,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhone.trim(),
        pickupAddress: { address: pickup.trim() },
        dropoffAddress: { address: destination.trim() },
        fareAmount: Number(fareAmount),
        rideType,
        passengerCount: Number(passengerCount),
        notes: notes.trim() || undefined,
      });
      const ref = res.data?.bookingRef;
      if (!ref) throw new Error("Booking failed — no reference returned");
      router.push(`/express/customer/track?booking=${encodeURIComponent(ref)}`);
    } catch (err: unknown) {
      // e.g. the rider just went offline or took another job — the message says so.
      setError(
        err instanceof Error ? err.message : "Could not request this ride",
      );
      setLoading(false);
    }
  };

  const stepOrder: Step[] = ["route", "rider", "details"];
  const stepLabels = ["Route", "Rider", "Details"];

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Book a Ride
        </h1>
        <p className="text-[12px] text-[#555]">
          Pick a rider. Once they confirm, you pay and the trip begins.
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        {stepOrder.map((s, i) => {
          const done = i < stepOrder.indexOf(step);
          const active = s === step;
          return (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border
                ${done ? "bg-green-500/20 border-green-500/40 text-green-400" : active ? "bg-[#ff2d2d] border-[#ff2d2d] text-white" : "bg-[#111] border-[#2a2a2a] text-[#555]"}`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[11px] ${active ? "text-[#e0e0e0]" : "text-[#444]"}`}
              >
                {stepLabels[i]}
              </span>
              {i < 2 && <div className="w-4 h-px bg-[#2a2a2a] shrink-0" />}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {/* Step 1: route */}
      {step === "route" && (
        <div className="flex flex-col gap-4">
          <MapPlaceholder
            pickup={pickup || "Pickup location"}
            destination={destination || "Destination"}
            height="h-48"
          />
          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-400" />
              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Enter pickup location..."
                className={`${inputCls} pl-9`}
              />
            </div>
            <div className="relative">
              <MapPinIcon
                size={14}
                color="#ff2d2d"
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />
              <input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Enter destination..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>
          <button
            onClick={() => {
              setError(null);
              setStep("rider");
            }}
            disabled={!pickup.trim() || !destination.trim()}
            className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Choose a rider →
          </button>
        </div>
      )}

      {/* Step 2: choose a rider */}
      {step === "rider" && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0 text-[12px] text-[#aaa]">
              <span className="truncate">● {pickup}</span>
              <span className="truncate">⌖ {destination}</span>
            </div>
            <button
              onClick={() => setStep("route")}
              className="text-[11px] text-[#ff2d2d] bg-transparent border-none cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[12px] text-[#555]">
              {ridersLoading
                ? "Looking for riders…"
                : `${riders.length} rider${riders.length !== 1 ? "s" : ""} online`}
            </p>
            <button
              onClick={loadRiders}
              disabled={ridersLoading}
              className="p-2 bg-[#1a1a1a] border border-[#222] rounded-xl cursor-pointer hover:border-[#333] disabled:opacity-40"
              aria-label="Refresh riders"
            >
              <RefreshIcon size={14} color="#555" />
            </button>
          </div>

          {ridersError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
              <AlertTriangleIcon size={13} color="currentColor" />
              {ridersError}
            </div>
          )}

          {ridersLoading && riders.length === 0 ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : riders.length === 0 && !ridersError ? (
            <p className="text-[12px] text-[#555] text-center py-10">
              No riders are online right now. Tap refresh in a moment.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {riders.map((r) => (
                <RiderCard
                  key={r.id}
                  rider={r}
                  selected={selectedRider?.id === r.id}
                  onSelect={() =>
                    setSelectedRider(selectedRider?.id === r.id ? null : r)
                  }
                  showActions={false}
                />
              ))}
            </div>
          )}

          <p className="text-[10px] text-[#444]">
            Your rider has to confirm before you pay. If they decline, you
            haven't been charged and you can pick someone else.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("route")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              disabled={!selectedRider}
              className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              Continue with {selectedRider?.name.split(" ")[0] ?? "rider"} →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: details, then send the request */}
      {step === "details" && selectedRider && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0 text-[12px] text-[#aaa]">
              <span className="truncate">● {pickup}</span>
              <span className="truncate">⌖ {destination}</span>
              <span className="text-[#e0e0e0] font-medium">
                Rider: {selectedRider.name}
              </span>
            </div>
            <button
              onClick={() => setStep("rider")}
              className="text-[11px] text-[#ff2d2d] bg-transparent border-none cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>

          <div>
            <p className={labelCls}>Your name</p>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full name"
              className={inputCls}
            />
          </div>

          <div>
            <p className={labelCls}>Phone number</p>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+2348012345678"
              className={inputCls}
            />
            <p className="text-[10px] text-[#444] mt-1">
              Your rider will call this number.
              {profile.email
                ? ` Receipts and codes go to ${profile.email}.`
                : ""}
            </p>
          </div>

          <div>
            <p className={labelCls}>Ride type</p>
            <div className="grid grid-cols-2 gap-2">
              {(["standard", "premium"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRideType(t)}
                  className={`py-2.5 rounded-xl border text-[13px] font-medium capitalize cursor-pointer transition-all
                    ${rideType === t ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40 text-[#ff2d2d]" : "bg-[#1a1a1a] border-[#222] text-[#666] hover:border-[#333]"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Passengers</p>
              <input
                type="number"
                min={1}
                value={passengerCount}
                onChange={(e) => setPassengerCount(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <p className={labelCls}>Fare (₦)</p>
              <input
                type="number"
                min={1}
                value={fareAmount}
                onChange={(e) => setFareAmount(e.target.value)}
                placeholder="e.g. 2000"
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[10px] text-[#444] -mt-2">
            You set the fare for now. Your rider sees it when deciding, and you
            pay exactly this amount after they confirm.
          </p>

          <div>
            <p className={labelCls}>Notes for the rider (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Call when you arrive"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("rider")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={handleRequest}
              disabled={loading}
              className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {loading
                ? "Sending request..."
                : `Request ${selectedRider.name.split(" ")[0]} →`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
