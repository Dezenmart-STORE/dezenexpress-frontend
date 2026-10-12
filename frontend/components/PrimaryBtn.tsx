export default function PrimaryBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-[#ff2d2d] text-white border-none rounded-lg py-2.5 text-sm font-semibold font-[var(--font-syne)] cursor-pointer tracking-wide hover:opacity-90 active:scale-[0.99] transition-all"
    >
      {children}
    </button>
  );
}
