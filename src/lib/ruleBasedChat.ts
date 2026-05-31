import {
  getTotalDebit,
  getCategoryBreakdown,
  getEstimatedBalance,
} from './analytics';
import { subscriptionUsage, SALARY_AMOUNT } from './mockData';

const fmt = (n: number) => n.toLocaleString('en-IN');

export function generateRuleBasedResponse(question: string): string {
  const q = question.toLowerCase();

  const mayTotal = getTotalDebit('2026-05');
  const aprilTotal = getTotalDebit('2026-04');
  const mayCategories = getCategoryBreakdown('2026-05');
  const aprilCategories = getCategoryBreakdown('2026-04');
  const balance = getEstimatedBalance();

  // ── Subscriptions ──────────────────────────────────────────────────────────
  if (
    q.includes('subscri') ||
    q.includes('netflix') ||
    q.includes('spotify') ||
    q.includes('prime') ||
    q.includes('hotstar') ||
    q.includes('wast') ||
    q.includes('cancel')
  ) {
    const total = subscriptionUsage.reduce((s, u) => s + u.amount, 0);
    const unused = subscriptionUsage.filter((s) => !s.isActive);
    const unusedTotal = unused.reduce((s, u) => s + u.amount, 0);
    return `You're paying ₹${fmt(total)}/month across ${subscriptionUsage.length} subscriptions:

✅  Netflix — ₹649  (watched recently, worth keeping)
✅  Spotify — ₹119  (used daily, definitely keep)
⚠️  Amazon Prime — ₹299  (last used 45 days ago — are you ordering regularly?)
🔴  Hotstar — ₹299  (not opened in 62 days — pure dead weight)

Cancelling Hotstar alone frees up ₹3,588/year.
Cancelling both Prime + Hotstar saves you ₹7,176/year — that's almost a month's groceries.

Quick action: Open Hotstar right now. If you can't remember the last show you watched, cancel it today. It takes 2 minutes.`;
  }

  // ── Affordability ──────────────────────────────────────────────────────────
  if (
    q.includes('afford') ||
    q.includes('buy') ||
    q.includes('purchase') ||
    q.includes('₹25') ||
    q.includes('25000') ||
    q.includes('25,000') ||
    (q.includes('phone') && !q.includes('recharge'))
  ) {
    const amountMatch = question.match(/[₹\s]?([\d,]+)/);
    const targetAmount =
      amountMatch ? parseInt(amountMatch[1].replace(/,/g, '')) : 25000;

    if (balance >= targetAmount) {
      return `Technically yes — your estimated balance is ₹${fmt(balance)}, which covers ₹${fmt(targetAmount)}.

But today is May 30, and your next salary arrives June 1. Buying now leaves only ₹${fmt(balance - targetAmount)} as a buffer for 2 days.

My suggestion: wait 2 days, buy it from June's salary, and keep May's balance intact as a cushion. You won't feel the difference, but your account will.`;
    } else {
      return `Honest answer: not this month.

Your estimated balance right now is ₹${fmt(balance)}, which is ₹${fmt(targetAmount - balance)} short of ₹${fmt(targetAmount)}.

The good news — salary arrives in 2 days (June 1, ₹45,000).

To comfortably afford this in June, you'd need to save:
→  Cut Swiggy orders in half → saves ~₹1,750
→  Cancel Hotstar + pause Prime → saves ₹598
→  Skip one shopping splurge (you had two big ones this month) → saves ~₹4,000

Do that and you can buy the ₹${fmt(targetAmount)} item and still have ₹14,000+ as a safety net. Zero financial stress.`;
    }
  }

  // ── Why is balance low / general balance question ──────────────────────────
  if (
    q.includes('balance') ||
    q.includes('always low') ||
    q.includes('why low') ||
    q.includes('money go') ||
    q.includes('where did') ||
    q.includes('broke') ||
    q.includes('empty') ||
    (q.includes('left') && q.includes('month'))
  ) {
    const foodAmt = mayCategories['Food & Dining'] || 0;
    const shoppingAmt = mayCategories['Shopping'] || 0;
    const unusedSubsAmt = subscriptionUsage
      .filter((s) => !s.isActive)
      .reduce((s, u) => s + u.amount, 0);

    // Check if it's specifically "where did money go" vs "why is balance low"
    if (q.includes('where') || q.includes('go') || q.includes('salary')) {
      const sorted = Object.entries(mayCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6);
      const catLines = sorted
        .map(([cat, amt]) => `• ${cat}: ₹${fmt(amt)} (${((amt / mayTotal) * 100).toFixed(0)}%)`)
        .join('\n');

      return `Here's where your ₹${fmt(SALARY_AMOUNT)} May salary actually went:

${catLines}

Total spent: ₹${fmt(mayTotal)} — leaving ₹${fmt(balance)} today.

Two things stand out:
1. Food delivery (₹${fmt(foodAmt)}) is your biggest category — 29% of salary just on eating out.
2. Shopping spiked to ₹${fmt(shoppingAmt)} this month vs ₹3,500 last month. That Myntra + Amazon combo hit hard.

Your subscriptions are also leaking ₹598/month on two apps you haven't opened in 45+ days.`;
    }

    return `Three patterns are draining your account every month:

1️⃣  Food delivery habit — ₹${fmt(foodAmt)} this month (${((foodAmt / SALARY_AMOUNT) * 100).toFixed(0)}% of your salary)
    Swiggy alone: ₹3,490. That's 6 orders averaging ₹582 each.
    Cooking even 3 days a week could save ₹2,500–3,000/month.

2️⃣  Shopping spikes — ₹${fmt(shoppingAmt)} this month vs ₹3,500 last month
    One Myntra haul + one Amazon order = ₹8,000 gone in 2 days.
    These feel like small decisions but blow the budget month after month.

3️⃣  Silent subscription drain — ₹${fmt(unusedSubsAmt)}/month on apps you don't open
    Hotstar hasn't been opened in 62 days. It leaves quietly every month.

Fix all three and you'd end every month with ₹7,000–10,000 more than you do now.`;
  }

  // ── Month-over-month comparison ─────────────────────────────────────────────
  if (
    q.includes('compare') ||
    q.includes('last month') ||
    q.includes('april') ||
    q.includes('previous') ||
    q.includes('vs ') ||
    q.includes('differ')
  ) {
    const diff = mayTotal - aprilTotal;
    const pct = (((mayTotal - aprilTotal) / aprilTotal) * 100).toFixed(1);
    const foodMay = mayCategories['Food & Dining'] || 0;
    const foodApr = aprilCategories['Food & Dining'] || 0;
    const shopMay = mayCategories['Shopping'] || 0;
    const shopApr = aprilCategories['Shopping'] || 0;

    return `May vs April — here's what changed:

📈  Total: ₹${fmt(mayTotal)} this month vs ₹${fmt(aprilTotal)} last month (+₹${fmt(diff)}, ${pct}% more)

Biggest jumps:
• Shopping: ₹${fmt(shopMay)} vs ₹${fmt(shopApr)} last month (+₹${fmt(shopMay - shopApr)}, 129% more)
• Food & Dining: ₹${fmt(foodMay)} vs ₹${fmt(foodApr)} last month (+₹${fmt(foodMay - foodApr)}, 39% more)
  Swiggy specifically jumped from ~₹2,140 to ₹3,490 (64% more orders)

What stayed the same:
• Subscriptions: ₹1,366 both months (fixed cost)
• Transport: similar (₹4,300 vs ₹3,860)
• Fitness: ₹1,500 both months

Bottom line: May's extra ₹${fmt(diff)} overspend came almost entirely from that shopping spike and eating out more often.`;
  }

  // ── Food / Swiggy / Zomato ─────────────────────────────────────────────────
  if (
    q.includes('food') ||
    q.includes('swiggy') ||
    q.includes('zomato') ||
    q.includes('eat') ||
    q.includes('dining') ||
    q.includes('restaurant') ||
    q.includes('delivery')
  ) {
    const foodAmt = mayCategories['Food & Dining'] || 0;
    const aprilFoodAmt = aprilCategories['Food & Dining'] || 0;
    const foodPct = ((foodAmt / mayTotal) * 100).toFixed(1);

    return `Food & dining is your #1 expense at ₹${fmt(foodAmt)} — that's ${foodPct}% of your ₹45,000 salary.

Breakdown:
• Swiggy: ₹3,490  (6 orders this month, avg ₹582/order)
• Zomato: ₹2,100  (3 orders, avg ₹700/order)
• Restaurant dining: ₹3,840  (3 sit-down meals on weekends)

vs April: ₹${fmt(foodAmt - aprilFoodAmt)} more this month (+${(((foodAmt - aprilFoodAmt) / aprilFoodAmt) * 100).toFixed(0)}%)

The restaurant meals on weekends (₹1,240 + ₹1,400 + ₹1,200) are expensive but occasional.
The real habit is Swiggy — it's up 64% vs last month.

Small fix with real impact: replace 2 Swiggy orders per week with home cooking.
That alone saves ~₹1,200/month without feeling like a sacrifice.`;
  }

  // ── Transport / fuel ───────────────────────────────────────────────────────
  if (
    q.includes('transport') ||
    q.includes('fuel') ||
    q.includes('uber') ||
    q.includes('ola') ||
    q.includes('travel') ||
    q.includes('cab')
  ) {
    const transportAmt = mayCategories['Transport'] || 0;
    return `Transport cost you ₹${fmt(transportAmt)} this month:

• Fuel (petrol): ₹2,500 across 2 fill-ups
• Uber: ₹765 (2 rides — ₹345 + ₹420)
• Ola: ₹1,035 (2 rides — ₹280 + ₹755)

This is actually one of your more stable categories — similar to last month (₹3,860).
The one thing to watch: your Ola rides are averaging ₹500+ each. If those are frequent short trips, it adds up fast.`;
  }

  // ── Shopping ──────────────────────────────────────────────────────────────
  if (
    q.includes('shop') ||
    q.includes('myntra') ||
    q.includes('amazon') ||
    q.includes('flipkart') ||
    q.includes('clothes') ||
    q.includes('online')
  ) {
    const shopAmt = mayCategories['Shopping'] || 0;
    const aprilShopAmt = aprilCategories['Shopping'] || 0;
    return `Shopping was your #2 expense this month at ₹${fmt(shopAmt)} — and it's the main reason May was worse than April.

• Myntra (May 13): ₹3,499
• Amazon (May 19): ₹4,501
• Total: ₹${fmt(shopAmt)} vs ₹${fmt(aprilShopAmt)} last month (129% increase)

Both happened within a week of each other, which is a pattern worth noticing — one purchase often triggers another.

For next month: set a ₹3,000 shopping budget. The two splurges this month alone cost ₹4,500 more than your April average.`;
  }

  // ── Default: full breakdown ────────────────────────────────────────────────
  const sorted = Object.entries(mayCategories)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const catLines = sorted
    .map(([cat, amt]) => `• ${cat}: ₹${fmt(amt)} (${((amt / mayTotal) * 100).toFixed(0)}%)`)
    .join('\n');

  return `Here's where your ₹${fmt(SALARY_AMOUNT)} May salary went:

${catLines}

Total spent: ₹${fmt(mayTotal)} — ₹${fmt(balance)} remaining today.

The headline: food delivery + a shopping spike account for most of May's overspend vs last month.
You spent ₹${fmt(mayTotal - aprilTotal)} more than April.

Try asking:
• "What subscriptions am I wasting money on?"
• "Why is my balance always low?"
• "Can I afford a ₹25,000 phone?"
• "Compare May vs April spending"`;
}
