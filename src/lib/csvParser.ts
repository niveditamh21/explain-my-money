import { Transaction } from './mockData';

export interface CSVRow {
  date: string;
  amount: string | number;
  merchant: string;
  category?: string;
  source?: string;
  isCredit?: boolean | string;
  description?: string;
}

/**
 * Parses a CSV file and converts it to Transaction objects.
 * Supports multiple bank formats (HDFC, ICICI, Axis, generic)
 *
 * Expected CSV columns (in any order):
 * - date (YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
 * - amount (number, can be negative for debits)
 * - merchant (string) OR description (string)
 * - category (optional: Food & Dining, Shopping, Transport, etc.)
 * - source (optional: UPI, Credit Card, Debit Card, Wallet, Bank Transfer)
 * - isCredit (optional: true/false or "CR"/"DR")
 *
 * Example CSV format:
 * Date,Merchant,Amount,Category,Source
 * 2026-05-01,Salary Credit,45000,Salary,Bank Transfer
 * 2026-05-02,Swiggy,-485,Food & Dining,UPI
 * 2026-05-03,Netflix,-649,Subscriptions,Credit Card
 */
export function parseCSV(csvContent: string): Transaction[] {
  const lines = csvContent.split('\n').filter((line) => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV must have a header row and at least one transaction');
  }

  const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
  const transactions: Transaction[] = [];

  // Find column indices
  const dateIdx = header.findIndex((h) => h.includes('date'));
  const amountIdx = header.findIndex((h) => h.includes('amount'));
  const merchantIdx = header.findIndex((h) =>
    h.includes('merchant') || h.includes('description') || h.includes('payee')
  );
  const categoryIdx = header.findIndex((h) => h.includes('category'));
  const sourceIdx = header.findIndex((h) => h.includes('source') || h.includes('mode'));
  const creditIdx = header.findIndex((h) =>
    h.includes('credit') || h.includes('type') || h.includes('transaction_type')
  );

  if (dateIdx === -1 || amountIdx === -1 || merchantIdx === -1) {
    throw new Error(
      'CSV must contain columns: Date, Amount, and Merchant (or Description)'
    );
  }

  // Parse each transaction row
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(',').map((c) => c.trim());
    if (cells.length < 3 || !cells[dateIdx] || !cells[amountIdx]) continue;

    try {
      const date = parseDate(cells[dateIdx]);
      if (!date) continue;

      let amount = parseFloat(cells[amountIdx].replace(/[^0-9.-]/g, ''));
      if (isNaN(amount)) continue;

      // Determine credit vs debit
      let isCredit = false;
      let absAmount = Math.abs(amount);

      // Check isCredit column
      if (creditIdx !== -1) {
        const creditValue = cells[creditIdx].toLowerCase();
        isCredit =
          creditValue.includes('cr') ||
          creditValue === 'true' ||
          creditValue.includes('credit');
      }
      // If amount is positive and no credit marker, check context (salary = credit)
      else if (amount > 0 && cells[merchantIdx].toLowerCase().includes('salary')) {
        isCredit = true;
      }
      // If amount is negative, it's a debit
      else if (amount < 0) {
        absAmount = Math.abs(amount);
        isCredit = false;
      }

      const merchant = cells[merchantIdx].trim();
      const category = categoryIdx !== -1 ? cells[categoryIdx].trim() : inferCategory(merchant);
      const source = sourceIdx !== -1 ? cells[sourceIdx].trim() : inferSource(merchant);

      transactions.push({
        id: `imported_${Date.now()}_${i}`,
        date,
        amount: absAmount,
        merchant,
        category,
        source: normalizeSource(source),
        isCredit,
      });
    } catch (err) {
      console.warn(`Skipped row ${i}:`, err);
      continue;
    }
  }

  if (transactions.length === 0) {
    throw new Error('No valid transactions found in CSV');
  }

  return transactions;
}

