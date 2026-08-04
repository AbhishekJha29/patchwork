"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Sparkles,
  ChevronDown,
  LayoutDashboard,
  Settings,
  BellRing,
  GitBranch,
  ShieldCheck,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [selectedRepo, setSelectedRepo] = useState("All Repositories");
  const [repoDropdownOpen, setRepoDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userEmail = session?.user?.email || "user@example.com";
  const userImage = session?.user?.image;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#090d16]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Workspace Scope */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                PATCHWORK
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase -mt-1">
                AI Incident Engine
              </span>
            </div>
          </Link>

          {/* Repo Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setRepoDropdownOpen(!repoDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 text-xs font-mono text-slate-300 transition-colors"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[150px] sm:max-w-[200px] truncate">
                {selectedRepo}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {repoDropdownOpen && (
              <div className="absolute left-0 mt-2 w-64 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-1 z-50">
                <div className="px-3 py-2 text-[10px] font-mono uppercase text-slate-500 border-b border-slate-800">
                  Select Scope
                </div>
                <button
                  onClick={() => {
                    setSelectedRepo("All Repositories");
                    setRepoDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs font-mono flex items-center justify-between hover:bg-slate-800 transition-colors",
                    selectedRepo === "All Repositories"
                      ? "text-cyan-400 bg-cyan-950/20 font-semibold"
                      : "text-slate-300"
                  )}
                >
                  <span>All Repositories</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Main Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              pathname === "/dashboard" || pathname.startsWith("/incidents")
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all",
              pathname === "/settings"
                ? "bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Right: Notifications & User Profile */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 relative transition-colors"
            title="Notifications"
          >
            <BellRing className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400" />
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full border border-slate-800 bg-slate-900 hover:bg-slate-800 transition-colors"
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt={userName}
                  className="w-7 h-7 rounded-full object-cover border border-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-300 font-mono text-xs font-bold">
                  {userName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-slate-300 hidden sm:inline pr-1">
                {userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 pr-1 hidden sm:inline" />
            </button>

            {userDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-200">
                    {userName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {userEmail}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded font-mono">
                    <ShieldCheck className="w-3 h-3" /> Authenticated
                  </span>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setUserDropdownOpen(false)}
                  className="w-full text-left px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  Account Settings
                </Link>
                <button
                  onClick={() => {
                    setUserDropdownOpen(false);
                    signOut({ callbackUrl: "/sign-in" });
                  }}
                  className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 border-t border-slate-800/60 mt-1"
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
