import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Sparkles, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import toast from 'react-hot-toast';

function formatMessage(text) {
  const clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
  const lines = clean.split('\n');

  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-1" />;

    // Numbered list item: "1. Name - $XX.XX"
    const listMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (listMatch) {
      const parts = listMatch[2].split(/ - (\$[\d.]+)$/);
      return (
        <div key={i} className="flex items-center gap-2 py-1 px-1 rounded-lg hover:bg-gray-50 hover:bg-opacity-10 transition-colors">
          <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-600 text-[10px] font-bold flex items-center justify-center shrink-0">
            {listMatch[1]}
          </span>
          <span className="text-sm flex-1">{parts[0]?.trim()}</span>
          {parts[1] && <span className="text-sm font-semibold text-brand-500 shrink-0">{parts[1]}</span>}
        </div>
      );
    }

    // Bullet point
    if (trimmed.startsWith('- ')) {
      return (
        <div key={i} className="flex items-start gap-2 py-0.5">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
          <p className="text-sm leading-relaxed">{trimmed.slice(2)}</p>
        </div>
      );
    }

    return <p key={i} className="text-sm leading-relaxed">{trimmed}</p>;
  });
}

const QUICK_REPLIES = [
  'Show me trending products',
  'Where is my order?',
  'What is your return policy?',
  'Available coupon codes',
  'Show my cart',
];

export default function Chatbot() {
  const { isLoggedIn } = useAuthStore();
  const { addItem, fetchCart } = useCartStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! I'm ShopBot, your personal shopping assistant. Ask me to find products, track your order, or anything else. How can I help?",
      suggestions: [],
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const sendMessage = async (text = input) => {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg = { role: 'user', content: msg };
    setMessages((prev) => [...prev, userMsg, { role: 'assistant', content: '...', loading: true }]);
    setLoading(true);

    try {
      // Build history from current messages (exclude the loading placeholder we just added)
      const history = messages
        .filter((m) => !m.loading && m.content !== '...')
        .map((m) => ({ role: m.role, content: m.content }));

      const { data } = await api.post('/chatbot/chat', { message: msg, history });

      // If the chatbot modified the cart server-side, sync the store
      if (data.cartUpdated && isLoggedIn()) {
        fetchCart().catch(() => {});
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: data.reply, suggestions: data.suggestedProducts || [] },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: 'assistant', content: "Sorry, I'm having trouble connecting. Please try again!", suggestions: [] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!isLoggedIn()) return toast.error('Please sign in to add to cart');
    try {
      await addItem(productId, 1);
      toast.success('Added to cart!');
    } catch {
      toast.error('Failed to add to cart');
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 ${
          open ? 'bg-gray-800 rotate-90' : 'bg-gradient-to-br from-brand-500 to-orange-400 hover:shadow-glow-lg hover:scale-110'
        }`}
      >
        {open ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <div className="relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-scale-in"
          style={{ height: '540px' }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-dark-900 to-dark-700 p-4 flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-orange-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">ShopBot</p>
              <p className="text-xs text-gray-400">Always here to help</p>
            </div>
            <button onClick={() => setOpen(false)} className="ml-auto text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-gradient-to-br from-brand-500 to-orange-400' : 'bg-dark-800'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <Bot className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-2`}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-dark-900 text-white rounded-tr-sm'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-sm'
                    }`}
                  >
                    {msg.loading ? (
                      <div className="flex gap-1 py-1">
                        {[0, 1, 2].map((d) => (
                          <span
                            key={d}
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: `${d * 0.15}s` }}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-0.5">{formatMessage(msg.content)}</div>
                    )}
                  </div>

                  {/* Product suggestion cards */}
                  {msg.suggestions?.length > 0 && (
                    <div className="w-full space-y-2">
                      {msg.suggestions.map((p) => (
                        <div key={p._id} className="bg-white rounded-xl border border-gray-100 p-2.5 flex items-center gap-2.5 shadow-sm">
                          <img src={p.thumbnail} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-brand-600 font-bold">${p.price}</p>
                          </div>
                          <div className="flex gap-1">
                            <Link
                              to={`/products/${p._id}`}
                              onClick={() => setOpen(false)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                            >
                              <span className="text-xs">View</span>
                            </Link>
                            <button
                              onClick={() => handleAddToCart(p._id)}
                              className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 transition-colors"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies — shown only at the start */}
          {messages.length <= 2 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-thin">
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  onClick={() => sendMessage(r)}
                  className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600 transition-all shrink-0"
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition-all">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder='Ask me anything...'
                disabled={loading}
                autoComplete="off"
                className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder-gray-400"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className={`p-1.5 rounded-lg transition-all ${
                  input.trim() && !loading ? 'bg-brand-500 text-white hover:bg-brand-600' : 'text-gray-300'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
