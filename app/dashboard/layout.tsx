import type React from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col" data-oid="7gqs7zx">
      <div className="flex flex-1" data-oid="-3vbfon">
        <DashboardSidebar data-oid="fj6mxwg" />
        <main className="flex-1 p-4 md:p-6" data-oid="0l9i6sn">
          {children}
        </main>
      </div>
    </div>
  );
}
