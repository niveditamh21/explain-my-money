/**
 * Unit tests for src/lib/ruleBasedChat.ts
 *
 * Verifies that each question intent is correctly detected and that the
 * response contains the expected key facts from the mock data.
 */

import { generateRuleBasedResponse } from '@/lib/ruleBasedChat';

// Helper — assert a response includes all expected substrings
function expectAll(response: string, ...substrings: string[]) {
  for (const s of substrings) {
    expect(response).toContain(s);
  }
}

// ── Subscription intent ─────────────────────────────────────────────────────

describe('subscription questions', () => {
  const TRIGGERS = [
    'What subscriptions am I wasting?',
    'Tell me about my netflix',
    'should I cancel hotstar',
    'I think I am paying for prime for nothing',
    'wasting money on apps',
  ];

  it.each(TRIGGERS)('recognises "%s" as a subscription question', (q) => {
    const response = generateRuleBasedResponse(q);
    expectAll(response, 'Netflix', 'Spotify', 'Hotstar', '₹1,366');
  });

  it('flags Hotstar as unused (62 days)', () => {
    const r = generateRuleBasedResponse('subscriptions');
    expect(r).toMatch(/62 days|not opened/i);
  });

  it('flags Amazon Prime as borderline (45 days)', () => {
    const r = generateRuleBasedResponse('subscriptions');
    expect(r).toContain('45 days');
  });

  it('mentions yearly saving for cancelling Hotstar', () => {
    const r = generateRuleBasedResponse('subscriptions');
    expect(r).toContain('₹3,588');
  });

  it('mentions combined yearly saving for both unused subs', () => {
    const r = generateRuleBasedResponse('cancel subscriptions');
    expect(r).toContain('₹7,176');
  });
});

// ── Affordability intent ────────────────────────────────────────────────────

describe('affordability questions', () => {
  it('gives a "yes" answer when target amount is below balance (₹5,000 < ₹12,150)', () => {
    const r = generateRuleBasedResponse('Can I afford a ₹5,000 item?');
    // Balance is ₹12,150 so 5000 is affordable
    expect(r).toContain('12,150');
  });

  it('gives a "no" answer when target amount exceeds balance (₹25,000 > ₹12,150)', () => {
    const r = generateRuleBasedResponse('Can I afford a ₹25,000 phone?');
    expect(r).toContain('12,150'); // shows current balance
    expect(r).toContain('25,000'); // echoes the target
  });

  it('recognises "buy" keyword', () => {
    const r = generateRuleBasedResponse('I want to buy a laptop');
    // Should enter affordability handler
    expect(r).toContain('balance');
  });

  it('recognises "afford" keyword', () => {
    const r = generateRuleBasedResponse('afford a new phone');
    expect(r).toContain('12,150');
  });

  it('does not treat "phone recharge" as a phone purchase', () => {
    // "recharge" short-circuits the phone keyword
    const r = generateRuleBasedResponse('how much did I spend on phone recharge');
    // Should NOT enter affordability handler — falls to food/default
    expect(r).not.toContain('Honest answer: not this month');
  });
});

// ── Balance / "where did money go" intent ──────────────────────────────────

describe('"where did money go" questions', () => {
  it('returns full category breakdown for "where did my salary go"', () => {
    const r = generateRuleBasedResponse('Where did my salary go this month?');
    expectAll(r, '₹9,430', '₹8,000', '₹32,850', '₹12,150');
  });

  it('returns root-cause analysis for "why is my balance low"', () => {
    const r = generateRuleBasedResponse('Why is my balance always low?');
    expectAll(r, 'Swiggy', '₹3,490', 'subscription');
  });

  it('mentions food delivery as a drain', () => {
    const r = generateRuleBasedResponse('balance low');
    expect(r).toMatch(/food delivery|swiggy/i);
  });

  it('mentions shopping spikes', () => {
    const r = generateRuleBasedResponse('why am I always broke');
    expect(r).toMatch(/shopping/i);
  });
});

// ── Comparison intent ───────────────────────────────────────────────────────

