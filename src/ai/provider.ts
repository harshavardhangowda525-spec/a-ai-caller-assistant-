/**
 * AIProvider — vendor-agnostic interface for the conversational agent that
 * drives the call. Concrete implementations (mock, Anthropic) plug in behind
 * this. The provider is responsible for turning the caller's utterances into
 * an outcome + the next thing to say, always constrained by the system prompt.
 */

export type AiOutcome =
  | 'interested'
  | 'not_interested'
  | 'callback'
  | 'do_not_call'
  | 'continue';

export interface AiTurnInput {
  systemPrompt: string;
  /** Prior turns in the conversation. */
  history: Array<{ role: 'ai' | 'caller'; text: string }>;
  /** The latest caller utterance (transcribed). Empty on the opening turn. */
  callerUtterance: string;
}

export interface AiTurnResult {
  /** The line the AI should speak next. */
  say: string;
  outcome: AiOutcome;
  /** True when the caller explicitly agreed to be transferred. */
  requestTransfer: boolean;
  /** For callbacks: a natural-language time the caller proposed. */
  callbackTimeText?: string;
  /** Short summary appended to the call record when the conversation ends. */
  summary?: string;
}

export interface AiProvider {
  readonly name: string;
  nextTurn(input: AiTurnInput): Promise<AiTurnResult>;
}
