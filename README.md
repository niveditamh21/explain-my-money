# 💰 Explain My Money

> *"Where did my ₹45,000 salary actually go this month?"*

An AI financial coach that answers spending questions in plain language — not just charts and categories.

## What it does

Instead of showing pie charts, it tells you:
- *"You spent 39% more on Swiggy than last month."*
- *"Hotstar hasn't been opened in 62 days — ₹299/month for nothing."*
- *"At your current rate you'll have ₹12,150 before salary day."*
- *"You can't afford a ₹25,000 phone this month — here's how to plan for next month."*

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| AI | OpenAI GPT-4o-mini (optional) + built-in rule-based fallback |
| Data | Mock Indian transactions (UPI / Credit Card / Wallet) |
| Future | Account Aggregator API for real bank data |

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # optional: add OPENAI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
The app works fully **without** an API key — the built-in AI covers all common questions.

## Features

- **Spending snapshot** — salary vs spent, category bars, daily burn rate
- **Transaction list** — grouped by date with UPI / Card / Wallet badges  
- **AI chat** — plain-language answers to:
  - "Where did my money go?"
  - "What subscriptions am I wasting?"
  - "Can I afford a ₹25,000 phone?"
  - "Why is my balance always low?"
  - "Compare May vs April"

## Roadmap

- [ ] Account Aggregator (AA) integration for real bank/UPI data
- [ ] SMS parsing fallback
- [ ] Budget goals with proactive alerts ("You've spent 80% of your food budget")
- [ ] Monthly WhatsApp / push report
