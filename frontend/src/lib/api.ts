const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

type FetchOptions = RequestInit & { auth?: boolean };

async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { auth = true, headers: extraHeaders, ...rest } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(extraHeaders ?? {}),
  };

  if (auth) {
    const token = getToken();
    if (token)
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { headers, ...rest });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(
      json?.message ?? `Request failed with status ${res.status}`,
    );
  }

  return json;
}

export async function apiDownload(
  path: string,
  filename: string,
  options: FetchOptions = {},
): Promise<void> {
  const { auth = true, headers: extraHeaders, ...rest } = options;

  const headers: HeadersInit = {
    ...(extraHeaders ?? {}),
  };

  if (auth) {
    const token = getToken();
    if (token)
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { headers, ...rest });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed with status ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

// ── Auth ─────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{
      success: boolean;
      data: { token: string; user: Record<string, unknown> };
    }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      auth: false,
    }),
};

// ── Dashboard ─────────────────────────────────────────────
export const dashboardApi = {
  getStats: () =>
    apiFetch<{ success: boolean; data: DashboardStats }>("/dashboard"),
  getCharts: () =>
    apiFetch<{ success: boolean; data: DashboardCharts }>("/dashboard/charts"),
};

export interface DashboardCharts {
  interestVsPrincipal: { name: string; value: number; fill: string }[];
  timeSeriesData: { name: string; loanBalance: number; fdGrowth: number }[];
}

export interface DashboardStats {
  total_customers: number;
  active_loans: number;
  total_fd_accounts: number;
  total_outstanding_loans: number;
  payments_today: number;
}

// ── Customers ─────────────────────────────────────────────
export const customerApi = {
  getAll: () => apiFetch<{ success: boolean; data: Customer[] }>("/customers"),
  getOne: (id: number) =>
    apiFetch<{ success: boolean; data: Customer }>(`/customers/${id}`),
  create: (body: Partial<Customer>) =>
    apiFetch<{ success: boolean; data: Customer }>("/customers", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; data: Customer }>(`/customers/${id}`, {
      method: "DELETE",
    }),
};

export interface Customer {
  customer_id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
  account_number: string;
  created_at: string;
}

