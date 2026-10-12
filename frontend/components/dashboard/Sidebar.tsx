"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "./SidebarContext";
import { useLogout } from "@/lib/hooks/useAuth";
import { useProviderInfo } from "@/lib/hooks/useProviderInfo";
import { useUnreadCount } from "@/lib/hooks/useNotifications";
import {
  GridIcon,
  PackageIcon,
  DollarIcon,
  ShieldIcon,
  MessageIcon,
  WalletIcon,
  BellIcon,
  UserIcon,
  LogOutIcon,
  TruckIcon,
  MapPinIcon,
} from "@/components/Icons";

const mainNav = [
  { label: "Dashboard", href: "/dashboard", Icon: GridIcon },
  { label: "Orders", href: "/orderpage", Icon: PackageIcon },
  { label: "Pricing", href: "/pricing", Icon: DollarIcon },
  { label: "Admin", href: "/admin", Icon: ShieldIcon },
  { label: "Chats", href: "/chats", Icon: MessageIcon },
  { label: "Wallet", href: "/wallet", Icon: WalletIcon },
];

// DezenExpress V1 — new services
const expressNav = [
  {
    label: "Order a Ride",
    href: "/express/customer/book-ride",
    Icon: TruckIcon,
  },
  {
    label: "Pick Up & Delivery",
    href: "/express/customer/book-delivery",
    Icon: MapPinIcon,
  },
];

const bottomNav = [
  {
    label: "Notifications",
    href: "/notifications",
    Icon: BellIcon,
    badge: true,
  },
  { label: "Profile", href: "/profile", Icon: UserIcon },
];

function NavLink({
  label,
  href,
  Icon,
  collapsed,
  badge,
  unread,
}: {
  label: string;
  href: string;
  Icon: React.FC<{ size?: number; color?: string }>;
  collapsed: boolean;
  badge?: boolean;
  unread?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");
  const { close } = useSidebar();

  return (
    <Link
      href={href}
      onClick={close}
      title={collapsed ? label : undefined}
      className={`relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] w-full transition-all font-[var(--font-dm)] no-underline
        ${collapsed ? "justify-center" : ""}
        ${
          active
            ? "bg-white text-[#111] font-semibold"
            : "bg-transparent text-[#666] hover:bg-white/5 hover:text-[#ccc]"
        }`}
    >
      <span className="shrink-0 relative">
        <Icon size={17} color={active ? "#111" : "#666"} />
        {collapsed && badge && unread && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#ff2d2d] rounded-full" />
        )}
      </span>
      {!collapsed && <span className="truncate flex-1">{label}</span>}
      {!collapsed && badge && unread && unread > 0 && (
        <span className="shrink-0 min-w-[18px] h-[18px] px-1 bg-[#ff2d2d] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}

function SidebarInner({ collapsed }: { collapsed: boolean }) {
  const logout = useLogout();
  const provider = useProviderInfo();
  const { count: unreadCount } = useUnreadCount();

  const initials = provider?.name
    ? provider.name
        .split(" ")
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Scrollable middle section */}
      <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden min-h-0">
        {/* Logo */}
        <div
          className={`flex items-center gap-2.5 pb-5 pt-1 shrink-0 ${collapsed ? "justify-center" : "px-1"}`}
        >
          <Image
            src="/dezen-express-logo.png"
            alt="Dezen Express"
            width={collapsed ? 32 : 36}
            height={collapsed ? 32 : 36}
            className="shrink-0 object-contain"
          />
          {!collapsed && (
            <span className="font-[var(--font-syne)] font-extrabold text-[13px] tracking-[0.1em] text-[#f0f0f0] truncate">
              DEZEN-EXPRESS
            </span>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex flex-col gap-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.href} {...item} collapsed={collapsed} />
          ))}
        </nav>

        {/* DezenExpress services */}
        <div className="mt-3 pt-3 border-t border-[#1e1e1e] flex flex-col gap-0.5">
          {!collapsed && (
            <p className="text-[10px] text-[#333] uppercase tracking-widest font-semibold px-3 mb-1">
              DezenExpress
            </p>
          )}
          {expressNav.map((item) => (
            <NavLink key={item.href} {...item} collapsed={collapsed} />
          ))}
        </div>

        <div className="flex-1" />

        {/* Bottom nav */}
        <div className="border-t border-[#222] pt-3 flex flex-col gap-0.5">
          {bottomNav.map((item) => (
            <NavLink
              key={item.href}
              {...item}
              collapsed={collapsed}
              unread={item.badge ? unreadCount : undefined}
            />
          ))}
        </div>
      </div>

      {/* User + Sign Out — always pinned to bottom, never scrolls away */}
      <div className="shrink-0 border-t border-[#1e1e1e] pt-3 mt-1">
        <div
          className={`flex items-center gap-2.5 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 rounded-full bg-[#ff2d2d]/20 border border-[#ff2d2d]/30 flex items-center justify-center text-[13px] font-bold text-[#ff2d2d] shrink-0 overflow-hidden">
            {provider?.profileImage ? (
              <img
                src={provider.profileImage}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-[#555] m-0">
                {provider?.verificationStatus === "verified"
                  ? "Verified"
                  : "Pending verification"}
              </p>
              <p className="text-[12px] font-semibold text-[#e0e0e0] m-0 font-[var(--font-syne)] truncate">
                {provider?.name ?? "Provider"}
              </p>
            </div>
          )}
        </div>

        {/* Sign out — always visible */}
        {!collapsed ? (
          <button
            onClick={logout}
            className="mt-2 w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer transition-all font-[var(--font-dm)]"
          >
            <LogOutIcon size={16} color="currentColor" />
            <span>Sign Out</span>
          </button>
        ) : (
          <button
            onClick={logout}
            title="Sign Out"
            className="mt-2 w-full flex items-center justify-center py-2.5 text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer rounded-xl transition-all"
          >
            <LogOutIcon size={16} color="currentColor" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { isOpen, isCollapsed, collapse, close } = useSidebar();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`
        fixed top-0 left-0 h-full z-40 w-[220px]
        bg-[#141414] border-r border-[#1e1e1e] p-3.5
        transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <button
          onClick={close}
          className="absolute top-4 right-3 text-[#555] hover:text-[#aaa] bg-transparent border-none cursor-pointer leading-none"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <SidebarInner collapsed={false} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`
        hidden lg:flex flex-col shrink-0 relative
        bg-[#141414] border-r border-[#1e1e1e] p-3.5
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-[68px]" : "w-[220px]"}
      `}
      >
        <button
          onClick={collapse}
          className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-[#2a2a2a] border border-[#333]
            flex items-center justify-center text-[#888] hover:text-white hover:bg-[#333]
            transition-all cursor-pointer z-10 text-xs"
        >
          {isCollapsed ? "›" : "‹"}
        </button>
        <SidebarInner collapsed={isCollapsed} />
      </aside>
    </>
  );
}
