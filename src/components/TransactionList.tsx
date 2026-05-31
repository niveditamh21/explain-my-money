import { getTransactionsByMonth } from '@/lib/analytics';

const SOURCE_STYLES: Record<string, string> = {
  UPI: 'bg-blue-50 text-blue-600',
  'Credit Card': 'bg-purple-50 text-purple-600',
  'Debit Card': 'bg-teal-50 text-teal-600',
  Wallet: 'bg-orange-50 text-orange-600',
  'Bank Transfer': 'bg-slate-100 text-slate-600',
};

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
  Salary: '💰',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function TransactionList() {
  const txns = getTransactionsByMonth('2026-05').sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  // Group by date
  const grouped = txns.reduce<Record<string, typeof txns>>((acc, t) => {
    (acc[t.date] = acc[t.date] ?? []).push(t);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Transactions — May 2026
        </h3>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: '420px' }}>
        {dates.map((date) => (
          <div key={date}>
            <div className="px-5 py-1.5 bg-slate-50 border-y border-slate-100">
              <span className="text-xs font-medium text-slate-400">
                {formatDate(date)}
              </span>
            </div>

            {grouped[date].map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">
                    {CATEGORY_ICONS[t.category] ?? '📌'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {t.merchant}
                    </p>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                        SOURCE_STYLES[t.source] ?? 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {t.source}
                    </span>
                  </div>
                </div>

                <p
                  className={`text-sm font-semibold shrink-0 ml-3 ${
                    t.isCredit ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {t.isCredit ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
