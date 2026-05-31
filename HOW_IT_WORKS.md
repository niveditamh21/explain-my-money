# How Explain My Money Works

## Overview

Explain My Money is a Next.js web application that acts as an AI financial coach.
Instead of showing pie charts, it answers plain-language questions like
"Where did my salary go?" or "What subscriptions am I wasting money on?"
and responds in conversational, specific, actionable language.

---

## Project Structure

```
ExplainMyMoney/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root HTML layout, font, metadata
│   │   ├── page.tsx                # Main page (server component)
│   │   ├── globals.css             # Tailwind CSS base import
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts        # POST /api/chat  ← AI endpoint
│   ├── components/                 # UI components
│   │   ├── SpendingSnapshot.tsx    # Left panel: stats, category bars
│   │   ├── TransactionList.tsx     # Left panel: transaction list
│   │   └── ChatInterface.tsx       # Right panel: chat UI (client component)
│   └── lib/                        # Pure logic, no UI
│       ├── mockData.ts             # All transaction data + subscription info
│       ├── analytics.ts            # Functions that compute insights from data
│       └── ruleBasedChat.ts        # Built-in AI that works without an API key
├── .env.local.example              # Template for environment variables
├── next.config.mjs                 # Next.js config (minimal)
├── tailwind.config.ts              # Tailwind content paths
├── postcss.config.mjs              # PostCSS (required by Tailwind)
├── tsconfig.json                   # TypeScript config
└── package.json                    # Dependencies and scripts
```

---

## Data Layer — `src/lib/mockData.ts`

This is the single source of truth for all financial data. In a real product,
this would be replaced by live data from the Account Aggregator (AA) API.

### What it contains

**`Transaction` interface**
Each transaction has:
- `id` — unique string
- `date` — `YYYY-MM-DD` format
- `amount` — always a positive number
- `merchant` — display name (e.g. "Swiggy", "HP Petrol Pump")
- `category` — one of: Food & Dining, Groceries, Shopping, Transport,
  Subscriptions, Bills & Utilities, Health, Fitness, Cash, Salary
- `source` — `UPI | Credit Card | Debit Card | Wallet | Bank Transfer`
- `isCredit` — `true` only for salary credit

**`SubscriptionUsage` interface**
Tracks whether a recurring subscription is actually being used:
- `merchant`, `amount`, `lastUsedDaysAgo`, `isActive`

**Constants**
- `SALARY_AMOUNT = 45000` — monthly salary
- `SALARY_DATE = '2026-05-01'`

**Transaction data**
Two months of realistic Indian transactions are included:
- **May 2026** — 33 transactions (the "current" month)
- **April 2026** — 30 transactions (for month-over-month comparison)

Transactions cover UPI payments (Swiggy, Zomato, BigBasket), credit card
purchases (Myntra, Amazon), subscriptions (Netflix, Spotify, Prime, Hotstar),
fuel, utilities, gym, pharmacy, and ATM withdrawals.

---

## Analytics Layer — `src/lib/analytics.ts`

Pure TypeScript functions that compute metrics from the raw transaction data.
These are called by both the UI components (server-side) and the chat API.

| Function | What it returns |
|---|---|
| `getTransactionsByMonth(yearMonth)` | All transactions for a `YYYY-MM` month |
| `getTotalDebit(yearMonth)` | Sum of all debit amounts for the month |
| `getCategoryBreakdown(yearMonth)` | `{ "Food & Dining": 9430, "Shopping": 8000, … }` |
| `getTopMerchants(yearMonth, n)` | Top N merchants by total spend, with count |
| `getWeekendSpending(yearMonth)` | Weekend vs weekday totals and ratio |
| `getEstimatedBalance()` | `SALARY_AMOUNT − May total debit` |
| `getDailyBurnRate(yearMonth)` | Average spend per active spending day |
| `getSpendingContext()` | Full formatted context string fed to the LLM |

`getSpendingContext()` is the most important function. It builds a structured
plain-text summary of all financial data (categories, merchants, subscriptions,
weekend ratio, all transactions, month-over-month changes). This is injected
into the LLM system prompt so the AI has everything it needs to answer any
spending question accurately.

---

## Rule-Based AI — `src/lib/ruleBasedChat.ts`

This is the fallback AI engine that works **without any API key**.

It uses keyword pattern matching on the user's question to identify intent,
then generates a detailed, specific natural-language response using live
analytics data. It handles these question types:

| Detected intent | Trigger keywords |
|---|---|
| Subscriptions | `subscri`, `netflix`, `hotstar`, `prime`, `wast`, `cancel` |
| Affordability | `afford`, `buy`, `purchase`, `₹25`, `25000`, `phone` |
| Balance / "where did money go" | `balance`, `low`, `where`, `salary go`, `broke` |
| Month-over-month comparison | `compare`, `last month`, `april`, `differ` |
| Food & delivery | `food`, `swiggy`, `zomato`, `eat`, `dining` |
| Transport | `transport`, `fuel`, `uber`, `ola`, `cab` |
| Shopping | `shop`, `myntra`, `amazon`, `clothes` |
| Default | General spending breakdown |

Each handler pulls real numbers from `analytics.ts` and formats them into
a response that reads like a message from a knowledgeable friend — specific
merchant names, exact rupee amounts, actionable suggestions.

---

## Chat API — `src/app/api/chat/route.ts`

A single `POST` endpoint at `/api/chat`.

