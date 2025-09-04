-- Setup script for Supabase Session table
-- Run this in your Supabase SQL editor after unpausing your project

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

-- Grant necessary permissions
GRANT ALL ON "Session" TO anon, authenticated;
GRANT ALL ON "Session" TO service_role;




