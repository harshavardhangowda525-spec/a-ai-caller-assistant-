/**
 * CSV lead import parsing & validation.
 *
 * Expected columns (header names are matched case-insensitively and tolerate
 * spaces/underscores):
 *   Business Name, Phone Number, Business Type, Lead Source, Consent Status
 *
 * Produces a categorized preview: valid / invalid / duplicate / suppressed
 * rows so the admin can review before importing.
 */

import Papa from 'papaparse';
import { ConsentStatus } from '@/domain/types';
import { normalizeIndianPhone, parseIndianPhone } from './phone';

export interface RawLeadInput {
  business_name: string;
  phone_number: string;
  business_type: string;
  lead_source: string;
  consent_status: ConsentStatus;
}

export interface ParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  normalized?: RawLeadInput;
  category: 'valid' | 'invalid' | 'duplicate' | 'suppressed';
  errors: string[];
}

export interface CsvParseSummary {
  rows: ParsedRow[];
  counts: {
    total: number;
    valid: number;
    invalid: number;
    duplicate: number;
    suppressed: number;
  };
}

const HEADER_ALIASES: Record<string, keyof RawLeadInput> = {
  business_name: 'business_name',
  businessname: 'business_name',
  name: 'business_name',
  phone_number: 'phone_number',
  phonenumber: 'phone_number',
  phone: 'phone_number',
  mobile: 'phone_number',
  business_type: 'business_type',
  businesstype: 'business_type',
  type: 'business_type',
  lead_source: 'lead_source',
  leadsource: 'lead_source',
  source: 'lead_source',
  consent_status: 'consent_status',
  consentstatus: 'consent_status',
  consent: 'consent_status',
  permission: 'consent_status',
  permission_status: 'consent_status',
};

function canonicalHeader(h: string): keyof RawLeadInput | null {
  const key = h.trim().toLowerCase().replace(/[\s-]+/g, '_');
  return HEADER_ALIASES[key] ?? HEADER_ALIASES[key.replace(/_/g, '')] ?? null;
}

export function normalizeConsent(raw: string): ConsentStatus {
  const v = (raw ?? '').trim().toLowerCase();
  if (
    ['yes', 'y', 'true', '1', 'consented', 'consent', 'opt-in', 'optin', 'granted', 'given'].includes(
      v,
    )
  ) {
    return ConsentStatus.Consented;
  }
  if (['no', 'n', 'false', '0', 'no_consent', 'none', 'denied', 'opt-out', 'optout'].includes(v)) {
    return ConsentStatus.NoConsent;
  }
  return ConsentStatus.Unknown;
}

export interface CsvParseOptions {
  /** E.164 numbers already in the DB — used to flag duplicates. */
  existingNumbers?: Set<string>;
  /** E.164 numbers on the suppression list. */
  suppressedNumbers?: Set<string>;
}

/**
 * Parse & validate CSV text into a categorized preview.
 * Duplicate detection covers both within-file duplicates and collisions with
 * `existingNumbers`.
 */
export function parseLeadsCsv(
  csvText: string,
  options: CsvParseOptions = {},
): CsvParseSummary {
  const existing = options.existingNumbers ?? new Set<string>();
  const suppressed = options.suppressedNumbers ?? new Set<string>();
  const seenInFile = new Set<string>();

  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  });

  const rows: ParsedRow[] = [];
  let valid = 0;
  let invalid = 0;
  let duplicate = 0;
  let suppressedCount = 0;

  parsed.data.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // +1 for header, +1 for 1-based
    const errors: string[] = [];

    // Remap headers to canonical field names.
    const mapped: Partial<RawLeadInput> = {};
    for (const [header, value] of Object.entries(rawRow)) {
      const field = canonicalHeader(header);
      if (field) mapped[field] = (value ?? '').trim() as never;
    }

    const businessName = (mapped.business_name ?? '').trim();
    const phoneRaw = (mapped.phone_number ?? '').trim();

    if (!businessName) errors.push('Missing business name');
    if (!phoneRaw) errors.push('Missing phone number');

    const phoneResult = parseIndianPhone(phoneRaw);
    if (phoneRaw && !phoneResult.ok) {
      errors.push(`Invalid Indian phone number (${phoneResult.reason})`);
    }

    if (errors.length > 0) {
      invalid++;
      rows.push({ rowNumber, raw: rawRow, category: 'invalid', errors });
      return;
    }

    const e164 = normalizeIndianPhone(phoneRaw)!;

    // Suppression takes precedence over duplicate so the admin sees the most
    // important compliance reason.
    if (suppressed.has(e164)) {
      suppressedCount++;
      rows.push({
        rowNumber,
        raw: rawRow,
        category: 'suppressed',
        errors: ['On permanent suppression / do-not-call list'],
      });
      return;
    }

    if (existing.has(e164) || seenInFile.has(e164)) {
      duplicate++;
      rows.push({
        rowNumber,
        raw: rawRow,
        category: 'duplicate',
        errors: ['Duplicate phone number'],
      });
      return;
    }

    seenInFile.add(e164);
    valid++;
    rows.push({
      rowNumber,
      raw: rawRow,
      category: 'valid',
      errors: [],
      normalized: {
        business_name: businessName,
        phone_number: e164,
        business_type: (mapped.business_type ?? '').trim(),
        lead_source: (mapped.lead_source ?? '').trim(),
        consent_status: normalizeConsent(mapped.consent_status ?? ''),
      },
    });
  });

  return {
    rows,
    counts: {
      total: rows.length,
      valid,
      invalid,
      duplicate,
      suppressed: suppressedCount,
    },
  };
}
