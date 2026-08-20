/**
 * AnthropicAIProvider — real conversational model integration skeleton.
 *
 * Uses the Claude Messages API. The system prompt (with immutable safety rails)
 * constrains the model to approved information only. Requires AI_API_KEY.
 *
 * The model is asked to return a small JSON envelope so we can reliably extract
 * the outcome + transfer decision alongside the spoken line.
 */

import { logger } from '@/lib/logger';
import type { AiOutcome, AiProvider, AiTurnInput, AiTurnResult } from './provider';

interface AnthropicConfig {
  apiKey: string;
  model: string;
}

const RESPONSE_INSTRUCTION = `Respond ONLY with a compact JSON object:
{"say": string, "outcome": "interested"|"not_interested"|"callback"|"do_not_call"|"continue", "requestTransfer": boolean, "callbackTimeText"?: string, "summary"?: string}
Set requestTransfer=true ONLY if the caller has explicitly agreed to be transferred.`;

export class AnthropicAIProvider implements AiProvider {
  readonly name = 'anthropic';

  constructor(private readonly cfg: AnthropicConfig) {}

  async nextTurn(input: AiTurnInput): Promise<AiTurnResult> {
    const messages = [
      ...input.history.map((h) => ({
        role: h.role === 'ai' ? ('assistant' as const) : ('user' as const),
        content: h.text,
      })),
      {
        role: 'user' as const,
        content: input.callerUtterance || '(call just connected — greet the caller)',
      },
    ];

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.cfg.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: this.cfg.model,
        max_tokens: 400,
        system: `${input.systemPrompt}\n\n${RESPONSE_INSTRUCTION}`,
        messages,
      }),
    });

    if (!res.ok) {
      logger.error('anthropic.nextTurn failed', { status: res.status });
      throw new Error(`Anthropic API error: ${res.status}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = data.content?.find((c) => c.type === 'text')?.text ?? '{}';

    try {
      const parsed = JSON.parse(extractJson(text)) as Partial<AiTurnResult> & {
        outcome?: AiOutcome;
      };
      return {
        say: parsed.say ?? '',
        outcome: parsed.outcome ?? 'continue',
        requestTransfer: Boolean(parsed.requestTransfer),
        callbackTimeText: parsed.callbackTimeText,
        summary: parsed.summary,
      };
    } catch {
      // Fail safe: never invent a transfer or a false claim on parse failure.
      return {
        say: 'Thank you for your time. Have a great day.',
        outcome: 'continue',
        requestTransfer: false,
      };
    }
  }
}

function extractJson(text: string): string {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) return '{}';
  return text.slice(start, end + 1);
}
