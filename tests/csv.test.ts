import { describe, expect, it } from 'vitest';
import { parseLeadsCsv } from '@/lib/csv';
import { ConsentStatus } from '@/domain/types';

const HEADER = 'Business Name,Phone Number,Business Type,Lead Source,Consent Status';

describe('CSV lead import validation', () => {
  it('categorizes valid, invalid, duplicate and suppressed rows', () => {
    const csv = [
      HEADER,
      'ABC Coaching,9876543210,Education,Web,Yes',
      'XYZ Cafe,98765 43210,Food,Referral,Yes', // duplicate of ABC (same number)
      'Bad Number,12345,Retail,Ads,No', // invalid
      'No Name,,Retail,Ads,Yes', // invalid (missing name+phone)
      'Suppressed Biz,9000000000,Retail,Ads,Yes', // suppressed
    ].join('\n');

    const summary = parseLeadsCsv(csv, {
      suppressedNumbers: new Set(['+919000000000']),
    });

    expect(summary.counts.valid).toBe(1);
    expect(summary.counts.duplicate).toBe(1);
    expect(summary.counts.invalid).toBe(2);
    expect(summary.counts.suppressed).toBe(1);
  });

  it('normalizes phone numbers and consent on valid rows', () => {
    const csv = [HEADER, 'ABC Coaching,098765-43210,Education,Web,yes'].join('\n');
    const summary = parseLeadsCsv(csv);
    const valid = summary.rows.find((r) => r.category === 'valid');
    expect(valid?.normalized?.phone_number).toBe('+919876543210');
    expect(valid?.normalized?.consent_status).toBe(ConsentStatus.Consented);
  });

  it('marks no/unknown consent correctly', () => {
    const csv = [
      HEADER,
      'A,9876543211,T,S,no',
      'B,9876543212,T,S,maybe',
    ].join('\n');
    const summary = parseLeadsCsv(csv);
    const a = summary.rows[0]?.normalized;
    const b = summary.rows[1]?.normalized;
    expect(a?.consent_status).toBe(ConsentStatus.NoConsent);
    expect(b?.consent_status).toBe(ConsentStatus.Unknown);
  });

  it('flags collisions with existing DB numbers as duplicates', () => {
    const csv = [HEADER, 'A,9876543210,T,S,yes'].join('\n');
    const summary = parseLeadsCsv(csv, {
      existingNumbers: new Set(['+919876543210']),
    });
    expect(summary.counts.duplicate).toBe(1);
    expect(summary.counts.valid).toBe(0);
  });

  it('tolerates alternate header names', () => {
    const csv = ['name,phone,type,source,permission', 'A,9876543210,T,S,yes'].join('\n');
    const summary = parseLeadsCsv(csv);
    expect(summary.counts.valid).toBe(1);
  });
});
