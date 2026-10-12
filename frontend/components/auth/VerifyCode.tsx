"use client";

import { useState } from "react";

import Label from "../Label";
import Input from "../Input";
import PrimaryBtn from "../PrimaryBtn";

interface Props {
  onBack: () => void;
  onSubmit: () => void;
}

export default function VerifyCodeScreen({ onBack, onSubmit }: Props) {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col flex-1">
      <button
        onClick={onBack}
        className="text-[12.5px] text-[#888] bg-transparent border-none cursor-pointer text-left mb-2 hover:text-[#ff2d2d] transition-colors w-fit"
      >
        ← Back to login
      </button>

      <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#f0f0f0] mb-1 mt-2">
        Verify code
      </h1>
      <p className="text-[12.5px] text-[#888] mb-5 leading-relaxed">
        An activation code has been sent to your email
      </p>

      <Label text="Enter Code" />
      <Input
        placeholder="T280MX"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        maxLength={8}
        className="text-[22px] tracking-[0.35em] font-[var(--font-syne)]"
      />

      <p className="text-xs text-[#888] mb-4">
        Didn&apos;t receive a code?{" "}
        <span className="text-[#ff2d2d] cursor-pointer hover:opacity-75 transition-opacity">
          Resend
        </span>
      </p>

      <PrimaryBtn onClick={onSubmit}>Verify</PrimaryBtn>
    </div>
  );
}
