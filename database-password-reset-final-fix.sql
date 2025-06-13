-- Password Reset Token Final Fix
-- This fixes the issue where tokens are marked as used during page load validation
-- Run this script in your Supabase SQL editor

-- =============================================
-- CREATE SEPARATE FUNCTIONS FOR VALIDATION AND CONSUMPTION
-- =============================================

-- Function to validate token WITHOUT marking as used (for page load)
CREATE OR REPLACE FUNCTION public.check_password_reset_token(
  token_value TEXT
)
RETURNS TABLE(user_id UUID, email TEXT, is_valid BOOLEAN) AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find the token with explicit type casting for email
  SELECT prt.user_id, prt.expires_at, prt.used_at, u.email::TEXT as email
  INTO token_record
  FROM password_reset_tokens prt
  JOIN auth.users u ON u.id = prt.user_id
  WHERE prt.token = token_value;
  
  -- Check if token exists and is valid
  IF token_record IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE;
    RETURN;
  END IF;
  
  -- Check if token is expired or already used (but DON'T mark as used)
  IF token_record.expires_at < NOW() OR token_record.used_at IS NOT NULL THEN
    RETURN QUERY SELECT token_record.user_id, token_record.email, FALSE;
    RETURN;
  END IF;
  
  -- Return valid token info WITHOUT marking as used
  RETURN QUERY SELECT token_record.user_id, token_record.email, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume token (mark as used) - for actual password reset
CREATE OR REPLACE FUNCTION public.consume_password_reset_token(
  token_value TEXT
)
RETURNS TABLE(user_id UUID, email TEXT, is_valid BOOLEAN) AS $$
DECLARE
  token_record RECORD;
BEGIN
  -- Find the token with explicit type casting for email
  SELECT prt.user_id, prt.expires_at, prt.used_at, u.email::TEXT as email
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
    RETURN QUERY SELECT token_record.user_id, token_record.email, FALSE;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE password_reset_tokens
  SET used_at = NOW()
  WHERE token = token_value;
  
  -- Return valid token info
  RETURN QUERY SELECT token_record.user_id, token_record.email, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the original function to use the new check function (for backward compatibility)
CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
  token_value TEXT
)
RETURNS TABLE(user_id UUID, email TEXT, is_valid BOOLEAN) AS $$
BEGIN
  -- Use the check function (doesn't mark as used)
  RETURN QUERY SELECT * FROM public.check_password_reset_token(token_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- VERIFICATION
-- =============================================

-- Check if the functions exist
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('check_password_reset_token', 'consume_password_reset_token', 'validate_password_reset_token')
ORDER BY p.proname;

-- Show current token status
SELECT 
  id,
  user_id,
  LEFT(token, 10) || '...' as token_preview,
  expires_at,
  used_at,
  created_at,
  CASE 
    WHEN expires_at < NOW() THEN 'EXPIRED'
    WHEN used_at IS NOT NULL THEN 'USED'
    ELSE 'VALID'
  END as status
FROM password_reset_tokens
ORDER BY created_at DESC
LIMIT 5;
