"use client";

import { useState, useEffect } from "react";
import {
  expressBookingApi,
  expressRiderPublicApi,
  AvailableRider,
} from "@/lib/express/api";
import RiderCard from "../shared/RiderCard";
import MapPlaceholder from "../shared/MapPlaceholder";
import {
  MapPinIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@/components/Icons";

type Step = "locations" | "riders" | "details" | "payment" | "confirmed";

function formatNGN(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

export default function BookRide() {
  const [step, setStep] = useState<Step>("locations");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");

  // Real riders — no mock data. GET /express/riders/available only returns
  // who's online + verified; it has no price, ETA, distance, or operating-area
  // fields, so none of that is shown here.
  const [availableRiders, setAvailableRiders] = useState<AvailableRider[]>([]);
  const [ridersLoading, setRidersLoading] = useState(false);
  const [ridersError, setRidersError] = useState<string | null>(null);
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  // No quote endpoint for rides exists yet, so fare is entered manually
  // rather than invented client-side.
  const [fareAmount, setFareAmount] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState("");
  const [otp, setOtp] = useState("");

  const rider = availableRiders.find((r) => r.id === selectedRiderId);

  // Fetch real available riders once the customer moves to the riders step.
  useEffect(() => {
    if (step !== "riders") return;
    let cancelled = false;
    setRidersLoading(true);
    setRidersError(null);
    expressRiderPublicApi
      .getAvailable()
      .then((res) => {
        if (cancelled) return;
        setAvailableRiders(res.data?.riders ?? []);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setRidersError(
          err instanceof Error
            ? err.message
            : "Could not load available riders",
        );
      })
      .finally(() => {
        if (!cancelled) setRidersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [step]);

  const validateDetails = () => {
    if (!customerName.trim())
      return (setError("Please enter your name"), false);
    if (!customerEmail.trim() && !customerPhone.trim())
      return (setError("Please enter your email or phone number"), false);
    if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail))
      return (setError("Please enter a valid email address"), false);
    const fare = Number(fareAmount);
    if (!fareAmount || Number.isNaN(fare) || fare <= 0)
      return (setError("Please enter a valid fare amount"), false);
    setError(null);
    return true;
  };

  const handlePay = async () => {
    if (!validateDetails() || !rider) return;
    setLoading(true);
    setError(null);
    try {
      // Reuse the booking if an earlier attempt created it but payment setup failed.
      let ref = bookingRef;
      if (!ref) {
        const bookRes = await expressBookingApi.bookRide({
          customerName,
          customerEmail,
          customerPhone,
          pickupAddress: { address: pickup },
          dropoffAddress: { address: destination },
          fareAmount: Number(fareAmount),
          // The booking API has no rider field, so record the choice in notes.
          notes: `Preferred rider: ${rider.name} (${rider.id})`,
        });
        ref = bookRes.data?.bookingRef ?? "";
        if (!ref) throw new Error("Booking failed — no reference returned");
        setBookingRef(ref);
      }

      const payRes = await fetch("/api/express/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingRef: ref,
          amount: Number(fareAmount),
          customerName,
          customerEmail,
          customerPhone,
          riderName: rider.name,
          riderPhone: rider.phone ?? "",
          description: `Ride: ${pickup} → ${destination}`,
        }),
      });
      const payData = await payRes.json();
      if (!payRes.ok || !payData.paymentUrl)
        throw new Error(payData.error ?? "Payment initiation failed");

      // Same-tab redirect; Pandascrow returns the customer to /track?booking=<ref>.
      window.location.href = payData.paymentUrl;
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.",
      );
      setLoading(false); // on success we're navigating away, so keep the button disabled
    }
  };

  const handleCancel = async () => {
    if (!bookingRef) return;
    if (
      !confirm(
        "Cancel this ride? A refund will be processed if the rider hasn't started the trip yet.",
      )
    )
      return;
    try {
      await expressBookingApi.cancelOrder(bookingRef, "Customer cancelled");
      alert("Ride cancelled. Refund will be processed within 24 hours.");
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : "Could not cancel — contact support",
      );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Book a Ride
        </h1>
        <p className="text-[12px] text-[#555]">
          No account needed — just enter your details to book
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {(["locations", "riders", "details", "payment"] as Step[]).map(
          (s, i) => {
            const steps: Step[] = [
              "locations",
              "riders",
              "details",
              "payment",
              "confirmed",
            ];
            const current = steps.indexOf(step);
            const done = steps.indexOf(s) < current;
            const active = s === step;
            return (
              <div key={s} className="flex items-center gap-1.5 shrink-0">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border
                ${
                  done
                    ? "bg-green-500/20 border-green-500/40 text-green-400"
                    : active
                      ? "bg-[#ff2d2d] border-[#ff2d2d] text-white"
                      : "bg-[#111] border-[#2a2a2a] text-[#555]"
                }`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span
                  className={`text-[11px] hidden sm:block capitalize shrink-0
                ${active ? "text-[#e0e0e0]" : "text-[#444]"}`}
                >
                  {s === "locations"
                    ? "Route"
                    : s === "riders"
                      ? "Rider"
                      : s === "details"
                        ? "Your Info"
                        : "Pay"}
                </span>
                {i < 3 && <div className="w-4 h-px bg-[#2a2a2a] shrink-0" />}
              </div>
            );
          },
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
          <AlertTriangleIcon size={13} color="currentColor" />
          {error}
        </div>
      )}

      {/* Step: Locations */}
      {step === "locations" && (
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
                className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl pl-9 pr-4 py-3.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
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
                className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl pl-9 pr-4 py-3.5 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
              />
            </div>
          </div>
          <button
            onClick={() => setStep("riders")}
            disabled={!pickup || !destination}
            className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Find Available Riders →
          </button>
        </div>
      )}

      {/* Step: Riders */}
      {step === "riders" && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex flex-col gap-1 flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[12px] text-[#aaa]">
                <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="truncate">{pickup}</span>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-[#aaa]">
                <MapPinIcon size={10} color="#ff2d2d" />
                <span className="truncate">{destination}</span>
              </div>
            </div>
            <button
              onClick={() => setStep("locations")}
              className="text-[11px] text-[#ff2d2d] bg-transparent border-none cursor-pointer shrink-0"
            >
              Edit
            </button>
          </div>

          {ridersError && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[12px] text-red-400">
              <AlertTriangleIcon size={13} color="currentColor" />
              {ridersError}
            </div>
          )}

          {ridersLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <p className="text-[12px] text-[#555]">
                {availableRiders.length} rider
                {availableRiders.length !== 1 ? "s" : ""} available
              </p>
              {availableRiders.length === 0 && !ridersError && (
                <p className="text-[12px] text-[#555] text-center py-8">
                  No riders are currently available. Please check back shortly.
                </p>
              )}
              <div className="flex flex-col gap-3">
                {availableRiders.map((r) => (
                  <RiderCard
                    key={r.id}
                    rider={r}
                    selected={selectedRiderId === r.id}
                    onSelect={() =>
                      setSelectedRiderId(r.id === selectedRiderId ? null : r.id)
                    }
                    showActions={false}
                  />
                ))}
              </div>
            </>
          )}

          <button
            onClick={() => setStep("details")}
            disabled={!selectedRiderId}
            className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Continue with {rider?.name.split(" ")[0] ?? "Rider"} →
          </button>
        </div>
      )}

      {/* Step: Customer details — NO SIGNUP NEEDED */}
      {step === "details" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl">
            <CheckCircleIcon
              size={14}
              color="#22c55e"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[12px] text-[#555]">
              No account needed. Just enter your details so we can send your
              booking confirmation and OTP.
            </p>
          </div>

          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Your Name
            </p>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Full name"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>

          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Email Address
            </p>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>

          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Phone Number
            </p>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="08012345678"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
          </div>

          <div>
            <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5">
              Fare Amount (₦)
            </p>
            <input
              type="number"
              min={1}
              value={fareAmount}
              onChange={(e) => setFareAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]"
            />
            <p className="text-[10px] text-[#444] mt-1">
              Agree on a fare with your rider, or enter your budget — no
              automatic quote is available yet.
            </p>
          </div>

          <p className="text-[11px] text-[#444]">
            Use this email or phone to track your ride at any time — no account
            required.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("riders")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (validateDetails()) setStep("payment");
              }}
              className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90"
            >
              Continue to Payment →
            </button>
          </div>
        </div>
      )}

      {/* Step: Payment summary */}
      {step === "payment" && rider && (
        <div className="flex flex-col gap-4">
          {/* Summary */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            <div className="px-5 py-4">
              <p className="text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-2">
                Booking Summary
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/20 flex items-center justify-center font-bold text-[#ff2d2d] font-[var(--font-syne)] shrink-0">
                  {rider.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-[#e0e0e0]">
                    {rider.name}
                  </p>
                  <p className="text-[11px] text-[#aaa] font-medium capitalize">
                    {rider.vehicleType}
                    {rider.vehiclePlateNumber
                      ? ` · ${rider.vehiclePlateNumber}`
                      : ""}
                  </p>
                </div>
              </div>
            </div>
            {[
              { label: "From", value: pickup },
              { label: "To", value: destination },
              { label: "Passenger", value: customerName },
              { label: "Contact", value: customerEmail || customerPhone },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-5 py-3 gap-4"
              >
                <p className="text-[12px] text-[#555] shrink-0">{label}</p>
                <p className="text-[12px] text-[#e0e0e0] font-medium text-right truncate max-w-[60%]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* Amount */}
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[12px] text-[#555]">Total to pay</p>
              <p className="text-[11px] text-[#444] mt-0.5">
                Paid securely via PandaEscrow
              </p>
            </div>
            <p className="font-[var(--font-syne)] font-bold text-[24px] text-[#ff2d2d]">
              {formatNGN(Number(fareAmount))}
            </p>
          </div>

          {/* PandaEscrow badge */}
          <div className="flex items-center justify-center gap-2 py-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#555"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <span className="text-[11px] text-[#444]">
              Secured by PandaEscrow · Card, bank transfer or virtual account
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("details")}
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
                : `Pay ${formatNGN(Number(fareAmount))}`}
            </button>
          </div>
        </div>
      )}

      {/* Step: Confirmed */}
      {step === "confirmed" && rider && (
        <div className="flex flex-col items-center gap-5 py-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center">
            <CheckCircleIcon size={36} color="#22c55e" />
          </div>
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-xl text-[#f0f0f0] mb-1">
              Ride Booked!
            </h2>
            <p className="text-[13px] text-[#555]">
              Payment confirmed · {rider.name} has been notified
            </p>
          </div>

          <div className="w-full bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Booking Ref</p>
              <p className="text-[13px] text-[#e0e0e0] font-mono font-semibold">
                {bookingRef.split("-").slice(-1)[0]}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Trip OTP</p>
              <p className="text-[18px] text-[#ff2d2d] font-bold font-mono tracking-widest">
                {otp}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Rider</p>
              <p className="text-[12px] text-[#e0e0e0] capitalize">
                {rider.name}
                {rider.vehiclePlateNumber
                  ? ` · ${rider.vehiclePlateNumber}`
                  : ""}
              </p>
            </div>
            <div className="flex items-center justify-between px-5 py-3.5">
              <p className="text-[12px] text-[#555]">Confirmation sent to</p>
              <p className="text-[12px] text-[#e0e0e0] truncate max-w-[55%]">
                {customerEmail || customerPhone}
              </p>
            </div>
          </div>

          <div className="w-full flex items-start gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <AlertTriangleIcon
              size={13}
              color="#f59e0b"
              className="shrink-0 mt-0.5"
            />
            <p className="text-[11px] text-amber-400 text-left">
              Share the OTP with your rider to start the trip. Save your booking
              ref to track this ride.
            </p>
          </div>

          <div className="w-full flex gap-3">
            <button
              onClick={() =>
                (window.location.href = `/express/customer/track?ref=${bookingRef}`)
              }
              className="flex-1 py-2.5 bg-[#1a1a1a] border border-[#222] text-[#aaa] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              Track Ride
            </button>
            <button
              onClick={() => {
                setStep("locations");
                setPickup("");
                setDestination("");
                setSelectedRiderId(null);
                setCustomerName("");
                setCustomerEmail("");
                setCustomerPhone("");
                setFareAmount("");
              }}
              className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
            >
              Book Another
            </button>
          </div>

          {/* Cancel + Chat */}
          <div className="w-full flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-transparent border border-red-500/30 text-red-400 rounded-xl text-[12px] font-medium cursor-pointer hover:bg-red-500/10 transition-all"
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
              Cancel Ride
            </button>
            <button
              onClick={() =>
                (window.location.href = `/chats?ref=${bookingRef}`)
              }
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-transparent border border-[#2a2a2a] text-[#aaa] rounded-xl text-[12px] font-medium cursor-pointer hover:border-[#444] hover:text-[#e0e0e0] transition-all"
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
          </div>

          <p className="text-[10px] text-[#444] text-center">
            Free cancellation before the rider starts the trip. After trip
            starts, cancellation fees may apply.
          </p>
        </div>
      )}
    </div>
  );
}
