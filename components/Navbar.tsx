"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Terminal,
  ChevronDown,
  LayoutDashboard,
  Settings,
  BellRing,
  GitBranch,
  ShieldCheck,
  LogOut,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [selectedRepo, setSelectedRepo] = useState("All Repositories");
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "operator";
  const userEmail = session?.user?.email || "operator@patchwork.sys";
  const userImage = session?.user?.image;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-[#08090a]/95 backdrop-blur-md font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Workspace Scope */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded bg-emerald-950/80 border border-emerald-700/80 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:border-emerald-500 transition-colors">
              <Terminal className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex flex-col font-mono">
              <span className="font-bold text-sm tracking-wider text-zinc-100 uppercase">
                PATCHWORK
              </span>
              <span className="text-[9px] text-zinc-500 font-mono tracking-widest uppercase -mt-0.5">
                sys_console v2.4
              </span>
            </div>
          </Link>

          {/* Repo Selector Dropdown */}
          <div className="relative font-mono">
            <button
              onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1 rounded border border-zinc-800 bg-[#0d0f12] hover:bg-zinc-800/80 text-xs font-mono text-zinc-300 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
              <span className="max-w-[150px] sm:max-w-[200px] truncate text-[11px]">
                {selectedRepo}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500" />
            </button>

            {repoDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-lg border border-zinc-800 bg-[#0d0f12] shadow-2xl py-1 z-50 font-mono">
                <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800">
                  Select Scope
                </div>
                <button
                  onClick={() => {
                    setSelectedRepo("All Repositories");
                    setRepoDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-1.5 text-xs font-mono flex items-center justify-between hover:bg-zinc-800 transition-colors",
                    selectedRepo === "All Repositories"
                      ? "text-emerald-400 bg-emerald-950/40 font-semibold"
                      : "text-zinc-300"
                  )}
                >
                  <span>All Repositories</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Nav Links */}
        <nav className="hidden md:flex items-center gap-1 font-mono">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all",
              pathname === "/dashboard" || pathname.startsWith("/incidents")
                ? "bg-zinc-800/80 text-emerald-400 border border-zinc-700/80 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all",
              pathname === "/settings"
                ? "bg-zinc-800/80 text-emerald-400 border border-zinc-700/80 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            )}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3 font-mono">
          <button
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-[#0d0f12] hover:bg-zinc-800 rounded border border-zinc-800 relative transition-colors"
            title="System Alerts"
          >
            <BellRing className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          {/* User Profile */}
          <div className="relative font-mono">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1 rounded border border-zinc-800 bg-[#0d0f12] hover:bg-zinc-800 transition-colors"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-6 h-6 rounded object-cover border border-zinc-700"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-emerald-950 border border-emerald-700 flex items-center justify-center text-emerald-300 font-mono text-[10px] font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-mono text-zinc-300 hidden sm:inline pr-1">
                {userName}
              </span>
              <ChevronDown className="w-3 h-3 text-zinc-500 pr-1 hidden sm:inline" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-zinc-800 bg-[#0d0f12] shadow-2xl py-2 z-50 font-mono">
                <div className="px-4 py-2 border-b border-zinc-800 font-mono">
                  <p className="text-xs font-semibold text-zinc-200 font-mono">
                    {userName}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate font-mono">
                    {userEmail}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[9px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono uppercase">
                    <ShieldCheck className="w-3 h-3" /> sys_authenticated
                  </span>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 font-mono"
                >
                  <Settings className="w-3.5 h-3.5 text-zinc-400" />
                  Account Settings
                </Link>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    signOut({ callbackUrl: "/sign-in" });
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 border-t border-zinc-800 mt-1 font-mono"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

