"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loanApi, customerApi, Loan, Customer } from "@/lib/api";
import { toast } from "@/components/Toast";

const EMPTY = { customer_id: "", loan_amount: "", interest_rate: "", interest_type: "simple", calculation_type: "monthly", loan_start_date: "", duration_months: "" };

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([loanApi.getAll(), customerApi.getAll()])
      .then(([lr, cr]) => { setLoans(lr.data); setCustomers(cr.data); })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await loanApi.create({
        customer_id: Number(form.customer_id),
        loan_amount: Number(form.loan_amount),
        interest_rate: Number(form.interest_rate),
        interest_type: form.interest_type as Loan["interest_type"],
        calculation_type: form.calculation_type as Loan["calculation_type"],
        loan_start_date: form.loan_start_date,
        duration_months: Number(form.duration_months),
      });
      toast("Loan created successfully");
      setShowModal(false);
      setForm(EMPTY);
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await loanApi.delete(id);
      toast("Deleted successfully");
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const filtered = loans.filter((l) =>
    [l.customer?.name, String(l.loan_id), String(l.loan_amount)].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  const fmt = (n: number) =>
    "₹ " + new Intl.NumberFormat("en-IN").format(Number(n));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Loans</h1>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ New Loan</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Loan ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Rate</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "auto" }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No loans found</td></tr>
              ) : filtered.map((l) => (
                <tr key={l.loan_id}>
                  <td style={{ fontWeight: 600, color: "var(--accent)" }}>#{l.loan_id}</td>
                  <td>{l.customer?.name ?? `Customer #${l.customer_id}`}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(l.loan_amount)}</td>
                  <td>{l.interest_rate}%</td>
                  <td>
                    <span className={`badge ${l.interest_type === "simple" ? "badge-info" : l.interest_type === "compound" ? "badge-warning" : "badge-success"}`}>
                      {l.interest_type}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(l.loan_start_date).toLocaleDateString("en-IN")}</td>
                  <td>{l.duration_months} mo</td>
                  <td>
                    <Link href={`/loans/${l.loan_id}`} className="btn btn-secondary" style={{ padding: ".3rem .75rem", fontSize: ".8rem" }}>
                      View →
                    </Link>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(l.loan_id)}
                      style={{ background: 'var(--danger)', color: 'white', marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.4rem 0.6rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
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
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Create New Loan</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Customer <span style={{ color: "var(--danger)" }}>*</span></label>
                <select className="input" required value={form.customer_id} onChange={(e) => set("customer_id", e.target.value)}>
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name} — {c.account_number}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Loan Amount (₹) *</label>
                  <input className="input" type="number" min="1" placeholder="500000" required value={form.loan_amount} onChange={(e) => set("loan_amount", e.target.value)} />
                </div>
                <div>
                  <label className="label">Interest Rate (%) *</label>
                  <input className="input" type="number" step="0.01" min="0" placeholder="12" required value={form.interest_rate} onChange={(e) => set("interest_rate", e.target.value)} />
                </div>
                <div>
                  <label className="label">Interest Type *</label>
                  <select className="input" value={form.interest_type} onChange={(e) => set("interest_type", e.target.value)}>
                    <option value="simple">Simple</option>
                    <option value="compound">Compound</option>
                    <option value="reducing">Reducing Balance</option>
                  </select>
                </div>
                <div>
                  <label className="label">Calculation Type</label>
                  <select className="input" value={form.calculation_type} onChange={(e) => set("calculation_type", e.target.value)}>
                    <option value="ANNUAL_MONTHLY_REDUCING">Annual (Monthly Reducing Balance)</option>
                    <option value="ANNUAL_DAILY_REDUCING">Annual (Daily Reducing Balance)</option>
                    <option value="SIMPLE">Simple Interest</option>
                    <option value="COMPOUND">Compound Interest</option>
                  </select>
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" required value={form.loan_start_date} onChange={(e) => set("loan_start_date", e.target.value)} />
                </div>
                <div>
                  <label className="label">Duration (months) *</label>
                  <input className="input" type="number" min="1" placeholder="12" required value={form.duration_months} onChange={(e) => set("duration_months", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Saving…" : "Create Loan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
