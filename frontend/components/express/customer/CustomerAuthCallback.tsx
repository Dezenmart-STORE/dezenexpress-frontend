"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  saveCustomerToken,
  saveCustomerUser,
  clearCustomerToken,
  popReturnTo,
  consumeSignInPending,
} from "@/lib/express/customerAuth";
import { customerApi, normalizeProfile } from "@/lib/express/api";

export default function CustomerAuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // React strict mode runs effects twice in dev
    ran.current = true;

    const token = searchParams.get("token");
    const err = searchParams.get("error");
    const message = searchParams.get("message");

    // Remove the token from the address bar / history right away.
    window.history.replaceState(null, "", window.location.pathname);

    if (err || !token) {
      setError(
        message
          ? decodeURIComponent(message)
          : err
            ? "Google sign-in failed. Please try again."
            : "No sign-in token was received.",
      );
      return;
    }

    if (!consumeSignInPending()) {
      setError(
        "This sign-in link isn't valid or has expired. Please start signing in again from DezenExpress.",
      );
      return;
    }

    (async () => {
      saveCustomerToken(token);
      try {
        // Confirms the token works and caches name/email/phone for the forms.
        const profile = normalizeProfile(await customerApi.getProfile());
        saveCustomerUser(profile);
      } catch (e) {
        clearCustomerToken();
        setError(
          e instanceof Error
            ? e.message
            : "Signed in, but we couldn't load your account.",
        );
        return;
      }
      const to = popReturnTo();
      // Only follow same-site return paths.
      router.replace(
        to && to.startsWith("/express/") ? to : "/express/customer/book-ride",
      );
    })();
  }, [router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="bg-[#1a1a1a] border border-red-500/30 rounded-2xl p-8 max-w-sm w-full text-center flex flex-col items-center gap-4">
          <h2 className="font-[var(--font-syne)] font-bold text-lg text-[#f0f0f0]">
            Sign-in failed
          </h2>
          <p className="text-[13px] text-[#888]">{error}</p>
          <button
            onClick={() => router.replace("/express/customer")}
            className="mt-2 px-5 py-2.5 bg-[#ff2d2d] text-white rounded-xl text-[13px] font-semibold border-none cursor-pointer hover:opacity-90"
          >
            Back to DezenExpress
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#555] text-xs tracking-widest uppercase">
          Signing you in...
        </p>
      </div>
    </div>
  );
}
