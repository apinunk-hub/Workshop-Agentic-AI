import type { ChatMessage, ChatTurnResult, ToolCaller } from '../types';
export async function runOpenAiCompatConversation(baseUrl: string | undefined, apiKey: string | undefined, model: string, messages: ChatMessage[], tools: unknown[] = [], _toolCaller?: ToolCaller): Promise<ChatTurnResult> {
  if (!baseUrl?.trim()) return { reply: 'ยังไม่ได้ตั้งค่า base URL ของ OpenAI-compatible gateway ในระบบ', toolTrace: [] };
  if (!apiKey?.trim()) return { reply: 'ยังไม่ได้ตั้งค่า API key ของ provider ที่เลือกในระบบ', toolTrace: [] };
  const body = { model, messages, ...(tools.length ? { tools, tool_choice: 'auto' } : {}) };
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` }, body: JSON.stringify(body) });
  if (!response.ok) return { reply: `OpenAI-compatible provider ตอบกลับด้วยข้อผิดพลาด (${response.status})`, toolTrace: [] };
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return { reply: data.choices?.[0]?.message?.content?.trim() || 'Provider ไม่ได้ส่งข้อความตอบกลับ', toolTrace: [] };
}