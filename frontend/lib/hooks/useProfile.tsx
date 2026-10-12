"use client";

import { useState, useEffect } from "react";
import { profileApi, Provider } from "@/lib/api";

export function useProfile() {
  const [profile, setProfile] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    profileApi
      .get()
      .then((res) => setProfile(res.data.provider))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const update = async (data: Parameters<typeof profileApi.update>[0]) => {
    setLoading(true);
    try {
      const res = await profileApi.update(data);
      setProfile(res.data.provider);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return { profile, loading, error, update };
}
