"use client";

const stats = [
  {
    icon: "🚚",
    label: "Total Deliveries",
    value: "120,347",
    change: "28.4%",
    up: true,
    color: "text-[#f0f0f0]",
  },
  {
    icon: "📦",
    label: "Pending Deliveries",
    value: "23.6K",
    change: "5.2%",
    up: false,
    color: "text-[#f59e0b]",
  },
  {
    icon: "✅",
    label: "Completed Deliveries",
    value: "756",
    change: "3.1%",
    up: true,
    color: "text-[#f0f0f0]",
  },
  {
    icon: "💵",
    label: "Earnings Summary",
    value: "30",
    change: "11.3%",
    up: true,
    color: "text-[#f0f0f0]",
  },
];

export default function StarsC() {
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="bg-[#1a1a1a] border border-[#222] rounded-2xl p-4 hover:border-[#333] transition-colors"
        >
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs text-[#777] flex items-center gap-1.5">
              <span>{s.icon}</span>
              {s.label}
            </span>
            <span className="text-[#444] text-base cursor-pointer">···</span>
          </div>
          <div
            className={`font-[var(--font-syne)] font-bold text-[28px] flex items-center gap-2.5 ${s.color}`}
          >
            {s.value}
            <span
              className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 flex items-center gap-1
              ${s.up ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
            >
              {s.up ? "↑" : "↓"} {s.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
