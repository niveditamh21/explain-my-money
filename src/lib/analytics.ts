import { transactions, subscriptionUsage, SALARY_AMOUNT } from './mockData';

export function getTransactionsByMonth(yearMonth: string) {
  return transactions.filter((t) => t.date.startsWith(yearMonth));
}

export function getTotalDebit(yearMonth: string): number {
  return getTransactionsByMonth(yearMonth)
    .filter((t) => !t.isCredit)
    .reduce((sum, t) => sum + t.amount, 0);
}

export function getCategoryBreakdown(yearMonth: string): Record<string, number> {
  const txns = getTransactionsByMonth(yearMonth).filter((t) => !t.isCredit);
  const breakdown: Record<string, number> = {};
  for (const t of txns) {
    breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
  }
  return breakdown;
}

export function getTopMerchants(
  yearMonth: string,
  n = 6
): { merchant: string; amount: number; count: number }[] {
  const txns = getTransactionsByMonth(yearMonth).filter((t) => !t.isCredit);
  const map: Record<string, { amount: number; count: number }> = {};
  for (const t of txns) {
    if (!map[t.merchant]) map[t.merchant] = { amount: 0, count: 0 };
    map[t.merchant].amount += t.amount;
    map[t.merchant].count += 1;
  }
  return Object.entries(map)
    .map(([merchant, data]) => ({ merchant, ...data }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, n);
}

export function getWeekendSpending(yearMonth: string): {
  weekend: number;
  weekday: number;
  ratio: number;
} {
  const txns = getTransactionsByMonth(yearMonth).filter((t) => !t.isCredit);
  let weekend = 0,
    weekday = 0;
  for (const t of txns) {
    const day = new Date(t.date + 'T00:00:00').getDay(); // 0=Sun, 6=Sat
    if (day === 0 || day === 6) weekend += t.amount;
    else weekday += t.amount;
  }
  const total = weekend + weekday;
  return { weekend, weekday, ratio: total > 0 ? weekend / total : 0 };
}

export function getEstimatedBalance(): number {
  return SALARY_AMOUNT - getTotalDebit('2026-05');
}

export function getDailyBurnRate(yearMonth: string): number {
  const txns = getTransactionsByMonth(yearMonth).filter((t) => !t.isCredit);
  const uniqueDays = new Set(txns.map((t) => t.date)).size;
  if (uniqueDays === 0) return 0;
  return txns.reduce((sum, t) => sum + t.amount, 0) / uniqueDays;
}

/** Builds the full spending context string passed to the LLM. */
export function getSpendingContext(): string {
  const mayTotal = getTotalDebit('2026-05');
  const aprilTotal = getTotalDebit('2026-04');
  const mayCategories = getCategoryBreakdown('2026-05');
  const aprilCategories = getCategoryBreakdown('2026-04');
  const balance = getEstimatedBalance();
  const dailyBurn = getDailyBurnRate('2026-05');
  const weekendData = getWeekendSpending('2026-05');
  const topMerchants = getTopMerchants('2026-05', 8);

  const fmt = (n: number) => n.toLocaleString('en-IN');

  const categoryLines = Object.entries(mayCategories)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => {
      const pct = ((amt / mayTotal) * 100).toFixed(1);
      const aprilAmt = aprilCategories[cat] || 0;
      const change =
        aprilAmt > 0
          ? ` [${((amt - aprilAmt) / aprilAmt) * 100 > 0 ? '+' : ''}${(((amt - aprilAmt) / aprilAmt) * 100).toFixed(0)}% vs April]`
          : '';
      return `  ${cat}: ₹${fmt(amt)} (${pct}%)${change}`;
    })
    .join('\n');

  const subLines = subscriptionUsage
    .map(
      (s) =>
        `  ${s.merchant}: ₹${s.amount}/mo — ${s.isActive ? 'Active' : `UNUSED — last used ${s.lastUsedDaysAgo} days ago`}`
    )
    .join('\n');

  const merchantLines = topMerchants
    .map((m) => `  ${m.merchant}: ₹${fmt(m.amount)} (${m.count} txn${m.count > 1 ? 's' : ''})`)
    .join('\n');

  const txnLines = getTransactionsByMonth('2026-05')
    .filter((t) => !t.isCredit)
    .map((t) => `  ${t.date} | ${t.source.padEnd(13)} | ${t.merchant.padEnd(22)} | ₹${String(t.amount).padStart(5)} | ${t.category}`)
    .join('\n');

  const momChange = (((mayTotal - aprilTotal) / aprilTotal) * 100).toFixed(1);

  return `FINANCIAL CONTEXT — May 2026 (Today: May 30, 2026)

SALARY: ₹${fmt(SALARY_AMOUNT)} credited on May 1, 2026
ESTIMATED CURRENT BALANCE: ₹${fmt(balance)}
DAYS UNTIL NEXT SALARY: 2 days (June 1)

MAY 2026 SPENDING SUMMARY:
Total spent: ₹${fmt(mayTotal)} of ₹${fmt(SALARY_AMOUNT)} (${((mayTotal / SALARY_AMOUNT) * 100).toFixed(1)}% of salary)
Average daily spend: ₹${fmt(Math.round(dailyBurn))}

APRIL 2026 TOTAL (last month): ₹${fmt(aprilTotal)}
Month-over-month change: +₹${fmt(mayTotal - aprilTotal)} (+${momChange}%)

CATEGORY BREAKDOWN (May 2026 vs April):
${categoryLines}

SUBSCRIPTIONS (₹1,366/month total):
${subLines}
Potentially wasted (unused 45+ days): ₹598/month — Amazon Prime + Hotstar

TOP MERCHANTS (May 2026):
${merchantLines}

WEEKEND vs WEEKDAY SPENDING:
Weekend: ₹${fmt(weekendData.weekend)} (${(weekendData.ratio * 100).toFixed(1)}% of total)
Weekday: ₹${fmt(weekendData.weekday)} (${((1 - weekendData.ratio) * 100).toFixed(1)}% of total)

ALL TRANSACTIONS (May 2026):
${txnLines}`.trim();
}
