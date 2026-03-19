import Anthropic from '@anthropic-ai/sdk';

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessage(
  systemPrompt: string,
  messages: ClaudeMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const client = getAnthropicClient();
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find(c => c.type === 'text');
  return textContent?.text ?? '';
}

export async function sendStructuredMessage<T>(
  systemPrompt: string,
  userMessage: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): Promise<T> {
  const response = await sendMessage(
    systemPrompt + '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, just the JSON object.',
    [{ role: 'user', content: userMessage }],
    options
  );

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(response) as T;
  } catch {
    throw new Error(`Failed to parse Claude response as JSON: ${response.substring(0, 200)}`);
  }
}