**Request body**
```json
{
  "message": "Why is my balance always low?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

**Response**
```json
{ "reply": "Three patterns are draining your account every month…" }
```

**Decision flow**

```
POST /api/chat
      │
      ├─ OPENAI_API_KEY set in .env.local?
      │       │
      │      YES → Build system prompt with getSpendingContext()
      │             → Call gpt-4o-mini with full conversation history
      │             → Return AI reply
      │             → On error: fall through to rule-based
      │
      └─ NO (or OpenAI errored)
              → generateRuleBasedResponse(message)
              → Return rule-based reply
```

The OpenAI system prompt instructs the model to act like a financial friend,
use specific rupee amounts, keep responses under 200 words, and lead with
the most important insight. The full spending context from `getSpendingContext()`
is embedded in every system prompt so the LLM has complete data.

---

## UI Components

### `src/app/page.tsx` — Main Page (Server Component)

Renders the two-column layout:
- Left (40%): `<SpendingSnapshot />` + `<TransactionList />`
- Right (60%): `<ChatInterface />`

The right column is `sticky` on desktop so the chat stays visible while
scrolling transactions. On mobile it stacks vertically.

The header shows three "connected account" indicators (HDFC Savings,
ICICI Credit, PhonePe) — static in the demo, would be real in production.

### `src/components/SpendingSnapshot.tsx` — Server Component

Renders four UI sections:
1. **Main card** — ₹X,XXX / ₹45,000 with a color-coded progress bar
   (green < 65%, amber 65–85%, red > 85%)
2. **3 stat cards** — daily burn rate, weekend spending %, wasted subscription cost
3. **Category bars** — top 5 categories with proportional indigo bars

All values are computed at render time by calling `analytics.ts` functions.
No client-side JavaScript involved.

### `src/components/TransactionList.tsx` — Server Component

Fetches May 2026 transactions, sorts newest-first, groups by date.
Each transaction shows:
- Category emoji (🍔 🛒 🛍️ 🚗 📱 ⚡ 💊 💪 💵 💰)
- Merchant name
- Source badge with color-coding:
  - UPI → blue
  - Credit Card → purple
  - Debit Card → teal
  - Wallet → orange
  - Bank Transfer → gray
- Amount in green (credit) or dark (debit)

### `src/components/ChatInterface.tsx` — Client Component (`'use client'`)

The interactive chat panel. Uses React `useState` and `useRef`.

**State**
- `messages` — array of `{ role, content }` objects, seeded with welcome message
- `input` — current text input value
- `isLoading` — controls typing indicator visibility
- `suggestionsVisible` — hides suggestion pills after first message is sent

**Flow**
1. User clicks a suggestion pill or types a question and presses Enter / "Ask"
2. User message appended to `messages` state
3. POST to `/api/chat` with `message` + conversation `history`
4. Typing indicator shown while waiting
5. Response appended to `messages` state
6. Chat auto-scrolls to bottom via `useRef` + `scrollIntoView`

The welcome message is a hardcoded string with the top 3 insights for May 2026,
shown immediately without an API call.

---

## Rendering Architecture

```
Browser Request → Next.js Server
                       │
          ┌────────────┴───────────────┐
          │                            │
   page.tsx (server)            /api/chat (server)
   SpendingSnapshot (server)    ← called by ChatInterface
   TransactionList (server)
          │
   ChatInterface (client)
   ← hydrated in browser
   ← all interactivity lives here
```

Server components (page, snapshot, transaction list) run analytics at
request time — no client JS bundle cost. Only `ChatInterface` ships
JavaScript to the browser.

---

## Configuration Files

| File | Purpose |
|---|---|
| `next.config.mjs` | Minimal Next.js config (no overrides needed) |
| `tailwind.config.ts` | Points Tailwind at `src/**` for class scanning |
| `postcss.config.mjs` | Enables Tailwind and Autoprefixer |
| `tsconfig.json` | TypeScript strict mode, `@/*` path alias for `src/*` |
| `.env.local.example` | Documents the optional `OPENAI_API_KEY` variable |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | No | If provided, uses GPT-4o-mini. If absent, uses built-in rule-based AI. |

Copy `.env.local.example` to `.env.local` and add your key to enable OpenAI.

---

## Running the Project

```bash
# Install dependencies (one time)
npm install

# Start development server (hot reload)
npm run dev
# → http://localhost:3000

# Production build
npm run build
npm start
```

Node.js v18+ is required. The project was developed and tested on Node.js v24.

---

## How to Extend

### Add a new transaction
Open `src/lib/mockData.ts` and add an entry to the `transactions` array.
The analytics and chat will automatically reflect the new data.

### Add a new question pattern
Open `src/lib/ruleBasedChat.ts` and add a new `if (q.includes(...))` block
with a handler function. Return a string formatted like the existing handlers.

### Add a new analytics metric
Add a function to `src/lib/analytics.ts`. Call it from `getSpendingContext()`
to include it in the LLM context, or import it directly in a component.

### Replace mock data with real bank data
Replace the `transactions` array in `mockData.ts` with a fetch from the
India Stack Account Aggregator (AA) API. The AA framework provides a
consent-based way to pull transaction data from any bank.
More info: https://sahamati.org.in/account-aggregator-ecosystem/

### Add a new UI panel
Create a new server component in `src/components/`, import analytics functions,
and add it to the layout in `src/app/page.tsx`.
