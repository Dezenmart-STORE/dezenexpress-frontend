"use client";

import { useState } from "react";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/lib/CurrencyContext";

interface CurrencySelectorProps {
  compact?: boolean; // compact = just flag + code, no full name
}

export default function CurrencySelector({
  compact = false,
}: CurrencySelectorProps) {
  const { currency, setCurrency, loading, rates } = useCurrency();
  const [open, setOpen] = useState(false);

  const current = CURRENCIES.find((c) => c.code === currency)!;

  // Show live NGN rate for non-NGN currencies
  const getRateLabel = (code: CurrencyCode) => {
    if (code === "NGN") return "Base currency";
    const rate = rates[code];
    if (!rate) return "—";
    // How many of this currency per 1000 NGN
    const per1000 = (1000 * rate).toFixed(2);
    return `₦1,000 = ${CURRENCIES.find((c) => c.code === code)?.symbol}${per1000}`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] dark:bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-[13px] text-[#aaa] hover:border-[#444] hover:text-[#e0e0e0] transition-all cursor-pointer whitespace-nowrap"
      >
        <span>{current.flag}</span>
        <span className="font-semibold text-[#e0e0e0]">{current.code}</span>
        {!compact && (
          <span className="hidden sm:inline text-[#555]">{current.symbol}</span>
        )}
        {loading && (
          <span className="w-3 h-3 border border-[#555] border-t-transparent rounded-full animate-spin" />
        )}
        <span className="text-[#555] text-xs">∨</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 z-20 bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl overflow-hidden shadow-2xl w-64">
            <div className="px-4 py-3 border-b border-[#222]">
              <p className="text-[11px] text-[#555] uppercase tracking-wider">
                Select Currency
              </p>
              {loading && (
                <p className="text-[11px] text-[#ff2d2d] mt-0.5">
                  Fetching live rates...
                </p>
              )}
            </div>
            <div className="flex flex-col">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setCurrency(c.code);
                    setOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer border-none w-full
                    ${
                      currency === c.code
                        ? "bg-[#ff2d2d]/10 text-[#e0e0e0]"
                        : "bg-transparent text-[#777] hover:bg-white/[0.03] hover:text-[#e0e0e0]"
                    }`}
                >
                  <span className="text-xl shrink-0">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-semibold">
                        {c.code}
                      </span>
                      <span className="text-[11px] text-[#555]">
                        {c.symbol}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#555] truncate">
                      {getRateLabel(c.code)}
                    </p>
                  </div>
                  {currency === c.code && (
                    <span className="text-[#ff2d2d] shrink-0">✓</span>
                  )}
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-[#222]">
              <p className="text-[10px] text-[#444]">
                Rates update hourly via ExchangeRate-API
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
