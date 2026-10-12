"use client";

import VerifyCode from "@/components/auth/VerifyCode";
import AuthCard from "@/components/auth/AuthCard";

export default function AuthPage() {
  return (
    <AuthCard screen="verify">
      <VerifyCode
        onBack={function (): void {
          throw new Error("Function not implemented.");
        }}
        onSubmit={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
    </AuthCard>
  );
}
