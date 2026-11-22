-- SQL Script to create tables in Supabase for Indian Health Club

CREATE TABLE IF NOT EXISTS public.members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    age INT,
    weight NUMERIC,
    "startDate" TEXT,
    "durationMonths" NUMERIC,
    "durationDays" NUMERIC,
    "endDate" TEXT,
    amount NUMERIC,
    "paymentMethod" TEXT,
    "paymentStatus" TEXT DEFAULT 'pending',
    "utrNumber" TEXT,
    "wantsDiet" BOOLEAN DEFAULT false,
    "createdAt" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'current_settings',
    "gymName" TEXT DEFAULT 'INDIAN HEALTH CLUB',
    tagline TEXT DEFAULT 'Transform Your Body, Elevate Your Mind',
    "contactPhone" TEXT DEFAULT '+91 98765 43210',
    "upiId" TEXT DEFAULT 'indianhealthclub@upi',
    "merchantName" TEXT DEFAULT 'Indian Health Club',
    "adminPin" TEXT DEFAULT '1234',
    "customDayRate" NUMERIC DEFAULT 50,
    "qrImageUrl" TEXT,
    plans JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS and allow public access for anon key
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public full access to members" 
ON public.members FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Allow public full access to settings" 
ON public.settings FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);
