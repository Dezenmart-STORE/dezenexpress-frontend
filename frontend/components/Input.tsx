export default function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`input-field w-full bg-[#111] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-[#e0e0e0] mb-3 font-[var(--font-dm)] transition-colors ${className}`}
    />
  );
}
