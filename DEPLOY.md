# Deployment Guide — TokoBox ERP

## Prerequisites

- Node.js 18+ installed
- GitHub account
- Vercel account (free tier is sufficient)
- Supabase project already created and running
- `supabase` CLI installed (`npm i -g supabase`)

---

## Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Phase 9: Deploy preparation"
git branch -M main
git remote add origin https://github.com/<username>/tokobox-erp.git
git push -u origin main
```

## Step 2: Link Repository in Vercel

1. Go to [vercel.com](https://vercel.com) and create a new project
2. Import your GitHub repository
3. Select the `tokobox-erp` directory as root
4. Framework Preset: **Next.js**

## Step 3: Set Environment Variables

In Vercel project settings, add these environment variables:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (**Secret**, not public) |

> **WARNING:** Never expose `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_` prefixed variables. This key bypasses RLS!

## Step 4: Apply RLS Migrations

RLS policies are critical for data security. Apply them before deploying:

### Option A: Using Supabase CLI (recommended)

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### Option B: Using migrate.ts script

```bash
# Install tsx if not available
npm i -g tsx

# Run migration script
npx tsx scripts/migrate.ts
```

### Option C: Via Supabase Dashboard

1. Go to SQL Editor in Supabase dashboard
2. Copy contents of `supabase/migrations/001_rls_policies.sql`
3. Run the SQL

## Step 5: Deploy

Click "Deploy" in Vercel dashboard. The build will run automatically.

Build output should show:
- ✅ Next.js build completed
- ✅ No TypeScript errors
- ✅ Bundle size under 500KB (client bundle)

## Step 6: Smoke Test

After deployment, verify:

1. **Login page** → `https://<your-app>.vercel.app/login`
   - Should load without errors
2. **Registration** → Create a test account
3. **Dashboard** → `/dashboard`
   - Should redirect to login if not authenticated
   - Should load with correct session after login
4. **API routes** → Check that Supabase connection works
5. **RLS verification** → Ensure user can only see their own store data

## Rollback

If something breaks:

```bash
# Revert to previous commit
git revert HEAD

# Or deploy previous version from Vercel dashboard
# Settings > Deployments > Click "Redeploy" on previous deployment
```

## Troubleshooting

### Build fails

- Check `.env.local` has correct Supabase credentials
- Run `npm run build` locally to debug
- Check for unused imports/variables (strict TypeScript mode)

### RLS blocks all access

- Verify `store_id` matches `auth.uid()` correctly
- Temporarily disable RLS for debugging: `ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;`
- Remember to re-enable after fixing

### CORS errors

- Add your Vercel domain to Supabase's Redirect URLs
- Check middleware.ts configuration

### Large bundle size

- Use dynamic imports for heavy libraries (xlsx)
- Check `next build` output for bundle breakdown
- Consider code splitting for feature components
