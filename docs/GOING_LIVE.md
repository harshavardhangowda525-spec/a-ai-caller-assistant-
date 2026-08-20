# Going live with real AI voice calls

This guide is the exact path from the current codebase to **real, compliant AI
voice calls** for Infinity Web & Apps. Read it fully before spending money on a
provider.

> **Honest status.** The app can already place calls, handle webhooks, and
> transfer to the owner through a real provider's REST API. The conversation
> orchestration (greeting → pitch → transfer/decline/callback/do-not-call) is
> built and tested. The one remaining piece for a *talking* AI is the
> **real-time media transport adapter** (Section 4) plus **TTS/STT credentials**
> (Section 3). None of this can be exercised without a KYC-approved provider
> account — so the first real cost and delay is procurement, not code.

---

## 1. Procure a compliant telephony provider (Exotel recommended)

For Indian domestic AI outbound calling, **Exotel** is the realistic compliant
choice. Twilio generally will not originate India domestic calls or present an
Indian caller ID for this use case.

Get all of the following from Exotel:

1. An **Exotel account** with **KYC completed**.
2. A provisioned, **approved ExoPhone** — this becomes your verified caller ID
   (`6360471652`). The provider presents it; the app never spoofs.
3. **Voice Streaming** enabled on the account (bidirectional audio websocket).
4. **DLT / commercial-calling registration** as required by Indian regulation
   for outbound business calls.
5. API credentials: **Account SID**, **subdomain**, **API key**, **API secret**.

## 2. Configure telephony env vars

```bash
TELEPHONY_PROVIDER=exotel
TELEPHONY_ACCOUNT_SID=<exotel sid>
TELEPHONY_SUBDOMAIN=api.exotel.com
TELEPHONY_API_KEY=<exotel api key>
TELEPHONY_API_SECRET=<exotel api secret>
TELEPHONY_WEBHOOK_SECRET=<long random string>
OUTBOUND_CALLER_ID=6360471652        # must equal the approved ExoPhone
OWNER_TRANSFER_NUMBER=6360471652     # owner's phone for transfers
```

At campaign start and before every dial, the app calls
`ExotelTelephonyProvider.validateCallerId()`. If Exotel does **not** confirm the
number is a registered ExoPhone, the app refuses to dial and shows a config
error. This is the no-spoofing guarantee — expected behaviour, not a bug.

## 3. Add TTS + STT credentials (the AI's voice and ears)

Full AI voice needs a neural **Text-to-Speech** engine and a streaming
**Speech-to-Text** engine (choose vendors with good Indian-English support and
low latency). Implement each behind the existing interfaces in
`src/ai/voiceProviders.ts` and register them in `src/ai/voiceFactory.ts`:

```bash
TTS_PROVIDER=<vendor>   TTS_API_KEY=...   TTS_VOICE=<voice id>
STT_PROVIDER=<vendor>   STT_API_KEY=...   STT_LANGUAGE=en-IN
```

`TextToSpeech.synthesize()` must return telephony-compatible audio (typically
8 kHz μ-law/PCM); `SpeechToText.transcribe()` must emit interim + final
transcripts. The mocks already prove the conversation logic end-to-end.

## 4. Implement the real-time media transport adapter (last code step)

The provider-agnostic pieces are done:

- `src/ai/conversation.ts` — `VoiceConversation` (the dialogue state machine)
- `src/ai/voiceBridge.ts` — `runVoiceBridge()` runs a conversation over a
  `MediaSocket` (a minimal `onAudio` / `sendAudio` / `close` interface)

What remains is a thin **Exotel Voice Streaming adapter** that implements
`MediaSocket`:

1. Stand up a **websocket server** (Voice Streaming needs a persistent process —
   run alongside `npm run worker`, not on serverless functions).
2. When Exotel connects the stream for a call, build the conversation and bridge:

   ```ts
   import { runVoiceBridge } from '@/ai/voiceBridge';
   import { VoiceConversation } from '@/ai/conversation';
   import { getAIProvider } from '@/ai';
   import { getTts, getStt } from '@/ai/voiceFactory';
   import { buildSystemPrompt, DEFAULT_SCRIPT_CONFIG } from '@/ai/script';
   import { CallService } from '@/server/callService';

   // exotelWs is the provider websocket for this call; callId from stream params
   const socket = new ExotelMediaSocket(exotelWs); // implements MediaSocket
   const svc = new CallService();
   const convo = new VoiceConversation({
     ai: getAIProvider(),
     tts: getTts(),
     stt: getStt(),
     scriptConfig: DEFAULT_SCRIPT_CONFIG,
     systemPrompt: buildSystemPrompt(DEFAULT_SCRIPT_CONFIG),
     onTransfer: () => svc.requestTransfer(callId, true),  // consent already given
     onDoNotCall: async () => { /* suppression handled via CallService/webhook */ },
     onCallback: async () => { /* persist callback */ },
   });
   runVoiceBridge(socket, convo, callId);
   ```

3. `ExotelMediaSocket` translates Exotel's stream frames ⇆ `Uint8Array` audio and
   maps `close()` to ending/leaving the media session (the transfer itself is a
   REST `Calls/transfer` call, already implemented in `ExotelTelephonyProvider`).

That single adapter is the only provider-specific voice code left to write.

## 5. Deploy so the provider can reach you

- Host the Next.js app on a public URL; set `APP_BASE_URL` to it.
- Point the Exotel status webhook at `POST /api/webhooks/telephony`.
- Point the Voice App / stream at your websocket server.
- Run the worker (`npm run worker`) or schedule `POST /api/cron/tick`.

## 6. Final compliance gate

Before enabling `production_calling_enabled` in Settings:

- Confirm every uploaded contact has a lawful basis for commercial contact.
- Confirm DLT/UCC/DND obligations are met for your sender + content.
- Confirm the ExoPhone caller ID is verified (Settings page shows this).

Only then does the app place live calls. Until all of the above is true, keep
`TELEPHONY_PROVIDER=mock` — no real calls are placed and the full flow is still
demonstrable end-to-end.
