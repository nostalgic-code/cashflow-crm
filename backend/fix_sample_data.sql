-- Fix sample data and check what's in the database
-- Run this in your Supabase SQL Editor

-- First, let's see what we currently have
SELECT id, first_name, last_name, status, loan_type, loan_amount, created_at 
FROM clients 
ORDER BY created_at DESC;

-- Update one record to be a new lead for testing
UPDATE clients 
SET status = 'new-lead' 
WHERE custom_id = 'CL001';

-- Update the other to be active  
UPDATE clients 
SET status = 'active' 
WHERE custom_id = 'CL002';

-- Add a custom_id to any records that don't have one
UPDATE clients 
SET custom_id = 'CL' || LPAD(id::text, 3, '0') 
WHERE custom_id IS NULL;

-- Check the results
SELECT id, custom_id, first_name, last_name, status, loan_type, loan_amount, created_at 
FROM clients 
ORDER BY created_at DESC;