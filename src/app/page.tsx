import SpendingSnapshot from '@/components/SpendingSnapshot';
import TransactionList from '@/components/TransactionList';
import ChatInterface from '@/components/ChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💰</span>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Explain My Money
              </h1>
              <p className="text-xs text-slate-400">AI financial coach</p>
            </div>
          </div>

          {/* Connected accounts */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
            {['HDFC Savings', 'ICICI Credit', 'PhonePe'].map((acc) => (
              <span key={acc} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                {acc}
              </span>
            ))}
          </div>
        </div>
      </header>

      {/* ── Main layout ────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: snapshot + transactions */}
          <div className="w-full lg:w-2/5 flex flex-col gap-5">
            <SpendingSnapshot />
            <TransactionList />
          </div>

          {/* Right column: chat (sticky on desktop) */}
          <div className="w-full lg:w-3/5 lg:sticky lg:top-20 lg:self-start">
            <ChatInterface />
          </div>
        </div>
      </main>
    </div>
  );
}
