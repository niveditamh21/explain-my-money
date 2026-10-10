'use client';

import { useEffect, useState } from 'react';

export default function ConnectBankButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    const connected = localStorage.getItem('finbox_connected') === 'true';
    const savedBank = localStorage.getItem('finbox_bank_name') || '';
    setIsConnected(connected);
    setBankName(savedBank);
  }, []);

  const handleConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_FINBOX_CLIENT_ID;
    if (!clientId) {
      alert('Finbox is not configured yet. Add NEXT_PUBLIC_FINBOX_CLIENT_ID and FINBOX_API_SECRET to .env.local and configure your redirect URI.');
      return;
    }

    const redirectUri =
      process.env.NEXT_PUBLIC_FINBOX_REDIRECT_URI || `${window.location.origin}/api/finbox/callback`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'transactions:read',
      state: Math.random().toString(36).slice(2),
    });

    window.location.href = `https://auth.finbox.com/oauth/authorize?${params.toString()}`;
  };

  const handleDisconnect = () => {
    localStorage.removeItem('finbox_connected');
    localStorage.removeItem('finbox_bank_name');
    localStorage.removeItem('finbox_transactions');
    setIsConnected(false);
    setBankName('');
  };

  return (
    <>
      {isConnected ? (
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-1.5 font-medium border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            {bankName || 'Bank connected'}
          </span>
          <button
            onClick={handleDisconnect}
            className="text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 text-white text-sm font-medium px-3.5 py-2 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          Connect Bank
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="mb-4">
              <p className="text-lg font-semibold text-slate-900">Privacy-first bank connection</p>
              <p className="text-sm text-slate-500 mt-1">
                We only request read access to your transaction history for spending insights.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-2">
              <p>• Your bank login is handled by the secure provider, not by this app.</p>
              <p>• We do not store your raw transaction data on our server.</p>
              <p>• We can keep it only in your browser for local analysis, or you can disconnect anytime.</p>
            </div>

            <label className="flex items-start gap-3 mt-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>
                I understand my data is read-only, private, and can be disconnected at any time.
              </span>
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!isChecked) {
                    alert('Please confirm your consent before connecting your bank.');
                    return;
                  }
                  setIsOpen(false);
                  handleConnect();
                }}
                className="px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Connect Bank
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
