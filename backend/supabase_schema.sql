-- Supabase PostgreSQL Schema for Cashflow CRM
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
    id SERIAL PRIMARY KEY,
    custom_id VARCHAR(50) UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    address TEXT,
    loan_amount DECIMAL(12,2) DEFAULT 0,
    amount_paid DECIMAL(12,2) DEFAULT 0,
    loan_type VARCHAR(50) DEFAULT 'Secured Loan',
    status VARCHAR(20) DEFAULT 'active',
    repayment_due_date DATE,
    last_payment_date DATE,
    last_status_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'general',
    created_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    supabase_id UUID UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create documents table (for future use)
CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    file_type VARCHAR(50),
    file_size INTEGER,
    uploaded_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_custom_id ON clients(custom_id);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_notes_client_id ON notes(client_id);
CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow authenticated users to access all data for now)
-- You can make these more restrictive later

-- Clients policies
CREATE POLICY "Allow authenticated users to view clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update clients" ON clients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete clients" ON clients
    FOR DELETE USING (auth.role() = 'authenticated');

-- Payments policies
CREATE POLICY "Allow authenticated users to view payments" ON payments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert payments" ON payments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update payments" ON payments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete payments" ON payments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Notes policies
CREATE POLICY "Allow authenticated users to view notes" ON notes
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert notes" ON notes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update notes" ON notes
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete notes" ON notes
    FOR DELETE USING (auth.role() = 'authenticated');

-- Users policies
CREATE POLICY "Allow authenticated users to view users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update users" ON users
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Documents policies
CREATE POLICY "Allow authenticated users to view documents" ON documents
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert documents" ON documents
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update documents" ON documents
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete documents" ON documents
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert some sample data (optional)
INSERT INTO clients (
    custom_id, first_name, last_name, email, phone, address,
    loan_amount, amount_paid, loan_type, status, repayment_due_date
) VALUES 
(
    'CL001', 'John', 'Doe', 'john.doe@example.com', '+1234567890',
    '123 Main St, City, Country', 10000.00, 2500.00, 'Secured Loan',
    'active', '2025-12-31'
),
(
    'CL002', 'Jane', 'Smith', 'jane.smith@example.com', '+1234567891',
    '456 Oak Ave, City, Country', 15000.00, 0.00, 'Unsecured Loan',
    'active', '2025-11-30'
)
    'active', '2025-11-30'
)
ON CONFLICT (custom_id) DO NOTHING;

-- Create a view for analytics
CREATE OR REPLACE VIEW client_analytics AS
SELECT 
    COUNT(*) as total_clients,
    SUM(loan_amount) as total_loan_amount,
    SUM(amount_paid) as total_amount_paid,
    SUM(loan_amount * 1.5) as total_amount_due,
    SUM(GREATEST(0, (loan_amount * 1.5) - amount_paid)) as total_outstanding,
    COUNT(CASE WHEN status IN ('active', 'repayment-due', 'overdue') THEN 1 END) as active_loans,
    COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count,
    COUNT(CASE WHEN status = 'paid' THEN 1 END) as paid_count,
    CASE 
        WHEN SUM(loan_amount * 1.5) > 0 
        THEN (SUM(amount_paid) / SUM(loan_amount * 1.5) * 100)
        ELSE 0 
    END as repayment_rate,
    CASE 
        WHEN COUNT(*) > 0 
        THEN SUM(loan_amount) / COUNT(*)
        ELSE 0 
    END as avg_loan_amount
FROM clients;