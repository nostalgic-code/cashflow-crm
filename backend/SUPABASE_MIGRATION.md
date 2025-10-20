# Switch to Supabase PostgreSQL Database

## Why Switch?
- No SSL handshake issues
- Already integrated with your auth system
- Free tier with good limits
- Better integration with your existing setup

## Setup Steps:

### 1. Create Tables in Supabase
Go to your Supabase dashboard → SQL Editor and run:

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supabase_id UUID REFERENCES auth.users(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clients table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    id_number TEXT,
    loan_type TEXT DEFAULT 'Secured Loan',
    loan_amount DECIMAL(10,2) NOT NULL,
    interest_rate DECIMAL(5,2) DEFAULT 50.0,
    start_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    monthly_payment DECIMAL(10,2),
    amount_paid DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'new-lead',
    application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_status_update TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    reference TEXT,
    notes TEXT,
    processed_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (supabase_id = auth.uid());
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (supabase_id = auth.uid());
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (supabase_id = auth.uid());

CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can insert own clients" ON clients FOR INSERT WITH CHECK (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));
CREATE POLICY "Users can update own clients" ON clients FOR UPDATE USING (user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid()));

CREATE POLICY "Users can view own payments" ON payments FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())));
CREATE POLICY "Users can insert own payments" ON payments FOR INSERT WITH CHECK (client_id IN (SELECT id FROM clients WHERE user_id IN (SELECT id FROM users WHERE supabase_id = auth.uid())));
```

### 2. Update Backend to Use Supabase
Replace MongoDB with Supabase PostgreSQL using the Python client.

### 3. Environment Variables
```
SUPABASE_URL=https://ehlbupxheknhdycjxjdm.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

This eliminates all SSL issues and provides better integration!