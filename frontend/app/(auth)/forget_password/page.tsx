"use client";

import AuthCard from "@/components/auth/AuthCard";
import ForgetPassword from "@/components/auth/ForgetPassword";

export default function AuthPage() {
  return (
    <AuthCard screen="forgot">
      <ForgetPassword
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
