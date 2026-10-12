"use client";

import Label from "../Label";
import Input from "../Input";
import PrimaryBtn from "../PrimaryBtn";

interface Props {
  onBack: () => void;
  onDone: () => void;
}

export default function SetPasswordScreen({ onBack, onDone }: Props) {
  return (
    <div className="flex flex-col flex-1">
      <button
        onClick={onBack}
        className="text-[12.5px] text-[#888] bg-transparent border-none cursor-pointer text-left mb-2 hover:text-[#ff2d2d] transition-colors w-fit"
      >
        ← Back to login
      </button>

      <h1 className="font-[var(--font-syne)] font-bold text-2xl text-[#f0f0f0] mb-1 mt-2">
        Set a password
      </h1>
      <p className="text-[12.5px] text-[#888] mb-5 leading-relaxed">
        Your previous password has been reset. Please set a new password for
        your account
      </p>

      <Label text="Create Password" />
      <Input placeholder="••••••••••••" type="password" />

      <Label text="Re-enter Password" />
      <Input placeholder="••••••••••••" type="password" />

      <div className="mt-5">
        <PrimaryBtn onClick={onDone}>Set password</PrimaryBtn>
      </div>
    </div>
  );
}