/**
 * Parses date in multiple formats: YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY
 */
function parseDate(dateStr: string): string | null {
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{2})$/, // DD/MM/YY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (!match) continue;

    let year, month, day;

    if (format === formats[0]) {
      // YYYY-MM-DD
      [, year, month, day] = match;
    } else if (format === formats[3]) {
      // DD/MM/YY
      [, day, month, year] = match;
      // Assume 20YY
      year = '20' + year;
    } else {
      // DD-MM-YYYY or DD/MM/YYYY
      [, day, month, year] = match;
    }

    const date = new Date(`${year}-${month}-${day}`);
    if (!isNaN(date.getTime())) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Infers category from merchant name
 */
function inferCategory(merchant: string): string {
  const m = merchant.toLowerCase();

  if (m.includes('salary') || m.includes('salary credit')) return 'Salary';
  if (m.includes('swiggy') || m.includes('zomato') || m.includes('food')) return 'Food & Dining';
  if (m.includes('netflix') || m.includes('spotify') || m.includes('prime') || m.includes('hotstar'))
    return 'Subscriptions';
  if (m.includes('uber') || m.includes('ola') || m.includes('taxi') || m.includes('fuel') || m.includes('petrol'))
    return 'Transport';
  if (m.includes('amazon') || m.includes('flipkart') || m.includes('myntra')) return 'Shopping';
  if (m.includes('blinkit') || m.includes('bigbasket') || m.includes('grocery')) return 'Groceries';
  if (m.includes('electricity') || m.includes('water') || m.includes('broadband') || m.includes('airtel'))
    return 'Bills & Utilities';
  if (m.includes('gym') || m.includes('cult') || m.includes('fitness')) return 'Fitness';
  if (m.includes('pharmacy') || m.includes('apollo') || m.includes('hospital')) return 'Health';
  if (m.includes('atm') || m.includes('cash')) return 'Cash';

  return 'Other';
}

/**
 * Infers payment source from merchant name or context
 */
function inferSource(merchant: string): string {
  const m = merchant.toLowerCase();

  if (m.includes('upi')) return 'UPI';
  if (m.includes('credit card') || m.includes('credit')) return 'Credit Card';
  if (m.includes('debit card') || m.includes('debit')) return 'Debit Card';
  if (m.includes('wallet') || m.includes('phone')) return 'Wallet';
  if (m.includes('bank') || m.includes('transfer') || m.includes('salary')) return 'Bank Transfer';

  return 'UPI'; // Default
}

/**
 * Normalizes source string to valid enum value
 */
function normalizeSource(source: string): Transaction['source'] {
  const s = source.trim().toLowerCase();
  if (s.includes('credit')) return 'Credit Card';
  if (s.includes('debit')) return 'Debit Card';
  if (s.includes('wallet') || s.includes('phone')) return 'Wallet';
  if (s.includes('bank') || s.includes('transfer')) return 'Bank Transfer';
  return 'UPI';
}

/**
 * Generates a sample CSV template for users to fill
 */
export function generateCSVTemplate(): string {
  return `Date,Merchant,Amount,Category,Source
2026-05-01,Salary Credit,45000,Salary,Bank Transfer
2026-05-02,Swiggy,-485,Food & Dining,UPI
2026-05-03,Netflix,-649,Subscriptions,Credit Card
2026-05-04,Uber,-280,Transport,UPI
2026-05-05,BigBasket,-1850,Groceries,UPI
2026-05-10,Amazon Shopping,-2000,Shopping,Credit Card`;
}

/**
 * Exports transactions as CSV
 */
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const header = 'Date,Merchant,Amount,Category,Source,Type\n';
  const rows = transactions
    .map((t) => `${t.date},${t.merchant},${t.isCredit ? '+' : '-'}${t.amount},${t.category},${t.source},${t.isCredit ? 'Credit' : 'Debit'}`)
    .join('\n');

  return header + rows;
}
