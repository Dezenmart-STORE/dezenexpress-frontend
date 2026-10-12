"use client";

import { ReactNode } from "react";
import { SidebarProvider } from "./SidebarContext";
import Sidebar from "./Sidebar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-[#0f0f0f] text-[#e0e0e0] overflow-hidden font-[var(--font-dm)]">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
