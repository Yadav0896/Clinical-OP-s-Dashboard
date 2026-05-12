// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Maya PA Platform — AI Utility (OpenAI SDK)
// Replaces z-ai-web-dev-sdk with standard OpenAI API
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import OpenAI from 'openai';

// Singleton OpenAI client — initialized once, reused across requests
let _client: OpenAI | null = null;
let _unavailable = false;

function getClient(): OpenAI | null {
  if (_unavailable) return null;
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        '[ai] OPENAI_API_KEY not set. AI features will use KB-only mode. ' +
        'Set OPENAI_API_KEY in .env.local to enable AI enhancement.'
      );
      _unavailable = true;
      return null;
    }
    _client = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL || undefined,
    });
  }
  return _client;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface ChatCompletionResult {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Send messages to OpenAI Chat Completions API.
 * Returns null if no API key is configured (KB-only mode).
 */
export async function chatCompletion(
  options: ChatCompletionOptions
): Promise<ChatCompletionResult | null> {
  const client = getClient();
  if (!client) return null;
  const model = options.model || process.env.OPENAI_MODEL || 'gpt-4o';

  const completion = await client.chat.completions.create({
    model,
    messages: options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens,
  });

  const choice = completion.choices?.[0];
  return {
    content: choice?.message?.content || '',
    model: completion.model,
    usage: completion.usage
      ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        }
      : undefined,
  };
}

/**
 * Check if the AI is configured and available
 */
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
