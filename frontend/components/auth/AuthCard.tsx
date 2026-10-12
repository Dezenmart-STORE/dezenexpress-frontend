import { ReactNode } from "react";
import Logo from "../Logo";
import IllustrationPanel from "../IllustrationPanel";
import { Screen } from "../Types";

interface AuthCardProps {
  screen: Screen;
  children: ReactNode;
}

export default function AuthCard({ screen, children }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-[860px] bg-[#1a1a1a] rounded-[20px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.6)] border border-white/[0.06] fade-in">
      {/* Left Panel */}
      <div className="flex-1 min-w-0 p-8 md:px-9 md:py-8 flex flex-col">
        <Logo />
        {children}
      </div>

      {/* Right Panel — hidden below md (768px) */}
      <div className="hidden md:flex w-[280px] shrink-0 bg-[#141414] items-center justify-center p-3">
        <IllustrationPanel screen={screen} />
      </div>
    </div>
  );
}
