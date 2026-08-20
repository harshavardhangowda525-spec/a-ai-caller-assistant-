import { describe, expect, it, vi } from 'vitest';
import { runVoiceBridge, MediaSocket } from '@/ai/voiceBridge';
import { VoiceConversation } from '@/ai/conversation';
import { MockAIProvider } from '@/ai/mock';
import { MockStt, MockTts } from '@/ai/voiceProviders';
import { DEFAULT_SCRIPT_CONFIG, buildSystemPrompt } from '@/ai/script';

/** A fake provider media socket driven by the test. */
class FakeSocket implements MediaSocket {
  handler: ((f: Uint8Array) => void) | null = null;
  sent: string[] = [];
  closed = false;
  closeReason?: string;

  onAudio(h: (f: Uint8Array) => void) {
    this.handler = h;
  }
  async sendAudio(frame: Uint8Array) {
    this.sent.push(new TextDecoder().decode(frame));
  }
  async close(reason?: string) {
    this.closed = true;
    this.closeReason = reason;
  }
  /** Simulate the caller speaking. */
  say(text: string) {
    this.handler?.(new TextEncoder().encode(text));
  }
}

function makeConversation(onTransfer = vi.fn(async () => ({ ok: true }))) {
  return new VoiceConversation({
    ai: new MockAIProvider(),
    tts: new MockTts(),
    stt: new MockStt(),
    scriptConfig: DEFAULT_SCRIPT_CONFIG,
    systemPrompt: buildSystemPrompt(DEFAULT_SCRIPT_CONFIG),
    onTransfer,
    onDoNotCall: async () => {},
    onCallback: async () => {},
  });
}

describe('runVoiceBridge', () => {
  it('greets, then transfers and closes on caller agreement', async () => {
    const socket = new FakeSocket();
    const onTransfer = vi.fn(async () => ({ ok: true }));
    const handle = runVoiceBridge(socket, makeConversation(onTransfer), 'call-1');

    // Let the greeting turn run.
    await new Promise((r) => setTimeout(r, 0));
    expect(socket.sent[0]).toContain('Infinity Web and Apps');

    socket.say('Yes I am interested');
    await new Promise((r) => setTimeout(r, 0));
    socket.say('Yes transfer me to the owner');
    await handle.done;

    expect(onTransfer).toHaveBeenCalledOnce();
    expect(socket.closed).toBe(true);
    expect(socket.closeReason).toContain('interested');
  });

  it('closes politely on refusal', async () => {
    const socket = new FakeSocket();
    const handle = runVoiceBridge(socket, makeConversation(), 'call-2');
    await new Promise((r) => setTimeout(r, 0));

    socket.say('No thanks, not interested');
    await handle.done;
    expect(socket.closed).toBe(true);
    // The decline line was spoken before closing.
    expect(socket.sent.some((s) => s.includes('Thank you for your time'))).toBe(true);
  });

  it('stop() ends the bridge if the caller hangs up', async () => {
    const socket = new FakeSocket();
    const handle = runVoiceBridge(socket, makeConversation(), 'call-3');
    await new Promise((r) => setTimeout(r, 0));
    await handle.stop('caller_hangup');
    await handle.done;
    expect(socket.closeReason).toBe('caller_hangup');
  });
});
