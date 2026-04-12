
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LogIn, Eye, EyeOff } from "lucide-react";
import FloatingLines from "@/components/FloatingLines";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading } = useAuth();
  const { theme, setTheme, systemTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = theme === 'system' ? systemTheme : theme;
  const isDark = mounted && currentTheme === 'dark';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center transition-colors duration-500 overflow-hidden bg-background">
      {/* Light mode gradient background */}
      {!isDark && (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-indigo-100 pointer-events-none transition-opacity duration-1000 opacity-100" />
      )}

      {/* Dark mode FloatingLines background */}
      {isDark && (
        <div className="absolute inset-0 z-0 transition-opacity duration-1000 opacity-100">
          <FloatingLines
            linesGradient={{ start: "rgba(255,255,255,0)", end: "rgba(255,255,255,0.1)" }}
            topWavePosition={{ top: "10%", left: "0" }}
            middleWavePosition={{ top: "50%", left: "0" }}
          />
        </div>
      )}
      {isDark && <div className="absolute inset-0 z-0 bg-transparent pointer-events-none" />}

      {/* Theme Toggle */}
      <button 
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="absolute top-6 right-6 z-20 p-2 rounded-full bg-card/60 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-transform"
      >
        {isDark ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
      </button>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 card shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500 rounded-3xl mx-4">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="mb-4">
            <img src="/logo.png" alt="FinSure Logo" className="h-24 w-24 rounded-full object-cover dark:invert drop-shadow-md" />
          </div>
          <h1 className="text-4xl font-bold text-black dark:text-white pb-1">
            FinSure
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Core Banking Portal</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Username</label>
            <input
              type="text"
              required
              className="input transition-colors hover:border-primary/50 focus:bg-background h-12"
              placeholder="e.g. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input transition-colors hover:border-primary/50 focus:bg-background h-12 pr-10"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary h-12 w-full mt-4 font-semibold text-base shadow-lg shadow-primary/30"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
