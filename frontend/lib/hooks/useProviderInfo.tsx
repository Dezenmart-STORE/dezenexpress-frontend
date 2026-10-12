"use client";

import { useState, useEffect } from "react";
import { Provider } from "@/lib/api";
import { getProvider } from "./useAuth";

export function useProviderInfo() {
  const [provider, setProvider] = useState<Partial<Provider> | null>(null);

  useEffect(() => {
    setProvider(getProvider());
  }, []);

  return provider;
}
