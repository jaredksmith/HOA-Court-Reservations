# Vercel Deployment Guide for HOA Court Reservations

## 🚀 Quick Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Local development working
- [ ] GitHub repository connected to Vercel
- [ ] Environment variables configured in Vercel
- [ ] Build and deployment successful
- [ ] Production testing completed

## 1. Pre-Deployment Setup

### 1.1 Ensure Local Development Works
Before deploying, make sure everything works locally:

```bash
# Test your database connection
npm run test:db

# Start development server
npm run dev

# Test core functionality:
# - User registration/login
# - Profile creation
# - Booking creation
```

### 1.2 Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Prepare for deployment"
git push origin main
```

## 2. Vercel Project Setup

### 2.1 Connect GitHub Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository: `HOA-Court-Reservations`

### 2.2 Configure Build Settings

Vercel should auto-detect SvelteKit, but verify these settings:

- **Framework Preset**: SvelteKit
- **Build Command**: `npm run build`
- **Output Directory**: `.svelte-kit` (auto-detected)
- **Install Command**: `npm install`
- **Development Command**: `npm run dev`

## 3. Environment Variables Configuration

### 3.1 Required Environment Variables

In your Vercel project settings, add these environment variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Web Push Configuration
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key
VAPID_EMAIL=your_email@example.com

# Application Configuration
PUBLIC_APP_URL=https://your-app-domain.vercel.app
NODE_ENV=production
```

### 3.2 Setting Environment Variables in Vercel

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable:
   - **Name**: Variable name (e.g., `SUPABASE_URL`)
   - **Value**: Your actual value
   - **Environments**: Select Production, Preview, and Development

### 3.3 Environment Variable Security

- ✅ **Public variables** (prefixed with `PUBLIC_`): Safe to expose to client
- ❌ **Private variables**: Never expose service role keys or private keys
- 🔒 **VAPID keys**: Keep private keys secure

## 4. Supabase Configuration for Production

### 4.1 Update Supabase Project Settings

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Add your Vercel domain to allowed origins:
   - `https://your-app-domain.vercel.app`
   - `https://*.vercel.app` (for preview deployments)

### 4.2 Database Configuration

Ensure your production database has:
- ✅ All tables created (run `database-setup.sql`)
- ✅ RLS policies enabled
- ✅ Indexes created for performance
- ✅ Functions and triggers set up

## 5. Deployment Process

### 5.1 Initial Deployment

1. **Trigger Deployment**:
   - Push to main branch, or
   - Click "Deploy" in Vercel dashboard

2. **Monitor Build Process**:
   - Watch build logs for errors
   - Check for missing environment variables
   - Verify successful compilation

3. **Verify Deployment**:
   - Visit your deployed URL
   - Test basic functionality
   - Check browser console for errors

### 5.2 Preview Deployments

Vercel automatically creates preview deployments for:
- Pull requests
- Non-main branch pushes

These use the same environment variables but different URLs.

## 6. Post-Deployment Testing

### 6.1 Functional Testing

Test these core features in production:

1. **Authentication**:
   ```
   ✅ User registration
   ✅ User login/logout
   ✅ Session persistence
   ```

2. **Profile Management**:
   ```
   ✅ Profile creation
   ✅ Profile updates
   ✅ Hour balance display
   ```

3. **Booking System**:
   ```
   ✅ Create booking
   ✅ Invite participants
   ✅ Accept/decline invitations
   ✅ Booking confirmation
   ```

4. **Push Notifications**:
   ```
   ✅ Subscription registration
   ✅ Notification delivery
   ✅ Notification actions
   ```

### 6.2 Performance Testing

Monitor these metrics:
- Page load times
- Database query performance
- API response times
- Core Web Vitals

## 7. Troubleshooting Common Issues

### 7.1 Build Failures

**Error**: `Missing environment variables`
```bash
# Solution: Add all required env vars in Vercel dashboard
# Check: Settings → Environment Variables
```

**Error**: `Module not found`
```bash
# Solution: Ensure all dependencies are in package.json
npm install --save missing-package
```

### 7.2 Runtime Errors

**Error**: `Supabase connection failed`
```bash
# Check: Environment variables are correctly set
# Check: Supabase project is active
# Check: API keys are valid
```

**Error**: `CORS errors`
```bash
# Solution: Add Vercel domain to Supabase allowed origins
# Check: Supabase project settings → API → CORS
```

### 7.3 Database Issues

**Error**: `Table doesn't exist`
```bash
# Solution: Run ../database/database-setup.sql in Supabase SQL editor
# Check: All tables are created with correct schema
```

**Error**: `RLS policy violation`
```bash
# Solution: Verify RLS policies are correctly configured
# Check: User authentication is working
```

## 8. Monitoring and Maintenance

### 8.1 Set Up Monitoring

1. **Vercel Analytics**: Enable in project settings
2. **Supabase Monitoring**: Check database performance
3. **Error Tracking**: Monitor function logs

### 8.2 Regular Maintenance

- Monitor database performance
- Update dependencies regularly
- Review and rotate API keys
- Monitor user feedback and errors

## 9. Scaling Considerations

### 9.1 Database Scaling

- Monitor connection limits
- Optimize queries with indexes
- Consider read replicas for heavy read workloads

### 9.2 Application Scaling

- Vercel automatically scales functions
- Monitor function execution time
- Optimize bundle size for better performance

## 10. Security Best Practices

### 10.1 Environment Security

- ✅ Never commit `.env` files
- ✅ Rotate API keys regularly
- ✅ Use different projects for dev/prod
- ✅ Monitor access logs

### 10.2 Application Security

- ✅ Validate all user inputs
- ✅ Use RLS policies consistently
- ✅ Implement proper authentication
- ✅ Monitor for suspicious activity

## Success! 🎉

Once deployed successfully, your HOA Court Reservations app will be:
- ✅ Accessible at your Vercel domain
- ✅ Connected to your Supabase database
- ✅ Ready for user registration and bookings
- ✅ Automatically deployed on future pushes

## Next Steps

1. **User Testing**: Invite beta users to test the system
2. **Documentation**: Create user guides and admin documentation
3. **Monitoring**: Set up alerts for errors and performance issues
4. **Feedback**: Collect user feedback for improvements
