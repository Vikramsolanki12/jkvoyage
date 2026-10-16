import React, { useState } from 'react';
import { Trip } from '../../types/trip.ts';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  Volume2,
  Lightbulb,
} from 'lucide-react';

interface AiAssistantModalProps {
  trip: Trip;
  onClose: () => void;
}

interface Message {
  role: 'assistant' | 'user';
  text: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ trip, onClose }) => {
  const [activeView, setActiveView] = useState<'chat' | 'phrasebook'>('chat');
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your Smart Travel Concierge for ${trip.destination}, ${trip.country}. I can suggest hidden spots, clarify local customs, recommend dining, or translate essential phrases. What can I help you discover today?`,
    },
  ]);

  const quickPrompts = [
    'Best hidden food & street eats nearby',
    'Local etiquette and cultural norms',
    'What should we pack for today’s weather?',
    'Top sunset viewpoints and photography spots',
  ];

  const phrasebook = [
    { jp: 'Namaste / Hello', en: 'Greetings / Welcome', roman: 'nah-mah-stay' },
    { jp: 'Shukriya / Dhanyawad', en: 'Thank you very much', roman: 'shook-ree-yah' },
    { jp: 'Yeh kitne ka hai?', en: 'How much does this cost?', roman: 'yeh kit-nay kah hai' },
    { jp: 'Bill le aao please', en: 'Please bring the bill / check', roman: 'bill lay aao' },
    { jp: 'Kya aap English bolte hain?', en: 'Do you speak English?', roman: 'kya aap english boltay hain' },
    { jp: 'Madad kijiye!', en: 'Please help me! (Emergency)', roman: 'mah-dahd kee-jee-yay' },
    { jp: 'Washroom kahan hai?', en: 'Where is the restroom?', roman: 'washroom kah-hahn hai' },
    { jp: 'Khana bahut lazeez tha!', en: 'The food was delicious!', roman: 'khana bahut lazeez tha' },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          destination: trip.destination,
          tripContext: `Trip to ${trip.destination}, ${trip.country}. Duration: ${trip.startDate} to ${trip.endDate}. ${trip.travellers.length} travellers. Budget: ${trip.currency} ${trip.totalBudget}.`,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'Here is what I recommend for your journey!' },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Here is a tip for ${trip.destination}: Always keep small cash notes for local entry stalls and tuk-tuks, and carry a water bottle to stay hydrated while exploring!`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg h-[620px] max-h-[90vh] bg-slate-900 border border-slate-700 rounded-3xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Sparkles className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">Smart Travel Concierge</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Contextual advice for {trip.destination}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveView('chat')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeView === 'chat' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveView('phrasebook')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  activeView === 'phrasebook' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Phrasebook
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CHAT VIEW */}
        {activeView === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-slate-950 shrink-0 mt-0.5 shadow-sm font-bold">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-sky-600 text-white shadow-md rounded-br-none'
                        : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-md rounded-bl-none whitespace-pre-line'
                    }`}
                  >
                    {m.text}
                  </div>

                  {m.role === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-2.5 items-center text-xs text-cyan-300">
                  <div className="w-7 h-7 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0 shadow-sm animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="animate-pulse">Synthesizing local recommendations...</span>
                </div>
              )}
            </div>

            {/* Quick Chips */}
            <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp)}
                  className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] whitespace-nowrap border border-slate-700/60 transition-colors shrink-0 cursor-pointer"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Ask anything about transit, sights, food..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                disabled={isLoading || !inputPrompt.trim()}
                className="p-2.5 rounded-xl btn-cyan text-slate-950 font-bold disabled:opacity-50 shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* PHRASEBOOK VIEW */}
        {activeView === 'phrasebook' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 scrollbar-none">
            <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>
                Pocket Survival Guide for {trip.country}. Tap audio icon for pronunciation audio!
              </span>
            </div>

            {phrasebook.map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{p.jp}</span>
                    <span className="text-[11px] text-cyan-400 font-mono">({p.roman})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{p.en}</p>
                </div>

                <button
                  onClick={() => {
                    if ('speechSynthesis' in window) {
                      const utterance = new SpeechSynthesisUtterance(p.jp);
                      utterance.lang = 'hi-IN';
                      window.speechSynthesis.speak(utterance);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-400 transition-colors cursor-pointer"
                  title="Play pronunciation"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
