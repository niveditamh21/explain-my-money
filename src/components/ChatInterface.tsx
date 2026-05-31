'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "Where did my ₹45,000 salary go?",
  "What subscriptions am I wasting?",
  "Can I afford a ₹25,000 phone?",
  "Why is my balance always low?",
  "Compare May vs April spending",
];

const WELCOME =
  `Hey! I've analyzed your May 2026 spending. You've spent ₹32,850 of your ₹45,000 salary — that's 73%.

Quick highlights:
🍔 Food & dining: ₹9,430 (Swiggy alone: ₹3,490 across 6 orders)
🛍️ Shopping spiked to ₹8,000 (vs ₹3,500 last month)
🔴 Hotstar hasn't been opened in 62 days — you're paying ₹299/month for nothing

Ask me anything about where your money went!`;

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user';
  const lines = msg.content.split('\n');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-sm shrink-0 mt-1 mr-2">
          🤖
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-sm'
            : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-sm'
        }`}
      >
        {lines.map((line, i) =>
          line === '' ? (
            <div key={i} className="h-2" />
          ) : (
            <p key={i}>{line}</p>
          )
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-sm shrink-0 mt-1 mr-2">
        🤖
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionsVisible, setSuggestionsVisible] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setSuggestionsVisible(false);
    const userMsg: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Build history excluding the static welcome message
    const history = messages
      .slice(1)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.reply ?? 'Sorry, I could not get a response.' },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[580px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-lg">
          🤖
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Explain My Money</h3>
          <p className="text-xs text-slate-400">AI financial coach · May 2026</p>
        </div>
        <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          Online
        </span>
      </div>

      {/* Suggested questions */}
      {suggestionsVisible && (
        <div className="px-5 pt-3 pb-1 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-95 px-3 py-1.5 rounded-full transition-all border border-indigo-100 font-medium"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-slate-100">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your spending..."
            className="flex-1 text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent placeholder-slate-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ask
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Demo data · May 2026 · Real app connects via Account Aggregator API
        </p>
      </div>
    </div>
  );
}
