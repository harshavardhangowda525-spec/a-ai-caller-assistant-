import { LeadStatus, CallStatus, TransferStatus } from '@/domain/types';

const LEAD_STYLES: Record<string, string> = {
  pending: 'bg-brand-grayMid text-brand-navy',
  calling: 'bg-status-info/15 text-status-info',
  completed: 'bg-brand-grayMid text-brand-navy',
  interested: 'bg-status-success/15 text-status-success',
  not_interested: 'bg-status-danger/15 text-status-danger',
  callback: 'bg-status-warn/15 text-status-warn',
  do_not_call: 'bg-status-danger/20 text-status-danger',
  failed: 'bg-status-danger/15 text-status-danger',
  transferred: 'bg-brand-royal/15 text-brand-royal',
};

const LABELS: Record<string, string> = {
  pending: 'Pending',
  calling: 'Calling',
  completed: 'Completed',
  interested: 'Interested',
  not_interested: 'Not Interested',
  callback: 'Callback',
  do_not_call: 'Do Not Call',
  failed: 'Failed',
  transferred: 'Transferred',
  none: 'No Transfer',
  requested: 'Transfer Requested',
  in_progress: 'Transferring',
  successful: 'Transfer Successful',
  queued: 'Queued',
  initiated: 'Initiated',
  ringing: 'Ringing',
  answered: 'Answered',
  transfer_requested: 'Transfer Requested',
  transferring: 'Transferring',
  transfer_successful: 'Transfer Successful',
  transfer_failed: 'Transfer Failed',
  busy: 'Busy',
  no_answer: 'No Answer',
};

export function StatusBadge({
  status,
}: {
  status: LeadStatus | CallStatus | TransferStatus | string;
}) {
  const cls = LEAD_STYLES[status] ?? 'bg-brand-grayMid text-brand-navy';
  return <span className={`badge ${cls}`}>{LABELS[status] ?? status}</span>;
}
