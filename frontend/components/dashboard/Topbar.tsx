"use client";

import { ReactNode } from "react";
import { useSidebar } from "./SidebarContext";

interface TopbarProps {
  title: string;
  right?: ReactNode;
}

export default function Topbar({ title, right }: TopbarProps) {
  const { toggle } = useSidebar();

  return (
    <div className="flex items-center justify-between px-4 lg:px-7 py-4 lg:py-5 border-b border-[#1e1e1e] shrink-0 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden flex flex-col justify-center gap-[5px] w-8 h-8 cursor-pointer bg-transparent border-none shrink-0"
          aria-label="Open menu"
        >
          <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
          <span className="w-5 h-0.5 bg-[#aaa] rounded block" />
        </button>
        <h1 className="font-[var(--font-syne)] font-bold text-xl lg:text-[26px] text-[#f0f0f0] truncate">
          {title}
        </h1>
      </div>

      {right && (
        <div className="flex items-center gap-2 lg:gap-3 shrink-0 flex-wrap justify-end">
          {right}
        </div>
      )}
    </div>
  );
}
