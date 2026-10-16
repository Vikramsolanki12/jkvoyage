import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Zap,
  Loader2,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext.tsx';
import {
  PRICING_PLANS,
  PaymentPlan,
  openRazorpayCheckout
} from '../services/razorpayService.ts';

interface RazorpayModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureLockedMessage?: string;
}

export const RazorpayModal: React.FC<RazorpayModalProps> = ({
  isOpen,
  onClose,
  featureLockedMessage
}) => {
  const { currentUser, userProfile, updateProfileDetails } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>(PRICING_PLANS[1]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePayNow = async () => {
    setProcessing(true);
    try {
      await openRazorpayCheckout({
        plan: selectedPlan,
        userName: currentUser?.displayName || 'Traveler',
        userEmail: currentUser?.email || 'traveler@example.com',
        onSuccess: async (res) => {
          if (currentUser) {
            await updateProfileDetails({
              isPro: true,
              proPlan: res.planId,
              proPaymentId: res.paymentId
            });
          }
          setPaymentReceipt(res.paymentId);
          setSuccess(true);
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });
        },
        onFailure: (err) => {
          alert('Payment was not completed: ' + (err?.description || 'Canceled by user'));
        }
      });
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900 dark:text-slate-100 overflow-y-auto max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Payment Verified & Pro Unlocked!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              Congratulations! Your JKVoyage account has been upgraded to <strong>{selectedPlan.name}</strong>.
              All cloud features, AI itinerary optimization, digital wallet passes, and group chat are now unlocked.
            </p>
            {paymentReceipt && (
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 inline-block">
                Transaction Reference ID: <span className="text-sky-600 dark:text-sky-400 font-bold">{paymentReceipt}</span>
              </div>
            )}
            <div className="pt-4">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-colors"
              >
                Access All Pro Features Now
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Crown className="w-3.5 h-3.5" />
                <span>Safe & Secure Checkout</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Unlock Complete <span className="text-sky-600 dark:text-sky-400">JKVoyage Pro</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto mt-1">
                {featureLockedMessage ||
                  'Access unrestricted day planning, real-time group expense splitting, digital wallet passes, and saved trips across all devices.'}
              </p>
            </div>

            {/* Pricing Tiers Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
              {PRICING_PLANS.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={`relative p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-500/10 border-sky-500 ring-2 ring-sky-500/20 shadow-lg shadow-sky-500/10'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 shadow-md">
                        BEST VALUE
                      </span>
                    )}

                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">{plan.name}</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                      ₹{plan.priceINR}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400 ml-1">/{plan.period}</span>
                    </div>

                    <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {plan.features.slice(0, 3).map((f, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-sky-500 dark:text-sky-400 shrink-0 mt-0.5" />
                          <span className="leading-tight">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Payment Methods Badges */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 mb-6">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
                <span className="font-semibold text-slate-800 dark:text-slate-300">Supported Secure Payment Options:</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instant UPI & Cards
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono">GPay / PhonePe / Paytm UPI</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">Visa / Mastercard / RuPay</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">NetBanking (50+ Banks)</span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">CRED / Wallets</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={handlePayNow}
              disabled={processing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 hover:opacity-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/25 transition-all hover:scale-[1.01] disabled:opacity-50"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Secure Gateway...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-current" />
                  <span>Pay ₹{selectedPlan.priceINR} & Unlock All Features</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-3">
              🔒 Safe & secure checkout. Saved safely to your traveler account. Owned by JKSoftonics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
