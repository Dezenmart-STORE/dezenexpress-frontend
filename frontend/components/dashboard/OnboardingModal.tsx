"use client";

import { useState, useEffect } from "react";
import {
  onboardingApi,
  locationsApi,
  saveProvider,
  CoverageArea,
} from "@/lib/api";

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

interface Props {
  providerName?: string;
  providerImage?: string;
  onComplete: () => void;
}

export default function OnboardingModal({
  providerName,
  providerImage,
  onComplete,
}: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState(providerName ?? "");
  const [phone, setPhone] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [coverageState, setCoverageState] = useState("");
  const [isStatewide, setIsStatewide] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);

  useEffect(() => {
    locationsApi
      .getStates()
      .then((res) => setStates(res.data.states))
      .catch(() => setStates(NIGERIAN_STATES));
  }, []);

  const handleNext = () => {
    if (!name.trim()) return setError("Business name is required");
    if (!phone.trim()) return setError("Phone number is required");
    if (!walletAddress.trim()) return setError("Wallet address is required");
    setError(null);
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!coverageState) return setError("Please select a coverage state");
    setLoading(true);
    setError(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      walletAddress: walletAddress.trim(),
      coverageAreas: [
        { state: coverageState, lgas: [], isStatewide },
      ] as CoverageArea[],
    };

    console.log("Onboarding payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await onboardingApi.complete(payload);
      console.log("Onboarding success:", res);
      saveProvider(res.data.provider);
      onComplete();
    } catch (err: unknown) {
      console.error("Onboarding error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to complete setup. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#222] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#141414] border-b border-[#222] px-6 py-5 flex flex-col items-center gap-3 text-center">
          {providerImage ? (
            <img
              src={providerImage}
              alt=""
              className="w-14 h-14 rounded-full object-cover border-2 border-[#ff2d2d]/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-[#ff2d2d]/20 border-2 border-[#ff2d2d]/30 flex items-center justify-center text-xl font-bold text-[#ff2d2d]">
              {providerName?.[0]?.toUpperCase() ?? "👤"}
            </div>
          )}
          <div>
            <h2 className="font-[var(--font-syne)] font-bold text-[17px] text-[#f0f0f0]">
              Welcome{providerName ? `, ${providerName.split(" ")[0]}` : ""}!
            </h2>
            <p className="text-[12px] text-[#888] mt-0.5">
              Complete your logistics provider profile to get started
            </p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all
                  ${
                    step === s
                      ? "bg-[#ff2d2d] border-[#ff2d2d] text-white"
                      : step > s
                        ? "bg-green-500/20 border-green-500 text-green-400"
                        : "bg-transparent border-[#333] text-[#555]"
                  }`}
                >
                  {step > s ? "✓" : s}
                </div>
                <span className="text-[11px] text-[#555]">
                  {s === 1 ? "Details" : "Coverage"}
                </span>
                {s < 2 && <div className="w-6 h-px bg-[#2a2a2a]" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[12px] text-red-400">
              {error}
            </div>
          )}

          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <>
              <div>
                <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
                  Business Name
                </p>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. GIG Logistics"
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
                  Phone Number
                </p>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234 801 234 5678"
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
                  Wallet Address
                </p>
                <input
                  type="text"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="0xAbCdEf1234567890..."
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
                />
                <p className="text-[10px] text-amber-400/80 mt-1">
                  ⚠️ Required to receive payments. Cannot be changed after
                  setup.
                </p>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity mt-1"
              >
                Continue →
              </button>
            </>
          )}

          {/* ── Step 2: Coverage ── */}
          {step === 2 && (
            <>
              <div>
                <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
                  Primary Coverage State
                </p>
                <select
                  value={coverageState}
                  onChange={(e) => setCoverageState(e.target.value)}
                  className="w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-[#e0e0e0] focus:border-[#ff2d2d] focus:outline-none transition-colors"
                >
                  <option value="">Select a state</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isStatewide}
                  onChange={(e) => setIsStatewide(e.target.checked)}
                  className="accent-[#ff2d2d]"
                />
                <span className="text-[12px] text-[#aaa]">
                  Cover entire state (statewide)
                </span>
              </label>

              <p className="text-[10px] text-[#555]">
                You can add more states and LGAs from your Profile page after
                setup.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep(1);
                    setError(null);
                  }}
                  className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all"
                >
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || !coverageState}
                  className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? "Setting up..." : "Complete Setup"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
