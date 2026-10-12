"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

//  Supported currencies
// Add more here as needed
export const CURRENCIES = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "GBP", symbol: "£", name: "British Pound", flag: "🇬🇧" },
  { code: "EUR", symbol: "€", name: "Euro", flag: "🇪🇺" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", flag: "🇬🇭" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", flag: "🇰🇪" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

interface CurrencyContextType {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  rates: Record<string, number>; // e.g. { USD: 1, NGN: 1580, GBP: 0.79 }
  loading: boolean;
  error: string | null;
  convert: (amountNgn: number) => string; // converts from NGN to current currency
  symbol: string;
  refetch: () => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "NGN",
  setCurrency: () => {},
  rates: {},
  loading: false,
  error: null,
  convert: (n) => `₦${n.toLocaleString()}`,
  symbol: "₦",
  refetch: () => {},
});

const CACHE_KEY = "dezenmart_fx_rates";
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache — saves API calls
const CURRENCY_KEY = "dezenmart_currency";

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>("NGN");
  const [rates, setRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved currency preference
  useEffect(() => {
    const saved = localStorage.getItem(CURRENCY_KEY) as CurrencyCode | null;
    if (saved && CURRENCIES.find((c) => c.code === saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const fetchRates = useCallback(async (force = false) => {
    // Check cache first
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { timestamp, data } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL_MS) {
          setRates(data);
          return;
        }
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      // No API key — use hardcoded fallback rates (approximate)
      const fallback: Record<string, number> = {
        NGN: 1,
        USD: 0.00063, // ~1580 NGN per USD
        GBP: 0.0005, // ~2000 NGN per GBP
        EUR: 0.00058, // ~1720 NGN per EUR
        GHS: 0.0095, // ~105 NGN per GHS
        KES: 0.082, // ~12 NGN per KES
      };
      setRates(fallback);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Base currency NGN — so all rates are relative to 1 NGN
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/NGN`,
      );
      const json = await res.json();

      if (json.result !== "success")
        throw new Error(json["error-type"] ?? "API error");

      const data: Record<string, number> = json.conversion_rates;
      setRates(data);

      // Cache it
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data,
        }),
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch rates");
      // Use fallback on error
      setRates({
        NGN: 1,
        USD: 0.00063,
        GBP: 0.0005,
        EUR: 0.00058,
        GHS: 0.0095,
        KES: 0.082,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    localStorage.setItem(CURRENCY_KEY, c);
  };

  // Convert from NGN to selected currency
  const convert = (amountNgn: number): string => {
    const info = CURRENCIES.find((c) => c.code === currency)!;
    if (currency === "NGN" || !rates[currency]) {
      return `${info.symbol}${amountNgn.toLocaleString("en-NG")}`;
    }
    const converted = amountNgn * rates[currency];
    // Format based on currency
    const formatted =
      converted < 1
        ? converted.toFixed(4)
        : converted < 100
          ? converted.toFixed(2)
          : Math.round(converted).toLocaleString();
    return `${info.symbol}${formatted}`;
  };

  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? "₦";

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        rates,
        loading,
        error,
        convert,
        symbol,
        refetch: () => fetchRates(true),
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
