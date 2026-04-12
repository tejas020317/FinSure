"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, DollarSign, PiggyBank, FileBarChart, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/payments", label: "Loan Payments", icon: DollarSign },
  { href: "/fd", label: "Fixed Deposits", icon: PiggyBank },
  { href: "/fd-deposits", label: "FD Deposits", icon: DollarSign },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
}

export default function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <>
      {isOpen && (
        <div
          className={"fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"}
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border/50 bg-white/70 dark:bg-black/40 backdrop-blur-xl shadow-lg md:shadow-none transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[80px]" : "w-64"} flex-shrink-0`}
      >
        {/* Logo Section */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 py-5 h-16 shrink-0`}>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap flex items-center gap-3">
              <img src="/logo.png" alt="FinSure Logo" className="h-10 w-10 rounded-full object-cover dark:invert drop-shadow-sm" />
              <div className="text-2xl font-bold tracking-tight text-black dark:text-white">
                FinSure
              </div>
            </div>
          )}
          {isCollapsed && (
            <img src="/logo.png" alt="FinSure Logo" className="h-10 w-10 rounded-full object-cover dark:invert drop-shadow-sm" />
          )}
          {!isCollapsed && (
            <button onClick={onClose} className="md:hidden text-muted-foreground hover:text-foreground shrink-0">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) onClose();
                }}
                className={`flex items-center relative rounded-lg transition-all duration-200 group ${
                  isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-3"
                } text-sm font-medium ${
                  active
                    ? "bg-black/5 dark:bg-white/10 text-foreground dark:text-white shadow-sm"
                    : "text-foreground/70 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                {active && (
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-6 bg-foreground dark:bg-white rounded-r-full" />
                )}
                
                <Icon
                  className={`shrink-0 ${isCollapsed ? "h-[20px] w-[20px]" : "h-[18px] w-[18px]"} ${
                    active ? "text-foreground dark:text-white" : "text-foreground/70 dark:text-white/60 group-hover:text-foreground dark:group-hover:text-white"
                  } transition-colors`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-border/50 md:hidden shrink-0">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}