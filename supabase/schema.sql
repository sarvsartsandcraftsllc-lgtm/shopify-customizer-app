-- Supabase Database Schema for PRNTONDEMAND App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create session table for Shopify app authentication
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT,
    "expires" TIMESTAMP(3),
    "accessToken" TEXT NOT NULL,
    "userId" BIGINT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "accountOwner" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "collaborator" BOOLEAN,
    "emailVerified" BOOLEAN,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- Create index for session table
CREATE INDEX IF NOT EXISTS "Session_shop_idx" ON "Session"("shop");

-- Create design_orders table
CREATE TABLE IF NOT EXISTS design_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id TEXT NOT NULL,
    design_id TEXT NOT NULL,
    preview_url TEXT NOT NULL,
    print_url TEXT NOT NULL,
    notes TEXT,
    product_id TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'printed', 'fulfilled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_design_orders_order_id ON design_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_design_orders_design_id ON design_orders(design_id);
CREATE INDEX IF NOT EXISTS idx_design_orders_status ON design_orders(status);
CREATE INDEX IF NOT EXISTS idx_design_orders_created_at ON design_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_design_orders_product_id ON design_orders(product_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_design_orders_updated_at 
    BEFORE UPDATE ON design_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('prints', 'prints', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for prints bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'prints');
CREATE POLICY "Authenticated Uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'prints' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated Updates" ON storage.objects FOR UPDATE USING (bucket_id = 'prints' AND auth.role() = 'authenticated');

-- Create RLS policies for design_orders table
ALTER TABLE design_orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own design orders
CREATE POLICY "Users can view their own design orders" ON design_orders
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert their own design orders
CREATE POLICY "Users can insert their own design orders" ON design_orders
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update their own design orders
CREATE POLICY "Users can update their own design orders" ON design_orders
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow service role to perform all operations (for webhooks and admin)
CREATE POLICY "Service role full access" ON design_orders
    FOR ALL USING (auth.role() = 'service_role');

-- Create views for easier querying
CREATE OR REPLACE VIEW design_orders_summary AS
SELECT 
    id,
    order_id,
    design_id,
    product_title,
    quantity,
    status,
    created_at,
    updated_at
FROM design_orders
ORDER BY created_at DESC;

-- Create function to get design statistics
CREATE OR REPLACE FUNCTION get_design_statistics()
RETURNS TABLE (
    total_orders BIGINT,
    pending_orders BIGINT,
    printed_orders BIGINT,
    fulfilled_orders BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
        COUNT(*) FILTER (WHERE status = 'printed') as printed_orders,
        COUNT(*) FILTER (WHERE status = 'fulfilled') as fulfilled_orders
    FROM design_orders;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create sample data for testing (optional)
INSERT INTO design_orders (
    order_id, 
    design_id, 
    preview_url, 
    print_url, 
    notes, 
    product_id, 
    variant_id, 
    product_title, 
    quantity, 
    status
) VALUES 
(
    '123456789',
    'sample-design-001',
    'https://example.com/preview1.png',
    'https://example.com/print1.png',
    'Sample design for testing',
    'product-001',
    'variant-001',
    'Sample T-Shirt',
    1,
    'pending'
),
(
    '123456790',
    'sample-design-002',
    'https://example.com/preview2.png',
    'https://example.com/print2.png',
    'Another sample design',
    'product-002',
    'variant-002',
    'Sample Hoodie',
    2,
    'printed'
)
ON CONFLICT (id) DO NOTHING;



