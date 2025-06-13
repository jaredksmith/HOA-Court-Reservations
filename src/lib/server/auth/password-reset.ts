import { supabaseAdmin } from '$lib/server/db';
import { sendPasswordResetEmail } from '$lib/server/email';
import crypto from 'crypto';

// Generate a secure random token
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Create a password reset token and send email
export async function createPasswordResetToken(
  email: string,
  baseUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user exists
    const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers({
      filter: `email.eq.${email}`
    });

    const user = users?.[0];
    
    if (userError || !user) {
      // Don't reveal whether the email exists for security
      console.log('Password reset requested for non-existent email:', email);
      return { success: true }; // Return success to not reveal email existence
    }

    // Get user profile for name
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('full_name')
      .eq('user_id', user.id)
      .single();

    // Generate secure token
    const token = generateResetToken();
    
    // Create token in database using the function
    const { error: tokenError } = await supabaseAdmin.rpc('create_password_reset_token', {
      user_email: email,
      token_value: token,
      expiry_hours: 1
    });

    if (tokenError) {
      console.error('Error creating password reset token:', tokenError);
      return { success: false, error: 'Failed to create reset token' };
    }

    // Create reset link
    const resetLink = `${baseUrl}/auth/reset-password/confirm?token=${token}`;

    // Send email
    const emailResult = await sendPasswordResetEmail(
      email,
      resetLink,
      profile?.full_name
    );

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return { success: false, error: 'Failed to send reset email' };
    }

    console.log('✅ Password reset token created and email sent for:', email);
    return { success: true };

  } catch (error) {
    console.error('❌ Error in createPasswordResetToken:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Validate a password reset token
export async function validatePasswordResetToken(
  token: string
): Promise<{ 
  success: boolean; 
  userId?: string; 
  email?: string; 
  error?: string 
}> {
  try {
    // Validate token using the database function
    const { data, error } = await supabaseAdmin.rpc('validate_password_reset_token', {
      token_value: token
    });

    if (error) {
      console.error('Error validating password reset token:', error);
      return { success: false, error: 'Invalid token' };
    }

    if (!data || data.length === 0) {
      return { success: false, error: 'Token not found' };
    }

    const tokenData = data[0];

    if (!tokenData.is_valid) {
      return { success: false, error: 'Token is expired or already used' };
    }

    return {
      success: true,
      userId: tokenData.user_id,
      email: tokenData.email
    };

  } catch (error) {
    console.error('❌ Error validating password reset token:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Update user password
export async function updateUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      console.error('Error updating user password:', error);
      return { success: false, error: 'Failed to update password' };
    }

    console.log('✅ Password updated successfully for user:', userId);
    return { success: true };

  } catch (error) {
    console.error('❌ Error updating user password:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Clean up expired tokens (can be called periodically)
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    const { error } = await supabaseAdmin.rpc('cleanup_expired_password_reset_tokens');
    
    if (error) {
      console.error('Error cleaning up expired tokens:', error);
    } else {
      console.log('✅ Expired password reset tokens cleaned up');
    }
  } catch (error) {
    console.error('❌ Error in cleanupExpiredTokens:', error);
  }
}
