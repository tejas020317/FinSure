"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Eye, Trash2, FileText, CheckCircle, Calculator } from "lucide-react";
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
      <div className="page-header mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Customers</h1>
        </div>
        <div className="flex items-center gap-3">
          <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: 220 }} />
          <button className="btn btn-primary shadow-sm" onClick={() => setShowModal(true)}><Plus className="mr-2 w-4 h-4"/> Add Customer</button>
        </div>
      </div>

      <div className="card overflow-hidden outline-none !p-0">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">#</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Account No.</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Phone</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "3rem" }}><div className="spinner" style={{ margin: "auto" }} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="h-24 text-center text-muted-foreground">No customers found</td></tr>
              ) : filtered.map((c) => (
                <tr key={c.customer_id} className="transition-colors hover:bg-muted/30 border-b border-border last:border-0">
                  <td className="p-4 align-middle text-sm text-muted-foreground">#{c.customer_id}</td>
                  <td className="p-4 align-middle font-medium text-foreground">{c.name}</td>
                  <td className="p-4 align-middle"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/30">{c.account_number}</span></td>
                  <td className="p-4 align-middle">{c.phone ?? "—"}</td>
                  <td className="p-4 align-middle">{c.email ?? "—"}</td>
                  <td className="p-4 align-middle text-muted-foreground">{new Date(c.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="p-4 align-middle text-center w-[250px]">
                    <div className="flex items-center justify-center gap-2 flex-row">
                      <button
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                        onClick={() => window.location.href = `/customers/${c.customer_id}`}
                        title="View Customer"
                      >
                        <Eye className="w-3.5 h-3.5"/> View
                      </button>
                      <button 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 bg-white/5 border border-white/10 hover:bg-white/10 text-white"
                        onClick={() => reportApi.downloadCustomerSummary(c.customer_id).catch(e => toast(e.message, "error"))}
                        title="Download PDF Summary"
                      >
                        <FileText className="w-3.5 h-3.5"/> PDF
                      </button>
                      <button 
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md transition-all duration-200 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDelete(c.customer_id)}
                        title="Delete Customer"
                      >
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100 flex items-center justify-center p-4 sm:p-6" onClick={() => setShowModal(false)}>
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-lg border border-border p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
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
