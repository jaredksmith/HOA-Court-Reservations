/**
 * Phone number validation and formatting utilities
 */

/**
 * Validates US phone number format
 * Accepts formats like: (555) 123-4567, 555-123-4567, 555.123.4567, 5551234567, +1 555 123 4567
 */
export function isValidPhoneNumber(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Check for valid US phone number patterns
  const patterns = [
    /^\d{10}$/,           // 5551234567
    /^\+1\d{10}$/,        // +15551234567
    /^1\d{10}$/           // 15551234567
  ];
  
  return patterns.some(pattern => pattern.test(cleaned));
}

/**
 * Formats phone number to standard display format: (555) 123-4567
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different input lengths
  if (cleaned.length === 10) {
    // 5551234567 -> (555) 123-4567
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // 15551234567 -> (555) 123-4567
    const withoutCountryCode = cleaned.slice(1);
    return `(${withoutCountryCode.slice(0, 3)}) ${withoutCountryCode.slice(3, 6)}-${withoutCountryCode.slice(6)}`;
  }
  
  // Return original if can't format
  return phone;
}

/**
 * Formats phone number for database storage (removes formatting)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Ensure US format with country code
  if (cleaned.length === 10) {
    cleaned = '+1' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+1') && cleaned.length === 11) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
}

/**
 * Real-time phone number input formatting
 * Use this for input field onChange handlers
 */
export function formatPhoneInput(value: string): string {
  // Remove all non-digit characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 10 digits
  const limited = cleaned.slice(0, 10);
  
  // Format as user types
  if (limited.length >= 6) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3, 6)}-${limited.slice(6)}`;
  } else if (limited.length >= 3) {
    return `(${limited.slice(0, 3)}) ${limited.slice(3)}`;
  } else if (limited.length > 0) {
    return `(${limited}`;
  }
  
  return '';
}

/**
 * Get phone number validation error message
 */
export function getPhoneValidationError(phone: string): string | null {
  if (!phone || phone.trim() === '') {
    return 'Phone number is required';
  }
  
  if (!isValidPhoneNumber(phone)) {
    return 'Please enter a valid US phone number (e.g., (555) 123-4567)';
  }
  
  return null;
}

/**
 * Phone number input component props type
 */
export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
}
