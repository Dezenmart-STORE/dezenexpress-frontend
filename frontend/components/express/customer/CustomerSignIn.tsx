"use client";

import { useEffect, useState } from "react";
import { startGoogleSignIn, setReturnTo } from "@/lib/express/customerAuth";

export default function CustomerSignIn({
  message = "Sign in with Google to book rides and deliveries and track them.",
}: {
  message?: string;
}) {
  // A signed-in logistics provider has a different session from a customer.
  const [isProvider, setIsProvider] = useState(false);
  useEffect(() => {
    setIsProvider(
      document.cookie
        .split("; ")
        .some((c) => c.startsWith("dezenmart_logistics_token=")),
    );
  }, []);

  const handleClick = () => {
    // Come back to the page the customer was on after Google finishes.
    setReturnTo(window.location.pathname + window.location.search);
    startGoogleSignIn();
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-[#1a1a1a] border border-[#222] rounded-2xl p-6 flex flex-col gap-4 text-center">
        <div>
          <h1 className="font-[var(--font-syne)] font-bold text-xl text-[#f0f0f0]">
            Sign in to continue
          </h1>
          <p className="text-[12px] text-[#555] mt-1">{message}</p>
        </div>
        <button
          onClick={handleClick}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-[#2a2a2a] rounded-xl text-[13px] font-semibold text-[#1a1a1a] cursor-pointer hover:bg-gray-100 transition-all"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>
        {isProvider && (
          <p className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            You're signed in to the provider dashboard. Booking uses your
            customer sign-in, which is separate. Your provider session stays
            active.
          </p>
        )}
        <p className="text-[10px] text-[#444]">
          One Dezenmart account works across DezenMart, DezenFoods and
          DezenExpress.
        </p>
      </div>
    </div>
  );
}
