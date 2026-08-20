import { describe, expect, it } from 'vitest';
import {
  isValidIndianPhone,
  maskPhone,
  normalizeIndianPhone,
  parseIndianPhone,
} from '@/lib/phone';

describe('Indian phone validation & normalization', () => {
  it('normalizes common input forms to E.164', () => {
    const forms = [
      '9876543210',
      '+91 98765 43210',
      '098765-43210',
      '0091 9876543210',
      '+919876543210',
      '91 98765 43210',
    ];
    for (const f of forms) {
      expect(normalizeIndianPhone(f)).toBe('+919876543210');
    }
  });

  it('accepts mobile series 6,7,8,9', () => {
    expect(isValidIndianPhone('6360471652')).toBe(true);
    expect(isValidIndianPhone('7000000000')).toBe(true);
    expect(isValidIndianPhone('8000000000')).toBe(true);
    expect(isValidIndianPhone('9000000000')).toBe(true);
  });

  it('rejects invalid mobile series (0-5 leading)', () => {
    expect(isValidIndianPhone('5876543210')).toBe(false);
    expect(parseIndianPhone('1234567890').reason).toBe('invalid_mobile_series');
  });

  it('rejects wrong length', () => {
    expect(isValidIndianPhone('98765')).toBe(false);
    expect(isValidIndianPhone('987654321012345')).toBe(false);
  });

  it('rejects non-Indian country codes', () => {
    expect(parseIndianPhone('+14155552671').reason).toBe('non_indian_country_code');
    expect(isValidIndianPhone('+442071838750')).toBe(false);
  });

  it('rejects empty input', () => {
    expect(parseIndianPhone('').reason).toBe('empty');
  });

  it('masks numbers to last 4 digits', () => {
    expect(maskPhone('+919876543210')).toBe('+91 ******3210');
  });
});
