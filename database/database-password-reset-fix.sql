-- Password Reset Token Validation Fix
-- Run this script in your Supabase SQL editor to fix the token validation type mismatch

-- =============================================
-- FIX: Update validate_password_reset_token function to handle email type casting
-- =============================================

-- Drop and recreate the function with proper type casting
DROP FUNCTION IF EXISTS public.validate_password_reset_token(TEXT);

CREATE OR REPLACE FUNCTION public.validate_password_reset_token(
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

-- =============================================
-- VERIFICATION: Test the function
-- =============================================

-- Check if the function exists and has correct signature
SELECT 
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'validate_password_reset_token';

-- Show any existing password reset tokens (for debugging)
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
