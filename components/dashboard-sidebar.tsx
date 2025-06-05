"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Shuffle, PlusCircle, ChevronLeft, ChevronRight, Settings as SettingsIcon, FileText, Wrench } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const mainLinks: SidebarLink[] = [
  {
    title: "Builder",
    href: "/dashboard/builder",
    icon: <Wrench className="h-5 w-5" />,
  },
  {
    title: "Pipelines",
    href: "/dashboard/pipelines",
    icon: <Shuffle className="h-5 w-5" data-oid="7apae41" />,
  },
  {
    title: "Pages",
    href: "/dashboard/pages",
    icon: <FileText className="h-5 w-5" />,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the main logo for now - we can add theme switching later
  const logoSrc = "/maive_main_logo.png";

  // Helper to determine if Builder should be active
  const isBuilderActive =
    pathname === "/dashboard/builder" ||
    pathname === "/dashboard/pipelines/new" ||
    /^\/dashboard\/pipelines\/[\w-]+$/.test(pathname);

  // Determine active states for each top-level link
  const isPipelinesActive = pathname.startsWith("/dashboard/pipelines") && !isBuilderActive;
  const isPagesActive = pathname.startsWith("/dashboard/pages");

  const getIsActive = (title: string) => {
    switch (title) {
      case "Pipelines":
        return isPipelinesActive;
      case "Pages":
        return isPagesActive;
      case "Builder":
        return isBuilderActive;
      default:
        return pathname === "/dashboard";
    }
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <>
      <aside
        className={cn(
          "hidden md:block relative bg-sidebar transition-all duration-200",
          collapsed ? 'w-20' : 'w-fit'
        )}
        data-oid="5hcjuqs"
      >
        <div className="flex flex-col items-center pt-4 pb-2" style={{ minHeight: '64px', justifyContent: 'center' }}>
          {collapsed ? (
            <img
              src="/maive_light_avatar.png"
              alt="Maive Logo Collapsed"
              className="w-12 h-12 mb-4 rounded-lg"
            />
          ) : (
            <img
              src={logoSrc}
              alt="Maive Logo"
              className="w-32 mb-4"
              data-oid="nra7ryn"
            />
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] py-6" data-oid="0l.n27i">
          <div className="px-4" data-oid="qp1kobx">
            <div className="space-y-6" data-oid="rb293g9">
              <nav className="flex flex-col space-y-1" data-oid=".a1jnvk">
                {mainLinks.map((link) => {
                  const isActive = getIsActive(link.title);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-[hsl(var(--sidebar-active))] text-sidebar-foreground rounded-md font-semibold shadow-sm"
                          : "text-sidebar-foreground hover:bg-black/5 hover:text-foreground rounded-md",
                        collapsed && 'justify-center px-2'
                      )}
                      data-oid="wfdp29x"
                    >
                      {link.icon}
                      {!collapsed && link.title}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </ScrollArea>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute bottom-16 right-0 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-background shadow-lg border border-border flex items-center justify-center transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>
    </>
  );
}
