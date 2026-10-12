"use client";

import { useState } from "react";
import {
  WalletIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "@/components/Icons";

interface Props {
  value: string;
  onChange: (address: string) => void;
  disabled?: boolean;
  label?: string;
}

function validateCeloAddress(address: string): {
  valid: boolean;
  message: string;
} {
  if (!address) return { valid: false, message: "" };
  if (!address.startsWith("0x"))
    return { valid: false, message: "Address must start with 0x" };
  if (address.length !== 42)
    return {
      valid: false,
      message: `Address must be 42 characters (currently ${address.length})`,
    };
  if (!/^0x[0-9a-fA-F]{40}$/.test(address))
    return { valid: false, message: "Address contains invalid characters" };
  return { valid: true, message: "Valid Celo address" };
}

export default function CeloWalletInput({
  value,
  onChange,
  disabled = false,
  label,
}: Props) {
  const [touched, setTouched] = useState(false);
  const { valid, message } = validateCeloAddress(value);
  const showError = touched && value && !valid;
  const showSuccess = touched && valid;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <p className="text-[11px] font-medium text-[#555] uppercase tracking-wider">
          {label}
        </p>
      )}

      {/* Celo badge */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <svg
          width="12"
          height="12"
          viewBox="0 0 950 950"
          fill="none"
          className="shrink-0"
        >
          <circle cx="475" cy="475" r="475" fill="#FCFF52" />
          <circle cx="475" cy="475" r="270" fill="#35D07F" />
          <circle cx="475" cy="230" r="120" fill="#FCFF52" />
          <circle cx="475" cy="720" r="120" fill="#FCFF52" />
        </svg>
        <span className="text-[10px] text-[#FCFF52]/70 font-medium">
          Celo Blockchain · USDT payments
        </span>
      </div>

      {/* Input */}
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 shrink-0">
          <WalletIcon size={14} color={valid ? "#22c55e" : "#555"} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => setTouched(true)}
          placeholder="0x0000000000000000000000000000000000000000"
          disabled={disabled}
          className={`w-full bg-[#111] border rounded-lg pl-8 pr-10 py-2.5 text-[12px] font-mono text-[#e0e0e0]
            focus:outline-none transition-colors placeholder:text-[#333]
            ${disabled ? "opacity-40 cursor-not-allowed border-[#2e2e2e]" : ""}
            ${showError ? "border-red-500/50 focus:border-red-500" : ""}
            ${showSuccess ? "border-green-500/50 focus:border-green-500" : ""}
            ${!showError && !showSuccess ? "border-[#2e2e2e] focus:border-[#ff2d2d]" : ""}`}
        />
        {/* Status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showSuccess && <CheckCircleIcon size={14} color="#22c55e" />}
          {showError && <AlertTriangleIcon size={14} color="#f87171" />}
        </div>
      </div>

      {/* Validation message */}
      <div className="h-4 flex items-center">
        {showError && <p className="text-[10px] text-red-400">{message}</p>}
        {showSuccess && (
          <p className="text-[10px] text-green-400">✓ Valid Celo address</p>
        )}
        {!touched && !value && (
          <p className="text-[10px] text-[#444]">
            Enter your Celo wallet address to receive delivery payments
          </p>
        )}
      </div>
    </div>
  );
}
