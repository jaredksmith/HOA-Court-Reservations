# Supabase API Keys Reference Guide

## 🔑 Quick Reference: Which Key to Use

| Environment Variable | Supabase Dashboard Location | Purpose |
|---------------------|----------------------------|---------|
| `SUPABASE_URL` | Settings → API → Project URL | Your project's API endpoint |
| `SUPABASE_ANON_KEY` | Settings → API → Project API keys → **anon public** | Client-side operations, respects RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → **service_role** | Server-side admin operations, bypasses RLS |

## 📍 Exact Navigation Path

1. **Go to your Supabase project dashboard**
2. **Click "Settings"** (gear icon in left sidebar)
3. **Click "API"** in the settings menu
4. **Find "Project API keys" section** (NOT "JWT Secret")

## 🎯 Visual Guide

```
Supabase Dashboard → Settings → API
┌─────────────────────────────────────────────────────────────┐
│ Project URL                                                 │
│ https://your-project-ref.supabase.co                       │ ← SUPABASE_URL
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Project API keys                                            │
│                                                             │
│ anon                                                        │
│ public                                                      │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz... │ ← SUPABASE_ANON_KEY
│ [Copy] [Reveal]                                             │
│                                                             │
│ service_role                                                │
│ secret                                                      │
│ eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFz... │ ← SUPABASE_SERVICE_ROLE_KEY
│ [Copy] [Reveal]                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ JWT Secret                                                  │
│ your-jwt-secret-here                                        │ ← ❌ DON'T use this for .env
│ [Copy] [Reveal]                                             │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Correct .env File Setup

```env
# ✅ CORRECT - Copy these exact values from Supabase dashboard
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...     # From "anon public"
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... # From "service_role"

# ❌ WRONG - Don't use JWT Secret
# SUPABASE_SERVICE_ROLE_KEY=your-jwt-secret-value
```

## 🔍 How to Identify the Correct Keys

### **SUPABASE_ANON_KEY** (anon public)
- ✅ Labeled as "anon" and "public" in dashboard
- ✅ Safe to expose to client-side code
- ✅ Used for user authentication and RLS-protected operations
- ✅ Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **SUPABASE_SERVICE_ROLE_KEY** (service_role)
- ✅ Labeled as "service_role" and "secret" in dashboard
- ❌ Never expose to client-side code
- ✅ Used for admin operations that bypass RLS
- ✅ Starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **JWT Secret** (NOT for .env)
- ❌ Don't use this for environment variables
- ✅ Used internally by Supabase for token verification
- ✅ Usually a shorter string, not a JWT token

## 🛡️ Security Best Practices

### **Service Role Key Security**
```typescript
// ✅ CORRECT - Server-side only
// src/lib/server/db/admin.ts
import { supabaseAdmin } from './index.js';

export async function adminFunction() {
  return await supabaseAdmin.from('profiles').select('*');
}

// ❌ WRONG - Never in client-side code
// src/lib/components/SomeComponent.svelte
// const supabase = createClient(url, SERVICE_ROLE_KEY); // Exposed to browser!
```

### **Environment Variable Protection**
```bash
# ✅ Ensure .env is in .gitignore
echo ".env" >> .gitignore

# ✅ Use different projects for dev/prod
# Development: your-project-dev.supabase.co
# Production: your-project-prod.supabase.co
```

## 🧪 Testing Your Setup

```bash
# Test that you have the correct keys
npm run test:db

# Should show:
# ✅ Connection: Success
# ✅ Auth Setup: Success
# ✅ All tables found
```

## ❓ Common Issues

### **"Invalid API key" Error**
- ✅ Check you're using "service_role" key, not JWT Secret
- ✅ Verify no extra spaces or characters in .env file
- ✅ Ensure key is from correct Supabase project

### **"Row Level Security" Errors**
- ✅ This is expected for service_role operations
- ✅ Means your RLS policies are working correctly
- ✅ Service role bypasses RLS as intended

### **"Missing environment variables" Error**
- ✅ Check .env file exists in project root
- ✅ Verify all three variables are set
- ✅ Restart development server after changing .env

## 📞 Need Help?

If you're still having trouble:
1. Double-check you're in the right Supabase project
2. Verify the keys are copied exactly (no truncation)
3. Try regenerating the keys in Supabase dashboard
4. Check browser network tab for specific error messages
