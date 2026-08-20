/**
 * Indian phone number validation & normalization.
 *
 * Rules (India, +91):
 *  - Mobile numbers are 10 digits and start with 6, 7, 8, or 9.
 *  - We accept common input forms: "+91 98765 43210", "098765-43210",
 *    "0091 9876543210", "9876543210", etc.
 *  - Output is E.164: "+919876543210".
 *
 * We intentionally validate mobile numbers only, since automated commercial
 * outbound calling to Indian landlines has different regulatory handling and
 * the campaign spec targets business mobile leads. Landline handling can be
 * added behind the same interface later.
 */

export interface PhoneParseResult {
  ok: boolean;
  e164?: string; // normalized, e.g. +919876543210
  national?: string; // 10 digit, e.g. 9876543210
  reason?: string;
}

const INDIAN_MOBILE_RE = /^[6-9]\d{9}$/;

/** Strip everything except digits and a single leading '+'. */
function sanitize(raw: string): string {
  const trimmed = (raw ?? '').trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/[^\d]/g, '');
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Reduce any accepted Indian input form down to the 10-digit national number.
 * Returns null if the country/trunk prefixing does not resolve to 10 digits.
 */
function extractNationalDigits(sanitized: string): string | null {
  let digits = sanitized.replace(/^\+/, '');

  // 0091XXXXXXXXXX  -> 91XXXXXXXXXX
  if (digits.startsWith('00')) digits = digits.slice(2);

  // 91XXXXXXXXXX (12 digits) -> strip country code
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // 0XXXXXXXXXX (11 digits, national trunk prefix) -> strip leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 10) return null;
  return digits;
}

export function parseIndianPhone(raw: string): PhoneParseResult {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: 'empty' };
  }

  const sanitized = sanitize(raw);

  // Reject an explicit non-India country code (e.g. +1..., +44...).
  if (sanitized.startsWith('+') && !sanitized.startsWith('+91')) {
    return { ok: false, reason: 'non_indian_country_code' };
  }

  const national = extractNationalDigits(sanitized);
  if (!national) {
    return { ok: false, reason: 'wrong_length' };
  }
  if (!INDIAN_MOBILE_RE.test(national)) {
    return { ok: false, reason: 'invalid_mobile_series' };
  }

  return {
    ok: true,
    e164: `+91${national}`,
    national,
  };
}

/** Convenience: returns the E.164 string or null. */
export function normalizeIndianPhone(raw: string): string | null {
  const r = parseIndianPhone(raw);
  return r.ok ? r.e164! : null;
}

export function isValidIndianPhone(raw: string): boolean {
  return parseIndianPhone(raw).ok;
}

/**
 * Mask a phone number for display, keeping only the last 4 digits.
 * "+919876543210" -> "+91 ******3210"
 */
export function maskPhone(e164: string): string {
  const digits = (e164 ?? '').replace(/[^\d]/g, '');
  if (digits.length < 4) return '****';
  const last4 = digits.slice(-4);
  // Assume +91 country code for Indian numbers.
  const national = digits.length >= 12 ? digits.slice(2) : digits;
  const maskedCount = Math.max(0, national.length - 4);
  return `+91 ${'*'.repeat(maskedCount)}${last4}`;
}
