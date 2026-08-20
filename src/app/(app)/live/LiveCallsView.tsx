'use client';

import { useEffect, useState } from 'react';
import { LiveDot, EmptyState } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';

interface LiveCall {
  id: string;
  businessName: string;
  maskedPhone: string;
  status: string;
  aiState: string;
  stage: string;
  transferStatus: string;
  startedAt: string | null;
  durationSeconds: number | null;
}

const AI_STATE_TEXT: Record<string, string> = {
  idle: 'Waiting…',
  greeting: 'AI is greeting the caller…',
  pitching: 'AI is speaking…',
  awaiting_response: 'Listening to caller…',
  handling_interest: 'Caller is interested…',
  requesting_transfer: 'Asking to transfer…',
  scheduling_callback: 'Scheduling a callback…',
  closing: 'Wrapping up…',
  ended: 'Call ended',
};

function fmtDuration(startedAt: string | null, fallback: number | null): string {
  let s = fallback ?? 0;
  if (startedAt) s = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function LiveCallsView({ initial }: { initial: LiveCall[] }) {
  const [calls, setCalls] = useState<LiveCall[]>(initial);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/live', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setCalls(data.calls);
        }
      } catch {
        /* keep last state on transient errors */
      }
    }, 3000);
    const clock = setInterval(() => setTick((t) => t + 1), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-brand-navy">
            Live Calls <LiveDot />
          </h2>
          <p className="text-sm text-brand-grayText">
            {calls.length} call{calls.length === 1 ? '' : 's'} in progress · refreshes automatically
          </p>
        </div>
      </div>

      {calls.length === 0 ? (
        <EmptyState
          icon="📞"
          title="No live calls right now"
          description="When a campaign is running, active calls appear here in real time with AI state and transfer status."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {calls.map((c) => {
            const transferring = c.transferStatus === 'requested' || c.transferStatus === 'in_progress';
            const transferred = c.transferStatus === 'successful';
            return (
              <div key={c.id} className="card p-5" data-tick={tick}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-brand-grayText">
                    Live Call
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-lg font-bold text-brand-navy">{c.businessName}</div>
                <div className="font-mono text-sm text-brand-grayText">{c.maskedPhone}</div>

                <div className="mt-3 flex items-center gap-2 text-sm">
                  <LiveDot color={transferred ? 'bg-status-success' : 'bg-status-info'} />
                  <span className="font-semibold text-brand-navy">
                    {transferred
                      ? 'Owner connected'
                      : transferring
                        ? 'Transferring to owner…'
                        : 'Connected'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-brand-grayText">
                  <div className="flex justify-between">
                    <span>Duration</span>
                    <span className="font-mono font-semibold text-brand-navy">
                      {fmtDuration(c.startedAt, c.durationSeconds)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>AI state</span>
                    <span className="font-medium text-brand-navy">
                      {AI_STATE_TEXT[c.aiState] ?? c.aiState}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stage</span>
                    <span className="font-medium text-brand-navy">{c.stage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Transfer</span>
                    <StatusBadge status={c.transferStatus} />
                  </div>
                  <div className="flex justify-between">
                    <span>Started</span>
                    <span className="text-brand-navy">
                      {c.startedAt ? new Date(c.startedAt).toLocaleTimeString() : '—'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
