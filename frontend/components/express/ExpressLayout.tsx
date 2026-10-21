"use client";

import { useState, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import {
  HomeIcon,
  PackageIcon,
  TruckIcon,
  WalletIcon,
  UserIcon,
  ClockIcon,
  MapPinIcon,
  LogOutIcon,
} from "@/components/Icons";

const CUSTOMER_NAV = [
  { href: "/express/customer", label: "Home", Icon: HomeIcon },
  { href: "/express/customer/book-ride", label: "Book Ride", Icon: TruckIcon },
  {
    href: "/express/customer/book-delivery",
    label: "Pick Up and Delivery",
    Icon: PackageIcon,
  },
  { href: "/express/customer/track", label: "Track", Icon: MapPinIcon },
  { href: "/express/customer/history", label: "History", Icon: ClockIcon },
];

const RIDER_NAV = [
  { href: "/express/rider", label: "Dashboard", Icon: HomeIcon },
  { href: "/express/rider/requests", label: "Requests", Icon: PackageIcon },
  { href: "/express/rider/active", label: "Active", Icon: TruckIcon },
  { href: "/express/rider/earnings", label: "Earnings", Icon: WalletIcon },
  { href: "/express/rider/profile", label: "Profile", Icon: UserIcon },
];

function NavLink({
  href,
  label,
  Icon,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  Icon: React.FC<any>;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const isIndex = href === "/express/customer" || href === "/express/rider";
  const active = isIndex
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      onClick={onNavigate}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all no-underline
        ${collapsed ? "justify-center" : ""}
        ${
          active
            ? "bg-[#ff2d2d]/15 border border-[#ff2d2d]/30 text-[#ff2d2d]"
            : "text-[#888] hover:bg-white/5 hover:text-[#e0e0e0] border border-transparent"
        }`}
    >
      <Icon size={17} color={active ? "#ff2d2d" : "#666"} />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function MobileBottomNav({ nav }: { nav: typeof CUSTOMER_NAV }) {
  const pathname = usePathname();
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414] border-t border-[#1e1e1e]">
      <div className="flex items-center justify-around h-16 px-1">
        {nav.slice(0, 5).map(({ href, label, Icon }) => {
          const isIndex =
            href === "/express/customer" || href === "/express/rider";
          const active = isIndex
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full no-underline relative"
            >
              {active && (
                <div className="absolute top-2 w-12 h-8 bg-[#ff2d2d]/10 rounded-xl" />
              )}
              <Icon size={20} color={active ? "#ff2d2d" : "#888"} />
              <span
                className={`text-[10px] font-medium z-10 ${active ? "text-[#ff2d2d]" : "text-[#888]"}`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function ExpressLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  // const [role, setRole] = useState<"customer" | "rider">("customer");

  const pathname = usePathname();

  const role: "customer" | "rider" = pathname.startsWith("/express/rider")
    ? "rider"
    : "customer";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nav = role === "customer" ? CUSTOMER_NAV : RIDER_NAV;

  return (
    <div className="flex h-screen bg-[#0f0f0f] text-[#e0e0e0] overflow-hidden font-[var(--font-dm)]">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed lg:relative top-0 left-0 h-full z-40 bg-[#141414] border-r border-[#1e1e1e]
        p-3.5 flex flex-col transition-all duration-300
        ${collapsed ? "lg:w-[68px]" : "lg:w-[220px]"}
        ${mobileOpen ? "w-[220px] translate-x-0" : "w-[220px] -translate-x-full lg:translate-x-0"}
      `}
      >
        {/* Collapse btn */}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#333] items-center justify-center text-[#888] hover:text-white cursor-pointer z-10 text-xs border-none"
        >
          {collapsed ? "›" : "‹"}
        </button>

        {/* Logo */}

        <Link
          href="/express/customer"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-2 pb-4 mb-2 border-b border-[#1e1e1e] no-underline ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Image
            src="/dezen-express-logo.png"
            alt="Dezen Express"
            width={collapsed ? 30 : 34}
            height={collapsed ? 30 : 34}
            className="shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="font-[var(--font-syne)] font-extrabold text-[12px] tracking-widest text-[#f0f0f0]">
              DEZEN-EXPRESS
            </span>
          )}
        </Link>

        {/* Role switcher */}
        <div
          className={`flex mb-3 bg-[#111] border border-[#2a2a2a] rounded-xl p-1 ${collapsed ? "flex-col gap-1" : "gap-0.5"}`}
        >
          {(["customer", "rider"] as const).map((r) => (
            <button
              key={r}
              onClick={() => {
                setMobileOpen(false);
                router.push(
                  r === "customer" ? "/express/customer" : "/express/rider",
                );
              }}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer border-none transition-all capitalize
                ${role === r ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#555] hover:text-[#aaa]"}`}
            >
              {collapsed
                ? r[0].toUpperCase()
                : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 flex-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              collapsed={collapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          ))}
        </nav>

        {/* Sign out / auth */}
        {role === "rider" ? (
          collapsed ? (
            <a
              href="/express/rider/auth"
              className="flex items-center justify-center py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all mt-2 no-underline"
            >
              <LogOutIcon size={16} color="currentColor" />
            </a>
          ) : (
            <a
              href="/express/rider/auth"
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-[#666] hover:bg-white/5 hover:text-[#ccc] transition-all mt-2 no-underline"
            >
              <LogOutIcon size={16} color="currentColor" />
              <span>Rider Sign In / Register</span>
            </a>
          )
        ) : collapsed ? (
          <button className="flex items-center justify-center py-2.5 text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer rounded-xl transition-all mt-2">
            <LogOutIcon size={16} color="currentColor" />
          </button>
        ) : (
          <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer transition-all mt-2">
            <LogOutIcon size={16} color="currentColor" />
            <span>Sign Out</span>
          </button>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1e1e1e] bg-[#0f0f0f] shrink-0">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex flex-col gap-[5px] w-8 h-8 justify-center bg-transparent border-none cursor-pointer shrink-0"
          >
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          </button>

          {/* <div className="flex items-center gap-1.5"> */}

          <Link
            href="/express/customer"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-1.5"
          >
            <Image
              src="/dezen-express-logo.png"
              alt="Dezen Express"
              width={28}
              height={28}
              className="shrink-0 object-contain"
            />
            <span className="font-[var(--font-syne)] font-extrabold text-[12px] tracking-widest text-[#f0f0f0]">
              DEZEN-EXPRESS
            </span>
          </Link>

          <div className="ml-auto flex bg-[#111] border border-[#2a2a2a] rounded-xl p-1 gap-0.5">
            {(["customer", "rider"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setMobileOpen(false);
                  router.push(
                    r === "customer" ? "/express/customer" : "/express/rider",
                  );
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold cursor-pointer border-none transition-all capitalize
                  ${role === r ? "bg-[#ff2d2d] text-white" : "bg-transparent text-[#555]"}`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 lg:pb-0">{children}</div>

        <MobileBottomNav nav={nav} />
      </div>
    </div>
  );
}
