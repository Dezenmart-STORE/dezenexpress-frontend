"use client";

import Label from "../Label";
import Input from "../Input";
import PrimaryBtn from "../PrimaryBtn";
import SocialLogin from "../SocialLogin";
import { useRouter } from "next/navigation";

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

export default function ForgotPasswordScreen({ onBack, onSubmit }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col flex-1">
      <button
        onClick={() => router.push("/login")}
        className="text-[12.5px] text-[#888] bg-transparent border-none cursor-pointer text-left mb-2 hover:text-[#ff2d2d] transition-colors w-fit"
      >
        ← Back to login
      </button>

      <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#f0f0f0] mb-1 mt-2">
        Forgot your password?
      </h1>
      <p className="text-[12.5px] text-[#888] mb-5 leading-relaxed">
        Don&apos;t worry, happens to all of us. Enter your email below to
        recover your password
      </p>

      <Label text="Email" />
      <Input placeholder="john.doe@gmail.com" type="email" />

      <div className="mt-5">
        <PrimaryBtn onClick={onSubmit}>Submit</PrimaryBtn>
      </div>

      <SocialLogin label="in" />
    </div>
  );
}