// ── Loans ─────────────────────────────────────────────────
export const loanApi = {
  getAll: () => apiFetch<{ success: boolean; data: Loan[] }>("/loans"),
  getOne: (id: number) =>
    apiFetch<{ success: boolean; data: Loan }>(`/loans/${id}`),
  create: (body: Partial<Loan>) =>
    apiFetch<{ success: boolean; data: Loan }>("/loans", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; data: Loan }>(`/loans/${id}`, {
      method: "DELETE",
    }),
  getCalculation: (id: number) =>
    apiFetch<{ success: boolean; data: LoanCalculation }>(
      `/loans/${id}/calculation`,
    ),
  addWithdrawal: (id: number, body: { amount: number; date: string }) =>
    apiFetch<{ success: boolean; data: any }>(`/loans/${id}/withdrawals`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export interface Loan {
  loan_id: number;
  customer_id: number;
  loan_amount: number;
  interest_rate: number;
  interest_type: "simple" | "compound" | "reducing";
  calculation_type: "daily" | "monthly";
  loan_start_date: string;
  duration_months: number;
  customer?: Customer;
  payments?: Payment[];
  created_at: string;
}

export interface LoanCalculation {
  type: string;
  principal?: number;
  original_principal?: number;
  remaining_principal: number;
  interest_due: number;
  total_payable: number;
  total_paid: number;
  total_interest?: number;
  payment_breakdown: PaymentBreakdown[];
}

export interface PaymentBreakdown {
  payment_id: number;
  payment_date: string;
  amount: number;
  interest_portion?: number;
  principal_portion?: number;
  outstanding_principal_after?: number;
  remarks?: string;
}

// ── Payments ──────────────────────────────────────────────
export const paymentApi = {
  getByLoan: (loanId: number) =>
    apiFetch<{ success: boolean; data: { loan: Loan; payments: Payment[] } }>(
      `/payments/${loanId}`,
    ),
  create: (body: Partial<Payment>) =>
    apiFetch<{ success: boolean; data: Payment }>("/payments", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; data: Payment }>(`/payments/${id}`, {
      method: "DELETE",
    }),
};

export interface Payment {
  payment_id: number;
  loan_id: number;
  payment_amount: number;
  payment_date: string;
  remarks?: string;
  created_at: string;
}

// ── Fixed Deposits ─────────────────────────────────────────
export const fdApi = {
  getAll: (customerId?: number) =>
    apiFetch<{ success: boolean; data: FD[] }>(
      `/fixed-deposits${customerId ? `?customer_id=${customerId}` : ""}`,
    ),
  getOne: (id: number) =>
    apiFetch<{ success: boolean; data: FD }>(`/fixed-deposits/${id}`),
  create: (body: Partial<FD>) =>
    apiFetch<{ success: boolean; data: FD }>("/fixed-deposits", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: number) =>
    apiFetch<{ success: boolean; data: FD }>(`/fixed-deposits/${id}`, {
      method: "DELETE",
    }),
  calculate: (body: Partial<FD>) =>
    apiFetch<{ success: boolean; data: FDMaturity }>(
      "/fixed-deposits/calculate",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
};

export interface FD {
  fd_id: number;
  customer_id: number;
  deposit_amount: number;
  interest_rate: number;
  interest_type: "simple" | "compound";
  compounding_frequency?: "monthly" | "quarterly" | "half_yearly" | "yearly";
  start_date: string;
  duration_months: number;
  customer?: Customer;
  maturity_amount: number;
  interest_earned: number;
  maturity_date: string;
  created_at: string;
}

export interface FDMaturity {
  maturity_amount: number;
  interest_earned: number;
  maturity_date: string;
}

// ── Reports ───────────────────────────────────────────────
export const reportApi = {
  getLoanLedger: (loanId: number) =>
    apiFetch<{ success: boolean; data: LoanLedgerReport }>(
      `/reports/loan-ledger/${loanId}`,
    ),
  getOutstandingLoans: () =>
    apiFetch<{ success: boolean; data: OutstandingLoan[] }>(
      `/reports/outstanding-loans`,
    ),
  getFdMaturity: () =>
    apiFetch<{ success: boolean; data: FDMaturityReport[] }>(
      `/reports/fd-maturity`,
    ),
  downloadLoanLedger: (loanId: number) =>
    apiDownload(
      `/reports/loan-ledger/${loanId}/pdf`,
      `loan_ledger_${loanId}.pdf`,
    ),
  downloadLoanLedgerCSV: (loanId: number) =>
    apiDownload(
      `/reports/loan-ledger/${loanId}/csv`,
      `loan_ledger_${loanId}.csv`,
    ),
  downloadFDMaturity: () =>
    apiDownload(`/reports/fd-maturity/pdf`, `fd_maturity_report.pdf`),
  downloadCustomerSummary: (customerId: number) =>
    apiDownload(
      `/reports/customer-summary/${customerId}/pdf`,
      `customer_${customerId}_summary.pdf`,
    ),
};

export interface LoanLedgerReport {
  loan_id: number;
  type: string;
  original_principal: number;
  current_outstanding: number;
  ledger: {
    date: string;
    type: string;
    withdrawal: number;
    payment: number;
    interest_charged: number;
    principal_paid: number;
    remaining_balance: number;
    remarks?: string;
  }[];
}

export interface OutstandingLoan {
  loan_id: number;
  customer_name: string;
  account_number: string;
  loan_amount: number;
  interest_type: string;
  start_date: string;
  duration_months: number;
  total_paid: number;
  remaining_balance: number;
  interest_due: number;
}

export interface FDMaturityReport {
  fd_id: number;
  customer_name: string;
  account_number: string;
  deposit_amount: number;
  start_date: string;
  duration_months: number;
  maturity_date: string;
  maturity_amount: number;
  interest_earned: number;
}
