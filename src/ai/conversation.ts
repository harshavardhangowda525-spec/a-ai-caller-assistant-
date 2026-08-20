/**
 * VoiceConversation — the provider-agnostic orchestrator that drives one live
 * AI voice call from connect to terminal outcome.
 *
 * It owns the conversation state machine that sits BETWEEN the audio transport
 * (a telephony voice-streaming websocket + TTS/STT) and the AI decision engine
 * (AiProvider). A transport adapter feeds it caller audio and plays back the
 * audio it returns; this class decides what to say, when to transfer, and when
 * to hang up — always honouring the safety rails.
 *
 * It is pure orchestration (no I/O of its own beyond the injected providers),
 * so it is fully unit-testable.
 */

import { AiState, TransferStatus } from '@/domain/types';
import type { AiProvider, AiOutcome } from './provider';
import { greetingLine, ScriptConfig } from './script';
import type { SpeechToText, TextToSpeech, TtsResult } from './voiceProviders';

export interface ConversationDeps {
  ai: AiProvider;
  tts: TextToSpeech;
  stt: SpeechToText;
  scriptConfig: ScriptConfig;
  systemPrompt: string;
  /** Called when the caller agrees to transfer — wires to CallService.requestTransfer. */
  onTransfer: () => Promise<{ ok: boolean; reason?: string }>;
  /** Called when the caller asks for no more calls — wires to suppression add. */
  onDoNotCall: () => Promise<void>;
  /** Called when the caller asks for a callback with the requested time text. */
  onCallback: (timeText: string) => Promise<void>;
  /** Persist AI state/summary transitions for the live dashboard. */
  onState?: (state: AiState, stage: string) => void;
}

export interface TurnResult {
  /** Audio to play back to the caller (empty if nothing to say). */
  audio: TtsResult | null;
  /** The text that was spoken. */
  said: string;
  aiState: AiState;
  outcome: AiOutcome;
  transferStatus: TransferStatus;
  /** True once the conversation has reached a terminal state. */
  ended: boolean;
}

export class VoiceConversation {
  private history: Array<{ role: 'ai' | 'caller'; text: string }> = [];
  private ended = false;
  private transferStatus: TransferStatus = TransferStatus.None;

  constructor(private readonly deps: ConversationDeps) {}

  isEnded(): boolean {
    return this.ended;
  }

  getTranscript(): ReadonlyArray<{ role: 'ai' | 'caller'; text: string }> {
    return this.history;
  }

  /** The opening turn — speaks the fixed greeting. */
  async start(): Promise<TurnResult> {
    const line = greetingLine(this.deps.scriptConfig);
    this.history.push({ role: 'ai', text: line });
    this.deps.onState?.(AiState.Greeting, 'greeting');
    const audio = await this.deps.tts.synthesize(line);
    return {
      audio,
      said: line,
      aiState: AiState.Greeting,
      outcome: 'continue',
      transferStatus: this.transferStatus,
      ended: false,
    };
  }

  /**
   * Handle a chunk of caller audio. On a final transcript it advances the
   * conversation by one AI turn. Interim transcripts are ignored (no action
   * until the caller finishes speaking).
   */
  async onCallerAudio(audioChunk: Uint8Array): Promise<TurnResult | null> {
    if (this.ended) return null;
    const transcript = await this.deps.stt.transcribe(audioChunk);
    if (!transcript.isFinal || !transcript.text.trim()) return null;
    return this.onCallerUtterance(transcript.text);
  }

  /** Advance the conversation given a final caller utterance. */
  async onCallerUtterance(utterance: string): Promise<TurnResult> {
    if (this.ended) {
      return {
        audio: null,
        said: '',
        aiState: AiState.Ended,
        outcome: 'continue',
        transferStatus: this.transferStatus,
        ended: true,
      };
    }

    this.history.push({ role: 'caller', text: utterance });
    this.deps.onState?.(AiState.AwaitingResponse, 'awaiting_response');

    const turn = await this.deps.ai.nextTurn({
      systemPrompt: this.deps.systemPrompt,
      history: this.history,
      callerUtterance: utterance,
    });

    // Side-effects for terminal-ish outcomes, before speaking.
    let aiState: AiState = AiState.Pitching;

    if (turn.outcome === 'do_not_call') {
      await this.deps.onDoNotCall();
      aiState = AiState.Closing;
      this.ended = true;
    } else if (turn.outcome === 'callback') {
      await this.deps.onCallback(turn.callbackTimeText ?? utterance);
      aiState = AiState.SchedulingCallback;
      this.ended = true;
    } else if (turn.outcome === 'not_interested') {
      aiState = AiState.Closing;
      this.ended = true;
    } else if (turn.requestTransfer) {
      // Only reached after explicit agreement (AiProvider guarantees this).
      aiState = AiState.RequestingTransfer;
      const res = await this.deps.onTransfer();
      this.transferStatus = res.ok ? TransferStatus.InProgress : TransferStatus.Failed;
      // The call now leaves the AI's hands (bridged to the owner) — end AI loop.
      this.ended = true;
    } else if (turn.outcome === 'interested') {
      aiState = AiState.HandlingInterest;
    }

    if (turn.say) this.history.push({ role: 'ai', text: turn.say });
    this.deps.onState?.(aiState, turn.outcome);

    const audio = turn.say ? await this.deps.tts.synthesize(turn.say) : null;

    return {
      audio,
      said: turn.say,
      aiState: this.ended && aiState === AiState.Pitching ? AiState.Ended : aiState,
      outcome: turn.outcome,
      transferStatus: this.transferStatus,
      ended: this.ended,
    };
  }
}
