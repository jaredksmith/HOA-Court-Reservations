# Email Configuration - HOA Court Reservations

## Current Configuration Status

### ⚠️ **DEVELOPMENT/TESTING CONFIGURATION**
The application is currently configured to use **Resend's default sending domain** for development and testing purposes.

**Current Email Sender**: `HOA Court Reservations <onboarding@resend.dev>`

## Issue Resolution

### Problem Identified
The password reset functionality was failing with a **403 Forbidden error** because:
- Application was configured to send from `noreply@hoacourtreservations.com`
- This domain was **not verified** in the Resend account
- Resend requires domain verification for custom domains

### Solution Applied
**Temporary Fix**: Updated email configuration to use Resend's default domain
- **File**: `src/lib/server/email/index.ts`
- **Change**: `noreply@hoacourtreservations.com` → `onboarding@resend.dev`
- **Status**: ✅ **Password reset now working**

## Production Deployment Requirements

### 🚨 **BEFORE PRODUCTION DEPLOYMENT**

#### 1. Domain Setup in Resend
1. **Login to Resend Dashboard**: [https://resend.com/domains](https://resend.com/domains)
2. **Add Your Domain**: Add your production domain (e.g., `hoacourtreservations.com`)
3. **Verify DNS Records**: Add required DNS records to verify ownership
4. **Wait for Verification**: Domain status must show "Verified"

#### 2. Update Email Configuration
Update `src/lib/server/email/index.ts`:
```typescript
// PRODUCTION CONFIGURATION
const { data, error } = await resend.emails.send({
  from: 'HOA Court Reservations <noreply@yourdomain.com>', // Use your verified domain
  to: [to],
  subject: template.subject,
  html: template.html,
  text: template.text,
});
```

#### 3. Environment Variables
Ensure production environment has:
```env
RESEND_API_KEY=your_production_resend_api_key
```

## DNS Records for Domain Verification

When setting up your custom domain in Resend, you'll need to add these DNS records:

### Required DNS Records
- **SPF Record**: `v=spf1 include:_spf.resend.com ~all`
- **DKIM Record**: Provided by Resend dashboard
- **DMARC Record**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com`

## Testing Instructions

### Development Testing
1. **Current Setup**: Works with `onboarding@resend.dev`
2. **Test Password Reset**: 
   - Go to `/auth/reset-password`
   - Enter valid email address
   - Check email inbox for reset link
3. **Expected Sender**: "HOA Court Reservations" from `onboarding@resend.dev`

### Production Testing Checklist
- [ ] Custom domain verified in Resend
- [ ] DNS records properly configured
- [ ] Email configuration updated to use custom domain
- [ ] Test password reset with production domain
- [ ] Verify emails are not marked as spam
- [ ] Check email deliverability

## Email Templates

### Current Templates
- **Password Reset**: Professional HTML template with branding
- **Location**: `src/lib/server/email/index.ts` → `emailTemplates.passwordReset()`

### Template Customization
To customize email templates:
1. Edit `emailTemplates` object in `src/lib/server/email/index.ts`
2. Update HTML/CSS styling
3. Modify email content and branding
4. Test with development configuration

## Monitoring and Logging

### Server Logs
Monitor these log messages:
- `🔐 Password reset request for: [email]` - Request received
- `✅ Password reset email sent successfully: [id]` - Email sent
- `❌ Failed to send password reset email: [error]` - Email failed

### Resend Dashboard
Monitor email delivery in Resend dashboard:
- **Delivery Status**: Check if emails are delivered
- **Bounce Rate**: Monitor bounced emails
- **Spam Reports**: Check for spam complaints

## Security Considerations

### Email Security
- **Token Expiry**: Reset tokens expire after 1 hour
- **Single Use**: Tokens are marked as used after validation
- **No Email Disclosure**: Error messages don't reveal if email exists
- **Secure Links**: Reset links use cryptographically secure tokens

### Domain Security
- **SPF/DKIM**: Prevents email spoofing
- **DMARC**: Provides email authentication
- **HTTPS Links**: All reset links use HTTPS

## Troubleshooting

### Common Issues
1. **403 Domain Error**: Domain not verified in Resend
2. **Email Not Received**: Check spam folder, verify email address
3. **Invalid Token**: Token expired or already used
4. **DNS Issues**: Verify DNS records are properly configured

### Debug Steps
1. Check server logs for error messages
2. Verify RESEND_API_KEY is set correctly
3. Test with Resend's default domain first
4. Check Resend dashboard for delivery status

## Next Steps

### Immediate (Development)
- ✅ Password reset functionality working
- ✅ Using Resend default domain
- ✅ Ready for development testing

### Before Production
- [ ] Set up custom domain in Resend
- [ ] Configure DNS records
- [ ] Update email configuration
- [ ] Test with production domain
- [ ] Monitor email deliverability

---

**Last Updated**: December 2024  
**Configuration**: Development (Resend Default Domain)  
**Status**: ✅ Working - Ready for Testing
