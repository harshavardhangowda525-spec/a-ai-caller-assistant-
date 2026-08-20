/**
 * Core domain types & enums.
 *
 * These are deliberately framework-agnostic (no Next.js, no Supabase imports) so
 * they can be unit-tested in isolation and reused across the backend, queue
 * worker, and telephony/AI layers.
 */

// --- Lead lifecycle status -------------------------------------------------

export const LeadStatus = {
  Pending: 'pending',
  Calling: 'calling',
  Completed: 'completed',
  Interested: 'interested',
  NotInterested: 'not_interested',
  Callback: 'callback',
  DoNotCall: 'do_not_call',
  Failed: 'failed',
  Transferred: 'transferred',
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

/** Statuses at which a lead's call is finished and the queue may advance. */
export const TERMINAL_LEAD_STATUSES: LeadStatus[] = [
  LeadStatus.Completed,
  LeadStatus.Interested,
  LeadStatus.NotInterested,
  LeadStatus.Callback,
  LeadStatus.DoNotCall,
  LeadStatus.Failed,
  LeadStatus.Transferred,
];

export function isTerminalLeadStatus(status: LeadStatus): boolean {
  return TERMINAL_LEAD_STATUSES.includes(status);
}

// --- Consent ---------------------------------------------------------------

export const ConsentStatus = {
  Consented: 'consented',
  NoConsent: 'no_consent',
  Unknown: 'unknown',
} as const;
export type ConsentStatus = (typeof ConsentStatus)[keyof typeof ConsentStatus];

// --- Call (telephony) status ----------------------------------------------

export const CallStatus = {
  Queued: 'queued',
  Initiated: 'initiated',
  Ringing: 'ringing',
  Answered: 'answered',
  InProgress: 'in_progress',
  TransferRequested: 'transfer_requested',
  Transferring: 'transferring',
  TransferSuccessful: 'transfer_successful',
  TransferFailed: 'transfer_failed',
  Completed: 'completed',
  Busy: 'busy',
  NoAnswer: 'no_answer',
  Failed: 'failed',
} as const;
export type CallStatus = (typeof CallStatus)[keyof typeof CallStatus];

export const TERMINAL_CALL_STATUSES: CallStatus[] = [
  CallStatus.TransferSuccessful,
  CallStatus.TransferFailed,
  CallStatus.Completed,
  CallStatus.Busy,
  CallStatus.NoAnswer,
  CallStatus.Failed,
];

export function isTerminalCallStatus(status: CallStatus): boolean {
  return TERMINAL_CALL_STATUSES.includes(status);
}

// --- AI conversation state -------------------------------------------------

export const AiState = {
  Idle: 'idle',
  Greeting: 'greeting',
  Pitching: 'pitching',
  AwaitingResponse: 'awaiting_response',
  HandlingInterest: 'handling_interest',
  RequestingTransfer: 'requesting_transfer',
  SchedulingCallback: 'scheduling_callback',
  Closing: 'closing',
  Ended: 'ended',
} as const;
export type AiState = (typeof AiState)[keyof typeof AiState];

// --- Transfer status -------------------------------------------------------

export const TransferStatus = {
  None: 'none',
  Requested: 'requested',
  InProgress: 'in_progress',
  Successful: 'successful',
  Failed: 'failed',
} as const;
export type TransferStatus = (typeof TransferStatus)[keyof typeof TransferStatus];

// --- Campaign status -------------------------------------------------------

export const CampaignStatus = {
  Draft: 'draft',
  Running: 'running',
  Paused: 'paused',
  Stopped: 'stopped',
  Completed: 'completed',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

// --- Entities --------------------------------------------------------------

export interface Lead {
  id: string;
  business_name: string;
  phone_number: string; // E.164 normalized, e.g. +919876543210
  business_type: string | null;
  lead_source: string | null;
  consent_status: ConsentStatus;
  status: LeadStatus;
  call_attempts: number;
  last_called_at: string | null;
  next_callback_at: string | null;
  call_result: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  delay_between_calls_seconds: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
}

export interface CallRecord {
  id: string;
  lead_id: string;
  campaign_id: string | null;
  provider_call_id: string | null;
  status: CallStatus;
  ai_state: AiState;
  transfer_status: TransferStatus;
  started_at: string | null;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  ai_summary: string | null;
  recording_status: string | null;
  created_at: string;
  updated_at: string;
}

export interface SuppressionEntry {
  id: string;
  phone_number: string;
  reason: string;
  created_at: string;
}
