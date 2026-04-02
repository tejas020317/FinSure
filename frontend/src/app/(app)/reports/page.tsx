"use client";

import { useEffect, useState } from "react";
import { reportApi, OutstandingLoan, FDMaturityReport, LoanLedgerReport } from "@/lib/api";
import { toast } from "@/components/Toast";
import Link from "next/link";

export default function ReportsPage() {
  const [tab, setTab] = useState<"outstanding" | "fd" | "ledger">("outstanding");

  // Data states
  const [outstanding, setOutstanding] = useState<OutstandingLoan[]>([]);
  const [fdMaturity, setFdMaturity] = useState<FDMaturityReport[]>([]);
  const [ledger, setLedger] = useState<LoanLedgerReport | null>(null);

  // Load states
  const [loading, setLoading] = useState(false);

  // Loan Ledger specific
  const [loanIdInput, setLoanIdInput] = useState("");
  const [loadingLedger, setLoadingLedger] = useState(false);

  useEffect(() => {
    if (tab === "outstanding" && outstanding.length === 0) {
      loadOutstanding();
    } else if (tab === "fd" && fdMaturity.length === 0) {
      loadFdMaturity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadOutstanding = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getOutstandingLoans();
      setOutstanding(res.data);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFdMaturity = async () => {
    setLoading(true);
    try {
      const res = await reportApi.getFdMaturity();
      setFdMaturity(res.data);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : String(e), "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loanIdInput) return;
    setLoadingLedger(true);
    try {
      const id = Number(loanIdInput);
      const res = await reportApi.getLoanLedger(id);
      setLedger(res.data);
    } catch (e: unknown) {
      toast(e instanceof Error ? e.message : "Loan not found", "error");
      setLedger(null);
    } finally {
      setLoadingLedger(false);
    }
  };

  const fmt = (n: number | string | undefined) => "₹ " + new Intl.NumberFormat("en-IN").format(Number(n || 0));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Financial Reports</h1>
          <p style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>
            View and analyze overall financial data
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: ".5rem" }}>
        {[
          { id: "outstanding", label: "📈 Outstanding Loans" },
          { id: "fd", label: "🏦 FD Maturity Returns" },
          { id: "ledger", label: "📋 Loan Ledger" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as "outstanding" | "fd" | "ledger")}
            style={{
              padding: ".45rem 1rem",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: tab === t.id ? "#3b82f6" : "transparent",
              color: tab === t.id ? "#fff" : "var(--text-muted)",
              fontWeight: 500,
              fontSize: ".875rem",
              transition: "all .15s",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "outstanding" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1rem", display: "flex", justifyContent: "flex-end", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Export options are available on individual views.</span>
          </div>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner"></div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Customer</th>
                    <th>A/C No</th>
                    <th>Loan Amount</th>
                    <th>Remaining Bal</th>
                    <th>Interest Due</th>
                  </tr>
                </thead>
                <tbody>
                  {outstanding.map((o) => (
                    <tr key={o.loan_id}>
                      <td style={{ fontWeight: 600 }}>
                        <Link href={`/loans/${o.loan_id}`} style={{ textDecoration: "none", color: "#3b82f6" }}>
                          #{o.loan_id}
                        </Link>
                      </td>
                      <td>{o.customer_name}</td>
                      <td>{o.account_number}</td>
                      <td>{fmt(o.loan_amount)}</td>
                      <td style={{ fontWeight: 600, color: "#ef4444" }}>{fmt(o.remaining_balance)}</td>
                      <td style={{ color: "#f59e0b" }}>{fmt(o.interest_due)}</td>
                    </tr>
                  ))}
                  {outstanding.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        No outstanding loans.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "fd" && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: "1rem", display: "flex", justifyContent: "flex-end", borderBottom: "1px solid var(--border)" }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => reportApi.downloadFDMaturity().catch(e => toast(e.message, "error"))}
              style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
            >
              📄 Download PDF
            </button>
          </div>
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center" }}><div className="spinner"></div></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>FD ID</th>
                    <th>Customer</th>
                    <th>A/C No</th>
                    <th>Deposit</th>
                    <th>Maturity Date</th>
                    <th>Maturity Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fdMaturity.map((f) => (
                    <tr key={f.fd_id}>
                      <td style={{ fontWeight: 600 }}>#{f.fd_id}</td>
                      <td>{f.customer_name}</td>
                      <td>{f.account_number}</td>
                      <td>{fmt(f.deposit_amount)}</td>
                      <td>{new Date(f.maturity_date).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontWeight: 600, color: "#10b981" }}>{fmt(f.maturity_amount)}</td>
                    </tr>
                  ))}
                  {fdMaturity.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                        No fixed deposits found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "ledger" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div className="card" style={{ padding: "1.5rem" }}>
            <form onSubmit={fetchLedger} style={{ display: "flex", gap: "1rem", alignItems: "flex-end" }}>
              <div style={{ flex: 1, maxWidth: "300px" }}>
                <label className="label">Loan ID</label>
                <input
                  className="input"
                  type="number"
                  placeholder="Enter Loan ID..."
                  value={loanIdInput}
                  onChange={(e) => setLoanIdInput(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loadingLedger}>
                {loadingLedger ? "Fetching..." : "Fetch Ledger"}
              </button>
            </form>
          </div>

          {ledger && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border)", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <h3 style={{ fontWeight: 600, margin: 0 }}>Ledger details for Loan #{ledger.loan_id}</h3>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => reportApi.downloadLoanLedger(ledger.loan_id).catch(e => toast(e.message, "error"))}
                    style={{ fontSize: "0.875rem", padding: "0.5rem 1rem" }}
                  >
                    📄 Download PDF
                  </button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                   <div style={{ padding: ".75rem", background: "#fff", borderRadius: 8, border: "1px solid var(--border)" }}>
                     <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Original Principal</div>
                     <div style={{ fontWeight: 600, marginTop: ".25rem" }}>{fmt(ledger.original_principal)}</div>
                   </div>
                   <div style={{ padding: ".75rem", background: "#fff", borderRadius: 8, border: "1px solid var(--border)" }}>
                     <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Type</div>
                     <div style={{ fontWeight: 600, marginTop: ".25rem", textTransform: "capitalize" }}>{ledger.type}</div>
                   </div>
                   <div style={{ padding: ".75rem", background: "#fff", borderRadius: 8, border: "1px solid var(--border)" }}>
                     <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Current Outstanding</div>
                     <div style={{ fontWeight: 600, marginTop: ".25rem", color: "#8b5cf6" }}>{fmt(ledger.current_outstanding)}</div>
                   </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Payment</th>
                      <th>Interest Paid</th>
                      <th>Principal Paid</th>
                      <th>Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.ledger.map((row, idx) => (
                      <tr key={idx}>
                        <td>{new Date(row.date).toLocaleDateString("en-IN")}</td>
                        <td style={{ fontWeight: 600 }}>{fmt(row.payment)}</td>
                        <td style={{ color: "#f59e0b" }}>{fmt(row.interest_paid)}</td>
                        <td style={{ color: "#3b82f6" }}>{fmt(row.principal_paid)}</td>
                        <td style={{ fontWeight: 600, color: "#8b5cf6" }}>{fmt(row.remaining_balance)}</td>
                      </tr>
                    ))}
                    {ledger.ledger.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
                          No payments found for this loan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
