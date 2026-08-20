/**
 * Voice bridge — connects a telephony provider's bidirectional audio stream to
 * a VoiceConversation. Written against a minimal, transport-agnostic MediaSocket
 * interface so any provider's streaming adapter (Exotel Voice Streaming, a SIP
 * media server, Twilio Media Streams, etc.) can drive it without this module
 * taking a dependency on that provider's SDK.
 *
 * Flow:
 *   provider ──audio──▶ MediaSocket.onAudio ──▶ STT ──▶ VoiceConversation
 *   VoiceConversation ──TTS audio──▶ MediaSocket.sendAudio ──▶ provider
 *   on transfer/terminal ──▶ MediaSocket.close (call is bridged to owner or ended)
 */

import { VoiceConversation } from './conversation';
import { logger } from '@/lib/logger';

/**
 * A minimal duplex audio channel the provider adapter implements. `onAudio`
 * registers a handler for inbound caller audio frames; `sendAudio` plays a
 * frame back; `close` ends the media session.
 */
export interface MediaSocket {
  onAudio(handler: (frame: Uint8Array) => void): void;
  sendAudio(frame: Uint8Array): Promise<void> | void;
  close(reason?: string): Promise<void> | void;
}

export interface VoiceBridgeHandle {
  /** Resolves when the conversation reaches a terminal state and closes. */
  done: Promise<void>;
  /** Force-stop the bridge (e.g. provider reported the caller hung up). */
  stop(reason?: string): Promise<void>;
}

/**
 * Run a VoiceConversation over a MediaSocket. Returns a handle whose `done`
 * promise resolves when the call ends (refusal, callback, do-not-call, or a
 * completed transfer). Errors in a single turn are logged and end the call
 * safely rather than leaving a hung, silent line.
 */
export function runVoiceBridge(
  socket: MediaSocket,
  conversation: VoiceConversation,
  callId: string,
): VoiceBridgeHandle {
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  let finished = false;
  // Serialize turns: a caller may speak while the AI is mid-turn; we process
  // one utterance at a time to keep the conversation coherent.
  let processing = Promise.resolve();

  async function end(reason?: string) {
    if (finished) return;
    finished = true;
    try {
      await socket.close(reason);
    } catch (err) {
      logger.warn('voiceBridge.close_error', {
        callId,
        error: err instanceof Error ? err.message : 'unknown',
      });
    }
    resolveDone();
  }

  // Speak the opening greeting.
  processing = processing
    .then(async () => {
      const start = await conversation.start();
      if (start.audio) await socket.sendAudio(start.audio.audio);
    })
    .catch((err) => {
      logger.error('voiceBridge.greeting_error', { callId, error: String(err) });
      return end('greeting_error');
    });

  socket.onAudio((frame) => {
    processing = processing
      .then(async () => {
        if (finished) return;
        const turn = await conversation.onCallerAudio(frame);
        if (!turn) return; // interim/empty transcript — wait for more
        if (turn.audio) await socket.sendAudio(turn.audio.audio);
        if (turn.ended) {
          logger.info('voiceBridge.call_ended', {
            callId,
            outcome: turn.outcome,
            transferStatus: turn.transferStatus,
          });
          await end(`ended_${turn.outcome}`);
        }
      })
      .catch(async (err) => {
        logger.error('voiceBridge.turn_error', { callId, error: String(err) });
        await end('turn_error');
      });
  });

  return {
    done,
    stop: (reason?: string) => end(reason ?? 'stopped'),
  };
}
