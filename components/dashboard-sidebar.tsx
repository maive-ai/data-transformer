"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileText, PlusCircle } from "lucide-react";

interface SidebarLink {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const mainLinks: SidebarLink[] = [
  {
    title: "Pipelines",
    href: "/dashboard/pipelines",
    icon: <FileText className="h-5 w-5" data-oid="7apae41" />,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden border-r md:block w-fit"
      style={{ backgroundColor: "#0E1317" }}
      data-oid="5hcjuqs"
    >
      <ScrollArea className="h-[calc(100vh-4rem)] py-6" data-oid="0l.n27i">
        <div className="px-4" data-oid="qp1kobx">
          <div
            className="flex flex-col items-center mb-8"
            data-oid="sidebar-logo-header"
          >
            <img
              src="/maive_main_logo.png"
              alt="Maive Logo"
              className="w-40 mb-6"
              data-oid="nra7ryn"
            />
          </div>
          <div className="mb-6" data-oid="c9yvzi9">
            <Link href="/dashboard/pipelines/new" data-oid="v.-1gu:">
              <Button className="w-full justify-start gap-2" data-oid="ux58-jr">
                <PlusCircle className="h-4 w-4" data-oid="8uibz_a" />
                New Pipeline
              </Button>
            </Link>
          </div>
          <div className="space-y-6" data-oid="rb293g9">
            <nav className="flex flex-col space-y-1" data-oid=".a1jnvk">
              {mainLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                    pathname === link.href ||
                      (link.href !== "/dashboard" &&
                        pathname.startsWith(link.href))
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                  data-oid="wfdp29x"
                >
                  {link.icon}
                  {link.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </ScrollArea>
    </aside>
  );
}
