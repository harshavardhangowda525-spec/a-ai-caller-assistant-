import 'server-only';

/**
 * Factory for the voice media providers (TTS + STT). Selects concrete engines
 * from env. Ships with mock engines; real engines are added here behind the
 * TextToSpeech / SpeechToText interfaces once their credentials are configured.
 *
 * Env (add to .env when going live with full AI voice):
 *   TTS_PROVIDER=mock|<vendor>   TTS_API_KEY=...   TTS_VOICE=...
 *   STT_PROVIDER=mock|<vendor>   STT_API_KEY=...   STT_LANGUAGE=en-IN
 */

import { MockStt, MockTts, SpeechToText, TextToSpeech } from './voiceProviders';

export function getTts(): TextToSpeech {
  const provider = process.env.TTS_PROVIDER ?? 'mock';
  switch (provider) {
    // case 'elevenlabs': return new ElevenLabsTts({ apiKey: process.env.TTS_API_KEY! });
    // case 'google':     return new GoogleTts({ ... });
    case 'mock':
    default:
      return new MockTts();
  }
}

export function getStt(): SpeechToText {
  const provider = process.env.STT_PROVIDER ?? 'mock';
  switch (provider) {
    // case 'deepgram':  return new DeepgramStt({ apiKey: process.env.STT_API_KEY! });
    // case 'google':    return new GoogleStt({ ... });
    case 'mock':
    default:
      return new MockStt();
  }
}
