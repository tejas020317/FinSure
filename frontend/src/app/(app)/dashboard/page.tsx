"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { dashboardApi, DashboardStats, DashboardCharts } from "@/lib/api";
import {
  LineChart, Line, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  accent: string;
  sub?: string;
  href?: string;
}

function StatCard({ label, value, icon, accent, sub, href }: StatCardProps) {
  const inner = (
    <div className="card" style={{
      display: "flex", alignItems: "flex-start", gap: "1rem",
      transition: "box-shadow .15s, transform .15s",
      cursor: href ? "pointer" : "default",
    }}
      onMouseEnter={(e) => { if (href) { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 24px rgba(0,0,0,.1)"; }}}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = ""; }}
    >
      <div className="stat-icon" style={{ background: accent + "18", flexShrink: 0 }}>
        <span style={{ fontSize: "1.4rem" }}>{icon}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: ".75rem", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: ".3rem" }}>{label}</div>
        <div style={{ fontSize: "1.75rem", fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: ".75rem", color: "var(--text-muted)", marginTop: ".35rem" }}>{sub}</div>}
      </div>
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link> : inner;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charts, setCharts] = useState<DashboardCharts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getCharts()
    ])
      .then(([statsRes, chartsRes]) => {
        setStats(statsRes.data);
        setCharts(chartsRes.data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
  const fmtCurrency = (n: number) =>
    "₹ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(n);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </span>
      </div>

      {error && (
        <div style={{ color: "var(--danger)", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
          ⚠ {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
          <div className="spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : stats ? (
        <>
          {/* Stat Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
            <StatCard label="Total Customers" value={fmt(stats.total_customers)} icon="👥" accent="#3b82f6" href="/customers" sub="View all customers →" />
            <StatCard label="Active Loans" value={fmt(stats.active_loans)} icon="💳" accent="#8b5cf6" href="/loans" sub="View all loans →" />
            <StatCard label="FD Accounts" value={fmt(stats.total_fd_accounts)} icon="🏦" accent="#10b981" href="/fd" sub="View all FDs →" />
            <StatCard label="Outstanding Loans" value={fmtCurrency(stats.total_outstanding_loans)} icon="💰" accent="#f59e0b" sub="Total principal" />
          <StatCard label="Payments Today" value={fmt(stats.payments_today)} icon="✅" accent="#06b6d4" href="/payments" sub="Add new payment →" />
          </div>

          {/* Charts */}
          {charts && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
              <div className="card">
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                  Loan Balance Over Time
                </h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={charts.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                      <Area type="monotone" dataKey="loanBalance" name="Outstanding Balance" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                  FD Growth Trend
                </h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={charts.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                      <Line type="monotone" dataKey="fdGrowth" name="Total FDs" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                  Principal vs Interest Recovered
                </h3>
                <div style={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.interestVsPrincipal}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {charts.interestVsPrincipal.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => fmtCurrency(Number(v))} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "1rem", textTransform: "uppercase", letterSpacing: ".06em" }}>
            Quick Actions
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
            {[
              { href: "/customers", label: "Add Customer", icon: "➕👤" },
              { href: "/loans", label: "Create Loan", icon: "➕💳" },
              { href: "/payments", label: "Record Payment", icon: "➕💰" },
              { href: "/fd", label: "Open FD", icon: "➕🏦" },
            ].map((q) => (
              <Link key={q.href} href={q.href}
                style={{
                  display: "flex", alignItems: "center", gap: ".75rem",
                  background: "#fff", border: "1px solid var(--border)", borderRadius: 10,
                  padding: "1rem 1.2rem", textDecoration: "none",
                  color: "var(--text-primary)", fontWeight: 500, fontSize: ".875rem",
                  transition: "all .15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#3b82f6"; (e.currentTarget as HTMLElement).style.color = "#3b82f6"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "var(--text-primary)"; }}
              >
                <span>{q.icon}</span> {q.label}
              </Link>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
