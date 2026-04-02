"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)",
        padding: "1rem",
      }}
    >
      {/* Decorative orbs */}
      <div style={{
        position: "fixed", top: "15%", left: "10%", width: 320, height: 320,
        borderRadius: "50%", background: "rgba(59,130,246,.12)", filter: "blur(80px)", pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "15%", right: "10%", width: 280, height: 280,
        borderRadius: "50%", background: "rgba(16,185,129,.08)", filter: "blur(80px)", pointerEvents: "none",
      }} />

      <div style={{
        width: "100%", maxWidth: 420,
        background: "rgba(255,255,255,.04)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 20,
        padding: "2.5rem",
        boxShadow: "0 25px 60px rgba(0,0,0,.4)",
      }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: ".5rem" }}>🏛️</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: ".25rem" }}>
            BankLoan Manager
          </h1>
          <p style={{ fontSize: ".875rem", color: "#94a3b8" }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
          <div>
            <label className="label" style={{ color: "#94a3b8" }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bank.com"
              required
              className="input"
              style={{ background: "rgba(255,255,255,.07)", borderColor: "rgba(255,255,255,.12)", color: "#fff" }}
            />
          </div>
          <div>
            <label className="label" style={{ color: "#94a3b8" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="input"
              style={{ background: "rgba(255,255,255,.07)", borderColor: "rgba(255,255,255,.12)", color: "#fff" }}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)",
              borderRadius: 8, padding: ".75rem 1rem", color: "#fca5a5", fontSize: ".875rem",
            }}>
              ✕ &ensp;{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: ".75rem", fontSize: "1rem", justifyContent: "center", marginTop: ".5rem" }}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}
