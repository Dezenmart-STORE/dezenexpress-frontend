"use client";

import Link from "next/link";
import GoogleAuthButton from "./GoogleAuthButton";
import {
  PackageIcon,
  DollarIcon,
  TruckIcon,
  BarChartIcon,
} from "@/components/Icons";

const features = [
  { Icon: PackageIcon, text: "Manage customer orders" },
  { Icon: DollarIcon, text: "Set your pricing rules" },
  { Icon: TruckIcon, text: "Update delivery status" },
  { Icon: BarChartIcon, text: "Track your performance" },
];

export default function Login() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#f0f0f0] mb-2">
          Welcome to Dezen-Express
        </h1>
        <p className="text-[13px] text-[#888] leading-relaxed">
          Sign in to access your logistics provider dashboard
        </p>
      </div>

      <div className="w-full flex flex-col gap-2.5">
        {features.map(({ Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-3 px-3 py-2.5 bg-[#111] border border-[#2a2a2a] rounded-xl"
          >
            <div className="w-7 h-7 rounded-lg bg-[#ff2d2d]/10 flex items-center justify-center shrink-0">
              <Icon size={14} color="#ff2d2d" />
            </div>
            <span className="text-[13px] text-[#aaa]">{text}</span>
          </div>
        ))}
      </div>

      <div className="w-full">
        <GoogleAuthButton label="Continue with Google" />
        <p className="text-center text-[13px] text-[#888] mt-4">
          New here?{" "}
          <Link
            href="/sign_up"
            className="text-[#ff2d2d] font-medium hover:underline underline-offset-2"
          >
            Create an account
          </Link>
        </p>
        <p className="text-center text-[11px] text-[#555] mt-3">
          By signing in you agree to our Terms and Privacy Policy
        </p>
      </div>
    </div>
  );
}
