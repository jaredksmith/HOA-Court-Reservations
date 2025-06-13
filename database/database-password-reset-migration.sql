-- Password Reset Tokens Migration
-- Run this script in your Supabase SQL editor to add password reset functionality

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for password reset tokens
-- Only allow service role to manage tokens (no user access)
CREATE POLICY "Service role can manage password reset tokens" ON password_reset_tokens
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_reset_tokens()
RETURNS VOID AS $$
BEGIN
  DELETE FROM password_reset_tokens
  WHERE expires_at < NOW() OR used_at IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a password reset token
CREATE OR REPLACE FUNCTION public.create_password_reset_token(
  user_email TEXT,
  token_value TEXT,
  expiry_hours INTEGER DEFAULT 1
)
RETURNS UUID AS $$
DECLARE
  user_uuid UUID;
  token_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Clean up any existing tokens for this user
  DELETE FROM password_reset_tokens
  WHERE user_id = user_uuid;
  
  -- Create new token
  INSERT INTO password_reset_tokens (user_id, token, expires_at)
  VALUES (
    user_uuid,
    token_value,
    NOW() + (expiry_hours || ' hours')::INTERVAL
  )
  RETURNING id INTO token_id;
  
  RETURN token_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate and use a password reset token
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
  token_value TEXT
)
RETURNS TABLE(user_id UUID, email TEXT, is_valid BOOLEAN) AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find the token
  SELECT prt.user_id, prt.expires_at, prt.used_at, u.email::TEXT
  INTO token_record
  FROM password_reset_tokens prt
  JOIN auth.users u ON u.id = prt.user_id
  WHERE prt.token = token_value;

  -- Check if token exists and is valid
  IF token_record IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE;
    RETURN;
  END IF;

  -- Check if token is expired or already used
  IF token_record.expires_at < NOW() OR token_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT token_record.user_id, token_record.email::TEXT, FALSE;
    RETURN;
  END IF;

  -- Mark token as used
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE token = token_value;

  -- Return valid token info
  RETURN QUERY SELECT token_record.user_id, token_record.email::TEXT, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the table was created
SELECT
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'password_reset_tokens';

-- Show table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'password_reset_tokens'
ORDER BY ordinal_position;
