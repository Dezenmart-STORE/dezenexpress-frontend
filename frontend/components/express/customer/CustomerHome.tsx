"use client";

import Link from "next/link";
import { VEHICLE_TYPES } from "@/lib/express/types";

const QUICK_ACTIONS = [
  {
    icon: "🚗",
    label: "Book a Ride",
    href: "/express/customer/book-ride",
    color: "bg-[#ff2d2d]/10 border-[#ff2d2d]/20",
  },
  {
    icon: "📦",
    label: "Send a Package",
    href: "/express/customer/book-delivery",
    color: "bg-blue-500/10 border-blue-500/20",
  },
  {
    icon: "📍",
    label: "Track Order",
    href: "/express/customer/track",
    color: "bg-green-500/10 border-green-500/20",
  },
  {
    icon: "💳",
    label: "My Wallet",
    href: "/express/customer/wallet",
    color: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: "🕐",
    label: "History",
    href: "/express/customer/history",
    color: "bg-amber-500/10 border-amber-500/20",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Choose service",
    desc: "Book a ride or schedule a delivery",
  },
  {
    step: "2",
    title: "Select a rider",
    desc: "Pick from available verified riders near you",
  },
  {
    step: "3",
    title: "Pay via PandaEscrow",
    desc: "Funds held securely until service is complete",
  },
  {
    step: "4",
    title: "Track in real time",
    desc: "Follow your rider with live status updates",
  },
  {
    step: "5",
    title: "Confirm with OTP",
    desc: "Share OTP to release payment to rider",
  },
];

export default function CustomerHome() {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-6">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#ff2d2d]/10 to-[#0f0f0f] border border-[#ff2d2d]/20 rounded-2xl p-6">
        <p className="text-[11px] font-extrabold text-[#ff2d2d] tracking-widest mb-2">
          DEZENEXPRESS
        </p>
        <h1 className="font-[var(--font-syne)] font-black text-[28px] lg:text-[36px] text-[#f0f0f0] leading-tight">
          Rides & deliveries
          <br />
          you can trust
        </h1>
        <p className="text-[13px] text-[#555] mt-2 mb-5 max-w-sm">
          Secure escrow payments. Verified riders. Real-time tracking.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/express/customer/book-ride"
            className="bg-[#ff2d2d] text-white text-[13px] font-bold px-5 py-2.5 rounded-xl no-underline hover:opacity-90 transition-opacity"
          >
            Book a Ride →
          </Link>
          <Link
            href="/express/customer/book-delivery"
            className="bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] text-[13px] font-bold px-5 py-2.5 rounded-xl no-underline hover:border-[#333] transition-colors"
          >
            Send a Package →
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest mb-3">
          Quick Actions
        </p>
        <div className="grid grid-cols-5 gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${a.color} no-underline hover:opacity-80 transition-opacity`}
            >
              <span className="text-2xl">{a.icon}</span>
              <p className="text-[10px] font-semibold text-[#aaa] text-center leading-tight">
                {a.label}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Vehicle types */}
      <div>
        <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest mb-3">
          Available Vehicle Types
        </p>
        <div className="grid grid-cols-3 gap-2">
          {VEHICLE_TYPES.map((v) => (
            <Link
              key={v.value}
              href="/express/customer/book-delivery"
              className="flex items-center gap-2.5 px-3 py-3 bg-[#1a1a1a] border border-[#222] rounded-xl no-underline hover:border-[#333] transition-colors"
            >
              <span className="text-xl shrink-0">{v.icon}</span>
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#e0e0e0] truncate">
                  {v.label}
                </p>
                <p className="text-[10px] text-[#555]">{v.maxKg}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Escrow notice */}
      <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5 flex items-start gap-3">
        <span className="text-2xl shrink-0">🔒</span>
        <div>
          <p className="text-[13px] font-semibold text-[#e0e0e0] mb-1">
            Payments secured by PandaEscrow
          </p>
          <p className="text-[12px] text-[#555]">
            Your payment is held safely in escrow and only released to the rider
            after you confirm delivery with an OTP. Refunds go straight back to
            your wallet.
          </p>
        </div>
      </div>

      {/* How it works */}
      <div>
        <p className="text-[11px] font-bold text-[#555] uppercase tracking-widest mb-3">
          How It Works
        </p>
        <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl divide-y divide-[#1e1e1e]">
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="flex items-start gap-4 px-5 py-4">
              <div className="w-7 h-7 rounded-full bg-[#ff2d2d]/10 border border-[#ff2d2d]/30 flex items-center justify-center text-[12px] font-bold text-[#ff2d2d] shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#e0e0e0]">
                  {s.title}
                </p>
                <p className="text-[11px] text-[#555]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet promo */}
      <Link
        href="/express/customer/wallet"
        className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-500/10 to-[#1a1a1a] border border-purple-500/20 rounded-2xl no-underline hover:border-purple-500/40 transition-colors"
      >
        <span className="text-3xl shrink-0">💳</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#e0e0e0]">
            DezenExpress Wallet
          </p>
          <p className="text-[11px] text-[#555]">
            Fund your wallet and pay faster for future bookings
          </p>
        </div>
        <span className="text-[#555] text-[18px]">→</span>
      </Link>

      {/* Rider CTA */}
      <Link
        href="/express/rider/auth"
        className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#222] rounded-2xl no-underline hover:border-[#333] transition-colors"
      >
        <span className="text-3xl shrink-0">🏍</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#e0e0e0]">
            Become a DezenExpress Rider
          </p>
          <p className="text-[11px] text-[#555]">
            Earn 85% of every fare. Set your own hours.
          </p>
        </div>
        <span className="text-[#555] text-[18px]">→</span>
      </Link>
    </div>
  );
}
