import React from 'react';
import { Lock, Crown, Zap, Check } from 'lucide-react';

interface ProFeatureGateProps {
  title: string;
  description: string;
  previewItems?: string[];
  onOpenUpgrade: (msg?: string) => void;
  children?: React.ReactNode;
}

export const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  title,
  description,
  previewItems = [],
  onOpenUpgrade,
  children
}) => {
  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 sm:p-12 text-center shadow-sm transition-colors">
      {/* Blurred background preview mockup if any children */}
      {children && (
        <div className="absolute inset-0 filter blur-md opacity-25 pointer-events-none p-6 select-none overflow-hidden">
          {children}
        </div>
      )}

      {/* Gate content */}
      <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/10">
          <Lock className="w-7 h-7" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
          <Crown className="w-3.5 h-3.5" />
          <span>JKVoyage Pro Feature</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Unlock {title}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 mb-6 leading-relaxed">
          {description}
        </p>

        {previewItems.length > 0 && (
          <div className="w-full bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 mb-6 text-left space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              What you unlock with Pro Pass:
            </span>
            {previewItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                <Check className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          <button
            onClick={() => onOpenUpgrade(`Unlock ${title} and all premium travel tools!`)}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-400 hover:opacity-95 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.01]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Unlock Pro Access (₹499/yr or ₹99/trip)</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-3">
          Instant activation via UPI, GPay, PhonePe, Cards & NetBanking
        </span>
      </div>
    </div>
  );
};
