/** AI provider factory. Server-only. */

import { getConfig } from '@/lib/config';
import type { AiProvider } from './provider';
import { MockAIProvider } from './mock';
import { AnthropicAIProvider } from './anthropic';

let instance: AiProvider | null = null;

export function getAIProvider(): AiProvider {
  if (instance) return instance;
  const cfg = getConfig();
  switch (cfg.ai.provider) {
    case 'anthropic':
      instance = new AnthropicAIProvider({
        apiKey: cfg.ai.apiKey ?? '',
        model: cfg.ai.model,
      });
      break;
    case 'mock':
    default:
      instance = new MockAIProvider();
      break;
  }
  return instance;
}

export function __setAIProvider(p: AiProvider | null) {
  instance = p;
}

export type { AiProvider } from './provider';
