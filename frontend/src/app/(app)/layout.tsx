"use client";
import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Topnav from "@/components/Topnav";
import { usePathname } from "next/navigation";
import FloatingLines from "@/components/FloatingLines";
import { useTheme } from "next-themes";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const { theme, systemTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = mounted && currentTheme === 'dark';

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