-- Add missing columns to match frontend data
-- Run this in your Supabase SQL Editor

-- Add missing columns to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS application_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS id_number VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2) DEFAULT 50.0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(12,2);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_history JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS client_uuid VARCHAR(50) UNIQUE; -- For frontend UUID tracking

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_clients_application_date ON clients(application_date);
CREATE INDEX IF NOT EXISTS idx_clients_id_number ON clients(id_number);
CREATE INDEX IF NOT EXISTS idx_clients_due_date ON clients(due_date);
CREATE INDEX IF NOT EXISTS idx_clients_client_uuid ON clients(client_uuid);

-- Update existing records to have default values
UPDATE clients SET 
    application_date = created_at,
    interest_rate = 50.0,
    monthly_payment = loan_amount * 1.5,
    payment_history = '[]'::jsonb,
    documents = '[]'::jsonb
WHERE application_date IS NULL;

-- Check the updated schema
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY ordinal_position;