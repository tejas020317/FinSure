-- =============================================
-- Bank Loan and Deposit Management System
-- PostgreSQL Database Schema
-- =============================================

-- Create database (run manually if needed)
-- CREATE DATABASE bank_loan_db;

-- =============================================
-- 1. Users Table (admin / officer accounts)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    email           VARCHAR(150)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'officer'
                        CHECK (role IN ('admin', 'officer')),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- =============================================
-- 2. Customers Table
-- =============================================
CREATE TABLE IF NOT EXISTS customers (
    customer_id     SERIAL PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    phone           VARCHAR(20),
    address         TEXT,
    email           VARCHAR(150)    UNIQUE,
    account_number  VARCHAR(30)     NOT NULL UNIQUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- =============================================
-- 3. Loans Table
-- =============================================
CREATE TABLE IF NOT EXISTS loans (
    loan_id             SERIAL PRIMARY KEY,
    customer_id         INTEGER         NOT NULL
                            REFERENCES customers(customer_id)
                            ON DELETE CASCADE,
    loan_amount         DECIMAL(15, 2)  NOT NULL,
    interest_rate       DECIMAL(5, 2)   NOT NULL,
    interest_type       VARCHAR(20)     NOT NULL DEFAULT 'simple'
                            CHECK (interest_type IN ('simple', 'compound', 'reducing')),
    calculation_type    VARCHAR(30)     NOT NULL DEFAULT 'monthly'
                            CHECK (calculation_type IN ('daily', 'monthly', 'ANNUAL_MONTHLY_REDUCING', 'ANNUAL_DAILY_REDUCING', 'SIMPLE', 'COMPOUND')),
    loan_start_date     DATE            NOT NULL,
    duration_months     INTEGER         NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. Payments Table
-- =============================================
CREATE TABLE IF NOT EXISTS payments (
    payment_id      SERIAL PRIMARY KEY,
    loan_id         INTEGER         NOT NULL
                        REFERENCES loans(loan_id)
                        ON DELETE CASCADE,
    payment_amount  DECIMAL(15, 2)  NOT NULL,
    payment_date    DATE            NOT NULL,
    remarks         TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- =============================================
-- 5. Fixed Deposits Table
-- =============================================
CREATE TABLE IF NOT EXISTS fixed_deposits (
    fd_id                   SERIAL PRIMARY KEY,
    customer_id             INTEGER         NOT NULL
                                REFERENCES customers(customer_id)
                                ON DELETE CASCADE,
    deposit_amount          DECIMAL(15, 2)  NOT NULL,
    interest_rate           DECIMAL(5, 2)   NOT NULL,
    interest_type           VARCHAR(20)     NOT NULL DEFAULT 'simple'
                                CHECK (interest_type IN ('simple', 'compound')),
    compounding_frequency   VARCHAR(20)     DEFAULT 'quarterly'
                                CHECK (compounding_frequency IN ('monthly', 'quarterly', 'half_yearly', 'yearly')),
    start_date              DATE            NOT NULL,
    duration_months         INTEGER         NOT NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- =============================================
-- Indexes for faster lookups
-- =============================================
CREATE INDEX IF NOT EXISTS idx_loans_customer      ON loans(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_loan        ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_fixed_deposits_cust  ON fixed_deposits(customer_id);
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_account    ON customers(account_number);

-- =============================================
-- 6. Audit Logs Table
-- =============================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER         NOT NULL
                        REFERENCES users(id)
                        ON DELETE RESTRICT,
    action          VARCHAR(50)     NOT NULL,
    entity_type     VARCHAR(50)     NOT NULL,
    entity_id       INTEGER         NOT NULL,
    timestamp       TIMESTAMP       NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user      ON audit_logs(user_id);

-- =============================================
-- 7. Loan Transactions Table (Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS loan_transactions (
    id                  SERIAL PRIMARY KEY,
    loan_id             INTEGER         NOT NULL
                            REFERENCES loans(loan_id)
                            ON DELETE CASCADE,
    transaction_date    DATE            NOT NULL,
    transaction_type    VARCHAR(50)     NOT NULL
                            CHECK (transaction_type IN ('LOAN_DISBURSEMENT', 'PAYMENT', 'INTEREST_ENTRY', 'WITHDRAWAL')),
    deposit_amount      DECIMAL(15, 2)  DEFAULT 0,
    interest_charged    DECIMAL(15, 2)  DEFAULT 0,
    principal_paid      DECIMAL(15, 2)  DEFAULT 0,
    withdrawal_amount   DECIMAL(15, 2)  DEFAULT 0,
    remaining_balance   DECIMAL(15, 2)  NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_tx_loan      ON loan_transactions(loan_id);

-- =============================================
-- 7. Loan Transactions Table (Ledger)
-- =============================================
CREATE TABLE IF NOT EXISTS loan_transactions (
    id                  SERIAL PRIMARY KEY,
    loan_id             INTEGER         NOT NULL
                            REFERENCES loans(loan_id)
                            ON DELETE CASCADE,
    transaction_date    DATE            NOT NULL,
    transaction_type    VARCHAR(50)     NOT NULL
                            CHECK (transaction_type IN ('LOAN_DISBURSEMENT', 'PAYMENT', 'INTEREST_ENTRY', 'WITHDRAWAL')),
    deposit_amount      DECIMAL(15, 2)  DEFAULT 0,
    interest_charged    DECIMAL(15, 2)  DEFAULT 0,
    principal_paid      DECIMAL(15, 2)  DEFAULT 0,
    withdrawal_amount   DECIMAL(15, 2)  DEFAULT 0,
    remaining_balance   DECIMAL(15, 2)  NOT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_loan_tx_loan      ON loan_transactions(loan_id);
