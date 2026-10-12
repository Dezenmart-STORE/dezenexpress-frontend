import { Screen } from "./Types";

const map: Record<Screen, { emoji: string; bg: string; caption: string }> = {
  login: {
    emoji: "🔐",
    bg: "linear-gradient(135deg,#f0f4ff,#e8ecff)",
    caption: "Secure access to your account",
  },
  signup: {
    emoji: "📱",
    bg: "linear-gradient(135deg,#fff4f0,#ffe8e8)",
    caption: "Create your account in seconds",
  },
  forgot: {
    emoji: "🔏",
    bg: "linear-gradient(135deg,#f0f8ff,#e0eeff)",
    caption: "We'll help you get back in",
  },
  verify: {
    emoji: "✅",
    bg: "linear-gradient(135deg,#f0fff4,#e0f5e8)",
    caption: "Confirm your identity",
  },
  "set-password": {
    emoji: "🔑",
    bg: "linear-gradient(135deg,#f8f0ff,#ede0ff)",
    caption: "Choose a strong new password",
  },
};

const allScreens: Screen[] = [
  "login",
  "signup",
  "forgot",
  "verify",
  "set-password",
];

export default function IllustrationPanel({ screen }: { screen: Screen }) {
  const { emoji, bg, caption } = map[screen];
  return (
    <div
      style={{ background: bg }}
      className="w-full h-full flex flex-col items-center justify-center p-6 rounded-2xl m-3"
    >
      <div className="text-[88px] mb-4 drop-shadow-xl">{emoji}</div>
      <div className="flex gap-1.5 mb-3">
        {allScreens.map((sc) => (
          <div
            key={sc}
            style={{
              width: sc === screen ? 18 : 6,
              background: sc === screen ? "#ff2d2d" : "#ccc",
              opacity: sc === screen ? 1 : 0.35,
            }}
            className="h-1.5 rounded-full transition-all duration-200"
          />
        ))}
      </div>
      <p className="text-xs text-[#666] text-center">{caption}</p>
    </div>
  );
}
