"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserIcon, Settings as SettingsIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useState, useEffect } from "react";

export function DashboardHeader() {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");

  // Load system prompt from file on mount
  useEffect(() => {
    const fetchSystemPrompt = async () => {
      try {
        const response = await fetch('/api/pipelines/system-prompt');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.systemPrompt) {
          setSystemPrompt(data.systemPrompt);
        }
      } catch (error) {
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
      toast({
        title: "Error",
        description: "Failed to save system prompt. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <header
      className="sticky top-0 z-20 w-full bg-[hsl(var(--sidebar-background))]"
      style={{ borderBottom: 'none' }}
      data-oid="n3po3yu"
    >
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
      <div className="flex h-16 items-center px-0" data-oid="v4e6o7.">
        <div className="ml-auto flex items-center gap-2 pr-6" data-oid="5dnqxmj">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label="Settings"
            onClick={() => setIsSettingsOpen(true)}
            data-oid="settings-header"
          >
            <SettingsIcon className="h-5 w-5" />
          </Button>
          <DropdownMenu data-oid="ohx1si5">
            <DropdownMenuTrigger asChild data-oid="ush-rdl">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                data-oid="pm:0u9r"
              >
                <UserIcon className="h-5 w-5" data-oid="-dow5l5" />
                <span className="sr-only" data-oid="a8bczpw">
                  User menu
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-oid="73.pi5_">
              <DropdownMenuLabel data-oid="684avqo">
                My Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator data-oid="keysc8j" />
              <DropdownMenuItem data-oid="l5d54f:">Profile</DropdownMenuItem>
              <DropdownMenuItem data-oid="0a4f4:c">Settings</DropdownMenuItem>
              <DropdownMenuSeparator data-oid="x6ssa62" />
              <DropdownMenuItem data-oid="axnfrl6">Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
