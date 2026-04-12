"use client";

import { useEffect, useState, use } from "react";
import { fdApi, FD, FdTransaction, reportApi } from "@/lib/api";
import { toast } from "react-hot-toast";
import { ArrowLeft, Plus, Eye, Search, Trash2, FileText, CheckCircle, Calculator } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function FdLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const fdId = parseInt(id, 10);
  const [fd, setFd] = useState<FD | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Add Deposit modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchFd();
  }, [fdId]);

  const fetchFd = async () => {
    try {
      setLoading(true);
      const res = await fdApi.getOne(fdId);
      if (res.success) {
        setFd(res.data);
      } else {
        toast.error("Failed to load FD details.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch FD details.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    try {
      setAdding(true);
      const res = await fdApi.addDeposit(fdId, date, parseFloat(amount));
      if (res.success) {
        toast.success("Deposit added successfully!");
        setIsAddModalOpen(false);
        setAmount("");
        fetchFd();
      } else {
        toast.error("Failed to add deposit");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to add deposit");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
      <div className="spinner" style={{ width: 36, height: 36 }} />
    </div>;
  }

  if (!fd) {
    return <div className="empty-state">FD Not Found</div>;
  }

  const fmt = (n: number | string) => "₹ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n));
  
  return (
    <div>
      <div className="page-header flex justify-between items-center">
        <div>
          <Link href="/fd" style={{ fontSize: ".8rem", color: "var(--text-muted)", textDecoration: "none" }}>← Back to Fixed Deposits</Link>
          <h1 className="page-title" style={{ marginTop: ".25rem" }}>Fixed Deposit #{fd.fd_id}</h1>
          <p style={{ fontSize: ".875rem", color: "var(--text-muted)" }}>{fd.customer?.name} — {fd.customer?.account_number}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button className="btn btn-secondary border-border shadow-sm text-foreground bg-secondary/50 hover:bg-secondary" onClick={() => reportApi.downloadFDMaturity().catch(console.error)}>📄 Download Statement</button>
          {fd.deposit_type === "FLEXIBLE" && (
            <button className="btn btn-primary shadow-sm" onClick={() => setIsAddModalOpen(true)}>
              ➕ Add Deposit
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Basic Info</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Customer Name</span>
              <span className="font-medium text-sm">{fd.customer?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">FD Type</span>
              <span className="font-medium text-sm capitalize">{fd.deposit_type || fd.interest_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Interest Rate</span>
              <span className="font-medium text-sm text-amber-600 dark:text-amber-500">{fd.interest_rate}% ({fd.interest_type})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Duration</span>
              <span className="font-medium text-sm">{fd.duration_months} Months</span>
            </div>
          </div>
        </div>

        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Timeline</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Start Date</span>
              <span className="font-medium text-sm">{new Date(fd.start_date).toLocaleDateString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Maturity Date</span>
              <span className="font-medium text-sm">{new Date(fd.maturity_date).toLocaleDateString("en-IN")}</span>
            </div>
          </div>
        </div>

        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Financials</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Total Deposit</span>
              <span className="font-medium text-sm text-blue-600 dark:text-blue-400">{fmt(fd.deposit_amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Interest Earned</span>
              <span className="font-medium text-sm text-emerald-600 dark:text-emerald-400">+{fmt(fd.interest_earned)}</span>
            </div>
            <div className="border-t border-border my-2 pt-2 flex justify-between">
              <span className="text-muted-foreground font-semibold">Maturity Amount</span>
              <span className="font-bold text-violet-600 dark:text-violet-400">{fmt(fd.maturity_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {fd.deposit_type === "FLEXIBLE" && (
        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-0 shadow-sm overflow-hidden outline-none">
          <div className="border-b border-border p-6">
            <h3 className="font-semibold text-lg text-foreground">Deposit History</h3>
          </div>
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Deposit Amount</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Interest Earned</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Running Balance</th>
                </tr>
              </thead>
              <tbody>
                {fd.transactions && fd.transactions.length > 0 ? (
                  fd.transactions.map((tx: FdTransaction) => (
                    <tr key={tx.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                      <td className="p-4 align-middle">{new Date(tx.transaction_date).toLocaleDateString("en-IN")}</td>
                      <td className="p-4 align-middle text-right font-medium text-blue-600 dark:text-blue-400">{fmt(tx.deposit_amount)}</td>
                      <td className="p-4 align-middle text-right text-emerald-600 dark:text-emerald-400">
                        {tx.interest_added ? `+${fmt(tx.interest_added)}` : "—"}
                      </td>
                      <td className="p-4 align-middle text-right font-bold">{fmt(tx.balance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground">
                      No deposit transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Deposit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100 flex items-center justify-center p-4 sm:p-6" onClick={() => setIsAddModalOpen(false)}>
          <div className="bg-card w-full max-w-md rounded-2xl shadow-lg border border-border p-6 animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-6">Add Deposit</h2>
            <form onSubmit={handleAddDeposit} className="space-y-4">
              <div>
                <label className="label">Date *</label>
                <input 
                  type="date" 
                  className="input" 
                  required 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                />
              </div>
              <div>
                <label className="label">Deposit Amount (₹) *</label>
                <input 
                  type="number" 
                  min="1" 
                  step="0.01" 
                  className="input" 
                  placeholder="5000" 
                  required 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" className="btn btn-secondary flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1" disabled={adding}>
                  {adding ? "Saving..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}