"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, LogOut, Menu, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface TopnavProps {
  onMenuClick: () => void;
  onToggleCollapse: () => void;
  isCollapsed: boolean;
}

export default function Topnav({ onMenuClick, onToggleCollapse, isCollapsed }: TopnavProps) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--border)] bg-[var(--card-bg)] px-4 shadow-sm md:px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] md:hidden transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Collapse toggle (Desktop only) */}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex rounded-md p-2 text-[var(--text-primary)] hover:bg-[var(--sidebar-hover)] transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
        </button>

        <h1 className="text-xl font-bold tracking-tight text-[var(--text-primary)] md:hidden">
          BankLoan
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--content-bg)] text-[var(--text-primary)] hover:opacity-80 transition-opacity"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="flex items-center gap-3 border-l border-[var(--border)] pl-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name || "User"}</p>
            <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role || "Officer"}</p>
          </div>
          <button
            onClick={logout}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
            title="Log Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}