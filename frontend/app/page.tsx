"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Stage = "splash" | "choose";

// Each role keeps its own session, so we can tell which ones are already signed in.
const CUSTOMER_TOKEN_KEY = "dezenexpress_customer_token";
const RIDER_TOKEN_KEY = "dezenexpress_rider_token";
const PROVIDER_COOKIE = "dezenmart_logistics_token";

export default function SplashScreen() {
  const [stage, setStage] = useState<Stage>("splash");
  const [signedIn, setSignedIn] = useState({
    customer: false,
    rider: false,
    provider: false,
  });

  // Splash for 1.8s, then reveal the role cards.
  useEffect(() => {
    const t = setTimeout(() => setStage("choose"), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    setSignedIn({
      customer: !!localStorage.getItem(CUSTOMER_TOKEN_KEY),
      rider: !!localStorage.getItem(RIDER_TOKEN_KEY),
      provider: document.cookie
        .split("; ")
        .some((c) => c.startsWith(`${PROVIDER_COOKIE}=`)),
    });
  }, []);

  const roles = [
    {
      key: "customer",
      emoji: "🚗",
      title: "Customer",
      text: "Book a ride or send a package and pay by bank transfer.",
      cta: "Book a ride",
      href: "/express/customer/book-ride",
      signedIn: signedIn.customer,
    },
    {
      key: "rider",
      emoji: "🏍",
      title: "Rider",
      text: "Take paid trips and deliveries, then withdraw your earnings.",
      cta: signedIn.rider ? "Open rider app" : "Rider sign in",
      href: signedIn.rider ? "/express/rider" : "/express/rider/auth",
      signedIn: signedIn.rider,
    },
    {
      key: "provider",
      emoji: "🚚",
      title: "Logistics provider",
      text: "Manage delivery orders, your pricing and your wallet.",
      cta: signedIn.provider ? "Open dashboard" : "Provider sign in",
      href: signedIn.provider ? "/dashboard" : "/login",
      signedIn: signedIn.provider,
    },
  ];

  const choosing = stage === "choose";

  return (
    <main
      aria-label={
        choosing ? "Choose how to use DezenExpress" : "Loading DezenExpress"
      }
      aria-busy={!choosing}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#0b0b0d]"
    >
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/2
          h-64 w-64 -translate-x-1/2 -translate-y-1/2
          rounded-full bg-[#ff2d2d]/[0.07] blur-[90px]"
      />

      <div className="relative flex min-h-full flex-col items-center justify-center px-5 py-12">
        {/* Branding (stays on screen for both stages) */}
        <div className="flex flex-col items-center motion-safe:animate-[fadeIn_700ms_ease-out_both]">
          <div
            className={`relative ${choosing ? "mb-5" : "mb-7"} transition-all duration-500`}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 scale-125 rounded-3xl bg-[#ff2d2d]/15 blur-2xl"
            />
            <div
              className={`relative flex items-center justify-center rounded-[28px]
                border border-white/[0.08] bg-gradient-to-b from-[#202024] to-[#121214]
                shadow-[0_12px_50px_rgba(0,0,0,0.45)] transition-all duration-500
                ${choosing ? "h-20 w-20" : "h-28 w-28"}`}
            >
              <Image
                src="/dezen-express-logo.png"
                alt="DezenExpress emblem"
                width={88}
                height={88}
                priority
                className={`object-contain transition-all duration-500 ${choosing ? "h-[60px] w-[60px]" : "h-[88px] w-[88px]"}`}
              />
            </div>
          </div>

          <h1
            className="whitespace-nowrap font-[var(--font-syne)]
              text-[27px] font-black tracking-[0.07em] text-white sm:text-[32px]"
          >
            DEZEN<span className="text-[#ff3038]">EXPRESS</span>
          </h1>

          <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/45">
            Rides <span className="px-1 text-[#ff3038]">·</span> Deliveries
          </p>

          {/* Loading indicator (splash only) */}
          {!choosing && (
            <div role="status" className="mt-12 flex items-center gap-2">
              <span className="sr-only">Preparing your experience...</span>
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full bg-[#ff3038]
                    motion-safe:animate-pulse motion-reduce:opacity-100"
                  style={{
                    animationDelay: `${i * 180}ms`,
                    animationDuration: "900ms",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Role cards */}
        {choosing && (
          <section className="mt-10 w-full max-w-4xl motion-safe:animate-[fadeIn_500ms_ease-out_both]">
            <h2 className="mb-6 text-center text-[13px] font-medium uppercase tracking-[0.2em] text-white/60">
              How would you like to use DezenExpress?
            </h2>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {roles.map((r) => (
                <Link
                  key={r.key}
                  href={r.href}
                  className="group relative flex flex-col gap-3 rounded-2xl border border-white/[0.08]
                    bg-gradient-to-b from-[#1a1a1d] to-[#111113] p-6 no-underline
                    transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff3038]/50
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4
                    focus-visible:outline-[#ff3038] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {r.signedIn && (
                    <span className="absolute right-4 top-4 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                      Signed in
                    </span>
                  )}
                  <span className="text-4xl" aria-hidden="true">
                    {r.emoji}
                  </span>
                  <div>
                    <p className="font-[var(--font-syne)] text-[18px] font-bold text-white">
                      {r.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                      {r.text}
                    </p>
                  </div>
                  <span className="mt-auto flex items-center gap-1.5 pt-2 text-[13px] font-semibold text-[#ff3038]">
                    {r.cta}
                    <span
                      aria-hidden="true"
                      className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                    >
                      →
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Footer branding */}
        <footer
          className={`flex flex-col items-center gap-2 ${choosing ? "mt-12" : "absolute bottom-9"}`}
        >
          <div className="h-px w-8 bg-[#ff3038]/50" />
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-white/35">
            Powered by
          </p>
          <p className="text-xs font-bold tracking-[0.18em] text-white/65">
            DEZEN ECOSYSTEM
          </p>
        </footer>
      </div>
    </main>
  );
}
