import { describe, expect, it, vi } from 'vitest';
import { VoiceConversation, ConversationDeps } from '@/ai/conversation';
import { MockAIProvider } from '@/ai/mock';
import { MockStt, MockTts } from '@/ai/voiceProviders';
import { DEFAULT_SCRIPT_CONFIG, buildSystemPrompt } from '@/ai/script';
import { TransferStatus } from '@/domain/types';

function build(overrides: Partial<ConversationDeps> = {}) {
  const onTransfer = vi.fn(async () => ({ ok: true }));
  const onDoNotCall = vi.fn(async () => {});
  const onCallback = vi.fn(async () => {});
  const deps: ConversationDeps = {
    ai: new MockAIProvider(),
    tts: new MockTts(),
    stt: new MockStt(),
    scriptConfig: DEFAULT_SCRIPT_CONFIG,
    systemPrompt: buildSystemPrompt(DEFAULT_SCRIPT_CONFIG),
    onTransfer,
    onDoNotCall,
    onCallback,
    ...overrides,
  };
  return { convo: new VoiceConversation(deps), onTransfer, onDoNotCall, onCallback };
}

describe('VoiceConversation orchestrator', () => {
  it('opens with the fixed greeting and synthesizes audio', async () => {
    const { convo } = build();
    const start = await convo.start();
    expect(start.said).toContain("I'm calling from Infinity Web and Apps");
    expect(start.audio?.text).toBe(start.said);
    expect(convo.isEnded()).toBe(false);
  });

  it('interested caller -> transfer offer -> agreement triggers transfer and ends', async () => {
    const { convo, onTransfer } = build();
    await convo.start();

    const t1 = await convo.onCallerUtterance('Yes, I am interested');
    expect(t1.said).toContain('connect you with the owner');
    expect(t1.ended).toBe(false);

    const t2 = await convo.onCallerUtterance('Yes please transfer me');
    expect(onTransfer).toHaveBeenCalledOnce();
    expect(t2.transferStatus).toBe(TransferStatus.InProgress);
    expect(t2.ended).toBe(true);
  });

  it('a clear refusal ends the call without transferring', async () => {
    const { convo, onTransfer } = build();
    await convo.start();
    const t = await convo.onCallerUtterance('No, not interested');
    expect(t.outcome).toBe('not_interested');
    expect(t.ended).toBe(true);
    expect(onTransfer).not.toHaveBeenCalled();
  });

  it('a do-not-call request suppresses the number and ends', async () => {
    const { convo, onDoNotCall } = build();
    await convo.start();
    const t = await convo.onCallerUtterance('Please stop calling me and remove me');
    expect(onDoNotCall).toHaveBeenCalledOnce();
    expect(t.outcome).toBe('do_not_call');
    expect(t.ended).toBe(true);
  });

  it('a callback request records the time and ends without re-dialling', async () => {
    const { convo, onCallback } = build();
    await convo.start();
    const t = await convo.onCallerUtterance('Can you call me back tomorrow morning?');
    expect(onCallback).toHaveBeenCalledOnce();
    expect(t.outcome).toBe('callback');
    expect(t.ended).toBe(true);
  });

  it('accepts caller AUDIO via STT and advances the same way', async () => {
    const { convo } = build();
    await convo.start();
    const audio = new TextEncoder().encode('No thank you');
    const t = await convo.onCallerAudio(audio);
    expect(t?.outcome).toBe('not_interested');
    expect(t?.ended).toBe(true);
  });

  it('ignores further input once ended', async () => {
    const { convo } = build();
    await convo.start();
    await convo.onCallerUtterance('No');
    const after = await convo.onCallerUtterance('Actually yes');
    expect(after.ended).toBe(true);
    expect(after.said).toBe('');
  });
});
