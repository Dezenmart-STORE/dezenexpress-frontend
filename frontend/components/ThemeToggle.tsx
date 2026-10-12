"use client";

import { useTheme } from "@/lib/ThemeContext";

interface ThemeToggleProps {
  size?: "sm" | "md";
  showLabel?: boolean;
}

export default function ThemeToggle({
  size = "md",
  showLabel = false,
}: ThemeToggleProps) {
  const { isDark, toggle, theme } = useTheme();

  if (size === "sm") {
    return (
      <button
        onClick={toggle}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent border border-[#2a2a2a] dark:border-[#2a2a2a] light:border-[#e0e0e0] text-[#aaa] hover:border-[#444] hover:text-[#e0e0e0] transition-all cursor-pointer text-base"
      >
        {isDark ? "☀️" : "🌙"}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {/* Toggle track */}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-300
        ${isDark ? "bg-[#2a2a2a]" : "bg-[#ff2d2d]"}`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm transition-all duration-300
          ${isDark ? "left-0.5 bg-[#444]" : "left-[22px] bg-white"}`}
        >
          {isDark ? "🌙" : "☀️"}
        </div>
      </div>
      {showLabel && (
        <span className="text-[13px] text-[#aaa] capitalize">{theme} mode</span>
      )}
    </button>
  );
}
