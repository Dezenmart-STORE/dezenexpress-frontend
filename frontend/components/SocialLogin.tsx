interface SocialLoginProps {
  label?: string;
}

export default function SocialLogin({ label = "in" }: SocialLoginProps) {
  return (
    <>
      <div className="flex items-center gap-2.5 my-4">
        <div className="flex-1 h-px bg-[#2a2a2a]" />
        <span className="text-[11px] text-[#555] whitespace-nowrap">
          Or sign {label} with
        </span>
        <div className="flex-1 h-px bg-[#2a2a2a]" />
      </div>
      <div className="flex gap-2.5 justify-center">
        {[
          { i: "f", c: "#1877f2" },
          { i: "G", c: "#ea4335" },
          { i: "🍎", c: "#fff" },
        ].map((p, i) => (
          <button
            key={i}
            className="flex-1 bg-white/[0.03] border border-[#2a2a2a] rounded-lg py-2 flex items-center justify-center cursor-pointer hover:bg-white/[0.06] hover:border-white/20 transition-all"
          >
            <span style={{ color: p.c }} className="text-sm font-bold">
              {p.i}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
