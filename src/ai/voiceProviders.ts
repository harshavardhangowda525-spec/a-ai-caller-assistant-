/**
 * Voice media provider interfaces — Text-to-Speech (TTS) and Speech-to-Text
 * (STT). These abstract the "make the AI talk" and "hear the caller" halves of
 * a real-time voice call so the conversation orchestrator stays vendor-neutral.
 *
 * Real deployments implement these against a neural TTS (streaming audio out)
 * and a streaming STT (partial + final transcripts). Mocks let the whole
 * conversation flow be unit-tested with no account.
 *
 * All credentials stay server-side.
 */

export interface TtsResult {
  /** Raw audio bytes (provider-specific encoding, e.g. 8kHz μ-law for telephony). */
  audio: Uint8Array;
  /** The text that was synthesized (for logging/transcripts). */
  text: string;
  encoding: string;
  sampleRate: number;
}

export interface TextToSpeech {
  readonly name: string;
  /** Synthesize a line of speech. */
  synthesize(text: string, opts?: { voice?: string }): Promise<TtsResult>;
}

export interface SttTranscript {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface SpeechToText {
  readonly name: string;
  /**
   * Transcribe a chunk of caller audio. Streaming engines emit interim results
   * with isFinal=false and a final result with isFinal=true at end-of-utterance.
   */
  transcribe(audioChunk: Uint8Array): Promise<SttTranscript>;
}

// --- Mock implementations --------------------------------------------------

export class MockTts implements TextToSpeech {
  readonly name = 'mock-tts';
  async synthesize(text: string): Promise<TtsResult> {
    return {
      audio: new TextEncoder().encode(`[audio:${text}]`),
      text,
      encoding: 'mock',
      sampleRate: 8000,
    };
  }
}

/**
 * MockStt treats an incoming audio chunk as already-UTF8 text (tests feed it
 * caller utterances directly) and returns a final transcript.
 */
export class MockStt implements SpeechToText {
  readonly name = 'mock-stt';
  async transcribe(audioChunk: Uint8Array): Promise<SttTranscript> {
    const text = new TextDecoder().decode(audioChunk);
    return { text, isFinal: true, confidence: 1 };
  }
}
