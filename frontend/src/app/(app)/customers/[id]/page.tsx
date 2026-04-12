"use client";

import { useEffect, useState, use } from "react";
import { reportApi } from "@/lib/api";
import { toast } from "@/components/Toast";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function CustomerSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const customerId = parseInt(id, 10);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = async () => {
    try {
      setLoading(true);
      const res = await reportApi.getCustomerSummaryJSON(customerId);
      if (res.success) {
        setData(res.data);
      } else {
        toast("Failed to load customer summary");
      }
    } catch (e: any) {
      toast(e.message || "Failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [customerId]);

  const fmt = (n: number | string) => "₹ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(n));

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (!data) return <div className="empty-state">Customer not found.</div>;

  const totalLoans = data.loans.length;
  const totalLoanAmount = data.loans.reduce((sum: number, l: any) => sum + Number(l.loan_amount || 0), 0);
  const remainingLoanBalance = data.loans.reduce((sum: number, l: any) => sum + Number(l.remaining_balance || 0), 0);
  const totalInterestPaid = data.loans.reduce((sum: number, l: any) => sum + Number(l.interest_paid || 0), 0);

  const totalFDs = data.fixedDeposits.length;
  const totalFDDeposited = data.fixedDeposits.reduce((sum: number, f: any) => sum + Number(f.deposit_amount || 0), 0);
  const totalFDEarned = data.fixedDeposits.reduce((sum: number, f: any) => sum + Number(f.interest_earned || 0), 0);
  const totalFDMaturity = data.fixedDeposits.reduce((sum: number, f: any) => sum + Number(f.maturity_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="page-header flex justify-between items-center">
        <div>
          <Link href="/customers" style={{ fontSize: ".8rem", color: "var(--text-muted)", textDecoration: "none" }}>← Back to Customers</Link>
          <h1 className="page-title" style={{ marginTop: ".25rem" }}>Customer Summary</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION 1: BASIC INFO */}
        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Basic Information</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Name</span>
              <span className="font-medium">{data.customer.name}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Account Number</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">{data.customer.account_number}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Contact</span>
              <span className="font-medium">{data.customer.phone || data.customer.email || "N/A"}</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: LOAN SUMMARY */}
        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Loan Summary</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Total Loans Taken</span>
              <span className="font-medium">{totalLoans}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Total Loan Amount</span>
              <span className="font-medium">{fmt(totalLoanAmount)}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Remaining Loan Balance</span>
              <span className="font-medium text-red-500 dark:text-red-400">{fmt(remainingLoanBalance)}</span>
            </div>
            <div className="grid grid-cols-2">
              <span className="text-muted-foreground text-sm">Total Interest Paid</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{fmt(totalInterestPaid)}</span>
            </div>
          </div>
        </div>

        {/* SECTION 3: FD SUMMARY */}
        <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-6 shadow-sm md:col-span-2">
          <h3 className="font-semibold text-lg mb-4 text-foreground">Fixed Deposit (FD) Summary</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Total FD Accounts</span>
              <span className="text-xl font-bold">{totalFDs}</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Total Deposited</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{fmt(totalFDDeposited)}</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Total Interest Earned</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">+{fmt(totalFDEarned)}</span>
            </div>
            <div className="p-4 rounded-xl bg-muted/30">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold block mb-1">Total Maturity Value</span>
              <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{fmt(totalFDMaturity)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: FD LIST */}
      <div className="card rounded-2xl backdrop-blur-md bg-background/60 dark:bg-white/5 border border-border p-0 shadow-sm overflow-hidden outline-none mt-6">
        <div className="p-6 border-b border-border">
          <h3 className="font-semibold text-lg text-foreground">Fixed Deposit Accounts</h3>
        </div>
        <div className="table-wrap">
          <table className="w-full">
            <thead>
              <tr>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">FD ID</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Type</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Deposit Amount</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Interest Earned</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Maturity Amount</th>
                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.fixedDeposits.length === 0 ? (
                <tr><td colSpan={7} className="h-24 text-center text-muted-foreground">No fixed deposits found</td></tr>
              ) : data.fixedDeposits.map((f: any) => (
                <tr key={f.fd_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="p-4 align-middle font-medium">#{f.fd_id}</td>
                  <td className="p-4 align-middle capitalize">{f.deposit_type || f.interest_type}</td>
                  <td className="p-4 align-middle">{fmt(f.deposit_amount)}</td>
                  <td className="p-4 align-middle text-emerald-600 dark:text-emerald-400">+{fmt(f.interest_earned)}</td>
                  <td className="p-4 align-middle text-violet-600 dark:text-violet-400 font-medium">{fmt(f.maturity_amount)}</td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${f.status === 'Active' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}>
                      {f.status}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:scale-[1.02] transition-all"
                      onClick={() => router.push(`/fds/${f.fd_id}`)}
                    >
                      View →
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}