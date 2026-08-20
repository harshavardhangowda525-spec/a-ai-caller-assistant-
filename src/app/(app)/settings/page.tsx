import { getSettings } from '@/server/queries';
import { getConfig, validateConfiguredCallerId, getOwnerTransferNumberNormalized } from '@/lib/config';
import { getTelephonyProvider } from '@/telephony';
import { SettingsForm } from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = await getSettings();
  const cfg = getConfig();
  const callerId = validateConfiguredCallerId();

  // Confirm verification with the provider WITHOUT exposing the number itself.
  let callerIdVerified = false;
  let callerIdReason: string | undefined;
  if (callerId.ok && callerId.normalized) {
    try {
      const check = await getTelephonyProvider().validateCallerId(callerId.normalized);
      callerIdVerified = check.verified;
      callerIdReason = check.reason;
    } catch {
      callerIdReason = 'provider_unreachable';
    }
  }

  const configStatus = {
    provider: cfg.telephony.provider,
    aiProvider: cfg.ai.provider,
    callerIdConfigured: callerId.ok,
    callerIdVerified,
    callerIdReason: callerId.ok ? callerIdReason : callerId.error,
    ownerTransferConfigured: Boolean(getOwnerTransferNumberNormalized()),
    isMock: cfg.telephony.provider === 'mock',
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">Settings</h2>
        <p className="text-sm text-brand-grayText">
          Calling behaviour and provider configuration status.
        </p>
      </div>
      <SettingsForm
        initial={{
          delay: Number(settings.delay_between_calls_seconds ?? 30),
          maxRetries: Number(settings.max_retries ?? 3),
          recordingEnabled: Boolean(settings.recording_enabled ?? false),
          productionCallingEnabled: Boolean(settings.production_calling_enabled ?? false),
        }}
        configStatus={configStatus}
      />
    </div>
  );
}
