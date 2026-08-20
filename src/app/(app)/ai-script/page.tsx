import { getSettings } from '@/server/queries';
import { DEFAULT_SCRIPT_CONFIG } from '@/ai/script';
import { AiScriptEditor } from './AiScriptEditor';

export const dynamic = 'force-dynamic';

export default async function AiScriptPage() {
  const settings = await getSettings();
  const script = { ...DEFAULT_SCRIPT_CONFIG, ...((settings.ai_script as object) ?? {}) };
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-brand-navy">AI Script</h2>
        <p className="text-sm text-brand-grayText">
          Edit the approved information the AI may use. Safety rules (never impersonate a
          human, never invent prices, stop on refusal) are enforced in code and cannot be
          edited away.
        </p>
      </div>
      <AiScriptEditor initial={script as never} />
    </div>
  );
}
