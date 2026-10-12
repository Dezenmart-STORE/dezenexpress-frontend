"use client";

import SetPassword from "@/components/auth/SetPassword";
import AuthCard from "@/components/auth/AuthCard";

export default function AuthPage() {
  return (
    <AuthCard screen="set-password">
      <SetPassword
        onBack={function (): void {
          throw new Error("Function not implemented.");
        }}
        onDone={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
    </AuthCard>
  );
}
