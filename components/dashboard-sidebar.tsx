"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Shuffle, PlusCircle, ChevronLeft, ChevronRight, Settings as SettingsIcon } from "lucide-react";
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
    title: "Pipelines",
    href: "/dashboard/pipelines",
    icon: <Shuffle className="h-5 w-5" data-oid="7apae41" />,
  },
];

const secondaryLinks: SidebarLink[] = [
  {
    title: "Settings",
    href: "#",
    icon: <SettingsIcon className="h-5 w-5" data-oid="settings-gear" />,
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Load system prompt from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem('globalSystemPrompt');
    if (savedPrompt) setSystemPrompt(savedPrompt);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('globalSystemPrompt', systemPrompt);
    toast({
      title: "System Prompt Saved",
      description: "Your global system prompt has been updated and will be used for all workflows.",
    });
    setIsSettingsOpen(false);
  };

  return (
    <>
      <aside
        className={`hidden border-r md:block relative ${collapsed ? 'w-20' : 'w-fit'}`}
        style={{ backgroundColor: "#FFF9EF", transition: 'width 0.2s' }}
        data-oid="5hcjuqs"
      >
        <div className="flex flex-col items-center pt-8 pb-2">
          {collapsed ? (
            <img
              src="/maive_light_avatar.png"
              alt="Maive Logo"
              className="w-8 mb-4"
              data-oid="nra7ryn"
            />
          ) : (
            <img
              src="/maive_main_logo.png"
              alt="Maive Logo"
              className="w-32 mb-10"
              data-oid="nra7ryn"
            />
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] py-6" data-oid="0l.n27i">
          <div className="px-4" data-oid="qp1kobx">
            <div className="mb-6" data-oid="c9yvzi9">
              <Link href="/dashboard/pipelines/new" data-oid="v.-1gu:">
                <Button className="w-full justify-start gap-2" data-oid="ux58-jr">
                  <PlusCircle className="h-4 w-4" data-oid="8uibz_a" />
                  {!collapsed && 'New Pipeline'}
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
                      collapsed && 'justify-center px-2'
                    )}
                    data-oid="wfdp29x"
                  >
                    {link.icon}
                    {!collapsed && link.title}
                  </Link>
                ))}
                {secondaryLinks.map((link) => (
                  <button
                    key={link.title}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium w-full text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      collapsed && 'justify-center px-2'
                    )}
                    style={{ outline: 'none', border: 'none', background: 'none' }}
                    tabIndex={0}
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    data-oid="settings-menu"
                  >
                    {link.icon}
                    {!collapsed && link.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </ScrollArea>
        <button
          aria-label="Toggle sidebar"
          onClick={() => setCollapsed((c) => !c)}
          className="absolute bottom-16 right-0 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-md border flex items-center justify-center transition-colors hover:bg-gray-100"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
          }}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </aside>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>System Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Textarea
                id="system-prompt"
                placeholder="Enter your system prompt..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
