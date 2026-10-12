"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

const SERVICES = [
  {
    num: "01 / SHOPPING",
    icon: "🛍️",
    name: "DezenMart",
    desc: "Discover products from vendors and shop with a trusted marketplace experience.",
    href: "https://dezenmart.com",
    external: true,
    cta: "Shop on DezenMart",
    available: true,
  },
  {
    num: "02 / FOOD",
    icon: "🍲",
    name: "DezenFoods",
    desc: "Order meals, groceries and everyday food from your favourite vendors.",
    href: "#",
    external: false,
    cta: "Coming Soon",
    available: false,
  },
  {
    num: "03 / MOVE & DELIVER",
    icon: "🚗",
    name: "DezenExpress",
    desc: "Book a ride, request pickup or send packages where they need to go.",
    href: "/express/customer",
    external: false,
    cta: "Use DezenExpress",
    available: true,
    highlight: true,
  },
];

export default function Home() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#090909] text-[#f7f7f7] font-sans">
      {/* Nav */}
      <header className="border-b border-[#1e1e1e]">
        <div className="max-w-[1120px] mx-auto px-6 h-[76px] flex items-center justify-between">
          <span className="text-[27px] font-black tracking-tight">
            DEZEN<span className="text-[#ff3030]">.</span>
          </span>
          <nav className="hidden md:flex items-center gap-6 text-[14px] text-[#cfcfcf]">
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
            <a href="#about" className="hover:text-white transition-colors">
              About
            </a>
          </nav>
          <a
            href="#services"
            className="bg-[#ff3030] text-white text-[14px] font-bold px-5 py-3 rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all"
          >
            Get started
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 md:py-28 text-center px-6">
        <div className="max-w-[1120px] mx-auto">
          <div className="inline-block px-4 py-1.5 border border-[#303030] rounded-full text-[12px] text-[#bdbdbd] mb-6">
            ONE ACCOUNT • EVERYDAY NEEDS
          </div>
          <h1 className="text-[clamp(44px,8vw,82px)] font-black leading-[0.98] tracking-[-4px] max-w-[850px] mx-auto">
            Everything you need.
            <br />
            <span className="text-[#ff3030]">One Dezen.</span>
          </h1>
          <p className="max-w-[600px] mx-auto mt-6 mb-8 text-[#9b9b9b] text-[18px]">
            Shop products, order food, book a ride or send something across town
            — all through the Dezen ecosystem.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a
              href="#services"
              className="bg-[#ff3030] text-white text-[14px] font-bold px-6 py-3.5 rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all"
            >
              Explore Dezen
            </a>
            <a
              href="#how"
              className="border border-[#242424] text-[14px] font-bold px-6 py-3.5 rounded-xl hover:bg-[#181818] transition-all"
            >
              How it works
            </a>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-6" id="services">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[34px] font-black tracking-[-1.5px]">
              What do you need today?
            </h2>
            <p className="text-[#9b9b9b] mt-2">
              Choose a service and Dezen takes you there.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SERVICES.map((s) => {
              const Card = (
                <div
                  onMouseEnter={() => setHovered(s.name)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative min-h-[330px] rounded-2xl border p-7 flex flex-col overflow-hidden transition-all duration-300 cursor-pointer
                    ${s.highlight ? "bg-gradient-to-br from-[#151515] to-[#0e0e0e]" : "bg-[#111]"}
                    ${hovered === s.name ? "-translate-y-1.5 border-[#3a3a3a] bg-[#171717]" : "border-[#1e1e1e]"}
                    ${!s.available ? "opacity-60" : ""}`}
                >
                  <p className="text-[#666] text-[12px] font-extrabold">
                    {s.num}
                  </p>
                  <div className="text-[40px] my-6">{s.icon}</div>
                  <h3 className="text-[28px] font-black tracking-tight">
                    {s.name}
                  </h3>
                  <p className="text-[#9b9b9b] mt-2 mb-6">{s.desc}</p>
                  <div className="mt-auto flex items-center justify-between">
                    <span
                      className={`text-[14px] font-extrabold ${s.available ? "text-white" : "text-[#555]"}`}
                    >
                      {s.cta}{" "}
                      {s.available && <span className="text-[#ff3030]">→</span>}
                    </span>
                    {!s.available && (
                      <span className="text-[10px] font-bold px-2.5 py-1 bg-[#1e1e1e] border border-[#2a2a2a] rounded-full text-[#555]">
                        COMING SOON
                      </span>
                    )}
                  </div>
                </div>
              );

              if (!s.available) return <div key={s.name}>{Card}</div>;
              if (s.external)
                return (
                  <a key={s.name} href={s.href} target="_blank" rel="noopener">
                    {Card}
                  </a>
                );
              return (
                <Link key={s.name} href={s.href}>
                  {Card}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-6" id="how">
        <div className="max-w-[1120px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-[34px] font-black tracking-[-1.5px]">
              One ecosystem. Simple experience.
            </h2>
            <p className="text-[#9b9b9b] mt-2">
              You don't need three accounts to use three services.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8">
              <h3 className="text-[25px] font-black tracking-tight mb-2">
                One Dezen account
              </h3>
              <p className="text-[#9b9b9b] mb-6">
                Your Dezen identity connects the services, so moving between
                them feels natural.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  "Create one Dezen account.",
                  "Choose the service you need.",
                  "Use the same ecosystem across your everyday needs.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1c1c1c] border border-[#2a2a2a] flex items-center justify-center text-[12px] font-bold shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-[14px] text-[#ccc] mt-0.5">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111] border border-[#1e1e1e] rounded-2xl p-8">
              <h3 className="text-[25px] font-black tracking-tight mb-2">
                Services that work together
              </h3>
              <p className="text-[#9b9b9b] mb-6">
                Shopping, food and logistics can connect instead of operating as
                isolated platforms.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  "Buy on DezenMart and get it delivered.",
                  "Order on DezenFoods and have it picked up and delivered.",
                  "Book a ride or move a package with DezenExpress.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-[#1c1c1c] border border-[#ff3030]/30 flex items-center justify-center text-[12px] font-bold text-[#ff3030] shrink-0">
                      →
                    </div>
                    <span className="text-[14px] text-[#ccc] mt-0.5">
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DezenExpress spotlight */}
      <section className="py-16 px-6 border-t border-[#1e1e1e]" id="express">
        <div className="max-w-[1120px] mx-auto">
          <div className="bg-gradient-to-br from-[#151515] to-[#0e0e0e] border border-[#222] rounded-2xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="text-[11px] font-extrabold text-[#ff3030] tracking-widest mb-3">
                03 / MOVE & DELIVER
              </div>
              <h2 className="text-[clamp(28px,4vw,46px)] font-black tracking-tight mb-4">
                DezenExpress — rides and deliveries you can trust
              </h2>
              <p className="text-[#9b9b9b] mb-6 max-w-lg">
                Book a ride to anywhere in the city or send a package across
                town. Payments are held securely in escrow via PandaEscrow and
                only released when the service is complete.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/express/customer"
                  className="bg-[#ff3030] text-white text-[14px] font-bold px-6 py-3.5 rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all no-underline"
                >
                  Book a Ride →
                </Link>
                <Link
                  href="/express/customer/book-delivery"
                  className="border border-[#2a2a2a] text-[14px] font-bold px-6 py-3.5 rounded-xl hover:bg-[#181818] transition-all no-underline"
                >
                  Send a Package →
                </Link>
                <Link
                  href="/express/rider/auth"
                  className="border border-[#ff3030]/30 text-[#ff3030] text-[14px] font-bold px-6 py-3.5 rounded-xl hover:bg-[#ff3030]/10 transition-all no-underline"
                >
                  Become a Rider →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0">
              {[
                {
                  icon: "🚗",
                  label: "Book a Ride",
                  desc: "Anywhere in the city",
                },
                {
                  icon: "📦",
                  label: "Send a Package",
                  desc: "Tracked door-to-door",
                },
                {
                  icon: "🔒",
                  label: "Escrow Payment",
                  desc: "PandaEscrow protected",
                },
                {
                  icon: "🏍",
                  label: "Become a Rider",
                  desc: "Earn 85% per fare",
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="bg-[#0f0f0f] border border-[#222] rounded-xl p-4 w-[140px]"
                >
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-[13px] font-bold text-[#e0e0e0]">
                    {f.label}
                  </p>
                  <p className="text-[11px] text-[#555] mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-20 px-6 text-center border-t border-[#1e1e1e]"
        id="about"
      >
        <div className="max-w-[1120px] mx-auto">
          <h2 className="text-[clamp(34px,5vw,55px)] font-black tracking-[-2px]">
            Welcome to Dezen.
          </h2>
          <p className="text-[#9b9b9b] mt-3 mb-7 max-w-[550px] mx-auto">
            One ecosystem built around the things people do every day.
          </p>
          <a
            href="#services"
            className="bg-[#ff3030] text-white text-[14px] font-bold px-6 py-3.5 rounded-xl hover:brightness-110 hover:-translate-y-0.5 transition-all inline-block"
          >
            Choose a service →
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e1e1e] py-6 px-6">
        <div className="max-w-[1120px] mx-auto flex items-center justify-between flex-wrap gap-4 text-[13px] text-[#777]">
          <span>© Dezen. Everyday needs. One account.</span>
          <div className="flex items-center gap-5">
            <a href="#services" className="hover:text-white transition-colors">
              Services
            </a>
            <a href="#how" className="hover:text-white transition-colors">
              How it works
            </a>
            <Link
              href="/express/customer"
              className="hover:text-white transition-colors no-underline"
            >
              DezenExpress
            </Link>
            <Link
              href="/login"
              className="hover:text-white transition-colors no-underline"
            >
              Provider Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
