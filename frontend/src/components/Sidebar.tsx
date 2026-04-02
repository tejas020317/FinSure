"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, DollarSign, PiggyBank, FileBarChart, X, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/loans", label: "Loans", icon: CreditCard },
  { href: "/payments", label: "Payments", icon: DollarSign },
  { href: "/fd", label: "Fixed Deposits", icon: PiggyBank },
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
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className={"fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"}
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[var(--border)] bg-[var(--sidebar-bg)] shadow-md transition-all duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[70px]" : "w-64"} flex-shrink-0`}
      >
        {/* Logo Section */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-6 py-5 h-16 shrink-0`}>
          {!isCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-xl font-bold leading-tight text-[var(--accent)] dark:text-[var(--accent-light)]">
                BankLoan
              </div>
              <div className="mt-1 text-xs text-[var(--text-muted)]">
                Loan & Deposit Manager
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="text-xl font-bold leading-tight text-[var(--accent)] dark:text-[var(--accent-light)]">
              B
            </div>
          )}
          <button onClick={onClose} className="md:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-[var(--border)] shrink-0" />

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2 p-4 overflow-y-auto mt-2">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (typeof window !== "undefined" && window.innerWidth < 768) onClose();
                }}
                className={`flex items-center rounded-xl transition-all duration-200 group ${
                  isCollapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3"
                } text-sm font-medium ${
                  active
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--text-primary)]"
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`shrink-0 ${isCollapsed ? "h-6 w-6" : "h-5 w-5"} ${
                    active ? "opacity-100" : "opacity-75 group-hover:opacity-100"
                  } transition-opacity duration-200`}
                />
                {!isCollapsed && (
                  <span className="truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Logout */}
        <div className="p-4 border-t border-[var(--border)] md:hidden shrink-0">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="h-5 w-5 opacity-80 shrink-0" />
            {!isCollapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
