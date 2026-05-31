import { NextRequest, NextResponse } from 'next/server';
import { getSpendingContext } from '@/lib/analytics';
import { generateRuleBasedResponse } from '@/lib/ruleBasedChat';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { message, history } = body as {
    message: string;
    history: { role: 'user' | 'assistant'; content: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 });
  }

  // Try OpenAI if a key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey });

      const systemPrompt = `You are "Explain My Money", a friendly AI financial coach for Indian users.
You analyze spending data and give honest, actionable insights in plain language.

Guidelines:
- Be direct and specific. Use actual rupee amounts and real merchant names from the data.
- Sound like a smart friend, not a bank chatbot. Conversational, warm, honest.
- Use ₹ symbol for amounts. Keep responses under 200 words.
- Lead with the most important insight, not a preamble.
- Be honest even when the truth stings (e.g., "your Swiggy habit is expensive").
- For affordability questions, give a clear yes/no with reasoning.
- Use bullet points for lists, plain prose for explanations.

Here is the user's complete financial data for context:

${getSpendingContext()}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...history.map((h) => ({ role: h.role, content: h.content })),
          { role: 'user', content: message },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const reply = completion.choices[0].message.content ?? '';
      return NextResponse.json({ reply });
    } catch (err) {
      console.error('OpenAI error, falling back to rule-based:', err);
    }
  }

  // Rule-based fallback — works without any API key
  const reply = generateRuleBasedResponse(message);
  return NextResponse.json({ reply });
}
