"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/lib/hooks/useNotifications";
import {
  HomeIcon,
  PackageIcon,
  BellIcon,
  UserIcon,
  MessageIcon,
  WalletIcon,
  DollarIcon,
  ShieldIcon,
  XIcon,
  ChevronRightIcon,
  TruckIcon,
  MapPinIcon,
} from "@/components/Icons";

/* ── More drawer ─────────────────────────────────────────────────────────── */
const moreItems = [
  { href: "/pricing", label: "Pricing", Icon: DollarIcon },
  { href: "/chats", label: "Chats", Icon: MessageIcon },
  { href: "/wallet", label: "Wallet", Icon: WalletIcon },
  { href: "/admin", label: "Admin", Icon: ShieldIcon },
  {
    href: "/express/customer/book-ride",
    label: "Order a Ride",
    Icon: TruckIcon,
  },
  {
    href: "/express/customer/book-delivery",
    label: "Pick Up & Delivery",
    Icon: MapPinIcon,
  },
];

function MoreDrawer({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="fixed bottom-16 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-[#222] rounded-t-2xl p-4 pb-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold text-[#aaa] font-[var(--font-syne)]">
            More
          </p>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-[#555] hover:text-[#aaa]"
          >
            <XIcon size={16} color="currentColor" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {moreItems.map(({ href, label, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl no-underline transition-colors
                  ${
                    active
                      ? "bg-[#ff2d2d]/10 border border-[#ff2d2d]/30"
                      : "bg-[#111] border border-[#2a2a2a] hover:border-[#333]"
                  }`}
              >
                <Icon size={18} color={active ? "#ff2d2d" : "#666"} />
                <span
                  className={`text-[13px] font-medium ${active ? "text-[#ff2d2d]" : "text-[#aaa]"}`}
                >
                  {label}
                </span>
                <ChevronRightIcon size={14} color="#333" className="ml-auto" />
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ── Tab button ──────────────────────────────────────────────────────────── */
function Tab({
  href,
  label,
  Icon,
  active,
  badge,
}: {
  href?: string;
  label: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  active: boolean;
  badge?: number;
}) {
  const inner = (
    <>
      {active && (
        <div className="absolute top-1.5 w-10 h-8 bg-[#ff2d2d]/10 rounded-xl" />
      )}
      <div className="relative z-10">
        <Icon size={20} color={active ? "#ff2d2d" : "#555"} />
        {badge && badge > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-[#ff2d2d] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </div>
      <span
        className={`text-[10px] font-medium z-10 ${active ? "text-[#ff2d2d]" : "text-[#555]"}`}
      >
        {label}
      </span>
    </>
  );

  if (!href)
    return (
      <div className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative">
        {inner}
      </div>
    );
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 flex-1 h-full no-underline relative"
    >
      {inner}
    </Link>
  );
}

/* ── Main ────────────────────────────────────────────────────────────────── */
const MORE_PATHS = ["/pricing", "/chats", "/wallet", "/admin", "/express"];

export default function BottomNav() {
  const pathname = usePathname();
  const { count: unreadCount } = useUnreadCount();
  const [showMore, setShowMore] = useState(false);

  const isMoreActive = MORE_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414] border-t border-[#1e1e1e]">
        <div className="flex items-center justify-around h-16 px-1">
          <Tab
            href="/dashboard"
            label="Home"
            Icon={HomeIcon}
            active={pathname === "/dashboard"}
          />
          <Tab
            href="/orderpage"
            label="Orders"
            Icon={PackageIcon}
            active={
              pathname === "/orderpage" || pathname.startsWith("/orderpage/")
            }
          />
          <Tab
            href="/notifications"
            label="Alerts"
            Icon={BellIcon}
            active={pathname === "/notifications"}
            badge={unreadCount}
          />
          <Tab
            href="/profile"
            label="Account"
            Icon={UserIcon}
            active={pathname === "/profile"}
          />

          {/* More tab — triggers drawer */}
          <button
            onClick={() => setShowMore((v) => !v)}
            className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative bg-transparent border-none cursor-pointer"
          >
            {isMoreActive && (
              <div className="absolute top-1.5 w-10 h-8 bg-[#ff2d2d]/10 rounded-xl" />
            )}
            <div className="relative z-10 flex flex-col gap-[3px] items-center">
              {showMore ? (
                <XIcon size={20} color={isMoreActive ? "#ff2d2d" : "#555"} />
              ) : (
                <>
                  <span
                    className={`w-4 h-0.5 rounded-full ${isMoreActive ? "bg-[#ff2d2d]" : "bg-[#555]"}`}
                  />
                  <span
                    className={`w-4 h-0.5 rounded-full ${isMoreActive ? "bg-[#ff2d2d]" : "bg-[#555]"}`}
                  />
                  <span
                    className={`w-4 h-0.5 rounded-full ${isMoreActive ? "bg-[#ff2d2d]" : "bg-[#555]"}`}
                  />
                </>
              )}
            </div>
            <span
              className={`text-[10px] font-medium z-10 ${isMoreActive ? "text-[#ff2d2d]" : "text-[#555]"}`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {showMore && <MoreDrawer onClose={() => setShowMore(false)} />}
    </>
  );
}
