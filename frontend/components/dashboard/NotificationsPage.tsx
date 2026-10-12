"use client";

import { useSidebar } from "./SidebarContext";
import { useNotifications } from "@/lib/hooks/useNotifications";
import {
  BellIcon,
  PackageIcon,
  TruckIcon,
  DollarIcon,
  AlertTriangleIcon,
  RefreshIcon,
  CheckCircleIcon,
  XIcon,
} from "@/components/Icons";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function NotifIcon({ type }: { type: string }) {
  const props = { size: 16, color: "currentColor" };
  if (type === "order") return <PackageIcon {...props} />;
  if (type === "delivery") return <TruckIcon {...props} />;
  if (type === "payment") return <DollarIcon {...props} />;
  if (type === "dispute") return <AlertTriangleIcon {...props} />;
  return <BellIcon {...props} />;
}

function iconBg(type: string): string {
  if (type === "order") return "bg-blue-500/10 text-blue-400";
  if (type === "delivery") return "bg-purple-500/10 text-purple-400";
  if (type === "payment") return "bg-green-500/10 text-green-400";
  if (type === "dispute") return "bg-red-500/10 text-red-400";
  return "bg-[#ff2d2d]/10 text-[#ff2d2d]";
}

export default function NotificationsPage() {
  const { toggle } = useSidebar();
  const {
    notifications,
    loading,
    error,
    unreadCount,
    markAllRead,
    markOneRead,
    refetch,
  } = useNotifications();

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <>
      <div className="sticky top-0 z-10 bg-[#0f0f0f] flex items-center justify-between px-4 lg:px-7 py-4 lg:py-5 border-b border-[#1e1e1e] shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={toggle}
            className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer bg-transparent border-none shrink-0"
          >
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
            <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0]">
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#ff2d2d] text-white text-[11px] font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[12px] text-[#aaa] rounded-xl hover:border-[#444] transition-all cursor-pointer whitespace-nowrap"
            >
              <CheckCircleIcon size={13} color="currentColor" />
              Mark all read
            </button>
          )}
          <button
            onClick={refetch}
            className="p-2 bg-[#1a1a1a] border border-[#2a2a2a] text-[#aaa] rounded-xl hover:border-[#444] transition-all cursor-pointer"
          >
            <RefreshIcon size={14} color="currentColor" />
          </button>
        </div>
      </div>

      <div className="flex-1 lg:overflow-y-auto px-4 lg:px-7 py-4 lg:py-6 flex flex-col gap-5">
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-[13px] text-red-400">
            <AlertTriangleIcon size={15} color="currentColor" /> {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-8 h-8 border-2 border-[#ff2d2d] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#555] text-sm">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 gap-4 text-[#555]">
            <div className="w-16 h-16 rounded-2xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
              <BellIcon size={28} color="#333" />
            </div>
            <p className="text-[15px] font-medium text-[#777]">
              No notifications yet
            </p>
            <p className="text-[13px] text-center max-w-xs">
              You'll be notified about orders, deliveries and account updates
              here
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">
                  Unread ({unread.length})
                </p>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden divide-y divide-[#1e1e1e]">
                  {unread.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => markOneRead(n._id)}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer bg-[#ff2d2d]/[0.02]"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg(n.type)}`}
                      >
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-semibold text-[#e0e0e0]">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#555] shrink-0">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#888] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-[#ff2d2d] shrink-0 mt-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {read.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">
                  Earlier ({read.length})
                </p>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl overflow-hidden divide-y divide-[#1e1e1e]">
                  {read.map((n) => (
                    <div
                      key={n._id}
                      className="flex items-start gap-3 px-5 py-4 opacity-60"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${iconBg(n.type)}`}
                      >
                        <NotifIcon type={n.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] font-medium text-[#aaa]">
                            {n.title}
                          </p>
                          <span className="text-[10px] text-[#555] shrink-0">
                            {timeAgo(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#666] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
