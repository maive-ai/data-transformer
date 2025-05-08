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
import { MoonIcon, SunIcon, UserIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function DashboardHeader() {
  const { setTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-10 w-full border-b bg-background"
      data-oid="n3po3yu"
    >
      <div
        className="container flex h-16 items-center px-4 sm:px-6 lg:px-8"
        data-oid="v4e6o7."
      >
        <Link href="/" className="flex items-center gap-2" data-oid="9bzt:_y">
          <span className="text-lg font-semibold" data-oid="hjlnplu">
            DataFlow
          </span>
        </Link>
        <nav className="ml-6 hidden md:flex gap-6" data-oid=".4rltb9">
          <Link
            href="/dashboard"
            className={`text-sm font-medium ${
              pathname === "/dashboard"
                ? "text-foreground"
                : "text-muted-foreground"
            } transition-colors hover:text-foreground`}
            data-oid="z9l7qa."
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/pipelines"
            className={`text-sm font-medium ${
              pathname.startsWith("/dashboard/pipelines")
                ? "text-foreground"
                : "text-muted-foreground"
            } transition-colors hover:text-foreground`}
            data-oid="i8akysg"
          >
            Pipelines
          </Link>
          <Link
            href="/dashboard/integrations"
            className={`text-sm font-medium ${
              pathname.startsWith("/dashboard/integrations")
                ? "text-foreground"
                : "text-muted-foreground"
            } transition-colors hover:text-foreground`}
            data-oid="7d46fmd"
          >
            Integrations
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2" data-oid="5dnqxmj">
          <DropdownMenu data-oid="5pkv9d2">
            <DropdownMenuTrigger asChild data-oid="kx9-ei5">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                data-oid="b57.pqs"
              >
                <SunIcon
                  className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
                  data-oid="a9m7xsx"
                />
                <MoonIcon
                  className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
                  data-oid="0dqij79"
                />
                <span className="sr-only" data-oid="jfmtnfj">
                  Toggle theme
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-oid="iz9hk54">
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                data-oid="tyw70d:"
              >
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                data-oid="phjf.6q"
              >
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                data-oid="zwv-ax0"
              >
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
