"use client";

import { useState, useEffect } from "react";
import { locationsApi } from "@/lib/api";

export function useStates() {
  const [states, setStates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    locationsApi
      .getStates()
      .then((res) => setStates(res.data.states))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { states, loading, error };
}

export function useLgas(state: string | null) {
  const [lgas, setLgas] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state) {
      setLgas([]);
      return;
    }
    setLoading(true);
    locationsApi
      .getLgas(state)
      .then((res) => setLgas(res.data.lgas))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [state]);

  return { lgas, loading, error };
}
