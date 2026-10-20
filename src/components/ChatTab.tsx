import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, ShieldCheck, Crown, Users, Sparkles, X } from 'lucide-react';
import { ChatMessage, Trip } from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ChatTabProps {
  trip: Trip;
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => Promise<void>;
  className?: string;
  onClose?: () => void;
  isCornerWidget?: boolean;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  trip,
  messages,
  onSendMessage,
  className,
  onClose,
  isCornerWidget = false
}) => {
  const { currentUser, userProfile } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || sending) return;

    setSending(true);
    const content = text.trim();
    setText('');

    try {
      const effectiveName =
        userProfile?.displayName ||
        currentUser?.displayName ||
        trip.collaborators?.find(
          (c) => c.uid === currentUser?.uid || (c.email && c.email.toLowerCase() === currentUser?.email?.toLowerCase())
        )?.name ||
        'Traveler Member';

      const effectivePhoto = userProfile?.photoURL || currentUser?.photoURL || '';

      const newMsg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        tripId: trip.id,
        senderId: currentUser?.uid || 'guest_user',
        senderName: effectiveName,
        senderEmail: currentUser?.email || undefined,
        senderPhoto: effectivePhoto || '',
        text: content,
        createdAt: new Date().toISOString()
      };
      await onSendMessage(newMsg);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const quickSnippets = [
    'Reached the airport! ✈️',
    'Checked into hotel 🏨',
    'Heading for dinner now 🍛',
    'Shared location pin 📍',
    'Cab booked, ETA 10 mins 🚕'
  ];

  return (
    <div className={`bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl flex flex-col transition-colors ${className || 'h-[580px]'}`}>
      {/* Chat Header */}
      <div className="p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
              <span className="truncate">{trip.title} Room</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </h4>
            <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500 shrink-0" />
              <span className="truncate">Live companion channel</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {messages.length} {messages.length === 1 ? 'msg' : 'msgs'}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close chat popup"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-slate-950/30">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <MessageSquare className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" />
            <h5 className="text-sm font-semibold text-slate-800 dark:text-white">No messages yet</h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
              Start coordinating with your travel group! Coordinate pickup times, flight updates, and food stops.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const myName = (userProfile?.displayName || currentUser?.displayName || '').trim().toLowerCase();
            const myEmail = (currentUser?.email || '').trim().toLowerCase();
            const msgSenderName = (msg.senderName || 'Traveler').trim();
            const msgSenderEmail = (msg.senderEmail || '').trim().toLowerCase();
            const plannerEmail = (trip.ownerEmail || '').trim().toLowerCase();
            const plannerName = (trip.ownerName || '').trim().toLowerCase();

            const isMe =
              Boolean(currentUser?.uid && msg.senderId === currentUser.uid) ||
              Boolean(myEmail && msgSenderEmail && msgSenderEmail === myEmail) ||
              Boolean(myName && msgSenderName.toLowerCase() === myName);

            const isPlanner =
              Boolean(trip.ownerId && msg.senderId === trip.ownerId) ||
              Boolean(plannerEmail && msgSenderEmail && msgSenderEmail === plannerEmail) ||
              Boolean(plannerName && msgSenderName.toLowerCase() === plannerName);

            const timeStr = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : '';

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                {msg.senderPhoto ? (
                  <img
                    src={msg.senderPhoto}
                    alt={msgSenderName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-300 dark:ring-slate-700 mt-1"
                  />
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border mt-1 ${
                      isPlanner
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                        : 'bg-sky-500/15 border-sky-500/30 text-sky-600 dark:text-sky-400'
                    }`}
                  >
                    {(msgSenderName[0] || 'U').toUpperCase()}
                  </div>
                )}

                <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-1.5 mb-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200">
                      {isMe ? 'You' : msgSenderName}
                    </span>
                    {isPlanner ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold uppercase tracking-wide">
                        <Crown className="w-2.5 h-2.5 text-amber-500" />
                        Planner
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[9px] font-bold">
                        <Users className="w-2.5 h-2.5" />
                        Traveller
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{timeStr}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isMe
                        ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/20'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700/80 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Snippets Bar */}
      <div className="px-4 py-2 bg-slate-100 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] text-slate-500 uppercase font-semibold shrink-0">Quick:</span>
        {quickSnippets.map((snippet, i) => (
          <button
            key={i}
            onClick={() => {
              setText(snippet);
            }}
            className="text-[11px] px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 whitespace-nowrap transition-colors"
          >
            {snippet}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <input
          type="text"
          maxLength={1000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message trip companions (e.g. Flight landed at Gate 4)..."
          className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
        />

        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md shadow-sky-500/20 shrink-0"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
