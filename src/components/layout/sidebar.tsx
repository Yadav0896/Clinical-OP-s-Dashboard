"use client";

import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Brain,
  ScrollText,
  Settings,
  type LucideIcon,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, type NavItemId } from "@/lib/constants";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  FileCheck,
  Brain,
  ScrollText,
};

interface SidebarProps {
  activeNav: NavItemId;
  onNavChange: (id: NavItemId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ activeNav, onNavChange, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-slate-50"
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-3 border-b border-slate-200 px-4">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
          M
        </div>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col overflow-hidden"
          >
            <span className="text-sm font-bold text-slate-800">Maya PA</span>
            <span className="text-[10px] text-slate-400">Prior Auth Platform</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 scrollbar-thin">
          {NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon] || LayoutDashboard;
            const isActive = activeNav === item.id;

            const btn = (
              <button
                key={item.id}
                onClick={() => onNavChange(item.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id}>
                  <TooltipTrigger asChild>{btn}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return btn;
          })}
        </nav>
      </TooltipProvider>

      {/* Bottom section */}
      <div className="border-t border-slate-200 p-3">
        {!collapsed && (
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
            <Settings className="h-4.5 w-4.5" />
            <span>Settings</span>
          </button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="mt-1 w-full justify-center text-slate-400 hover:text-slate-600"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </motion.aside>
  );
}
