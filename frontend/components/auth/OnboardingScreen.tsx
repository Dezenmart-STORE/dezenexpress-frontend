"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CeloWalletInput from "@/components/auth/CeloWalletInput";
import {
  onboardingApi,
  locationsApi,
  getProvider,
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

export default function OnboardingScreen() {
  const router = useRouter();
  const provider = getProvider();

  const [name, setName] = useState(provider?.name ?? "");
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

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Business name is required");
    if (!phone) return setError("Phone number is required");
    if (!walletAddress) return setError("Wallet address is required");
    if (!coverageState) return setError("Please select a coverage state");

    setLoading(true);
    setError(null);

    try {
      const res = await onboardingApi.complete({
        name: name.trim(),
        phone,
        walletAddress,
        coverageAreas: [
          { state: coverageState, lgas: [], isStatewide },
        ] as CoverageArea[],
      });
      saveProvider(res.data.provider);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 lg:p-8 flex flex-col gap-5">
        <div className="flex flex-col items-center text-center gap-2">
          {provider?.profileImage && (
            <img
              src={provider.profileImage}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-[#ff2d2d]/30"
            />
          )}
          <h1 className="font-[var(--font-syne)] font-bold text-xl text-[#f0f0f0]">
            Welcome{provider?.name ? `, ${provider.name.split(" ")[0]}` : ""}!
          </h1>
          <p className="text-[13px] text-[#888]">
            Complete your logistics provider profile to get started
          </p>
        </div>

        {error && (
          <div className="px-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-[12px] text-red-400">
            {error}
          </div>
        )}

        <div>
          <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider mb-1.5">
            Business / Provider Name
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

        <CeloWalletInput
          value={walletAddress}
          onChange={setWalletAddress}
          label="Wallet Address"
        />

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

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold font-[var(--font-syne)] border-none cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Completing setup..." : "Complete Setup →"}
        </button>

        <p className="text-[10px] text-[#444] text-center">
          You can add more coverage areas later from your profile
        </p>
      </div>
    </div>
  );
}
