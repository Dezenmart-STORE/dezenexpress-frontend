const riders = [
  { avatar: "👨", stars: 5, status: "Completed" as const },
  { avatar: "👩", stars: 5, status: "Pending" as const },
  { avatar: "🧑", stars: 5, status: "Pending" as const },
];

export default function TopRiders() {
  return (
    <div className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-5">
      <div className="flex justify-between items-center mb-4">
        <span className="font-[var(--font-syne)] font-semibold text-sm text-[#e0e0e0]">
          Top-Rated Riders
        </span>
        <button className="bg-transparent border-none text-[#888] text-xs cursor-pointer flex items-center gap-1 hover:text-[#ccc] transition-colors">
          📅 Jan 2024 ∨
        </button>
      </div>

      {/* Table head */}
      <div className="grid grid-cols-3 py-1.5 border-b border-[#222] mb-2">
        {["Profile Pic", "⭐ Rating Stars", "📦 Delivery Status"].map((h) => (
          <span key={h} className="text-[11px] text-[#555] font-medium">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {riders.map((r, i) => (
        <div
          key={i}
          className="grid grid-cols-3 py-2.5 border-b border-[#1e1e1e] items-center"
        >
          <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center text-sm border border-[#333]">
            {r.avatar}
          </div>
          <span className="text-[#f59e0b] text-xs">{"★".repeat(r.stars)}</span>
          <span
            className={`text-[10px] font-semibold rounded-md px-2 py-0.5 inline-block
            ${
              r.status === "Completed"
                ? "bg-green-500/15 text-green-400"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            + {r.status}
          </span>
        </div>
      ))}
    </div>
  );
}
