"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topnav from "@/components/Topnav";
import { useRouter } from "next/navigation";
import FloatingLines from "@/components/FloatingLines";
import { useTheme } from "next-themes";
import { useAuth } from "@/lib/auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { theme, systemTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!loading && !token) router.replace("/login");
  }, [loading, token, router]);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = mounted && currentTheme === 'dark';

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="spinner" />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Redirecting to loginâ€¦</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full bg-background overflow-hidden">
      {/* Floating background applied strictly when dark mode */}
      {isDark && (
        <div className="absolute inset-0 z-0 transition-opacity duration-1000 opacity-100">
          <FloatingLines
            linesGradient={{ start: "rgba(255,255,255,0)", end: "rgba(255,255,255,0.1)" }}
            topWavePosition={{ top: "10%", left: "0" }}
            middleWavePosition={{ top: "50%", left: "0" }}
          />
        </div>
      )}
      {/* Subtle overlay */}
      {isDark && <div className="absolute inset-0 z-0 bg-transparent pointer-events-none" />}

      {/* Main app relative shell */}
      <div className="relative z-10 flex h-full w-full">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isCollapsed={sidebarCollapsed} />
        
        <div className="flex flex-1 flex-col h-full overflow-hidden transition-all duration-300">
          <Topnav 
            onMenuClick={() => setSidebarOpen(true)} 
            isCollapsed={sidebarCollapsed} 
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} 
          />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
            <div className="w-full animate-in fade-in zoom-in-95 duration-300">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
