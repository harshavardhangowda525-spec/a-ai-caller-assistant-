import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { getAIProvider } from '@/ai';
import { buildSystemPrompt, DEFAULT_SCRIPT_CONFIG, greetingLine, ScriptConfig } from '@/ai/script';

/**
 * Voice-app endpoint the telephony provider calls to drive the conversation.
 *
 * This is provider-shape-agnostic here: it returns the next AI turn as JSON.
 * A real deployment adapts this into the provider's voice markup (e.g. TwiML
 * <Say>/<Gather>, or Exotel App flow) and streams TTS. The AI decision logic
 * (what to say, whether to transfer) is identical regardless of provider.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { callId: string } },
) {
  const db = getAdminClient();

  const [{ data: settingsRows }, { data: call }] = await Promise.all([
    db.from('settings').select('key,value').eq('key', 'ai_script'),
    db.from('calls').select('id, ai_state').eq('id', params.callId).maybeSingle(),
  ]);
  if (!call) return NextResponse.json({ error: 'call_not_found' }, { status: 404 });

  const scriptCfg: ScriptConfig = {
    ...DEFAULT_SCRIPT_CONFIG,
    ...((settingsRows?.[0]?.value as Partial<ScriptConfig>) ?? {}),
  };
  const systemPrompt = buildSystemPrompt(scriptCfg);

  const body = (await req.json().catch(() => ({}))) as {
    callerUtterance?: string;
    history?: Array<{ role: 'ai' | 'caller'; text: string }>;
  };

  // Opening turn: speak the fixed greeting.
  if (!body.history || body.history.length === 0) {
    await db.from('calls').update({ ai_state: 'greeting', current_stage: 'greeting' }).eq('id', call.id);
    return NextResponse.json({ say: greetingLine(scriptCfg), outcome: 'continue', requestTransfer: false });
  }

  const ai = getAIProvider();
  const turn = await ai.nextTurn({
    systemPrompt,
    history: body.history,
    callerUtterance: body.callerUtterance ?? '',
  });

  // Persist AI-derived stage/summary on the call for the live view.
  await db
    .from('calls')
    .update({
      ai_state:
        turn.outcome === 'interested'
          ? 'handling_interest'
          : turn.requestTransfer
            ? 'requesting_transfer'
            : 'pitching',
      current_stage: turn.outcome,
      ai_summary: turn.summary ?? null,
    })
    .eq('id', call.id);

  return NextResponse.json(turn);
}
