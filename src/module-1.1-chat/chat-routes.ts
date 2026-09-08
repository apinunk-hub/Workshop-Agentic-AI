import type { Env } from '../../env';
import { errorJson, json } from '../../lib/http';
import { runGeminiConversation } from './providers/gemini';
import { runOpenAiCompatConversation } from './providers/openai-compat';
import type { ChatMessage, ChatProvider, ChatTurnResult } from './types';

const providers: ChatProvider[] = ['gemini', 'openai', 'openai-compat'];
export function resolveProvider(value: unknown, env: Env): ChatProvider {
  const candidate = typeof value === 'string' ? value : env.DEFAULT_CHAT_PROVIDER;
  return providers.includes(candidate as ChatProvider) ? candidate as ChatProvider : 'gemini';
}
export function defaultModelFor(provider: ChatProvider, env: Env): string {
  return provider === 'gemini' ? env.GEMINI_MODEL || 'gemini-flash-latest' : provider === 'openai' ? env.OPENAI_MODEL || 'gpt-4o-mini' : env.OPENAI_COMPAT_MODEL || 'gpt-4o-mini';
}
export function buildSystemPrompt(): string { return 'คุณคือผู้ช่วย AI ของระบบ ตอบเป็นภาษาไทยอย่างสุภาพ ชัดเจน และตรงประเด็น'; }
function resolveApiKey(provider: ChatProvider, env: Env): string | undefined { return provider === 'gemini' ? env.GEMINI_API_KEY : provider === 'openai' ? env.OPENAI_API_KEY : env.OPENAI_COMPAT_API_KEY; }
function resolveBaseUrl(provider: ChatProvider, env: Env): string | undefined { return provider === 'openai' ? 'https://api.openai.com/v1' : provider === 'openai-compat' ? env.OPENAI_COMPAT_BASE_URL : undefined; }

export async function runChatTurn(provider: ChatProvider, model: string, messages: ChatMessage[], env: Env): Promise<ChatTurnResult> {
  const allMessages = [{ role: 'user' as const, content: buildSystemPrompt() }, ...messages];
  if (provider === 'gemini') return runGeminiConversation(resolveApiKey(provider, env), model, allMessages);
  return runOpenAiCompatConversation(resolveBaseUrl(provider, env), resolveApiKey(provider, env), model, allMessages);
}

export async function handleChatRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return errorJson('ต้องใช้เมธอด POST', 405);
  try {
    const body = await request.json() as { message?: unknown; history?: unknown; provider?: unknown; model?: unknown };
    if (typeof body.message !== 'string' || !body.message.trim()) return errorJson('กรุณาระบุ message');
    const provider = resolveProvider(body.provider, env);
    const history = Array.isArray(body.history) ? body.history.filter((item): item is ChatMessage => !!item && typeof item === 'object' && ((item as ChatMessage).role === 'user' || (item as ChatMessage).role === 'assistant') && typeof (item as ChatMessage).content === 'string') : [];
    const messages = [...history, { role: 'user' as const, content: body.message }];
    const model = typeof body.model === 'string' && body.model.trim() ? body.model : defaultModelFor(provider, env);
    const result = await runChatTurn(provider, model, messages, env);
    return json({ reply: result.reply, provider, model, toolTrace: result.toolTrace });
  } catch { return errorJson('รูปแบบคำขอไม่ถูกต้อง', 400); }
}