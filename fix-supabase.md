# Fix Supabase Connection

## Step 1: Check Supabase Project Status
1. Go to https://supabase.com/dashboard
2. Find your PRNTONDEMAND project
3. If it shows "Paused", click "Resume" to unpause it

## Step 2: Get New DATABASE_URL
1. In your Supabase project dashboard, go to Settings > Database
2. Copy the "Connection string" under "Connection pooling"
3. It should look like: `postgresql://postgres:[password]@aws-1-us-east-1.pooler.supabase.com:5432/postgres`

## Step 3: Update Vercel Environment
1. Run: `vercel env add DATABASE_URL production`
2. Paste the new connection string when prompted

## Step 4: Create Session Table
1. In Supabase dashboard, go to SQL Editor
2. Run the contents of `setup-supabase.sql` file
3. This will create the required Session table

## Step 5: Deploy
1. Run: `npx vercel --prod`
2. Test your app

## Alternative: If Supabase is completely broken
If you can't access your old Supabase project, create a new one:
1. Go to https://supabase.com/dashboard
2. Create new project
3. Get the new DATABASE_URL
4. Run the setup-supabase.sql script
5. Update Vercel environment variables