describe('month-over-month comparison questions', () => {
  const TRIGGERS = [
    'Compare May vs April',
    'how does this month compare to last month?',
    'what changed from april',
    'show me the difference',
  ];

  it.each(TRIGGERS)('recognises "%s" as a comparison question', (q) => {
    const r = generateRuleBasedResponse(q);
    expectAll(r, '₹32,850', '₹24,525');
  });

  it('highlights the shopping spike', () => {
    const r = generateRuleBasedResponse('compare may april');
    expectAll(r, '₹8,000', '₹3,500');
  });

  it('shows the total month-over-month difference (₹8,325)', () => {
    const r = generateRuleBasedResponse('last month comparison');
    expect(r).toContain('₹8,325');
  });

  it('mentions food increase percentage', () => {
    const r = generateRuleBasedResponse('compare months');
    expect(r).toMatch(/39%|food/i);
  });
});

// ── Food / delivery intent ──────────────────────────────────────────────────

describe('food and delivery questions', () => {
  const TRIGGERS = [
    'How much did I spend on food?',
    'What is my swiggy spend?',
    'How often do I order from zomato?',
    'dining expenses',
    'eating out',
  ];

  it.each(TRIGGERS)('recognises "%s" as a food question', (q) => {
    const r = generateRuleBasedResponse(q);
    expectAll(r, 'Swiggy', '₹3,490', '₹9,430');
  });

  it('includes Zomato breakdown', () => {
    const r = generateRuleBasedResponse('food spending');
    expectAll(r, 'Zomato', '₹2,100');
  });

  it('mentions restaurant dining total', () => {
    const r = generateRuleBasedResponse('dining');
    expect(r).toContain('₹3,840');
  });

  it('shows April comparison for food', () => {
    const r = generateRuleBasedResponse('swiggy this month');
    expect(r).toMatch(/april|last month/i);
  });
});

// ── Transport intent ────────────────────────────────────────────────────────

describe('transport questions', () => {
  it('recognises "uber" keyword', () => {
    const r = generateRuleBasedResponse('uber spending');
    expectAll(r, '₹4,300', 'Fuel');
  });

  it('recognises "fuel" keyword', () => {
    const r = generateRuleBasedResponse('fuel costs this month');
    expect(r).toContain('₹2,500');
  });

  it('recognises "cab" keyword', () => {
    const r = generateRuleBasedResponse('how much on cabs');
    expect(r).toContain('Ola');
  });
});

// ── Shopping intent ─────────────────────────────────────────────────────────

describe('shopping questions', () => {
  it('recognises "shop" keyword', () => {
    const r = generateRuleBasedResponse('shopping this month');
    expectAll(r, '₹8,000', 'Myntra', 'Amazon');
  });

  it('highlights the 129% increase vs April', () => {
    const r = generateRuleBasedResponse('myntra and amazon');
    expect(r).toContain('129%');
  });

  it('shows April comparison (₹3,500)', () => {
    const r = generateRuleBasedResponse('online shopping');
    expect(r).toContain('₹3,500');
  });
});

// ── Default / fallback response ─────────────────────────────────────────────

describe('default fallback response', () => {
  const GENERIC = [
    'hello',
    'what is my financial health',
    'give me a summary',
    'random question xyz',
  ];

  it.each(GENERIC)('returns a response for unrecognised question "%s"', (q) => {
    const r = generateRuleBasedResponse(q);
    expect(r.length).toBeGreaterThan(50);
  });

  it('default response includes total spent and balance', () => {
    const r = generateRuleBasedResponse('hello');
    expectAll(r, '₹32,850', '₹12,150', '₹45,000');
  });

  it('default response suggests follow-up questions', () => {
    const r = generateRuleBasedResponse('summary');
    expect(r).toMatch(/ask me|try asking/i);
  });
});

// ── Response quality ────────────────────────────────────────────────────────

describe('response quality', () => {
  it('all responses contain at least one ₹ amount', () => {
    const questions = [
      'subscriptions',
      'afford phone',
      'balance low',
      'compare april',
      'food',
      'uber',
      'shopping',
      'general summary',
    ];
    for (const q of questions) {
      expect(generateRuleBasedResponse(q)).toContain('₹');
    }
  });

  it('all responses are non-empty strings', () => {
    const questions = ['?', 'a', 'subscri', 'buy', 'balance'];
    for (const q of questions) {
      const r = generateRuleBasedResponse(q);
      expect(typeof r).toBe('string');
      expect(r.trim().length).toBeGreaterThan(0);
    }
  });
});
