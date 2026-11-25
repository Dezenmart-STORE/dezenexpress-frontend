"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { expressBookingApi } from "@/lib/express/api";
import { useCustomerProfile } from "@/lib/hooks/useCustomerProfile";
import BankTransferPayment from "./BankTransferPayment";
import MapPlaceholder from "../shared/MapPlaceholder";
import { MapPinIcon, AlertTriangleIcon } from "@/components/Icons";

type Step = "package" | "people" | "payment";
type Size = "small" | "medium" | "large";

const PACKAGE_SIZES: {
  value: Size;
  label: string;
  desc: string;
  icon: string;
}[] = [
  {
    value: "small",
    label: "Small",
    desc: "Documents, phone, small items",
    icon: "📄",
  },
  {
    value: "medium",
    label: "Medium",
    desc: "Shoes, clothes, small box",
    icon: "📦",
  },
  { value: "large", label: "Large", desc: "Large box, appliance", icon: "🗃" },
];

function formatNGN(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

const inputCls =
  "w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 text-[13px] text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none placeholder:text-[#444]";
const labelCls =
  "text-[11px] text-[#aaa] font-medium uppercase tracking-wider mb-1.5";

export default function BookDelivery() {
  const router = useRouter();
  const profile = useCustomerProfile();

  const [step, setStep] = useState<Step>("package");
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [packageSize, setPackageSize] = useState<Size | "">("");
  const [description, setDescription] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [fareAmount, setFareAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingRef, setBookingRef] = useState("");

  useEffect(() => {
    setSenderName((v) => v || profile.name || "");
    setSenderPhone((v) => v || profile.phoneNumber || "");
  }, [profile]);

  const validatePackage = () => {
    if (!pickup.trim() || !destination.trim())
      return (setError("Enter the pickup and delivery addresses"), false);
    if (!packageSize) return (setError("Choose a package size"), false);
    if (!description.trim())
      return (setError("Describe what you're sending"), false);
    const fare = Number(fareAmount);
    if (!fareAmount || Number.isNaN(fare) || fare <= 0)
      return (setError("Enter a valid fare amount"), false);
    if (weightKg && (Number.isNaN(Number(weightKg)) || Number(weightKg) <= 0))
      return (setError("Weight must be a positive number"), false);
    setError(null);
    return true;
  };

  const validatePeople = () => {
    if (!senderPhone.trim())
      return (setError("Enter your phone number"), false);
    if (!recipientName.trim())
      return (setError("Enter the recipient's name"), false);
    if (!recipientPhone.trim())
      return (setError("Enter the recipient's phone"), false);
    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail))
      return (
        setError("Enter a valid recipient email or leave it blank"),
        false
      );
    setError(null);
    return true;
  };

  const handleContinue = async () => {
    if (!validatePeople() || !packageSize) return;
    setLoading(true);
    setError(null);
    try {
      const res = await expressBookingApi.bookDelivery({
        customerName: senderName.trim() || undefined,
        customerPhone: senderPhone.trim(),
        pickupAddress: { address: pickup.trim() },
        dropoffAddress: { address: destination.trim() },
        fareAmount: Number(fareAmount),
        package: {
          description: description.trim(),
          sizeCategory: packageSize,
          weightKg: weightKg ? Number(weightKg) : undefined,
        },
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      const ref = res.data?.bookingRef;
      if (!ref) throw new Error("Booking failed — no reference returned");
      setBookingRef(ref);
      setStep("payment");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not create booking");
    } finally {
      setLoading(false);
    }
  };

  const goToTracking = (ref: string) =>
    router.push(`/express/customer/track?booking=${encodeURIComponent(ref)}`);

  const stepOrder: Step[] = ["package", "people", "payment"];
  const stepLabels = ["Package", "People", "Pay"];

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
      <div>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
          Send a Package
        </h1>
        <p className="text-[12px] text-[#555]">
          Pay by bank transfer — a rider collects your package once it's paid
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

      {/* Step 1: package */}
      {step === "package" && (
        <div className="flex flex-col gap-4">
          <MapPlaceholder
            pickup={pickup || "Pickup"}
            destination={destination || "Delivery"}
            height="h-40"
          />
          <div className="flex flex-col gap-3">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-green-400" />
              <input
                value={pickup}
                onChange={(e) => setPickup(e.target.value)}
                placeholder="Pickup address..."
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
                placeholder="Delivery address..."
                className={`${inputCls} pl-9`}
              />
            </div>
          </div>

          <div>
            <p className={labelCls}>Package size</p>
            <div className="grid grid-cols-3 gap-2">
              {PACKAGE_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setPackageSize(s.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center cursor-pointer transition-all
                    ${packageSize === s.value ? "border-[#ff2d2d] bg-[#ff2d2d]/5" : "border-[#222] bg-[#1a1a1a] hover:border-[#333]"}`}
                >
                  <span className="text-xl">{s.icon}</span>
                  <p className="text-[12px] font-semibold text-[#e0e0e0]">
                    {s.label}
                  </p>
                  <p className="text-[10px] text-[#555]">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className={labelCls}>What are you sending?</p>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Signed contract documents"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Weight in kg (optional)</p>
              <input
                type="number"
                min={0}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
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
                placeholder="e.g. 3500"
                className={inputCls}
              />
            </div>
          </div>
          <p className="text-[10px] text-[#444] -mt-2">
            You set the fare for now. Riders see it when they review your
            request, and you pay exactly this amount.
          </p>

          <div>
            <p className={labelCls}>Notes for the rider (optional)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={`${inputCls} resize-none`}
              placeholder="e.g. Call the recipient on arrival"
            />
          </div>

          <button
            onClick={() => validatePackage() && setStep("people")}
            className="w-full py-3 bg-[#ff2d2d] text-white rounded-xl text-[14px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90"
          >
            Continue →
          </button>
        </div>
      )}

      {/* Step 2: sender + recipient */}
      {step === "people" && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-[#aaa]">
              Sender (you)
            </p>
            <input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Your full name"
              className={inputCls}
            />
            <input
              type="tel"
              value={senderPhone}
              onChange={(e) => setSenderPhone(e.target.value)}
              placeholder="Your phone (+2348012345678)"
              className={inputCls}
            />
            {profile.email && (
              <p className="text-[10px] text-[#444]">
                Receipts and the completion code go to {profile.email}.
              </p>
            )}
          </div>

          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-[12px] font-semibold text-[#aaa]">Recipient</p>
            <input
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Recipient full name"
              className={inputCls}
            />
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Recipient phone"
              className={inputCls}
            />
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Recipient email (optional)"
              className={inputCls}
            />
            <p className="text-[10px] text-[#444]">
              If you add the recipient's email, the completion code is sent to
              them too, so they can give it to the rider on delivery.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep("package")}
              className="flex-1 py-2.5 bg-transparent border border-[#222] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#333]"
            >
              ← Back
            </button>
            <button
              onClick={handleContinue}
              disabled={loading}
              className="flex-[2] py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 disabled:opacity-30"
            >
              {loading ? "Creating booking..." : "Continue to payment →"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: pay by bank transfer */}
      {step === "payment" && bookingRef && (
        <div className="flex flex-col gap-4">
          <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
            {[
              { label: "Booking", value: bookingRef },
              { label: "From", value: pickup },
              { label: "To", value: destination },
              { label: "Package", value: `${packageSize} · ${description}` },
              {
                label: "Recipient",
                value: `${recipientName} · ${recipientPhone}`,
              },
              { label: "Fare", value: formatNGN(Number(fareAmount)) },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between px-5 py-2.5 gap-4"
              >
                <p className="text-[12px] text-[#555] shrink-0">{label}</p>
                <p className="text-[12px] text-[#e0e0e0] font-medium text-right truncate max-w-[65%] capitalize">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <BankTransferPayment
            bookingRef={bookingRef}
            onPaid={() => setTimeout(() => goToTracking(bookingRef), 1500)}
            onCancelled={() => {
              setBookingRef("");
              setStep("people");
            }}
          />
        </div>
      )}
    </div>
  );
}
