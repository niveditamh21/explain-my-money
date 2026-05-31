/**
 * Unit tests for src/lib/analytics.ts
 *
 * All expected values are derived from the fixed mock data in mockData.ts.
 *
 * May 2026 totals (verified by hand):
 *   - Total debit  : ₹32,850
 *   - Balance      : ₹12,150  (45,000 − 32,850)
 *   - Unique spending days : 26  (May 1–26)
 *   - Weekend spend: ₹9,250  (Sat/Sun transactions)
 *
 * April 2026 totals:
 *   - Total debit  : ₹24,525
 */

import {
  getTransactionsByMonth,
  getTotalDebit,
  getCategoryBreakdown,
  getTopMerchants,
  getWeekendSpending,
  getEstimatedBalance,
  getDailyBurnRate,
  getSpendingContext,
} from '@/lib/analytics';

// ── getTransactionsByMonth ──────────────────────────────────────────────────

describe('getTransactionsByMonth', () => {
  it('returns all May 2026 transactions (debit + credit)', () => {
    const txns = getTransactionsByMonth('2026-05');
    // 32 debit + 1 salary credit = 33
    expect(txns).toHaveLength(33);
  });

  it('returns all April 2026 transactions', () => {
    const txns = getTransactionsByMonth('2026-04');
    // 29 debit + 1 salary credit = 30
    expect(txns).toHaveLength(30);
  });

  it('returns empty array for a month with no data', () => {
    expect(getTransactionsByMonth('2025-01')).toHaveLength(0);
  });

  it('never mixes transactions from different months', () => {
    const may = getTransactionsByMonth('2026-05');
    const hasAprilDate = may.some((t) => t.date.startsWith('2026-04'));
    expect(hasAprilDate).toBe(false);
  });
});

// ── getTotalDebit ───────────────────────────────────────────────────────────

describe('getTotalDebit', () => {
  it('correctly totals May 2026 debits', () => {
    expect(getTotalDebit('2026-05')).toBe(32850);
  });

  it('correctly totals April 2026 debits', () => {
    expect(getTotalDebit('2026-04')).toBe(24525);
  });

  it('excludes salary credit from the total', () => {
    // If salary was included it would be 45000 + 32850 = 77850
    expect(getTotalDebit('2026-05')).toBeLessThan(45000);
  });

  it('returns 0 for a month with no data', () => {
    expect(getTotalDebit('2025-01')).toBe(0);
  });
});

// ── getCategoryBreakdown ────────────────────────────────────────────────────

describe('getCategoryBreakdown', () => {
  let breakdown: Record<string, number>;

  beforeEach(() => {
    breakdown = getCategoryBreakdown('2026-05');
  });

  it('includes all expected categories', () => {
    const categories = Object.keys(breakdown);
    expect(categories).toContain('Food & Dining');
    expect(categories).toContain('Groceries');
    expect(categories).toContain('Shopping');
    expect(categories).toContain('Transport');
    expect(categories).toContain('Subscriptions');
    expect(categories).toContain('Bills & Utilities');
    expect(categories).toContain('Fitness');
    expect(categories).toContain('Cash');
    expect(categories).toContain('Health');
  });

  it('does not include Salary as a debit category', () => {
    expect(breakdown['Salary']).toBeUndefined();
  });

  it('correctly sums Food & Dining (₹9,430)', () => {
    // Swiggy×6 + Zomato×3 + 3 restaurant meals
    expect(breakdown['Food & Dining']).toBe(9430);
  });

  it('correctly sums Shopping (₹8,000)', () => {
    // Myntra ₹3,499 + Amazon Shopping ₹4,501
    expect(breakdown['Shopping']).toBe(8000);
  });

  it('correctly sums Groceries (₹4,200)', () => {
    // BigBasket×2 + Blinkit×1
    expect(breakdown['Groceries']).toBe(4200);
  });

  it('correctly sums Transport (₹4,300)', () => {
    // Uber×2 + Ola×2 + Fuel×2
    expect(breakdown['Transport']).toBe(4300);
  });

  it('correctly sums Subscriptions (₹1,366)', () => {
    // Netflix + Spotify + Prime + Hotstar
    expect(breakdown['Subscriptions']).toBe(1366);
  });

  it('all category values sum to the May total debit', () => {
    const sum = Object.values(breakdown).reduce((a, b) => a + b, 0);
    expect(sum).toBe(32850);
  });
});

// ── getTopMerchants ─────────────────────────────────────────────────────────

