/**
 * Integration tests for POST /api/chat  (src/app/api/chat/route.ts)
 *
 * Strategy:
 *  - Mock `next/server` so the route can run outside the Next.js runtime.
 *  - Delete process.env.OPENAI_API_KEY so the route always uses the
 *    rule-based fallback — no network calls, no API key needed.
 *  - Test the full request → response pipeline.
 */

// ── Mock next/server ────────────────────────────────────────────────────────
// NextResponse.json() is the only thing the route calls from next/server.
// We return a plain object so tests can read ._data and ._status directly.

jest.mock('next/server', () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data: unknown, init?: { status?: number }) => ({
      _data: data,
      _status: init?.status ?? 200,
    })),
  },
}));

import { POST } from '@/app/api/chat/route';

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Build a minimal fake NextRequest that satisfies the route's req.json() call */
function makeReq(body: object) {
  return { json: async () => body } as any;
}

/** Call POST and return the unwrapped mock response */
async function chat(message: string, history: { role: string; content: string }[] = []) {
  const res = await POST(makeReq({ message, history })) as any;
  return { status: res._status as number, data: res._data as Record<string, unknown> };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/chat — input validation', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('returns 400 for an empty message string', async () => {
    const { status, data } = await chat('');
    expect(status).toBe(400);
    expect(data).toHaveProperty('error');
  });

  it('returns 400 for a whitespace-only message', async () => {
    const { status } = await chat('   ');
    expect(status).toBe(400);
  });
});

describe('POST /api/chat — rule-based fallback (no API key)', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  it('returns 200 with a reply field', async () => {
    const { status, data } = await chat('Where did my money go?');
    expect(status).toBe(200);
    expect(data).toHaveProperty('reply');
    expect(typeof data.reply).toBe('string');
    expect((data.reply as string).length).toBeGreaterThan(20);
  });

  it('subscription question returns info about Hotstar', async () => {
    const { data } = await chat('What subscriptions am I wasting?');
    expect(data.reply as string).toContain('Hotstar');
  });

  it('affordability question returns balance reference', async () => {
    const { data } = await chat('Can I afford a ₹25,000 phone?');
    expect(data.reply as string).toContain('12,150');
  });

  it('comparison question returns April and May totals', async () => {
    const { data } = await chat('Compare May vs April');
    const reply = data.reply as string;
    expect(reply).toContain('₹32,850');
    expect(reply).toContain('₹24,525');
  });

  it('passes previous history without error', async () => {
    const history = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ];
    const { status } = await chat('Where did my salary go?', history);
    expect(status).toBe(200);
  });

  it('handles empty history array', async () => {
    const { status } = await chat('food spending', []);
    expect(status).toBe(200);
  });
});

describe('POST /api/chat — diverse question types all return 200', () => {
  beforeEach(() => {
    delete process.env.OPENAI_API_KEY;
  });

  const questions = [
    'Why is my balance always low?',
    'Compare this month to last month',
    'How much did I spend on Swiggy?',
    'Can I afford a ₹50,000 laptop?',
    'What are my top expenses?',
    'Tell me about my subscriptions',
    'How much fuel did I buy?',
    'What did I buy on Myntra?',
    'random unrecognised question',
  ];

  it.each(questions)('returns 200 for: "%s"', async (q) => {
    const { status, data } = await chat(q);
    expect(status).toBe(200);
    expect((data.reply as string).length).toBeGreaterThan(10);
  });
});
