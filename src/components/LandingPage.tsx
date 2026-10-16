import React from 'react';
import {
  Compass,
  Sparkles,
  Calendar,
  CreditCard,
  Briefcase,
  CheckSquare,
  MessageSquare,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  UserPlus,
  LogIn,
  AlertCircle,
  ArrowRight,
  Shield
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext.tsx';
import { JKLogo } from './JKLogo.tsx';

interface LandingPageProps {
  onSignIn: () => void;
  onRegister?: () => void;
  onOpenUpgrade?: (planMsg?: string) => void;
  subscriptionEnforced?: boolean;
  onToggleSubscriptionEnforced?: (enforced: boolean) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSignIn,
  onRegister = onSignIn
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-600 transition-colors">
      {/* 100% Free Announcement Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 text-slate-950 py-2 px-3 text-center text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 fill-current shrink-0" />
        <span className="truncate sm:whitespace-normal">
          100% Free Access! Registration is compulsory to unlock Day Planner, Group Expenses, Digital Wallet & Live Room Chat.
        </span>
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          <JKLogo size="md" />

          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Sign In Button */}
            <button
              onClick={onSignIn}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Sign In</span>
            </button>

            {/* Compulsory Register Button */}
            <button
              onClick={onRegister}
              className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden xs:inline">Register (Compulsory)</span>
              <span className="xs:hidden">Register</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-12 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center">
        {/* Glow backdrop effect */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-sky-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 sm:w-80 h-64 sm:h-80 bg-indigo-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-sky-600 dark:text-sky-400 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-sky-500 shrink-0" />
          <span>Owned by JKSoftonics • 100% Free Lifetime Access</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight max-w-4xl mx-auto leading-[1.15]">
          Plan Smart. Split Fairly.{' '}
          <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            Travel Unbound.
          </span>
        </h1>

        <p className="mt-4 sm:mt-5 text-xs sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The unified travel hub for friends, families, and solo explorers. Coordinate day-by-day itineraries,
          track and settle group expenses in ₹ INR, store digital boarding passes, and chat live with companions.
        </p>

        {/* Compulsory Registration Notice Callout */}
        <div className="mt-6 max-w-md mx-auto p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-500 shrink-0" />
          <span>Traveler Registration is <strong>compulsory</strong> to generate trips & passes. Always 100% Free!</span>
        </div>

        {/* CTA Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto">
          <button
            onClick={onRegister}
            className="w-full sm:w-auto px-6 sm:px-7 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-sky-500/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onSignIn}
            className="w-full sm:w-auto px-5 sm:px-6 py-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-sky-500" />
            <span>Sign In</span>
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" /> Safe & Secure
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold">
            <Shield className="w-3.5 h-3.5" /> Automatic Backup
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> Smart Trip Planner Unlocked Free
          </span>
        </div>
      </section>

      {/* Feature Showcase Grid - All Free */}
      <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Everything You Need for Effortless Journeys
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
            All core travel modules are unlocked and free for every registered traveler.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {/* 1. Day-by-Day Itinerary */}
          <div className="bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">Smart Day Itinerary</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Categorize day stops across sights, cafes, flights, and transit. Set timings, estimated spends in INR, and tips.
            </p>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1 font-mono">
              <div className="flex justify-between"><span>Day 1 • 09:30</span><span className="text-sky-600 dark:text-sky-400 font-bold">Amber Palace</span></div>
              <div className="flex justify-between text-slate-500"><span>Day 1 • 13:00</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">Rajasthani Thali</span></div>
            </div>
          </div>

          {/* 2. Group Expense Equalizer */}
          <div className="bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">Group Expense Equalizer</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Track who paid what, split equal shares in Indian Rupees (₹), and instantly calculate settlements without awkward math.
            </p>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <div className="flex justify-between font-semibold"><span>Hotel Haveli (3 Nights)</span><span className="text-amber-600 dark:text-amber-400 font-mono">₹24,500</span></div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Settlement: Rahul owes Priya ₹3,200</div>
            </div>
          </div>

          {/* 3. Smart Trip Planner */}
          <div className="bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">Smart Trip Planner</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Generate personalized multi-day itineraries for any destination in India or worldwide tailored to your vibe.
            </p>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1 font-mono">
              <span className="text-sky-500">✨ Smart Suggestions:</span>
              <p className="text-[11px] text-slate-400 font-sans">Curating 3 days in Udaipur featuring Lake Pichola & sunset boat tour.</p>
            </div>
          </div>

          {/* 4. Digital Passes & Wallet */}
          <div className="bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">Digital Travel Wallet</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Store boarding passes, train PNRs, hotel bookings, and IDs in a fast, offline-ready secure vault.
            </p>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1 font-mono">
              <div className="flex justify-between"><span>IndiGo 6E-204</span><span className="text-emerald-600 dark:text-emerald-400 font-bold">Confirmed</span></div>
              <div className="text-[10px] text-slate-500">PNR: 98AB2C • Gate 14B</div>
            </div>
          </div>

          {/* 5. Smart Packing Checklist */}
          <div className="bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <CheckSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">Packing Checklist</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Categorize clothing, gear, medications, and electronics. Mark packed items with 1 tap.
            </p>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-500" /> Passport & Aadhaar</span>
              <span className="text-[10px] text-emerald-600 font-bold">Packed</span>
            </div>
          </div>

          {/* 6. Live Trip Room Chat */}
          <div className="bg-white dark:bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-all shadow-sm">
            <div className="flex items-center justify-between mb-3.5">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                100% Free
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1">Live Group Room</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              Coordinate rendezvous spots, flight gates, and food stops with companions in a real-time stream.
            </p>
            <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
              <span className="text-[10px] text-sky-600 font-bold">JKSoftonics Support</span>
              <p className="text-[11px] text-slate-500">Boarding gate 4 opened. Heading to security!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-6 sm:py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-300">JKVoyage</span>
            <span>•</span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">Owned by JKSoftonics</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="text-emerald-600 dark:text-emerald-400">Automatic Backup</span>
            <span>•</span>
            <span className="text-sky-600 dark:text-sky-400">Safe & Secure</span>
            <span>•</span>
            <span className="text-indigo-600 dark:text-indigo-400">All Features 100% Free</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
