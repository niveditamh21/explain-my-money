export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number; // always positive
  merchant: string;
  category: string;
  source: 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet' | 'Bank Transfer';
  isCredit?: boolean;
}

export interface SubscriptionUsage {
  merchant: string;
  amount: number;
  lastUsedDaysAgo: number;
  isActive: boolean;
}

export const SALARY_AMOUNT = 45000;
export const SALARY_DATE = '2026-05-01';

export const subscriptionUsage: SubscriptionUsage[] = [
  { merchant: 'Netflix', amount: 649, lastUsedDaysAgo: 2, isActive: true },
  { merchant: 'Spotify', amount: 119, lastUsedDaysAgo: 0, isActive: true },
  { merchant: 'Amazon Prime', amount: 299, lastUsedDaysAgo: 45, isActive: false },
  { merchant: 'Hotstar', amount: 299, lastUsedDaysAgo: 62, isActive: false },
];

// May 2026: May 1 = Friday
export const transactions: Transaction[] = [
  // ── MAY 2026 ────────────────────────────────────────────────────────────────
  { id: 'm001', date: '2026-05-01', amount: 45000, merchant: 'Salary Credit',        category: 'Salary',           source: 'Bank Transfer', isCredit: true },
  { id: 'm002', date: '2026-05-01', amount: 1850,  merchant: 'BigBasket',             category: 'Groceries',        source: 'UPI' },
  { id: 'm003', date: '2026-05-02', amount: 485,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm004', date: '2026-05-03', amount: 649,   merchant: 'Netflix',               category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'm005', date: '2026-05-03', amount: 119,   merchant: 'Spotify',               category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'm006', date: '2026-05-04', amount: 299,   merchant: 'Amazon Prime',          category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'm007', date: '2026-05-04', amount: 299,   merchant: 'Hotstar',               category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'm008', date: '2026-05-05', amount: 345,   merchant: 'Uber',                  category: 'Transport',        source: 'UPI' },
  { id: 'm009', date: '2026-05-05', amount: 620,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm010', date: '2026-05-06', amount: 280,   merchant: 'Ola',                   category: 'Transport',        source: 'UPI' },
  { id: 'm011', date: '2026-05-07', amount: 1240,  merchant: 'Pebble Street Café',    category: 'Food & Dining',    source: 'Credit Card' },
  { id: 'm012', date: '2026-05-08', amount: 1000,  merchant: 'HP Petrol Pump',        category: 'Transport',        source: 'Credit Card' },
  { id: 'm013', date: '2026-05-09', amount: 450,   merchant: 'Zomato',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm014', date: '2026-05-10', amount: 1500,  merchant: 'Cult.fit',              category: 'Fitness',          source: 'UPI' },
  { id: 'm015', date: '2026-05-10', amount: 890,   merchant: 'Blinkit',               category: 'Groceries',        source: 'UPI' },
  { id: 'm016', date: '2026-05-11', amount: 380,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm017', date: '2026-05-12', amount: 1200,  merchant: 'BESCOM Electricity',    category: 'Bills & Utilities', source: 'UPI' },
  { id: 'm018', date: '2026-05-13', amount: 3499,  merchant: 'Myntra',                category: 'Shopping',         source: 'Credit Card' },
  { id: 'm019', date: '2026-05-14', amount: 680,   merchant: 'Zomato',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm020', date: '2026-05-15', amount: 2000,  merchant: 'ATM Withdrawal',        category: 'Cash',             source: 'Debit Card' },
  { id: 'm021', date: '2026-05-16', amount: 520,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm022', date: '2026-05-17', amount: 299,   merchant: 'Airtel Recharge',       category: 'Bills & Utilities', source: 'UPI' },
  { id: 'm023', date: '2026-05-18', amount: 1400,  merchant: 'Social Kitchen',        category: 'Food & Dining',    source: 'Credit Card' },
  { id: 'm024', date: '2026-05-19', amount: 1500,  merchant: 'HP Petrol Pump',        category: 'Transport',        source: 'Credit Card' },
  { id: 'm025', date: '2026-05-19', amount: 4501,  merchant: 'Amazon Shopping',       category: 'Shopping',         source: 'Credit Card' },
  { id: 'm026', date: '2026-05-20', amount: 420,   merchant: 'Uber',                  category: 'Transport',        source: 'UPI' },
  { id: 'm027', date: '2026-05-21', amount: 555,   merchant: 'Apollo Pharmacy',       category: 'Health',           source: 'UPI' },
  { id: 'm028', date: '2026-05-22', amount: 890,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm029', date: '2026-05-23', amount: 970,   merchant: 'Zomato',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'm030', date: '2026-05-24', amount: 1460,  merchant: 'BigBasket',             category: 'Groceries',        source: 'UPI' },
  { id: 'm031', date: '2026-05-25', amount: 1200,  merchant: 'The Smoke House',       category: 'Food & Dining',    source: 'Credit Card' },
  { id: 'm032', date: '2026-05-25', amount: 755,   merchant: 'Ola',                   category: 'Transport',        source: 'UPI' },
  { id: 'm033', date: '2026-05-26', amount: 595,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },

  // ── APRIL 2026 (for month-over-month comparison) ────────────────────────────
  { id: 'a001', date: '2026-04-01', amount: 45000, merchant: 'Salary Credit',        category: 'Salary',           source: 'Bank Transfer', isCredit: true },
  { id: 'a002', date: '2026-04-01', amount: 1650,  merchant: 'BigBasket',             category: 'Groceries',        source: 'UPI' },
  { id: 'a003', date: '2026-04-02', amount: 380,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a004', date: '2026-04-03', amount: 649,   merchant: 'Netflix',               category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'a005', date: '2026-04-03', amount: 119,   merchant: 'Spotify',               category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'a006', date: '2026-04-04', amount: 299,   merchant: 'Amazon Prime',          category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'a007', date: '2026-04-04', amount: 299,   merchant: 'Hotstar',               category: 'Subscriptions',    source: 'Credit Card' },
  { id: 'a008', date: '2026-04-05', amount: 290,   merchant: 'Uber',                  category: 'Transport',        source: 'UPI' },
  { id: 'a009', date: '2026-04-05', amount: 420,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a010', date: '2026-04-07', amount: 980,   merchant: 'Arbor Brewing Company', category: 'Food & Dining',   source: 'Credit Card' },
  { id: 'a011', date: '2026-04-08', amount: 1000,  merchant: 'HP Petrol Pump',        category: 'Transport',        source: 'Credit Card' },
  { id: 'a012', date: '2026-04-09', amount: 350,   merchant: 'Zomato',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a013', date: '2026-04-10', amount: 1500,  merchant: 'Cult.fit',              category: 'Fitness',          source: 'UPI' },
  { id: 'a014', date: '2026-04-10', amount: 780,   merchant: 'Blinkit',               category: 'Groceries',        source: 'UPI' },
  { id: 'a015', date: '2026-04-11', amount: 410,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a016', date: '2026-04-12', amount: 1150,  merchant: 'BESCOM Electricity',    category: 'Bills & Utilities', source: 'UPI' },
  { id: 'a017', date: '2026-04-14', amount: 560,   merchant: 'Zomato',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a018', date: '2026-04-15', amount: 2000,  merchant: 'ATM Withdrawal',        category: 'Cash',             source: 'Debit Card' },
  { id: 'a019', date: '2026-04-16', amount: 490,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a020', date: '2026-04-17', amount: 299,   merchant: 'Airtel Recharge',       category: 'Bills & Utilities', source: 'UPI' },
  { id: 'a021', date: '2026-04-18', amount: 3500,  merchant: 'Flipkart',              category: 'Shopping',         source: 'Credit Card' },
  { id: 'a022', date: '2026-04-19', amount: 1500,  merchant: 'HP Petrol Pump',        category: 'Transport',        source: 'Credit Card' },
  { id: 'a023', date: '2026-04-20', amount: 380,   merchant: 'Uber',                  category: 'Transport',        source: 'UPI' },
  { id: 'a024', date: '2026-04-21', amount: 340,   merchant: 'Apollo Pharmacy',       category: 'Health',           source: 'UPI' },
  { id: 'a025', date: '2026-04-22', amount: 680,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a026', date: '2026-04-23', amount: 890,   merchant: 'Zomato',                category: 'Food & Dining',    source: 'UPI' },
  { id: 'a027', date: '2026-04-24', amount: 1320,  merchant: 'BigBasket',             category: 'Groceries',        source: 'UPI' },
  { id: 'a028', date: '2026-04-25', amount: 1120,  merchant: 'The Only Place',        category: 'Food & Dining',    source: 'Credit Card' },
  { id: 'a029', date: '2026-04-26', amount: 690,   merchant: 'Ola',                   category: 'Transport',        source: 'UPI' },
  { id: 'a030', date: '2026-04-27', amount: 480,   merchant: 'Swiggy',                category: 'Food & Dining',    source: 'UPI' },
];
