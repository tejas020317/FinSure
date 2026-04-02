"use client";

import { useEffect, useState } from "react";
import { customerApi, reportApi, Customer } from "@/lib/api";
import { toast } from "@/components/Toast";

const EMPTY: Partial<Customer> = { name: "", phone: "", email: "", address: "", account_number: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<Partial<Customer>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    customerApi.getAll()
      .then((r) => setCustomers(r.data))
      .catch((e) => toast(e.message, "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await customerApi.create(form);
      toast("Customer created successfully");
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
      await customerApi.delete(id);
      toast("Deleted successfully");
      load();
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : "Failed", "error");
    }
  };

  const filtered = customers.filter((c) =>
    [c.name, c.phone, c.email, c.account_number].some((v) =>
      v?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers</h1>
        <div style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
          <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>➕ Add Customer</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Account No.</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Joined</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "auto" }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="empty-state">No customers found</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.customer_id}>
                  <td style={{ color: "var(--text-muted)", fontSize: ".8rem" }}>#{c.customer_id}</td>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td><span className="badge badge-info">{c.account_number}</span></td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td style={{ color: "var(--text-muted)" }}>{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                  <td style={{ textAlign: "right" }}>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => reportApi.downloadCustomerSummary(c.customer_id).catch(e => toast(e.message, "error"))}
                      style={{ fontSize: "0.75rem", padding: "0.4rem 0.6rem" }}
                      title="Download PDF Summary"
                    >
                      📄 Summary
                    </button>
                    <button
                      className="btn-danger"
                      onClick={() => handleDelete(c.customer_id)}
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
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontWeight: 700, marginBottom: "1.5rem", fontSize: "1.1rem" }}>Add New Customer</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {([
                { key: "name", label: "Full Name", placeholder: "Ramesh Patil", required: true },
                { key: "account_number", label: "Account Number", placeholder: "ACC-001", required: true },
                { key: "phone", label: "Phone", placeholder: "+91 98765 43210" },
                { key: "email", label: "Email", placeholder: "ramesh@example.com", type: "email" },
                { key: "address", label: "Address", placeholder: "123, MG Road, Nashik" },
              ] as { key: keyof Customer; label: string; placeholder: string; required?: boolean; type?: string }[]).map((f) => (
                <div key={f.key}>
                  <label className="label">{f.label}{f.required && <span style={{ color: "var(--danger)" }}> *</span>}</label>
                  <input
                    className="input"
                    type={f.type ?? "text"}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={(form[f.key] as string) ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
              <div style={{ display: "flex", gap: ".75rem", marginTop: ".5rem" }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? "Saving…" : "Create Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
