"use client";

import { ReactNode, useState, useEffect } from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import { SidebarProvider } from "@/components/dashboard/SidebarContext";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import BottomNav from "@/components/dashboard/BottomNav";
import { getProvider } from "@/lib/api";

export default function DashboardGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [providerName, setProviderName] = useState<string | undefined>();
  const [providerImage, setProviderImage] = useState<string | undefined>();

  useEffect(() => {
    const provider = getProvider();
    if (!provider || !provider.walletAddress || !provider.phone) {
      setProviderName(provider?.name);
      setProviderImage(provider?.profileImage);
      setShowOnboarding(true);
    }
  }, []);

  return (
    <SidebarProvider>
      <div className="flex lg:h-screen bg-[#0f0f0f] text-[#e0e0e0] lg:overflow-hidden font-[var(--font-dm)]">
        {/* Sidebar — desktop only */}
        <Sidebar />

        {/* Main content — add pb-16 on mobile for bottom nav */}
        <div className="flex-1 flex flex-col lg:overflow-hidden min-w-0 pb-16 lg:pb-0">
          {children}
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav />

      {/* Onboarding modal */}
      {showOnboarding && (
        <OnboardingModal
          providerName={providerName}
          providerImage={providerImage}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    </SidebarProvider>
  );
}
