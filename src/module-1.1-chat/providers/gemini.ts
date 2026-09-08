import type { ChatMessage, ChatTurnResult, ToolCaller } from '../types';
export async function runGeminiConversation(apiKey: string | undefined, model: string, messages: ChatMessage[], _tools: unknown[] = [], _toolCaller?: ToolCaller): Promise<ChatTurnResult> {
  if (!apiKey?.trim()) return { reply: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ในระบบ จึงยังเรียก Gemini ไม่ได้', toolTrace: [] };
  const contents = messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] }));
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contents }) });
  if (!response.ok) return { reply: `Gemini ตอบกลับด้วยข้อผิดพลาด (${response.status})`, toolTrace: [] };
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return { reply: data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim() || 'Gemini ไม่ได้ส่งข้อความตอบกลับ', toolTrace: [] };
}