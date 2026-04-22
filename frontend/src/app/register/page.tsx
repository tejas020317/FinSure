"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Eye, EyeOff, Moon, Sun, UserPlus } from "lucide-react";
import FloatingLines from "@/components/FloatingLines";
import { toast } from "@/components/Toast";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, token } = useAuth();
  const { theme, setTheme, systemTheme } = useTheme();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "officer">("officer");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = mounted && currentTheme === "dark";

  useEffect(() => {
    if (!loading && token) router.replace("/dashboard");
  }, [loading, token, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast("Passwords do not match", "error");
      return;
    }

    try {
      await register(name, email, password, role);
      toast("Account created");
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Registration failed", "error");
    }
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
            linesGradient={{
              start: "rgba(255,255,255,0)",
              end: "rgba(255,255,255,0.1)",
            }}
            topWavePosition={{ top: "10%", left: "0" }}
            middleWavePosition={{ top: "50%", left: "0" }}
          />
        </div>
      )}
      {isDark && <div className="absolute inset-0 z-0 bg-transparent pointer-events-none" />}

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="absolute top-6 right-6 z-20 p-2 rounded-full bg-card/60 backdrop-blur-sm border border-border shadow-sm hover:scale-110 transition-transform"
      >
        {isDark ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-600" />
        )}
      </button>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 card shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-500 rounded-3xl mx-4">
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="mb-4">
            <img
              src="/logo.png"
              alt="FinSure Logo"
              className="h-24 w-24 rounded-full object-cover dark:invert drop-shadow-md"
            />
          </div>
          <h1 className="text-3xl font-bold text-black dark:text-white pb-1">
            Create Account
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            FinSure â€” Core Banking Portal
          </p>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Name</label>
            <input
              type="text"
              required
              className="input transition-colors hover:border-primary/50 focus:bg-background h-12"
              placeholder="e.g. Riya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Email</label>
            <input
              type="email"
              required
              className="input transition-colors hover:border-primary/50 focus:bg-background h-12"
              placeholder="e.g. admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Role</label>
            <div className="relative">
              <select
                className="input transition-colors hover:border-primary/50 focus:bg-background h-12"
                value={role}
                onChange={(e) => setRole(e.target.value as "admin" | "officer")}
              >
                <option value="officer">Officer</option>
                <option value="admin">Admin</option>
              </select>
              <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                className="input transition-colors hover:border-primary/50 focus:bg-background h-12 pr-10"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground/80">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                className="input transition-colors hover:border-primary/50 focus:bg-background h-12 pr-10"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary h-12 w-full mt-4 font-semibold text-base shadow-lg shadow-primary/30"
          >
            {loading ? "Creating..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-muted-foreground mt-2">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

