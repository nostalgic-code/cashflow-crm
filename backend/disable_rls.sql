-- Disable Row Level Security for backend access
-- Run this in your Supabase SQL Editor

-- Disable RLS on clients table
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;

-- Disable RLS on other tables if they exist
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('clients', 'payments', 'notes', 'users');