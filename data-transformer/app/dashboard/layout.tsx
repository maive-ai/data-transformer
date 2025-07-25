import type React from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-row" data-oid="7gqs7zx">
      <DashboardSidebar data-oid="fj6mxwg" />
      <div className="flex flex-col flex-1 min-h-screen" data-oid="main-col">
        <DashboardHeader />
        <main className="flex-1 p-4 md:p-6" data-oid="0l9i6sn">
          {children}
        </main>
      </div>
    </div>
  );
}
