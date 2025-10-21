-- Create loans table for tracking multiple loans per client
-- Run this in your Supabase SQL Editor

-- Create loans table (each individual loan amount)
CREATE TABLE IF NOT EXISTS loans (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    loan_amount DECIMAL(12,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 50.0,
    loan_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for loans table
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_loan_date ON loans(loan_date);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date);

-- Disable RLS for loans table
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;

-- Add archived column to clients table for hiding paid clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_clients_archived ON clients(archived);

-- Create a view for active clients (not archived)
CREATE OR REPLACE VIEW active_clients AS
SELECT * FROM clients WHERE archived = FALSE;

-- Verify the tables were created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('loans', 'clients') AND column_name IN ('id', 'client_id', 'loan_amount', 'archived')
ORDER BY table_name, ordinal_position;