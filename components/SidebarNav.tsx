"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShieldAlert,
  GitBranch,
  ShieldCheck,
  GitPullRequest,
  Settings,
  LogOut,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavView =
  | "command_center"
  | "repositories"
  | "incidents"
  | "verification"
  | "pull_requests"
  | "settings";

interface SidebarNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  incidentsCount?: number;
  reposCount?: number;
  prsCount?: number;
  className?: string;
}

export function SidebarNav({
  currentView,
  onSelectView,
  incidentsCount = 0,
  reposCount = 0,
  prsCount = 0,
  className,
}: SidebarNavProps) {
  const { data: session } = useSession();

  const userName =
    session?.user?.name || session?.user?.email?.split("@")[0] || "operator";
  const userEmail = session?.user?.email || "operator@patchwork.sys";

  const navItems = [
    {
      id: "command_center" as NavView,
      label: "Command Center",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "repositories" as NavView,
      label: "Repositories",
      icon: GitBranch,
      badge: reposCount > 0 ? String(reposCount) : null,
    },
    {
      id: "incidents" as NavView,
      label: "Incidents",
      icon: ShieldAlert,
      badge: incidentsCount > 0 ? String(incidentsCount) : null,
    },
    {
      id: "verification" as NavView,
      label: "Verification",
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: "pull_requests" as NavView,
      label: "Pull Requests",
      icon: GitPullRequest,
      badge: prsCount > 0 ? String(prsCount) : null,
    },
    {
      id: "settings" as NavView,
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={cn(
        "w-[200px] shrink-0 border-r border-zinc-800 bg-[#0d0f12] flex flex-col justify-between h-screen sticky top-0 z-30 font-mono text-[#c9d1d9] select-none console-scanlines",
        className
      )}
    >
      {/* Top Header: Brand Logo & Title */}
      <div className="p-3.5 space-y-5">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/50">
            <Terminal className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex flex-col font-mono">
            <span className="font-bold text-sm tracking-wider text-zinc-100 uppercase">
              PATCHWORK
            </span>
            <span className="text-[9px] text-zinc-500 tracking-widest uppercase -mt-0.5">
              sys_console
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          <div className="px-2 pb-1 text-[9px] uppercase tracking-wider text-zinc-600 font-bold">
            WORKSPACE
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-mono transition-all text-left",
                  isActive
                    ? "bg-zinc-800/90 text-emerald-400 border border-zinc-700/90 font-bold shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 border border-transparent"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      isActive ? "text-emerald-400" : "text-zinc-500"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={cn(
                      "text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold shrink-0 ml-1",
                      isActive
                        ? "bg-emerald-950 border-emerald-800 text-emerald-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-500"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Footer: User Session & Sign Out */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 font-mono space-y-2">
        <div className="flex items-center gap-2 px-1">
          <div className="w-6 h-6 rounded bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-300 font-mono text-xs font-bold shrink-0">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-zinc-200 truncate font-mono">
              {userName}
            </div>
            <div className="text-[9px] text-zinc-500 truncate font-mono">
              {userEmail}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/sign-in" })}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-[10px] font-mono text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/60 border border-rose-900/50 rounded transition-colors"
          title="Sign out of console"
        >
          <LogOut className="w-3 h-3" />
          <span>SIGN_OUT</span>
        </button>
      </div>
    </aside>
  );
}
