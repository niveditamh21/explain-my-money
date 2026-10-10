/**
 * Finbox OAuth and Transaction Fetching
 * Privacy-first architecture: All data stays in browser
 */

export interface FinboxSession {
  token: string;
  expiresAt: number;
  bankName?: string;
  accountId?: string;
}

export interface FinboxTransaction {
  date: string; // YYYY-MM-DD
  amount: number;
  description: string;
  balance?: number;
  transactionType: 'DEBIT' | 'CREDIT';
  reference?: string;
}

const FINBOX_AUTH_URL = 'https://auth.finbox.com/oauth/authorize';
const FINBOX_API_URL = 'https://api.finbox.com';
const SESSION_STORAGE_KEY = 'finbox_session';
const TRANSACTIONS_STORAGE_KEY = 'finbox_transactions';

/**
 * Generate Finbox OAuth URL for "Connect Bank" button
 */
export function getFinboxAuthUrl(): string {
  const clientId = process.env.NEXT_PUBLIC_FINBOX_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_FINBOX_REDIRECT_URI || `${window.location.origin}/api/finbox/callback`;
  
  if (!clientId) {
    console.error('NEXT_PUBLIC_FINBOX_CLIENT_ID is not configured');
    return '';
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'transactions:read',
    state: generateRandomState(),
  });

  return `${FINBOX_AUTH_URL}?${params.toString()}`;
}

/**
 * Store session token (in sessionStorage for security)
 * Cleared when browser tab closes
 */
export function storeFinboxSession(session: FinboxSession): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

/**
 * Retrieve stored session
 */
export function getFinboxSession(): FinboxSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    // Check if token expired
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearFinboxSession();
      return null;
    }
    
    return session;
  } catch (err) {
    console.error('Failed to retrieve Finbox session:', err);
    return null;
  }
}

/**
 * Clear session (user logout or revoke)
 */
export function clearFinboxSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
}

/**
 * Check if user is connected to a bank
 */
export function isFinboxConnected(): boolean {
  const session = getFinboxSession();
  return session !== null;
}

/**
 * Exchange authorization code for access token
 * This is called from /api/finbox/callback on the server
 */
export async function exchangeCodeForToken(code: string): Promise<FinboxSession | null> {
  try {
    const response = await fetch('/api/finbox/exchange-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    const session: FinboxSession = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in * 1000),
      bankName: data.bank_name,
      accountId: data.account_id,
    };

    storeFinboxSession(session);
    return session;
  } catch (err) {
    console.error('Failed to exchange code for token:', err);
    return null;
  }
}

/**
 * Fetch transactions from Finbox API (client-side)
 * Uses stored session token
 */
export async function fetchFinboxTransactions(): Promise<FinboxTransaction[]> {
  const session = getFinboxSession();
  
  if (!session) {
    throw new Error('Not connected to a bank. Please click "Connect Bank" first.');
  }

  try {
    const response = await fetch('/api/finbox/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: session.token }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        clearFinboxSession();
        throw new Error('Session expired. Please reconnect your bank.');
      }
      throw new Error(`Failed to fetch transactions: ${response.statusText}`);
    }

    const data = await response.json();
    const transactions = data.transactions || [];

    // Store locally for offline access
    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify({
      transactions,
      fetchedAt: new Date().toISOString(),
      bankName: session.bankName,
    }));

    return transactions;
  } catch (err) {
    console.error('Failed to fetch Finbox transactions:', err);
    throw err;
  }
}

/**
 * Get cached transactions from localStorage
 */
export function getCachedTransactions(): {
  transactions: FinboxTransaction[];
  fetchedAt: string;
  bankName?: string;
} | null {
  try {
    const cached = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    console.error('Failed to retrieve cached transactions:', err);
    return null;
  }
}

/**
 * Convert Finbox transactions to app's Transaction format
 */
export function convertFinboxToAppFormat(finboxTxns: FinboxTransaction[]) {
  return finboxTxns.map((t, idx) => ({
    id: `finbox_${idx}_${Date.now()}`,
    date: t.date,
    amount: t.amount,
    merchant: t.description.substring(0, 22), // Truncate for display
    category: inferCategoryFromDescription(t.description),
    source: inferSourceFromType(t.transactionType),
    isCredit: t.transactionType === 'CREDIT',
  }));
}

/**
 * Infer category from transaction description
 */
function inferCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase();
  
  if (desc.includes('swiggy') || desc.includes('zomato') || desc.includes('food')) 
    return 'Food & Dining';
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('prime')) 
    return 'Subscriptions';
  if (desc.includes('uber') || desc.includes('ola') || desc.includes('fuel')) 
    return 'Transport';
  if (desc.includes('amazon') || desc.includes('flipkart') || desc.includes('myntra')) 
    return 'Shopping';
  if (desc.includes('grocery') || desc.includes('bigbasket') || desc.includes('blinkit')) 
    return 'Groceries';
  if (desc.includes('electricity') || desc.includes('broadband') || desc.includes('airtel')) 
    return 'Bills & Utilities';
  if (desc.includes('salary') || desc.includes('transfer')) 
    return 'Salary';

  return 'Other';
}

/**
 * Infer payment source from transaction type
 */
function inferSourceFromType(type: string): 'UPI' | 'Credit Card' | 'Debit Card' | 'Wallet' | 'Bank Transfer' {
  return 'Bank Transfer'; // Default - Finbox will provide more details in production
}

/**
 * Generate random state for OAuth security
 */
function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Get connection status for UI display
 */
export function getConnectionStatus() {
  const session = getFinboxSession();
  const cached = getCachedTransactions();

  return {
    isConnected: session !== null,
    bankName: session?.bankName || 'Unknown Bank',
    lastFetchedAt: cached?.fetchedAt,
    transactionCount: cached?.transactions.length || 0,
  };
}
