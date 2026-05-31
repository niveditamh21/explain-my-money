import {
  getTotalDebit,
  getCategoryBreakdown,
  getEstimatedBalance,
  getWeekendSpending,
  getDailyBurnRate,
} from '@/lib/analytics';
import { subscriptionUsage, SALARY_AMOUNT } from '@/lib/mockData';

const CATEGORY_ICONS: Record<string, string> = {
  'Food & Dining': '🍔',
  Groceries: '🛒',
  Shopping: '🛍️',
  Transport: '🚗',
  Entertainment: '🎮',
  Subscriptions: '📱',
  'Bills & Utilities': '⚡',
  Health: '💊',
  Fitness: '💪',
  Cash: '💵',
};

export default function SpendingSnapshot() {
  const mayTotal = getTotalDebit('2026-05');
  const aprilTotal = getTotalDebit('2026-04');
  const balance = getEstimatedBalance();
  const categories = getCategoryBreakdown('2026-05');
  const weekendData = getWeekendSpending('2026-05');
  const dailyBurn = getDailyBurnRate('2026-05');

  const unusedSubs = subscriptionUsage.filter((s) => !s.isActive);
  const unusedSubsTotal = unusedSubs.reduce((s, u) => s + u.amount, 0);

  const spentPercent = (mayTotal / SALARY_AMOUNT) * 100;
  const momChange = (((mayTotal - aprilTotal) / aprilTotal) * 100).toFixed(1);

  const sortedCategories = Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const fmt = (n: number) => n.toLocaleString('en-IN');

  const barColor =
    spentPercent > 85
      ? 'bg-rose-500'
      : spentPercent > 65
      ? 'bg-amber-400'
      : 'bg-emerald-500';

  return (
    <div className="space-y-4">
      {/* ── Main spending card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            May 2026
          </p>
          <span className="text-xs bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold">
            +{momChange}% vs April
          </span>
        </div>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-bold text-slate-900">₹{fmt(mayTotal)}</span>
          <span className="text-slate-400 text-sm">/ ₹{fmt(SALARY_AMOUNT)}</span>
        </div>
        <p className="text-xs text-slate-400 mb-3">spent this month</p>

        <div className="w-full bg-slate-100 rounded-full h-2 mb-2">
          <div
            className={`h-2 rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(spentPercent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-slate-400">
          <span>{spentPercent.toFixed(0)}% of salary used</span>
          <span>₹{fmt(balance)} remaining</span>
        </div>
      </div>

      {/* ── Quick stat cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Daily burn</p>
          <p className="text-base font-bold text-slate-800">₹{fmt(Math.round(dailyBurn))}</p>
          <p className="text-xs text-slate-400">avg/day</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Weekends</p>
          <p className="text-base font-bold text-slate-800">
            {(weekendData.ratio * 100).toFixed(0)}%
          </p>
          <p className="text-xs text-slate-400">of spending</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Wasted subs</p>
          <p className="text-base font-bold text-rose-500">₹{unusedSubsTotal}/mo</p>
          <p className="text-xs text-slate-400">{unusedSubs.length} unused</p>
        </div>
      </div>

      {/* ── Category breakdown ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
          Where your money went
        </h3>
        <div className="space-y-3">
          {sortedCategories.map(([cat, amt]) => {
            const pct = (amt / mayTotal) * 100;
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-700 flex items-center gap-1.5">
                    <span>{CATEGORY_ICONS[cat] ?? '📌'}</span>
                    {cat}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">
                    ₹{fmt(amt)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-indigo-400"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
