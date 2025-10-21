-- Create payments table for payment tracking
-- Run this in your Supabase SQL Editor

-- Drop payments table if it exists (to recreate with correct structure)
DROP TABLE IF EXISTS payments;

-- Create payments table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    client_id VARCHAR(50) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Create indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Disable RLS for payments table (same as clients table)
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- Verify the payments table was created
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payments' 
ORDER BY ordinal_position;