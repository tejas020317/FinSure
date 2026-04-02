"use client";

import { useEffect, useState } from "react";
import { fdApi, customerApi, FD, Customer, FDMaturity } from "@/lib/api";
import { toast } from "@/components/Toast";

const EMPTY_FD = {
  customer_id: "", deposit_amount: "", interest_rate: "", interest_type: "simple",
  compounding_frequency: "quarterly", start_date: "", duration_months: "",
};

const EMPTY_CALC = {
  deposit_amount: "", interest_rate: "", interest_type: "simple",
  compounding_frequency: "quarterly", start_date: new Date().toISOString().split("T")[0], duration_months: "",
};

const freqLabel: Record<string, string> = { monthly: "Monthly", quarterly: "Quarterly", half_yearly: "Half-Yearly", yearly: "Yearly" };

export default function FDPage() {
  const [fds, setFds] = useState<FD[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [form, setForm] = useState(EMPTY_FD);
  const [calcForm, setCalcForm] = useState(EMPTY_CALC);
  const [maturity, setMaturity] = useState<FDMaturity | null>(null);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([fdApi.getAll(), customerApi.getAll()])
      .then(([fr, cr]) => { setFds(fr.data); setCustomers(cr.data); })
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setC = (k: string, v: string) => { setCalcForm((p) => ({ ...p, [k]: v })); setMaturity(null); };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fdApi.create({
        customer_id: Number(form.customer_id),
        deposit_amount: Number(form.deposit_amount),
        interest_rate: Number(form.interest_rate),
        interest_type: form.interest_type as FD["interest_type"],
        compounding_frequency: form.compounding_frequency as FD["compounding_frequency"],
        start_date: form.start_date,
        duration_months: Number(form.duration_months),
      });
      toast("Fixed deposit created");
      setShowModal(false);
      setForm(EMPTY_FD);
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);
    try {
      const r = await fdApi.calculate({
        deposit_amount: Number(calcForm.deposit_amount),
        interest_rate: Number(calcForm.interest_rate),
        interest_type: calcForm.interest_type as FD["interest_type"],
        compounding_frequency: calcForm.compounding_frequency as FD["compounding_frequency"],
        start_date: calcForm.start_date,
        duration_months: Number(calcForm.duration_months),
      });
      setMaturity(r.data);
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    } finally {
      setCalculating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await fdApi.delete(id);
      toast("Deleted successfully");
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const fmt = (n: number) => "₹ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n));

  const filtered = fds.filter((f) =>
    [f.customer?.name, String(f.fd_id), String(f.deposit_amount)].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Fixed Deposits</h1>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 200 }} />
          <button className="btn btn-secondary" onClick={() => setShowCalc(true)}>🧮 Calculator</button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ New FD</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>FD ID</th>
                <th>Customer</th>
                <th>Deposit Amount</th>
                <th>Rate</th>
                <th>Type</th>
                <th>Frequency</th>
                <th>Start Date</th>
                <th>Maturity Date</th>
                <th>Maturity Amount</th>
                <th>Interest Earned</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "auto" }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={11} className="empty-state">No fixed deposits found</td></tr>
              ) : filtered.map((f) => (
                <tr key={f.fd_id}>
                  <td style={{ fontWeight: 600, color: "var(--accent)" }}>#{f.fd_id}</td>
                  <td>{f.customer?.name ?? `Customer #${f.customer_id}`}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(f.deposit_amount)}</td>
                  <td>{f.interest_rate}%</td>
                  <td>
                    <span className={`badge ${f.interest_type === "simple" ? "badge-info" : "badge-warning"}`}>
                      {f.interest_type}
                    </span>
                  </td>
                  <td style={{ color: "var(--text-muted)", fontSize: ".8rem" }}>
                    {f.compounding_frequency ? freqLabel[f.compounding_frequency] : "—"}
                  </td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(f.start_date).toLocaleDateString("en-IN")}</td>
                  <td style={{ fontWeight: 500 }}>{new Date(f.maturity_date).toLocaleDateString("en-IN")}</td>
                  <td style={{ fontWeight: 700, color: "#8b5cf6" }}>{fmt(f.maturity_amount)}</td>
                  <td style={{ color: "#10b981", fontWeight: 600 }}>+{fmt(f.interest_earned)}</td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(f.fd_id)}
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

      {/* Create FD Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Open Fixed Deposit</h2>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label">Customer *</label>
                <select className="input" required value={form.customer_id} onChange={(e) => setF("customer_id", e.target.value)}>
                  <option value="">Select customer…</option>
                  {customers.map((c) => <option key={c.customer_id} value={c.customer_id}>{c.name} — {c.account_number}</option>)}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Deposit Amount (₹) *</label>
                  <input className="input" type="number" min="1" placeholder="100000" required value={form.deposit_amount} onChange={(e) => setF("deposit_amount", e.target.value)} />
                </div>
                <div>
                  <label className="label">Interest Rate (%) *</label>
                  <input className="input" type="number" step="0.01" placeholder="7.5" required value={form.interest_rate} onChange={(e) => setF("interest_rate", e.target.value)} />
                </div>
                <div>
                  <label className="label">Interest Type *</label>
                  <select className="input" value={form.interest_type} onChange={(e) => setF("interest_type", e.target.value)}>
                    <option value="simple">Simple</option>
                    <option value="compound">Compound</option>
                  </select>
                </div>
                <div>
                  <label className="label">Compounding Frequency</label>
                  <select className="input" value={form.compounding_frequency} onChange={(e) => setF("compounding_frequency", e.target.value)} disabled={form.interest_type === "simple"}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" required value={form.start_date} onChange={(e) => setF("start_date", e.target.value)} />
                </div>
                <div>
                  <label className="label">Duration (months) *</label>
                  <input className="input" type="number" min="1" placeholder="12" required value={form.duration_months} onChange={(e) => setF("duration_months", e.target.value)} />
                </div>
              </div>
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>{saving ? "Saving…" : "Open FD"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maturity Calculator Modal */}
      {showCalc && (
        <div className="modal-overlay" onClick={() => setShowCalc(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>🧮 FD Maturity Calculator</h2>
            <form onSubmit={handleCalculate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label className="label">Deposit Amount (₹) *</label>
                  <input className="input" type="number" min="1" placeholder="100000" required value={calcForm.deposit_amount} onChange={(e) => setC("deposit_amount", e.target.value)} />
                </div>
                <div>
                  <label className="label">Interest Rate (%) *</label>
                  <input className="input" type="number" step="0.01" placeholder="7.5" required value={calcForm.interest_rate} onChange={(e) => setC("interest_rate", e.target.value)} />
                </div>
                <div>
                  <label className="label">Interest Type *</label>
                  <select className="input" value={calcForm.interest_type} onChange={(e) => setC("interest_type", e.target.value)}>
                    <option value="simple">Simple</option>
                    <option value="compound">Compound</option>
                  </select>
                </div>
                <div>
                  <label className="label">Compounding</label>
                  <select className="input" value={calcForm.compounding_frequency} onChange={(e) => setC("compounding_frequency", e.target.value)} disabled={calcForm.interest_type === "simple"}>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="half_yearly">Half-Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="label">Start Date *</label>
                  <input className="input" type="date" required value={calcForm.start_date} onChange={(e) => setC("start_date", e.target.value)} />
                </div>
                <div>
                  <label className="label">Duration (months) *</label>
                  <input className="input" type="number" min="1" placeholder="12" required value={calcForm.duration_months} onChange={(e) => setC("duration_months", e.target.value)} />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ justifyContent: "center" }} disabled={calculating}>
                {calculating ? "Calculating…" : "Calculate Maturity"}
              </button>
            </form>

            {maturity && (
              <div style={{ marginTop: "1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "1.25rem" }}>
                <h3 style={{ fontWeight: 600, color: "#065f46", marginBottom: "1rem" }}>📊 Maturity Results</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: ".75rem", textAlign: "center" }}>
                  <div>
                    <div style={{ fontSize: ".7rem", color: "#047857", fontWeight: 600, textTransform: "uppercase", marginBottom: ".25rem" }}>Maturity Amount</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#065f46" }}>{fmt(maturity.maturity_amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".7rem", color: "#047857", fontWeight: 600, textTransform: "uppercase", marginBottom: ".25rem" }}>Interest Earned</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#059669" }}>+{fmt(maturity.interest_earned)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: ".7rem", color: "#047857", fontWeight: 600, textTransform: "uppercase", marginBottom: ".25rem" }}>Maturity Date</div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: "#065f46" }}>{new Date(maturity.maturity_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                </div>
              </div>
            )}

            <button type="button" className="btn btn-secondary" style={{ width: "100%", marginTop: ".75rem", justifyContent: "center" }} onClick={() => setShowCalc(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
