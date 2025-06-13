# Environment Variables Configuration

This document outlines all the environment variables required for the HOA Court Reservations application.

## Required Environment Variables

### Database Configuration (Supabase)
```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=your_supabase_project_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Email Service Configuration (Resend)
```env
# Resend Email Service
RESEND_API_KEY=your_resend_api_key
```

## Environment Setup

### 1. Local Development (.env file)
Create a `.env` file in the root directory with the following structure:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Resend Email Service
RESEND_API_KEY=re_your_resend_api_key_here
```

### 2. Production Deployment (Vercel)
Set the following environment variables in your Vercel dashboard:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate values for your production environment

## Getting API Keys

### Supabase Keys
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the following:
   - **Project URL** → `PUBLIC_SUPABASE_URL`
   - **anon/public key** → `PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### Resend API Key
1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to API Keys
3. Create a new API key
4. Copy the key → `RESEND_API_KEY`

## Email Configuration Notes

### Resend Setup
- **Current Configuration**: Using Resend's default domain (`onboarding@resend.dev`) for development
- **Production**: You'll need to configure and verify a custom domain in Resend
- **From Address**: Currently set to `HOA Court Reservations <onboarding@resend.dev>`
- **Production Update Required**: Change to your verified domain before production deployment

### ⚠️ Development vs Production
- **Development**: Uses `onboarding@resend.dev` (no domain verification needed)
- **Production**: Must use verified custom domain (e.g., `noreply@yourdomain.com`)

### Email Template Customization
The password reset email template can be customized in:
- File: `src/lib/server/email/index.ts`
- Function: `emailTemplates.passwordReset()`

## Database Migration

Before using the password reset functionality, run the database migration:

1. Open your Supabase SQL Editor
2. Run the script from `database-password-reset-migration.sql`
3. This creates the `password_reset_tokens` table and required functions

## Security Considerations

### Environment Variable Security
- **Never commit** `.env` files to version control
- **Use different keys** for development and production
- **Rotate keys regularly** for production environments

### Email Security
- Password reset tokens expire after 1 hour
- Tokens are single-use (marked as used after validation)
- Email addresses are not revealed in error messages for security

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check `RESEND_API_KEY` is correctly set
   - Verify domain is configured in Resend
   - Check server logs for detailed error messages

2. **Database errors**
   - Ensure migration script has been run
   - Check `SUPABASE_SERVICE_ROLE_KEY` permissions
   - Verify RLS policies are correctly configured

3. **Token validation errors**
   - Check token hasn't expired (1 hour limit)
   - Verify token hasn't been used already
   - Ensure database functions are properly created

### Debug Mode
To enable detailed logging, check the server console for:
- `🔐` Password reset request logs
- `✅` Success operation logs  
- `❌` Error logs with detailed messages

## Production Checklist

Before deploying to production:

- [ ] All environment variables are set in Vercel
- [ ] Database migration has been run
- [ ] Resend domain is verified and configured
- [ ] Email templates are customized with correct branding
- [ ] Test the complete password reset flow
- [ ] Verify email delivery in production environment
