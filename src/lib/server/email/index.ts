import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend client
const resend = new Resend(env.RESEND_API_KEY);

// Email templates
export const emailTemplates = {
  passwordReset: (resetLink: string, userName: string) => ({
    subject: 'Reset Your HOA Court Reservations Password',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - HOA Court Reservations</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: 600;
            color: #007bff;
            margin-bottom: 10px;
          }
          .title {
            font-size: 28px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #6b7280;
            font-size: 16px;
          }
          .content {
            margin: 30px 0;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .message {
            margin-bottom: 30px;
            line-height: 1.7;
          }
          .button-container {
            text-align: center;
            margin: 40px 0;
          }
          .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s ease;
          }
          .reset-button:hover {
            transform: translateY(-2px);
          }
          .link-text {
            background-color: #f3f4f6;
            padding: 15px;
            border-radius: 6px;
            font-family: monospace;
            font-size: 14px;
            word-break: break-all;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .security-note {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
          }
          .security-note strong {
            color: #92400e;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🏠 HOA Court Reservations</div>
            <h1 class="title">Password Reset Request</h1>
            <p class="subtitle">Secure access to your court booking account</p>
          </div>
          
          <div class="content">
            <p class="greeting">Hello ${userName || 'there'},</p>
            
            <div class="message">
              <p>We received a request to reset the password for your HOA Court Reservations account. If you made this request, click the button below to set a new password:</p>
            </div>
            
            <div class="button-container">
              <a href="${resetLink}" class="reset-button">Reset My Password</a>
            </div>
            
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <div class="link-text">${resetLink}</div>
            
            <div class="security-note">
              <strong>Security Notice:</strong> This link will expire in 1 hour for your security. If you didn't request this password reset, you can safely ignore this email - your account remains secure.
            </div>
            
            <p>If you continue to have trouble accessing your account, please contact your HOA administrator for assistance.</p>
          </div>
          
          <div class="footer">
            <p>This email was sent from HOA Court Reservations</p>
            <p>If you have any questions, please contact your HOA administrator.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      HOA Court Reservations - Password Reset Request
      
      Hello ${userName || 'there'},
      
      We received a request to reset the password for your HOA Court Reservations account.
      
      To reset your password, click this link: ${resetLink}
      
      This link will expire in 1 hour for your security.
      
      If you didn't request this password reset, you can safely ignore this email.
      
      If you continue to have trouble accessing your account, please contact your HOA administrator.
      
      Best regards,
      HOA Court Reservations Team
    `
  })
};

// Send password reset email
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  userName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const template = emailTemplates.passwordReset(resetLink, userName || '');

    const { data, error } = await resend.emails.send({
      from: 'HOA Court Reservations <noreply@hoacourtreservations.com>',
      to: [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    if (error) {
      console.error('Resend email error:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Password reset email sent successfully:', data?.id);
    return { success: true };

  } catch (error) {
    console.error('❌ Failed to send password reset email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Validate email configuration
export function validateEmailConfig(): boolean {
  return !!env.RESEND_API_KEY;
}
