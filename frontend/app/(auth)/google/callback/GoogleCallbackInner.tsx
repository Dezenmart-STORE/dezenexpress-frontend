"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { saveToken, saveProvider, profileApi } from "@/lib/api";

type Stage = "loading" | "debug" | "error";

export default function GoogleCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    fullUrl: string;
    params: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const fullUrl = window.location.href;
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    if (params.error) {
      setError(decodeURIComponent(params.error));
      setStage("error");
      return;
    }

    const token = params.token || params.access_token || params.jwt || null;

    if (token) {
      handleToken(token);
    } else {
      setDebugInfo({ fullUrl, params });
      setStage("debug");
    }
  }, [searchParams]);

  const handleToken = async (token: string) => {
    saveToken(token);
    try {
      const res = await profileApi.get();
      saveProvider(res.data.provider);

      const p = res.data.provider;
      const needsOnboarding =
        p.onboardingComplete === false || !p.walletAddress || !p.phone;

      router.replace(needsOnboarding ? "/onboarding" : "/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
      setStage("error");
    }
  };

  // Debug screen
  if (stage === "debug") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <h2 className="font-[var(--font-syne)] font-bold text-[15px] text-[#f0f0f0]">
              Debug — What did the backend return?
            </h2>
          </div>
          <p className="text-[12px] text-[#888]">
            Google auth completed but no token found. Share this info.
          </p>

          <div className="bg-[#111] rounded-xl p-3">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-1">
              Full URL
            </p>
            <p className="text-[11px] text-green-400 font-mono break-all">
              {debugInfo?.fullUrl}
            </p>
          </div>

          <div className="bg-[#111] rounded-xl p-3">
            <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2">
              Query Parameters received
            </p>
            {Object.keys(debugInfo?.params ?? {}).length === 0 ? (
              <p className="text-[11px] text-red-400">
                None — backend sent nothing in the URL
              </p>
            ) : (
              Object.entries(debugInfo?.params ?? {}).map(([k, v]) => (
                <div key={k} className="mb-1.5">
                  <span className="text-[11px] text-amber-400 font-mono">
                    {k}
                  </span>
                  <span className="text-[11px] text-[#555]"> = </span>
                  <span className="text-[11px] text-[#aaa] font-mono break-all">
                    {v.length > 80 ? `${v.slice(0, 80)}...` : v}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.replace("/login")}
              className="flex-1 py-2.5 bg-transparent border border-[#2a2a2a] text-[#666] rounded-xl text-[13px] cursor-pointer hover:border-[#444] hover:text-[#aaa] transition-all"
            >
              ← Back to login
            </button>
            <button
              onClick={() =>
                navigator.clipboard.writeText(
                  JSON.stringify(debugInfo, null, 2),
                )
              }
              className="flex-1 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
            >
              📋 Copy debug info
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Error screen
  if (stage === "error") {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#f0f0f0]">
            Sign-in failed
          </h2>
          <p className="text-[13px] text-[#888]">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-2 px-5 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  // Loading screen
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-0.5">
          {(
            [
              [1, 0.5],
              [0.5, 1],
            ] as number[][]
          ).map((col, ci) => (
            <div key={ci} className="flex flex-col gap-1">
              {col.map((op, ri) => (
                <div
                  key={ri}
                  style={{ opacity: op }}
                  className="w-3 h-3 rounded-full bg-[#ff2d2d] animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
        <p className="text-[#555] text-xs font-[var(--font-dm)] tracking-widest uppercase">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
