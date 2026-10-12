"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  authApi,
  saveToken,
  clearToken,
  saveProvider,
  getProvider,
} from "@/lib/api";

export { getProvider };

export function useLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.login({ email, password });
      saveToken(res.token);
      saveProvider(res.data.provider);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

export function useRegister() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (data: Parameters<typeof authApi.register>[0]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authApi.register(data);
      saveToken(res.token);
      saveProvider(res.data.provider);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

export function useLogout() {
  const router = useRouter();
  return () => {
    clearToken();
    router.push("/login");
  };
}
