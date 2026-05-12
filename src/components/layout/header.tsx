"use client";

import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { STAGE_LABELS, type NavItemId } from "@/lib/constants";

interface HeaderProps {
  activeNav: NavItemId;
}

const PAGE_TITLES: Record<NavItemId, string> = {
  overview: "Overview",
  patients: "Patients",
  submissions: "Auth & Assist",
  "ai-tools": "AI Intelligence",
  audit: "Audit Trail",
};

const PAGE_SUBTITLES: Record<NavItemId, string> = {
  overview: "Dashboard with real-time metrics",
  patients: "Patient records and management",
  submissions: "PA submission workspace",
  "ai-tools": "AI-powered authorization tools",
  audit: "System activity logs",
};

export function Header({ activeNav }: HeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div>
        <h1 className="text-base font-bold text-slate-800">
          {PAGE_TITLES[activeNav]}
        </h1>
        <p className="text-xs text-slate-400">{PAGE_SUBTITLES[activeNav]}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-700">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            3
          </span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-slate-600 hover:text-slate-800">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                SA
              </div>
              <span className="hidden text-sm font-medium md:inline">Admin</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Maya Admin</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
