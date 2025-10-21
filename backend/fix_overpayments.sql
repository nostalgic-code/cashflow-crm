-- Fix corrupted client data with overpayments
-- Run this in your Supabase SQL Editor

-- Check for clients with overpayments (amount_paid > loan_amount * 1.5)
SELECT id, client_uuid, first_name, last_name, loan_amount, amount_paid, 
       (loan_amount * 1.5) as should_be_total_due,
       (amount_paid - (loan_amount * 1.5)) as overpayment
FROM clients 
WHERE amount_paid > (loan_amount * 1.5);

-- Reset overpaid clients to "paid" status with correct amounts
UPDATE clients 
SET 
    amount_paid = loan_amount * 1.5,
    status = 'paid',
    updated_at = NOW()
WHERE amount_paid > (loan_amount * 1.5);

-- Verify the fix
SELECT id, client_uuid, first_name, last_name, loan_amount, amount_paid, status
FROM clients 
WHERE amount_paid >= (loan_amount * 1.5);