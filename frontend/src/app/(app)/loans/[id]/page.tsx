"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { loanApi, paymentApi, reportApi, Loan, LoanCalculation, Payment } from "@/lib/api";
import { toast } from "@/components/Toast";

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const loanId = Number(id);

  const [loan, setLoan] = useState<Loan | null>(null);
  const [calc, setCalc] = useState<LoanCalculation | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "ledger" | "payments">("overview");

  // Add Payment / Withdrawal modal
  const [showModal, setShowModal] = useState<"payment" | "withdrawal" | false>(false);
  const [payForm, setPayForm] = useState({ payment_amount: "", payment_date: new Date().toISOString().split("T")[0], remarks: "" });
  const [wdForm, setWdForm] = useState({ amount: "", date: new Date().toISOString().split("T")[0] });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      loanApi.getOne(loanId),
      loanApi.getCalculation(loanId),
      paymentApi.getByLoan(loanId),
      reportApi.getLoanLedger(loanId)
    ])
      .then(([lr, cr, pr, ledgerRes]) => {
        setLoan(lr.data);
        setCalc(cr.data);
        setPayments(pr.data.payments);
        setLedgerData(ledgerRes.data);
      })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [loanId]);

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentApi.create({
        loan_id: loanId,
        payment_amount: Number(payForm.payment_amount),
        payment_date: payForm.payment_date,
        remarks: payForm.remarks,
      });
      toast("Payment recorded successfully");
      setShowModal(false);
      setPayForm({ payment_amount: "", payment_date: new Date().toISOString().split("T")[0], remarks: "" });
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await loanApi.addWithdrawal(loanId, {
        amount: Number(wdForm.amount),
        date: wdForm.date,
      });
      toast("Withdrawal recorded successfully");
      setShowModal(false);
      setWdForm({ amount: "", date: new Date().toISOString().split("T")[0] });
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number | string) => "₹ " + new Intl.NumberFormat("en-IN").format(Number(n));

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  if (!loan) return <div className="empty-state">Loan not found.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link href="/loans" style={{ fontSize: ".8rem", color: "var(--text-muted)", textDecoration: "none" }}>← Back to Loans</Link>
          <h1 className="page-title" style={{ marginTop: ".25rem" }}>Loan #{loan.loan_id}</h1>
          <p style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>{loan.customer?.name} — {loan.customer?.account_number}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary" onClick={() => reportApi.downloadLoanLedger(loanId).catch(console.error)}>📄 PDF Ledger</button>
          <button className="btn btn-secondary" onClick={() => reportApi.downloadLoanLedgerCSV(loanId).catch(console.error)}>📄 CSV Ledger</button>
          <button className="btn btn-primary" onClick={() => setShowModal("withdrawal")}>➕ Withdrawal</button>
          <button className="btn btn-primary" onClick={() => setShowModal("payment")}>💰 Add Payment</button>
        </div>
      </div>

      {/* Summary cards */}
      {calc && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {[
            { label: "Principal", value: fmt(loan.loan_amount), accent: "#3b82f6" },
            { label: "Remaining Principal", value: fmt(calc.remaining_principal), accent: "#8b5cf6" },
            { label: "Interest Due", value: fmt(calc.interest_due), accent: "#f59e0b" },
            { label: "Total Payable", value: fmt(calc.total_payable), accent: "#ef4444" },
            { label: "Total Paid", value: fmt(calc.total_paid), accent: "#10b981" },
          ].map((s) => (
            <div key={s.label} className="card" style={{ padding: "1.1rem 1.25rem" }}>
              <div style={{ fontSize: ".7rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 600, letterSpacing: ".06em", marginBottom: ".35rem" }}>{s.label}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: s.accent }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border)", paddingBottom: ".5rem" }}>
        {(["overview", "ledger", "payments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: ".45rem 1rem", borderRadius: 6, border: "none", cursor: "pointer",
            background: tab === t ? "#3b82f6" : "transparent",
            color: tab === t ? "#fff" : "var(--text-muted)",
            fontWeight: 500, fontSize: ".875rem", transition: "all .15s",
          }}>
            {t === "overview" ? "📋 Overview" : t === "ledger" ? "🏦 Loan Ledger" : `💰 Old Payments`}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: "1rem" }}>Loan Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
            {[
              { label: "Interest Type", value: loan.interest_type },
              { label: "Calculation", value: loan.calculation_type },
              { label: "Start Date", value: new Date(loan.loan_start_date).toLocaleDateString("en-IN") },
              { label: "Duration", value: `${loan.duration_months} months` },
              { label: "Interest Rate", value: `${loan.interest_rate}%` },
              { label: "Calculation Type", value: calc?.type ?? "—" },
            ].map((r) => (
              <div key={r.label} style={{ padding: ".75rem", background: "#f8fafc", borderRadius: 8 }}>
                <div style={{ fontSize: ".7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", marginBottom: ".25rem" }}>{r.label}</div>
                <div style={{ fontWeight: 600 }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "ledger" && ledgerData && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Deposit</th>
                  <th>Interest</th>
                  <th>Principal</th>
                  <th>Withdrawal</th>
                  <th>Remaining Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerData.ledger.map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td>{new Date(r.date).toLocaleDateString("en-IN")}</td>
                    <td style={{ color: r.payment > 0 ? "var(--text)" : "var(--text-muted)", fontWeight: r.payment > 0 ? 600 : 400 }}>{r.payment > 0 ? fmt(r.payment) : "-"}</td>
                    <td style={{ color: r.interest_charged > 0 ? "var(--text)" : "var(--text-muted)" }}>{r.interest_charged > 0 ? fmt(r.interest_charged) : "-"}</td>
                    <td style={{ color: r.principal_paid > 0 ? "var(--text)" : "var(--text-muted)" }}>{r.principal_paid > 0 ? fmt(r.principal_paid) : "-"}</td>
                    <td style={{ color: r.withdrawal > 0 ? "var(--text)" : "var(--text-muted)", fontWeight: r.withdrawal > 0 ? 600 : 400 }}>{r.withdrawal > 0 ? fmt(r.withdrawal) : "-"}</td>
                    <td style={{ fontWeight: 700 }}>{fmt(r.remaining_balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div className="card" style={{ padding: 0 }}>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr><td colSpan={3} className="empty-state">No payments recorded yet</td></tr>
                ) : payments.map((p) => {
                  return (
                    <tr key={p.payment_id}>
                      <td>{new Date(p.payment_date).toLocaleDateString("en-IN")}</td>
                      <td style={{ fontWeight: 600 }}>{fmt(p.payment_amount)}</td>
                      <td style={{ color: "var(--text-muted)" }}>{p.remarks ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showModal === "payment" && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Add Payment — Loan #{loanId}</h2>
            <form onSubmit={handleAddPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Payment Date</label>
                <input className="input" type="date" required
                  value={payForm.payment_date} onChange={(e) => setPayForm((p) => ({ ...p, payment_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Amount</label>
                <input className="input" type="number" min="1" step="0.01" placeholder="5000" required
                  value={payForm.payment_amount} onChange={(e) => setPayForm((p) => ({ ...p, payment_amount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Remarks</label>
                <input className="input" placeholder="EMI for March 2026"
                  value={payForm.remarks} onChange={(e) => setPayForm((p) => ({ ...p, remarks: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Saving…" : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Withdrawal Modal */}
      {showModal === "withdrawal" && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Loan Withdrawal — Loan #{loanId}</h2>
            <form onSubmit={handleAddWithdrawal} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Withdrawal Date</label>
                <input className="input" type="date" required
                  value={wdForm.date} onChange={(e) => setWdForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Amount to Disburse</label>
                <input className="input" type="number" min="1" step="0.01" placeholder="50000" required
                  value={wdForm.amount} onChange={(e) => setWdForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Saving…" : "Record Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
