-- Update existing loan types to match frontend
-- Run this in your Supabase SQL Editor after creating the schema

-- Update the default value for loan_type column
ALTER TABLE clients ALTER COLUMN loan_type SET DEFAULT 'Secured Loan';

-- Update any existing records with old loan types
UPDATE clients SET loan_type = 'Secured Loan' WHERE loan_type = 'personal';
UPDATE clients SET loan_type = 'Unsecured Loan' WHERE loan_type = 'business';

-- Show current loan types in database
SELECT DISTINCT loan_type, COUNT(*) as count 
FROM clients 
GROUP BY loan_type;