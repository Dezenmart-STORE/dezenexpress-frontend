"use client";

import { useLogout } from "@/lib/hooks/useAuth";

interface Props {
  variant?: "sidebar" | "profile" | "menu";
}

export default function LogoutButton({ variant = "profile" }: Props) {
  const logout = useLogout();

  if (variant === "sidebar") {
    // Compact version for sidebar bottom
    return (
      <button
        onClick={logout}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer transition-all font-[var(--font-dm)]"
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
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        <span>Sign Out</span>
      </button>
    );
  }

  if (variant === "menu") {
    // For dropdown menus
    return (
      <button
        onClick={logout}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer transition-colors"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
          <polyline points="16 17 21 12 16 7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Sign Out
      </button>
    );
  }

  // Profile page — full button
  return (
    <button
      onClick={logout}
      className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-[13px] font-semibold cursor-pointer hover:bg-red-500/20 transition-all"
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
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
      Sign Out of Dezen-Express
    </button>
  );
}
