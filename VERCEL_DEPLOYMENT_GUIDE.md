# Vercel Deployment Configuration Guide

## Critical: Environment Variables Setup

The blank white screen issue is caused by missing environment variables in Vercel. Follow these steps to configure them.

---

## Option 1: Vercel Dashboard (Recommended)

### Step 1: Access Project Settings
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: **OmniLink-APEX**
3. Click **Settings** tab
4. Navigate to **Environment Variables** section

### Step 2: Add Required Variables

Add these **2 required environment variables**:

#### Variable 1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://wwajmaohwcbooljdureo.supabase.co
Environment: Production, Preview, Development (select all)
```

#### Variable 2: VITE_SUPABASE_PUBLISHABLE_KEY
```
Name: VITE_SUPABASE_PUBLISHABLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YWptYW9od2Nib29samR1cmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEzNjAsImV4cCI6MjA3NDk5NzM2MH0.mVUv2O8zSi9CjspgSUlUMUnr69N4gJTCXxEjJBAg-Dg
Environment: Production, Preview, Development (select all)
```

**Note**: These are public anon keys and safe to expose. They're already in your codebase.

### Step 3: Trigger Redeploy
After adding environment variables:
1. Go to **Deployments** tab
2. Find the latest deployment
3. Click the **⋯** menu (three dots)
4. Select **Redeploy**
5. Confirm the redeployment

**Important**: Vercel needs to rebuild the app with the environment variables injected at build time.

---

## Option 2: Vercel CLI (Alternative)

If you prefer using the CLI, install and configure:

### Install Vercel CLI
```bash
npm install -g vercel
```

### Login to Vercel
```bash
vercel login
```

### Link Project
```bash
cd /home/user/OmniLink-APEX
vercel link
```

### Set Environment Variables
```bash
# Production
vercel env add VITE_SUPABASE_URL production
# Paste: https://wwajmaohwcbooljdureo.supabase.co

vercel env add VITE_SUPABASE_PUBLISHABLE_KEY production
# Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3YWptYW9od2Nib29samR1cmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjEzNjAsImV4cCI6MjA3NDk5NzM2MH0.mVUv2O8zSi9CjspgSUlUMUnr69N4gJTCXxEjJBAg-Dg

# Preview (optional but recommended)
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY preview

# Development (optional)
vercel env add VITE_SUPABASE_URL development
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY development
```

### Deploy
```bash
vercel --prod
```

---

## Verification Steps

### 1. Check Build Logs
After redeployment:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check **Build Logs**
4. Look for environment variable injection:
   ```
   ✓ Environment variables loaded
   ```

### 2. Verify Deployment
Once deployed, test the live site:

```bash
# Check if the app loads (should not be blank white screen)
curl -I https://your-domain.vercel.app

# Check health endpoint
curl https://your-domain.vercel.app/health
# Expected: {"status": "OK", ...}
```

### 3. Browser Console Check
Open your deployed site in a browser:
1. Open DevTools (F12)
2. Check **Console** tab
3. **Should NOT see**:
   - "Supabase is not configured"
   - "ReferenceError: createDebugLogger is not defined"
   - Any CORS errors to Supabase

4. **Should see**:
   - "✅ Using YOUR Supabase instance: https://wwajmaohwcbooljdureo.supabase.co"
   - "✅ Monitoring initialized"
   - "✅ Security initialized"

### 4. Network Tab Check
1. Open DevTools → **Network** tab
2. Reload the page
3. Filter by "supabase"
4. **Should see**: Successful requests to `wwajmaohwcbooljdureo.supabase.co`
5. **Should NOT see**: 401 Unauthorized or CORS errors

---

## Common Issues & Solutions

### Issue: "Still seeing blank white screen"
**Solution**: Clear browser cache and hard reload (Ctrl+Shift+R / Cmd+Shift+R)

### Issue: "Environment variables not taking effect"
**Solution**:
1. Verify variables are set for correct environment (Production/Preview)
2. Make sure you triggered a **new deployment** (not just refresh)
3. Wait for build to complete fully

### Issue: "Build succeeds but app doesn't load"
**Solution**:
1. Check browser console for JavaScript errors
2. Verify network requests to Supabase are successful
3. Check CSP headers aren't blocking requests

### Issue: "Supabase connection errors"
**Solution**:
1. Verify the anon key is correct (starts with "eyJhbGci...")
2. Check Supabase project status at https://status.supabase.com
3. Verify RLS policies in Supabase dashboard

---

## Security Notes

### Are these keys safe to expose?
**Yes** - These are **public anon keys** designed to be exposed in client-side code:
- They're already in your git history
- They're embedded in the built JavaScript
- They're protected by Row Level Security (RLS) policies
- They only have anon-level permissions

### What's protected?
- **Service Role Key**: Never expose this (used in Edge Functions only)
- **Database Password**: Never expose this
- **User Data**: Protected by RLS policies

---

## Next Steps After Deployment

1. ✅ Verify the app loads without white screen
2. ✅ Test user authentication flow
3. ✅ Test data operations (links, files, etc.)
4. ✅ Monitor error logs in Vercel dashboard
5. ✅ Set up proper error tracking (Sentry)

---

## Additional Fixes Applied

### ✅ ErrorBoundary Import Fix
- **File**: `src/components/ErrorBoundary.tsx`
- **Fix**: Added missing `createDebugLogger` import
- **Commit**: `b62026c - fix: Add missing createDebugLogger import to ErrorBoundary`

This fix resolves the cascading failure when errors occur in the app.

---

## Support & Troubleshooting

If issues persist after following this guide:

1. **Check build logs** in Vercel dashboard for errors
2. **Review browser console** for JavaScript errors
3. **Verify Supabase** project is active and accessible
4. **Compare** with local development (npm run dev should work)

For detailed root cause analysis, see: `PRODUCTION_BLOCKERS_ANALYSIS.md`
