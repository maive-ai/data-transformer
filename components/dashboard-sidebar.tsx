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
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load system prompt from file on mount
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        const response = await fetch('/api/pipelines/system-prompt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Fetched system prompt:', data); // Debug log
        if (data.systemPrompt) {
          setSystemPrompt(data.systemPrompt);
        } else {
          console.warn('No system prompt found in response');
        }
      } catch (error) {
        console.error('Failed to fetch system prompt:', error);
        toast({
          title: "Error",
          description: "Failed to load system prompt. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchSystemPrompt();
  }, []);

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/pipelines/system-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ systemPrompt }),
      });
      
      if (!response.ok) throw new Error('Failed to save system prompt');
      
      toast({
        title: "System Prompt Saved",
        description: "Your global system prompt has been updated and will be used for all workflows.",
      });
      setIsSettingsOpen(false);
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save system prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Use the main logo for now - we can add theme switching later
  const logoSrc = "/maive_main_logo.png";

  if (!mounted) {
    return null; // Avoid hydration mismatch
  }

  return (
    <>
      <aside
        className={cn(
          "hidden border-r md:block relative bg-sidebar border-sidebar-border transition-all duration-200",
          collapsed ? 'w-20' : 'w-fit'
        )}
        data-oid="5hcjuqs"
      >
        <div className="flex flex-col items-center pt-8 pb-2">
          {collapsed ? (
            <div className="w-8 h-8 mb-4 rounded-lg bg-gradient-to-br from-maive-orange to-maive-yellow flex items-center justify-center">
              <span className="text-maive-darker-gray font-bold text-lg">M</span>
            </div>
          ) : (
            <img
              src={logoSrc}
              alt="Maive Logo"
              className="w-32 mb-10"
              data-oid="nra7ryn"
            />
          )}
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] py-6" data-oid="0l.n27i">
          <div className="px-4" data-oid="qp1kobx">
            <div className="space-y-6" data-oid="rb293g9">
              <nav className="flex flex-col space-y-1" data-oid=".a1jnvk">
                {mainLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                      pathname === link.href ||
                        (link.href !== "/dashboard" &&
                          pathname.startsWith(link.href))
                        ? "bg-black/5 text-foreground rounded-md"
                        : "text-sidebar-foreground hover:bg-black/5 hover:text-foreground rounded-md",
                      collapsed && 'justify-center px-2'
                    )}
                    style={{ background: 'transparent', boxShadow: 'none', border: 'none' }}
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
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium w-full text-sidebar-foreground hover:bg-black/5 hover:text-foreground rounded-md transition-colors",
                      collapsed && 'justify-center px-2'
                    )}
                    style={{ outline: 'none', border: 'none', background: 'transparent' }}
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
          className="absolute bottom-16 right-0 translate-x-1/2 z-10 w-10 h-10 rounded-full bg-background shadow-lg border border-border flex items-center justify-center transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:scale-105"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </aside>

      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold maive-text-gradient">System Prompt</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Configure a global system prompt that will be applied to all AI operations in your pipelines.
              </p>
              <Textarea
                id="system-prompt"
                placeholder="Enter your system prompt..."
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="min-h-[200px] focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveSettings} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
