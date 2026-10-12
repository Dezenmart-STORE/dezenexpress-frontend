"use client";

import Login from "@/components/auth/Login";
import AuthCard from "@/components/auth/AuthCard";

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-[#111] flex items-center justify-center p-4 md:p-6">
      <AuthCard screen="login">
        <Login />
      </AuthCard>
    </main>
  );
}
