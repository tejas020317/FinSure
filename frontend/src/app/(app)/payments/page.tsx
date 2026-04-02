"use client";

import { useEffect, useState } from "react";
import { loanApi, paymentApi, Loan, Payment } from "@/lib/api";
import { toast } from "@/components/Toast";

export default function PaymentsPage() {
  const [loanId, setLoanId] = useState("");
  const [loan, setLoan] = useState<Loan | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allLoans, setAllLoans] = useState<Loan[]>([]);
  const [fetching, setFetching] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ loan_id: "", payment_amount: "", payment_date: new Date().toISOString().split("T")[0], remarks: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loanApi.getAll().then((r) => setAllLoans(r.data)).catch(() => {});
  }, []);

  const loadPayments = async (id?: string) => {
    const lid = id ?? loanId;
    if (!lid) return;
    setFetching(true);
    try {
      const r = await paymentApi.getByLoan(Number(lid));
      setLoan(r.data.loan);
      setPayments(r.data.payments);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setFetching(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await paymentApi.create({
        loan_id: Number(form.loan_id),
        payment_amount: Number(form.payment_amount),
        payment_date: form.payment_date,
        remarks: form.remarks,
      });
      toast("Payment recorded");
      setShowModal(false);
      setForm({ loan_id: "", payment_amount: "", payment_date: new Date().toISOString().split("T")[0], remarks: "" });
      if (loanId) loadPayments();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await paymentApi.delete(id);
      toast("Deleted successfully");
      if (loanId) loadPayments();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const fmt = (n: number) => "₹ " + new Intl.NumberFormat("en-IN").format(Number(n));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Payment</button>
      </div>

      {/* Loan selector */}
      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="label">Select Loan to view payment history</label>
            <select className="input" value={loanId} onChange={(e) => { setLoanId(e.target.value); if (e.target.value) loadPayments(e.target.value); }}>
              <option value="">Choose a loan…</option>
              {allLoans.map((l) => (
                <option key={l.loan_id} value={l.loan_id}>Loan #{l.loan_id} — {l.customer?.name ?? `Customer #${l.customer_id}`} ({fmt(l.loan_amount)})</option>
              ))}
            </select>
          </div>
          {loanId && (
            <button className="btn btn-secondary" onClick={() => loadPayments()} disabled={fetching}>
              {fetching ? "Loading…" : "🔄 Refresh"}
            </button>
          )}
        </div>
      </div>

      {loan && (
        <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "1rem" }}>
          <h2 style={{ fontWeight: 600 }}>Loan #{loan.loan_id} — {loan.customer?.name}</h2>
          <span className="badge badge-info">{fmt(loan.loan_amount)}</span>
          <span className="badge badge-warning">{loan.interest_rate}% {loan.interest_type}</span>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Payment Date</th>
                <th>Amount</th>
                <th>Remarks</th>
                <th>Recorded On</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fetching ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "auto" }} /></td></tr>
              ) : !loanId ? (
                <tr><td colSpan={6} className="empty-state">Select a loan above to view its payment history</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={6} className="empty-state">No payments recorded for this loan yet</td></tr>
              ) : payments.map((p, i) => (
                <tr key={p.payment_id}>
                  <td style={{ color: "var(--text-muted)" }}>{i + 1}</td>
                  <td style={{ fontWeight: 500 }}>{new Date(p.payment_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                  <td style={{ fontWeight: 700, color: "#10b981" }}>{fmt(p.payment_amount)}</td>
                  <td style={{ color: "var(--text-muted)" }}>{p.remarks ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)", fontSize: ".8rem" }}>{new Date(p.created_at).toLocaleDateString("en-IN")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(p.payment_id)}
                      style={{ background: 'var(--danger)', color: 'white', fontSize: '0.75rem', padding: '0.4rem 0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Record Payment</h2>
            <form onSubmit={handleAddPayment} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Loan *</label>
                <select className="input" required value={form.loan_id} onChange={(e) => setForm((p) => ({ ...p, loan_id: e.target.value }))}>
                  <option value="">Select loan…</option>
                  {allLoans.map((l) => (
                    <option key={l.loan_id} value={l.loan_id}>Loan #{l.loan_id} — {l.customer?.name ?? `Customer #${l.customer_id}`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Payment Amount (₹) *</label>
                <input className="input" type="number" min="1" step="0.01" placeholder="5000" required
                  value={form.payment_amount} onChange={(e) => setForm((p) => ({ ...p, payment_amount: e.target.value }))} />
              </div>
              <div>
                <label className="label">Payment Date *</label>
                <input className="input" type="date" required value={form.payment_date} onChange={(e) => setForm((p) => ({ ...p, payment_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Remarks</label>
                <input className="input" placeholder="EMI for March 2026" value={form.remarks} onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))} />
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? "Saving…" : "Record Payment"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
