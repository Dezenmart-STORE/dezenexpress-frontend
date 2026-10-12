"use client";

import { useState, useEffect } from "react";

const API_KEY = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;

// Module-level cache — survives component remounts
const cache: Record<string, { rate: number; time: number }> = {};
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function useExchangeRate(from = "USD", to = "NGN") {
  const key = `${from}-${to}`;
  const cached = cache[key];

  const [rate, setRate] = useState<number | null>(cached ? cached.rate : null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!API_KEY) {
      setLoading(false);
      return;
    }

    // Use cache if still fresh
    if (cache[key] && Date.now() - cache[key].time < CACHE_TTL) {
      setRate(cache[key].rate);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);

    fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.conversion_rate) {
          cache[key] = { rate: d.conversion_rate, time: Date.now() };
          setRate(d.conversion_rate);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [from, to, key]);

  const convert = (amount: number): number | null => {
    if (!rate) return null;
    return Math.round(amount * rate * 100) / 100;
  };

  return { rate, loading, error, convert };
}
