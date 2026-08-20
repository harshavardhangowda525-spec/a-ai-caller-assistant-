import { getConfig, validateConfiguredCallerId } from '@/lib/config';

/**
 * Always-visible compliance banner. Surfaces the caller-ID configuration state
 * and the mandatory admin warning about lawful contact eligibility.
 */
export function ComplianceBanner() {
  const cfg = getConfig();
  const callerId = validateConfiguredCallerId();
  const isMock = cfg.telephony.provider === 'mock';

  return (
    <div className="card border-status-warn/40 bg-status-warn/5 p-4">
      <div className="flex items-start gap-3">
        <span className="text-lg">⚠️</span>
        <div className="text-sm text-brand-navy">
          <b>Compliance responsibility.</b> You are responsible for ensuring every
          uploaded contact is legally eligible for commercial calling and that your
          telephony configuration complies with applicable Indian telecom
          requirements (TRAI/UCC/DND). This system does not spoof caller ID or bypass
          spam controls.
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span
              className={`badge ${
                isMock
                  ? 'bg-brand-grayMid text-brand-navy'
                  : 'bg-status-info/15 text-status-info'
              }`}
            >
              Provider: {cfg.telephony.provider.toUpperCase()}
            </span>
            <span
              className={`badge ${
                callerId.ok
                  ? 'bg-status-success/15 text-status-success'
                  : 'bg-status-danger/15 text-status-danger'
              }`}
            >
              Caller ID: {callerId.ok ? 'configured' : 'not configured'}
            </span>
            {isMock && (
              <span className="badge bg-status-warn/15 text-status-warn">
                Live calling disabled (mock mode)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
