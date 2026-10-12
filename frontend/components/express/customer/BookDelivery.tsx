"use client";

import { useState } from "react";
import { MOCK_RIDERS, VEHICLE_TYPES, VehicleType } from "@/lib/express/types";
import { expressBookingApi } from "@/lib/express/api";
import RiderCard from "../shared/RiderCard";
import MapPlaceholder from "../shared/MapPlaceholder";
import ETADisplay from "../shared/ETADisplay";
import {
  MapPinIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/components/Icons";

type Step = "details" | "riders" | "customer" | "payment" | "confirmed";

const PACKAGE_SIZES = [
  {
    value: "small",
    label: "Small",
    desc: "Envelope, phone, documents",
    icon: "📄",
    maxKg: "1kg",
    vehicles: ["bicycle", "motorcycle", "tricycle", "car", "van", "truck"],
  },
  {
    value: "medium",
    label: "Medium",
    desc: "Shoes, clothes, small box",
    icon: "📦",
    maxKg: "5kg",
    vehicles: ["motorcycle", "tricycle", "car", "van", "truck"],
  },
  {
    value: "large",
    label: "Large",
    desc: "Large box, appliance",
    icon: "🗃",
    maxKg: "20kg",
    vehicles: ["car", "van", "truck"],
  },
  {
    value: "bulky",
    label: "Bulky",
    desc: "Furniture, heavy goods",
    icon: "🏗",
    maxKg: "50kg+",
    vehicles: ["van", "truck"],
  },
];

function formatNGN(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function BookDelivery() {
  const [step, setStep] = useState<Step>("details");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [description, setDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType | "">("");
  const [selectedRider, setSelectedRider] = useState<string | null>(null);

  // Sender — phone only (no email needed)
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState("");
  const [pickupOtp, setPickupOtp] = useState("");
  const [deliveryOtp, setDeliveryOtp] = useState("");

  // ── Rider filtering: by package size AND selected vehicle type ──────────────
  const allowedVehicles =
    PACKAGE_SIZES.find((s) => s.value === packageSize)?.vehicles ?? [];

  const availableRiders = MOCK_RIDERS.filter((r) => {
    if (!r.isAvailable) return false;
    if (!r.operatingRules.serviceTypes.includes("delivery")) return false;
    if (!allowedVehicles.includes(r.vehicleType)) return false;
    if (selectedVehicle && r.vehicleType !== selectedVehicle) return false;
    return true;
  });

  const rider = availableRiders.find((r) => r.id === selectedRider);

  // Vehicles valid for selected package
  const validVehicles = VEHICLE_TYPES.filter((v) =>
    allowedVehicles.includes(v.value),
  );

  const validateCustomer = () => {
    if (!senderName.trim()) return (setError("Enter sender name"), false);
    if (!senderPhone.trim())
      return (setError("Enter sender phone number"), false);
    if (!recipientName.trim()) return (setError("Enter recipient name"), false);
    if (!recipientPhone.trim())
      return (setError("Enter recipient phone"), false);
    setError(null);
    return true;
  };

  const handlePay = async () => {
    if (!validateCustomer()) return;
    setLoading(true);
    setError(null);
    try {
      const bookRes = await expressBookingApi.bookDelivery({
        customerName: senderName,
        customerEmail: `${senderPhone}@dezenexpress.com`,
        customerPhone: senderPhone,
        pickupAddress: { address: pickup },
        dropoffAddress: { address: destination },
        package: {
          description: description || "Package",
          sizeCategory: packageSize as "small" | "medium" | "large" | "bulky",
        },
        recipientName,
        recipientPhone,
        fareAmount: rider!.priceEstimate!,
        notes: instructions,
      });

      const ref = bookRes.data?.bookingRef;
      if (!ref) throw new Error("Booking failed — no reference returned");

      const payRes = await fetch("/api/express/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: ref,
          amount: rider!.priceEstimate!,
          customerName: senderName,
          customerEmail: `${senderPhone}@dezenexpress.com`,
          customerPhone: senderPhone,
          riderName: rider!.name,
          riderEmail: "rider@dezenexpress.com",
          riderPhone: "+2340000000000",
          description: `Delivery: ${pickup} → ${destination} — ${ref}`,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok)
        throw new Error(payData.error ?? "Payment initiation failed");

      if (payData.paymentUrl) {
        window.open(payData.paymentUrl, "_blank");
        setBookingRef(ref);
        setPickupOtp(Math.floor(1000 + Math.random() * 9000).toString());
        setDeliveryOtp(Math.floor(1000 + Math.random() * 9000).toString());
        setStep("confirmed");
      } else {
        throw new Error("No payment URL returned");
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!bookingRef) return;
    if (
      !confirm(
        "Cancel this delivery? A refund will be processed if the rider hasn't picked up yet.",
      )
    )
      return;
    try {
      await expressBookingApi.cancelOrder(bookingRef, "Customer cancelled");
      alert("Delivery cancelled. Refund will be processed within 24 hours.");
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Could not cancel — contact support",
      );
    }
  };

  const stepLabels: Step[] = ["details", "riders", "customer", "payment"];

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Send a Package
        </h1>
        <p className="text-[12px] text-[#555]">
          No account needed — fast, tracked delivery across the city
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {stepLabels.map((s, i) => {
          const current = stepLabels.indexOf(step);
          const done = i < current;
          const active = s === step;
          const labels = ["Package", "Rider", "People", "Pay"];
          return (
            <div key={s} className="flex items-center gap-1.5 shrink-0">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border
                ${done ? "bg-green-500/20 border-green-500/40 text-green-400" : active ? "bg-[#ff2d2d] border-[#ff2d2d] text-white" : "bg-[#111] border-[#2a2a2a] text-[#555]"}`}
              >
                {done ? "✓" : i + 1}
              </div>
              <span
                className={`text-[11px] hidden sm:block shrink-0 ${active ? "text-[#e0e0e0]" : "text-[#444]"}`}
              >
                {labels[i]}
              </span>
              {i < 3 && <div className="w-4 h-px bg-[#2a2a2a] shrink-0" />}
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

      {/* ── Step 1: Package details ─────────────────────────────────────────── */}
      {step === "details" && (
        <div className="flex flex-col gap-4">
          <MapPlaceholder
            pickup={pickup || "Pickup"}
            destination={destination || "Destination"}
            height="h-40"
          />

          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-400" />
              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup address..."
                className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl pl-9 pr-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
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
                placeholder="Delivery address..."
                className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl pl-9 pr-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
              />
            </div>
          </div>

          {/* Package size */}
          <div>
            <p className="text-[12px] font-semibold text-[#aaa] mb-2">
              Package Size
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PACKAGE_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setPackageSize(s.value);
                    setSelectedVehicle("");
                    setSelectedRider(null);
                  }}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-left cursor-pointer transition-all
                    ${packageSize === s.value ? "border-[#ff2d2d] bg-[#ff2d2d]/5" : "border-[#222] bg-[#1a1a1a] hover:border-[#333]"}`}
                >
                  <span className="text-xl shrink-0">{s.icon}</span>
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#e0e0e0]">
                      {s.label}
                    </p>
                    <p className="text-[10px] text-[#555]">{s.desc}</p>
                    <p className="text-[10px] text-[#444]">Up to {s.maxKg}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Vehicle type filter — only shows vehicles valid for package */}
          {packageSize && (
            <div>
              <p className="text-[12px] font-semibold text-[#aaa] mb-2">
                Preferred Vehicle{" "}
                <span className="text-[#555] font-normal">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedVehicle("")}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] cursor-pointer transition-all
                    ${selectedVehicle === "" ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40 text-[#ff2d2d]" : "bg-[#1a1a1a] border-[#222] text-[#666] hover:border-[#333]"}`}
                >
                  All
                </button>
                {validVehicles.map((v) => (
                  <button
                    key={v.value}
                    onClick={() => setSelectedVehicle(v.value as VehicleType)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] cursor-pointer transition-all
                      ${selectedVehicle === v.value ? "bg-[#ff2d2d]/10 border-[#ff2d2d]/40 text-[#ff2d2d]" : "bg-[#1a1a1a] border-[#222] text-[#666] hover:border-[#333]"}`}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-[#444] mt-1.5">
                {packageSize === "large"
                  ? "Large packages need a car, van or truck"
                  : packageSize === "bulky"
                    ? "Bulky packages require a van or truck"
                    : "All vehicle types available for this package size"}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Package Description (optional)
            </p>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Clothes and shoes"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>

          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Special Instructions (optional)
            </p>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Fragile, handle with care"
              rows={2}
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444] resize-none"
            />
          </div>

          <button
            onClick={() => {
              setError(null);
              if (!pickup || !destination || !packageSize)
                return setError("Fill in all required fields");
              setStep("riders");
            }}
            className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90"
          >
            Find Riders →
          </button>
        </div>
      )}

      {/* ── Step 2: Select rider ─────────────────────────────────────────────── */}
      {step === "riders" && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="text-xl">
              {PACKAGE_SIZES.find((s) => s.value === packageSize)?.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-[#aaa] truncate">
                {pickup} → {destination}
              </p>
              <p className="text-[11px] text-[#555]">
                {PACKAGE_SIZES.find((s) => s.value === packageSize)?.label}{" "}
                package
                {selectedVehicle
                  ? ` · ${VEHICLE_TYPES.find((v) => v.value === selectedVehicle)?.label} preferred`
                  : ""}
              </p>
            </div>
            <button
              onClick={() => setStep("details")}
              className="text-[11px] text-[#ff2d2d] bg-transparent border-none cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>

          {availableRiders.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-3 bg-[#1a1a1a] border border-[#222] rounded-2xl">
              <p className="text-[14px] font-medium text-[#777]">
                No riders available
              </p>
              <p className="text-[12px] text-[#555] text-center max-w-xs">
                No{" "}
                {selectedVehicle
                  ? VEHICLE_TYPES.find((v) => v.value === selectedVehicle)
                      ?.label
                  : ""}{" "}
                riders available for a {packageSize} package right now
              </p>
              <button
                onClick={() => {
                  setSelectedVehicle("");
                }}
                className="text-[12px] text-[#ff2d2d] bg-transparent border-none cursor-pointer"
              >
                Clear vehicle filter
              </button>
            </div>
          ) : (
            <>
              <p className="text-[12px] text-[#555]">
                {availableRiders.length} rider
                {availableRiders.length !== 1 ? "s" : ""} available for your
                package
              </p>
              <div className="flex flex-col gap-3">
                {availableRiders.map((r) => (
                  <div key={r.id}>
                    <RiderCard
                      rider={r}
                      selected={selectedRider === r.id}
                      onSelect={() =>
                        setSelectedRider(r.id === selectedRider ? null : r.id)
                      }
                      showActions={false}
                    />
                    {/* Call rider button — confirm availability before paying */}
                    {selectedRider === r.id && (
                      <div className="mt-2 flex items-center gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#f59e0b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l1.28-1.28a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                        </svg>
                        <p className="text-[11px] text-amber-400 flex-1">
                          Confirm availability with rider before paying — escrow
                          cancellation may attract a fee
                        </p>
                        <a
                          href={`tel:+2340000000000`}
                          className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-[11px] font-semibold no-underline hover:bg-green-500/20 transition-colors shrink-0"
                        >
                          Call Rider
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep("details")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={() => setStep("customer")}
              disabled={!selectedRider}
              className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Sender + Recipient (phone only) ──────────────────────────── */}
      {step === "customer" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
            <CheckCircleIcon
              size={14}
              color="#22c55e"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[12px] text-[#555]">
              No account needed. Use your phone number to track this delivery
              later.
            </p>
          </div>

          {/* Sender */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-[#aaa]">
              Sender (You)
            </p>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your full name"
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
            <input
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="Phone number (e.g. 08012345678)"
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>

          {/* Recipient */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-[#aaa]">Recipient</p>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient full name"
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Recipient phone number"
              className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-2.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("riders")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (validateCustomer()) setStep("payment");
              }}
              className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90"
            >
              Review & Pay →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 4: Payment summary ──────────────────────────────────────────── */}
      {step === "payment" && rider && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            <div className="px-5 py-3.5">
              <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider">
                Delivery Summary
              </p>
            </div>
            {[
              { label: "From", value: pickup },
              { label: "To", value: destination },
              {
                label: "Package",
                value: `${PACKAGE_SIZES.find((s) => s.value === packageSize)?.label}${description ? ` · ${description}` : ""}`,
              },
              {
                label: "Vehicle",
                value: `${VEHICLE_TYPES.find((v) => v.value === rider.vehicleType)?.icon} ${VEHICLE_TYPES.find((v) => v.value === rider.vehicleType)?.label}`,
              },
              { label: "Rider", value: rider.name },
              { label: "Sender", value: `${senderName} · ${senderPhone}` },
              {
                label: "Recipient",
                value: `${recipientName} · ${recipientPhone}`,
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-5 py-2.5 gap-4"
              >
                <p className="text-[12px] text-[#555] shrink-0">{label}</p>
                <p className="text-[12px] text-[#e0e0e0] text-right truncate max-w-[60%]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Escrow notice */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangleIcon
              size={13}
              color="#f59e0b"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-amber-400">
              Payment is held in escrow by PandaEscrow and only released to the
              rider once delivery is confirmed. Make sure the rider is available
              before paying.
            </p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#555]">Total to pay</p>
              <p className="text-[11px] text-[#444] mt-0.5">
                Held in escrow · NGN
              </p>
            </div>
            <p className="font-[var(--font-syne)] font-bold text-[24px] text-[#ff2d2d]">
              {formatNGN(rider.priceEstimate!)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 py-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="text-[11px] text-[#444]">
              Secured by PandaEscrow · Card or bank transfer
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("customer")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={handlePay}
              disabled={loading}
              className="flex-[2] py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {loading
                ? "Processing..."
                : `Pay ${formatNGN(rider.priceEstimate!)}`}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 5: Confirmed ────────────────────────────────────────────────── */}
      {step === "confirmed" && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
            <CheckCircleIcon size={36} color="#22c55e" />
          </div>
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#f0f0f0] mb-1">
              Delivery Booked!
            </h2>
            <p className="text-[13px] text-[#555]">
              {rider?.name} will arrive at pickup shortly
            </p>
          </div>

          {rider && (
            <div className="w-full">
              <ETADisplay
                arrivalMinutes={rider.estimatedArrival}
                deliveryMinutes={
                  (rider.estimatedArrival ?? 10) + (rider.distanceAway ?? 5) * 3
                }
                type="delivery"
                status="accepted"
              />
            </div>
          )}

          <div className="w-full bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Booking Ref</p>
              <p className="text-[13px] text-[#e0e0e0] font-mono font-semibold">
                {bookingRef.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Pickup OTP</p>
              <p className="text-[18px] text-[#ff2d2d] font-bold font-mono tracking-widest">
                {pickupOtp}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Delivery OTP</p>
              <p className="text-[18px] text-green-400 font-bold font-mono tracking-widest">
                {deliveryOtp}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Track via</p>
              <p className="text-[12px] text-[#e0e0e0]">{senderPhone}</p>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2 text-left px-3 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-400">
                <strong>Pickup OTP ({pickupOtp})</strong> — give to rider when
                they arrive
              </p>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangleIcon
                size={13}
                color="#f59e0b"
                className="shrink-0 mt-0.5"
              />
              <p className="text-[11px] text-amber-400">
                <strong>Delivery OTP ({deliveryOtp})</strong> — recipient gives
                this to confirm receipt
              </p>
            </div>
          </div>

          <div className="w-full flex gap-3">
            <button
              onClick={() =>
                (window.location.href = `/express/customer/track?ref=${bookingRef}`)
              }
              className="flex-1 py-2.5 bg-[#1a1a1a] border border-[#222] text-[#aaa] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              Track Delivery
            </button>
            <button
              onClick={() =>
                (window.location.href = `/chats?ref=${bookingRef}`)
              }
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-transparent border border-[#2a2a2a] text-[#aaa] rounded-xl text-[12px] cursor-pointer hover:border-[#444] hover:text-[#e0e0e0]"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Chat Rider
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-transparent border border-red-500/30 text-red-400 rounded-xl text-[12px] cursor-pointer hover:bg-red-500/10"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              Cancel
            </button>
          </div>

          <p className="text-[10px] text-[#444] text-center">
            Free cancellation before rider picks up. After pickup, partial
            refund may apply.
          </p>

          <button
            onClick={() => {
              setStep("details");
              setPickup("");
              setDestination("");
              setPackageSize("");
              setSelectedVehicle("");
              setSelectedRider(null);
              setSenderName("");
              setSenderPhone("");
              setRecipientName("");
              setRecipientPhone("");
            }}
            className="px-6 py-2.5 bg-[#1a1a1a] border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
          >
            Send Another Package
          </button>
        </div>
      )}
    </div>
  );
}
