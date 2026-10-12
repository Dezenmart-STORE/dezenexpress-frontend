"use client";

import SignUp from "@/components/auth/SignUp";
import AuthCard from "@/components/auth/AuthCard";

export default function AuthPage() {
  return (
    <AuthCard screen="signup">
      <SignUp />
    </AuthCard>
  );
}
