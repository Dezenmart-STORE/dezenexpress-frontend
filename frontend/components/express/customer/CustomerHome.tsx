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
    icon: "🕐",
    label: "History",
    href: "/express/customer/history",
    color: "bg-amber-500/10 border-amber-500/20",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Book a ride or delivery",
    desc: "Enter the route and your fare. For rides, pick an online rider",
  },
  {
    step: "2",
    title: "Your rider confirms",
    desc: "Rides are sent to the rider you chose. If they decline, pick another",
  },
  {
    step: "3",
    title: "Pay by bank transfer",
    desc: "Send the exact fare to a one-time account we give you",
  },
  {
    step: "4",
    title: "Track your trip",
    desc: "Follow status updates as your rider moves",
  },
  {
    step: "5",
    title: "Share the completion code",
    desc: "Give the 6-digit code to the rider at the end to finish the trip",
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
          Pay by bank transfer. Verified riders. Live status updates.
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
        <div className="grid grid-cols-4 gap-2">
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
            Pay by bank transfer
          </p>
          <p className="text-[12px] text-[#555]">
            You pay the exact fare into a one-time bank account. Dezenmart holds
            the money until the trip is complete, then pays the rider. If you
            cancel a paid booking before a rider accepts, you are refunded.
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
            Earn on every trip and withdraw to your bank.
          </p>
        </div>
        <span className="text-[#555] text-[18px]">→</span>
      </Link>

      {/* Logistics provider portal */}
      <Link
        href="/login"
        className="flex items-center gap-4 p-4 bg-[#1a1a1a] border border-[#222] rounded-2xl no-underline hover:border-[#333] transition-colors"
      >
        <span className="text-3xl shrink-0">🚚</span>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-[#e0e0e0]">
            Logistics provider?
          </p>
          <p className="text-[11px] text-[#555]">
            Sign in to your provider dashboard
          </p>
        </div>
        <span className="text-[#555] text-[18px]">→</span>
      </Link>
    </div>
  );
}
