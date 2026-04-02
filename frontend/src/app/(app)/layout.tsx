"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import Topnav from "@/components/Topnav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !token) router.push("/login");
  }, [loading, token, router]);

  if (loading || !token) {
    return (
      <div className={"flex min-h-screen items-center justify-center"}>
        <div className={"spinner"} />
      </div>
    );
  }

  return (
    <div className={"flex flex-row h-screen w-screen overflow-hidden bg-[var(--content-bg)] text-[var(--text-primary)] transition-colors"}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        isCollapsed={isSidebarCollapsed}
      />

      <div className={"flex flex-col flex-1 min-w-0 transition-all"}>
        <Topnav 
          onMenuClick={() => setIsSidebarOpen(true)} 
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          isCollapsed={isSidebarCollapsed}
        />

        <main className={"flex-1 overflow-y-auto p-6 md:p-8"}>
          {children}
        </main>
      </div>
    </div>
  );
}