describe('getTopMerchants', () => {
  it('returns results sorted by total amount descending', () => {
    const merchants = getTopMerchants('2026-05', 10);
    for (let i = 0; i < merchants.length - 1; i++) {
      expect(merchants[i].amount).toBeGreaterThanOrEqual(merchants[i + 1].amount);
    }
  });

  it('respects the n limit', () => {
    expect(getTopMerchants('2026-05', 3)).toHaveLength(3);
    expect(getTopMerchants('2026-05', 6)).toHaveLength(6);
  });

  it('top merchant in May is Amazon Shopping (₹4,501)', () => {
    const top = getTopMerchants('2026-05', 1)[0];
    expect(top.merchant).toBe('Amazon Shopping');
    expect(top.amount).toBe(4501);
    expect(top.count).toBe(1);
  });

  it('counts multiple Swiggy transactions correctly', () => {
    const merchants = getTopMerchants('2026-05', 10);
    const swiggy = merchants.find((m) => m.merchant === 'Swiggy');
    expect(swiggy).toBeDefined();
    expect(swiggy!.amount).toBe(3490); // 485+620+380+520+890+595
    expect(swiggy!.count).toBe(6);
  });

  it('returns empty array for a month with no data', () => {
    expect(getTopMerchants('2025-01', 5)).toHaveLength(0);
  });
});

// ── getWeekendSpending ──────────────────────────────────────────────────────

describe('getWeekendSpending', () => {
  it('weekend + weekday equals total debit', () => {
    const { weekend, weekday } = getWeekendSpending('2026-05');
    expect(weekend + weekday).toBe(32850);
  });

  it('weekend total is ₹7,342', () => {
    // May 1 = Friday, so weekends are: 2,3,9,10,16,17,23,24
    // May 2(Sat):485  May 3(Sun):768  May 9(Sat):450  May 10(Sun):2390
    // May 16(Sat):520 May 17(Sun):299 May 23(Sat):970 May 24(Sun):1460
    expect(getWeekendSpending('2026-05').weekend).toBe(7342);
  });

  it('ratio is between 0 and 1', () => {
    const { ratio } = getWeekendSpending('2026-05');
    expect(ratio).toBeGreaterThan(0);
    expect(ratio).toBeLessThan(1);
  });

  it('ratio matches weekend/total', () => {
    const { weekend, weekday, ratio } = getWeekendSpending('2026-05');
    expect(ratio).toBeCloseTo(weekend / (weekend + weekday), 5);
  });

  it('returns zero ratio for a month with no data', () => {
    expect(getWeekendSpending('2025-01').ratio).toBe(0);
  });
});

// ── getEstimatedBalance ─────────────────────────────────────────────────────

describe('getEstimatedBalance', () => {
  it('returns SALARY_AMOUNT minus May debit', () => {
    // 45000 - 32850 = 12150
    expect(getEstimatedBalance()).toBe(12150);
  });

  it('is positive (spending did not exceed salary)', () => {
    expect(getEstimatedBalance()).toBeGreaterThan(0);
  });
});

// ── getDailyBurnRate ────────────────────────────────────────────────────────

describe('getDailyBurnRate', () => {
  it('returns total divided by number of unique spending days', () => {
    // May has spending on 26 unique days (1st through 26th)
    const rate = getDailyBurnRate('2026-05');
    expect(rate).toBeCloseTo(32850 / 26, 1);
  });

  it('returns 0 for a month with no data', () => {
    expect(getDailyBurnRate('2025-01')).toBe(0);
  });
});

// ── getSpendingContext ──────────────────────────────────────────────────────

describe('getSpendingContext', () => {
  let context: string;

  beforeAll(() => {
    context = getSpendingContext();
  });

  it('includes the salary amount', () => {
    expect(context).toContain('45,000');
  });

  it('includes the May total', () => {
    expect(context).toContain('32,850');
  });

  it('includes the estimated balance', () => {
    expect(context).toContain('12,150');
  });

  it('includes the April comparison total', () => {
    expect(context).toContain('24,525');
  });

  it('mentions subscription status for Hotstar', () => {
    expect(context).toContain('Hotstar');
    expect(context).toContain('UNUSED');
  });

  it('mentions Netflix as active', () => {
    expect(context).toContain('Netflix');
    expect(context).toContain('Active');
  });

  it('includes all transaction dates for May', () => {
    expect(context).toContain('2026-05-01');
    expect(context).toContain('2026-05-26');
  });

  it('includes weekend vs weekday breakdown', () => {
    expect(context).toContain('Weekend');
    expect(context).toContain('Weekday');
  });
});
