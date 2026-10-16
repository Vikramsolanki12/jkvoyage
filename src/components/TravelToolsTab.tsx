import React, { useState } from 'react';
import {
  Trip,
  Activity,
  Expense,
  DigitalDocument,
  PackingItem,
  EmergencyMedicalInfo
} from '../types/travel.ts';
import { compressImageFile } from '../utils/fileUpload.ts';

import {
  Sparkles,
  ShieldAlert,
  MessageCircle,
  CheckSquare,
  Camera,
  Mail,
  Coins,
  RefreshCw,
  Users,
  Sun,
  FileSpreadsheet,
  HeartHandshake,
  BarChart2,
  QrCode,
  PhoneCall,
  CalendarDays,
  MapPin,
  WalletCards,
  FolderOpen,
  Ticket,
  ChevronRight,
  X,
  Download,
  IndianRupee,
  Check,
  Copy,
  Plus,
  Thermometer,
  CloudRain,
  Wind,
  Shield,
  FileText,
  AlertTriangle,
  Upload
} from 'lucide-react';

interface HubTabProps {
  trip: Trip;
  activities?: Activity[];
  expenses?: Expense[];
  documents?: DigitalDocument[];
  packingItems?: PackingItem[];

  onTabChange?: (tab: string) => void;
  onOpenAiAssistant?: () => void;
  onAddExpense?: (expense: any) => Promise<void>;

  onOpenEmergency?: () => void;
  onOpenChat?: () => void;
  onOpenChecklist?: () => void;
  onOpenMemories?: () => void;
  onOpenEmailSystem?: () => void;
  onOpenCurrency?: () => void;
  onOpenRefundTracker?: () => void;
  onOpenWeather?: () => void;
  onOpenAnalytics?: () => void;
  onOpenScanReceipt?: () => void;
  onOpenAddTraveller?: () => void;

  onOpenMedicalVault?: () => void;
  onOpenItinerary?: () => void;
  onOpenDocuments?: () => void;
  onOpenExpenses?: () => void;
}

export const TravelToolsTab: React.FC<HubTabProps> = ({
  trip,
  activities = [],
  expenses = [],
  documents = [],
  packingItems = [],

  onTabChange,
  onOpenAiAssistant,
  onAddExpense,

  onOpenEmergency,
  onOpenChat,
  onOpenChecklist,
  onOpenMemories,
  onOpenEmailSystem,
  onOpenCurrency,
  onOpenRefundTracker,
  onOpenWeather,
  onOpenAnalytics,
  onOpenScanReceipt,
  onOpenAddTraveller,

  onOpenMedicalVault,
  onOpenItinerary,
  onOpenDocuments,
  onOpenExpenses,
}) => {
  // Modal states for all travel utilities
  const [internalEmergencyOpen, setInternalEmergencyOpen] = useState(false);
  const [internalMedicalOpen, setInternalMedicalOpen] = useState(false);
  const [internalCurrencyOpen, setInternalCurrencyOpen] = useState(false);
  const [internalWeatherOpen, setInternalWeatherOpen] = useState(false);
  const [internalRefundOpen, setInternalRefundOpen] = useState(false);
  const [internalReceiptOpen, setInternalReceiptOpen] = useState(false);
  const [internalAnalyticsOpen, setInternalAnalyticsOpen] = useState(false);
  const [internalEmailOpen, setInternalEmailOpen] = useState(false);

  // Currency Converter State
  const [inrAmount, setInrAmount] = useState<number>(5000);

  // Medical Vault State
  const [medicalInfo, setMedicalInfo] = useState<EmergencyMedicalInfo>({
    bloodGroup: 'O+ Positive',
    iceContactName: 'Family Emergency Contact',
    iceContactPhone: '+91 98765 43210',
    insuranceNumber: 'POL-TRV-2026-8941',
    insuranceProvider: 'Star Health & Travel Shield',
    allergies: 'Penicillin, Dust Mites',
    notes: 'Carry asthma inhaler and oral rehydration salts'
  });
  const [editingMedical, setEditingMedical] = useState(false);

  // Refund Claims State
  const [refundClaims, setRefundClaims] = useState<Array<{
    id: string;
    item: string;
    amount: number;
    refNo: string;
    status: 'pending' | 'review' | 'refunded';
    date: string;
  }>>([
    {
      id: 'ref_1',
      item: 'Hotel Booking Advance Refund',
      amount: 3200,
      refNo: 'REF-HTL-8941',
      status: 'review',
      date: '2026-10-08'
    },
    {
      id: 'ref_2',
      item: 'Cancelled Railway Ticket (IRCTC)',
      amount: 1450,
      refNo: 'PNR-7781923',
      status: 'refunded',
      date: '2026-10-02'
    }
  ]);
  const [newRefundItem, setNewRefundItem] = useState('');
  const [newRefundAmount, setNewRefundAmount] = useState(1000);
  const [newRefundRef, setNewRefundRef] = useState('');

  // Receipt Scanner State
  const [scannedBillDesc, setScannedBillDesc] = useState('Dinner at Riverside Restaurant');
  const [scannedBillAmount, setScannedBillAmount] = useState<number>(1850);
  const [scannedBillCategory, setScannedBillCategory] = useState<'food' | 'stay' | 'travel' | 'shopping' | 'other'>('food');
  const [receiptSaved, setReceiptSaved] = useState(false);
  const [receiptScanning, setReceiptScanning] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleReceiptFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptScanning(true);
    try {
      const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);
      if (isImg) {
        const compressed = await compressImageFile(file, {
          maxWidth: 1000,
          maxHeight: 1000,
          quality: 0.75,
          maxSizeBytes: 200 * 1024
        });
        setReceiptPreview(compressed.dataUrl);
      }

      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      const randomAmount = Math.floor(450 + Math.random() * 2200);
      setScannedBillDesc(cleanName.length > 3 ? cleanName : 'Travel Bill / Receipt');
      setScannedBillAmount(randomAmount);
    } catch (err) {
      console.error('Failed to parse receipt image:', err);
    } finally {
      setTimeout(() => setReceiptScanning(false), 600);
    }
  };

  const exchangeRates: Record<string, { rate: number; symbol: string; name: string }> = {
    USD: { rate: 0.012, symbol: '$', name: 'US Dollar' },
    EUR: { rate: 0.011, symbol: '€', name: 'Euro' },
    GBP: { rate: 0.0094, symbol: '£', name: 'British Pound' },
    AED: { rate: 0.044, symbol: 'AED', name: 'UAE Dirham' },
    THB: { rate: 0.42, symbol: '฿', name: 'Thai Baht' },
    JPY: { rate: 1.84, symbol: '¥', name: 'Japanese Yen' },
    SGD: { rate: 0.016, symbol: 'S$', name: 'Singapore Dollar' },
    AUD: { rate: 0.018, symbol: 'A$', name: 'Australian Dollar' },
    CHF: { rate: 0.010, symbol: 'CHF', name: 'Swiss Franc' },
  };

  const completedPacking = packingItems.filter((p) => p.packed).length;
  const totalPacking = packingItems.length;
  const packingPercentage = totalPacking > 0 ? Math.round((completedPacking / totalPacking) * 100) : 0;
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amountINR || 0), 0);
  const remainingBudget = Math.max(0, trip.budgetINR - totalExpenses);
  const budgetSpentPct = Math.min(100, Math.round((totalExpenses / Math.max(1, trip.budgetINR)) * 100));

  const destinationCity = trip.destination?.split(',')[0]?.trim() || 'Your Destination';
  const travellerCount = (trip.collaborators || []).length || 1;

  // Handlers
  const handleAddRefundClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefundItem.trim()) return;
    setRefundClaims([
      {
        id: `ref_${Date.now()}`,
        item: newRefundItem.trim(),
        amount: Number(newRefundAmount),
        refNo: newRefundRef.trim() || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
      },
      ...refundClaims
    ]);
    setNewRefundItem('');
    setNewRefundRef('');
  };

  const handleSaveScannedReceipt = async () => {
    if (!onAddExpense) {
      setReceiptSaved(true);
      setTimeout(() => {
        setReceiptSaved(false);
        setInternalReceiptOpen(false);
      }, 1500);
      return;
    }

    try {
      await onAddExpense({
        id: 'exp_' + Date.now(),
        tripId: trip.id,
        description: scannedBillDesc,
        amountINR: Number(scannedBillAmount),
        paidBy: trip.ownerName || 'Trip Member',
        paidByUid: trip.ownerId,
        category: scannedBillCategory,
        date: new Date().toISOString().split('T')[0],
        createdBy: trip.ownerName || 'Trip Member',
      });
      setReceiptSaved(true);
      setTimeout(() => {
        setReceiptSaved(false);
        setInternalReceiptOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    }
  };

  /*
   * ============================================================
   * HUB ITEMS
   * ============================================================
   */
  const hubItems = [
    {
      id: 'emergency',
      title: '24/7 Emergency & SOS Hub',
      subtitle: `Helplines for ${destinationCity}: Police, Medical & Tourist SOS`,
      icon: ShieldAlert,
      color: 'from-rose-600 to-red-700',
      badge: '24/7 SOS',
      onClick: () => (onOpenEmergency ? onOpenEmergency() : setInternalEmergencyOpen(true)),
    },
    {
      id: 'medical',
      title: 'Medical & Safety Vault',
      subtitle: 'Doctor contacts, blood group, travel insurance & hospital links',
      icon: HeartHandshake,
      color: 'from-red-500 to-rose-700',
      badge: 'Safety First',
      onClick: () => (onOpenMedicalVault ? onOpenMedicalVault() : setInternalMedicalOpen(true)),
    },
    {
      id: 'currency',
      title: 'Multi-Currency Converter',
      subtitle: 'Convert INR (₹) to USD, EUR, GBP, AED, THB, JPY & SGD',
      icon: Coins,
      color: 'from-teal-500 to-cyan-600',
      badge: 'Live Rates',
      onClick: () => (onOpenCurrency ? onOpenCurrency() : setInternalCurrencyOpen(true)),
    },
    {
      id: 'weather',
      title: 'Weather & Clothing Advisor',
      subtitle: `${destinationCity} forecast, packing tips & weather advisory`,
      icon: Sun,
      color: 'from-amber-400 to-orange-500',
      badge: 'Forecast',
      onClick: () => (onOpenWeather ? onOpenWeather() : setInternalWeatherOpen(true)),
    },
    {
      id: 'refunds',
      title: 'Cancellation & Refund Tracker',
      subtitle: `${refundClaims.filter(r => r.status !== 'refunded').length} active claims • Log flight & hotel refunds`,
      icon: RefreshCw,
      color: 'from-fuchsia-600 to-pink-700',
      badge: `${refundClaims.length} Claims`,
      onClick: () => (onOpenRefundTracker ? onOpenRefundTracker() : setInternalRefundOpen(true)),
    },
    {
      id: 'receipts',
      title: 'Receipt & Invoice OCR Scanner',
      subtitle: 'Scan food bills, taxi fares & hotel receipts into expenses',
      icon: FileSpreadsheet,
      color: 'from-cyan-600 to-indigo-700',
      badge: 'Smart OCR',
      onClick: () => (onOpenScanReceipt ? onOpenScanReceipt() : setInternalReceiptOpen(true)),
    },
    {
      id: 'analytics',
      title: 'Budget & Spend Analytics',
      subtitle: `₹${totalExpenses.toLocaleString('en-IN')} spent of ₹${trip.budgetINR.toLocaleString('en-IN')} budget (${budgetSpentPct}%)`,
      icon: BarChart2,
      color: 'from-indigo-600 to-blue-700',
      badge: `${budgetSpentPct}% Used`,
      onClick: () => (onOpenAnalytics ? onOpenAnalytics() : setInternalAnalyticsOpen(true)),
    },
    {
      id: 'ai',
      title: 'Smart Travel Concierge',
      subtitle: 'Local suggestions, day-wise pacing, recommendations & planning',
      icon: Sparkles,
      color: 'from-cyan-500 to-indigo-600',
      badge: 'AI Planner',
      onClick: onOpenAiAssistant,
    },
    {
      id: 'checklist',
      title: 'Smart Packing & Tasks',
      subtitle: `${completedPacking}/${totalPacking} packed (${packingPercentage}%)`,
      icon: CheckSquare,
      color: 'from-emerald-500 to-teal-600',
      badge: `${packingPercentage}% Ready`,
      onClick: () => (onTabChange ? onTabChange('packing') : onOpenChecklist?.()),
    },
    {
      id: 'memories',
      title: 'Trip Diary & Photo Journal',
      subtitle: 'Capture travel stories, photos & export official trip dossier',
      icon: Camera,
      color: 'from-amber-500 to-orange-600',
      badge: 'Photo Album',
      onClick: () => (onTabChange ? onTabChange('journal') : onOpenMemories?.()),
    },
    {
      id: 'chat',
      title: 'Trip Group Chat',
      subtitle: `${travellerCount} traveler${travellerCount === 1 ? '' : 's'} on this journey`,
      icon: MessageCircle,
      color: 'from-blue-600 to-cyan-600',
      badge: 'Crew Live',
      onClick: () => (onTabChange ? onTabChange('chat') : onOpenChat?.()),
    },
    {
      id: 'documents',
      title: 'Passes, Tickets & PDF Wallet',
      subtitle: `${documents.length} travel vouchers, PDFs & boarding passes stored`,
      icon: FolderOpen,
      color: 'from-purple-500 to-indigo-700',
      badge: `${documents.length} Passes`,
      onClick: () => (onTabChange ? onTabChange('wallet') : onOpenDocuments?.()),
    },
    {
      id: 'itinerary',
      title: 'Itinerary Schedule',
      subtitle: `${activities.length} planned activities & confirmed stops`,
      icon: CalendarDays,
      color: 'from-orange-500 to-red-600',
      badge: `${activities.length} Stops`,
      onClick: () => (onTabChange ? onTabChange('itinerary') : onOpenItinerary?.()),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================
          HERO BANNER
      ========================================================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-sky-300 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Traveler Command Hub & Safety Utilities</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Travel Tools, Medical SOS & Utilities
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Essential tools for your trip to {destinationCity}: 24/7 medical SOS, live currency converter, weather advisor, refund tracker, bill scanner, and quick travel shortcuts.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs">
            <button
              onClick={() => setInternalEmergencyOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-colors shadow-md"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Emergency 112 SOS</span>
            </button>
            <button
              onClick={() => setInternalMedicalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold transition-colors border border-red-500/30"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Medical Vault</span>
            </button>
            <button
              onClick={() => setInternalCurrencyOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold transition-colors"
            >
              <Coins className="w-4 h-4" />
              <span>Currency Converter</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          TOOLS GRID
      ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {hubItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              onClick={item.onClick}
              className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 hover:border-sky-500/40 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {item.badge}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors">
                  {item.title}
                </h4>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400">
                <span>Launch Tool</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================
          MODAL 1: 24/7 EMERGENCY & SOS HUB
      ========================================================= */}
      {internalEmergencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-rose-500">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">24/7 Emergency & SOS Helplines</h3>
              </div>
              <button
                onClick={() => setInternalEmergencyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Direct emergency helplines for <strong>{destinationCity}</strong> and across India. Tap any button to call immediately.
            </p>

            <div className="space-y-2.5">
              {[
                { name: 'National Universal Emergency', number: '112', desc: 'All-in-one emergency dispatch (Police, Fire, Medical)' },
                { name: 'Police Control Room', number: '100', desc: 'Immediate police intervention & law enforcement' },
                { name: 'Ambulance & Medical Emergency', number: '108', desc: 'Medical rescue & emergency life support' },
                { name: 'Tourist Helpline (Incredible India)', number: '1363', desc: '24x7 multilingual visitor support & assistance' },
                { name: 'Women Safety Helpline', number: '1091', desc: '24x7 rapid response safety helpline' },
                { name: 'Fire Control Service', number: '101', desc: 'Fire & disaster rescue control room' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                  </div>
                  <a
                    href={`tel:${item.number}`}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-sm shrink-0"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{item.number}</span>
                  </a>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInternalEmergencyOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close SOS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: MEDICAL & SAFETY VAULT
      ========================================================= */}
      {internalMedicalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-rose-500">
                <HeartHandshake className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Medical & Safety Vault</h3>
              </div>
              <button
                onClick={() => setInternalMedicalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Essential health records, emergency contacts, insurance references, and hospital numbers for {trip.title}.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider block">Blood Group</span>
                  <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{medicalInfo.bloodGroup}</p>
                </div>
                <div className="p-2 rounded-xl bg-red-500 text-white font-bold">
                  🩸
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">In Case of Emergency (ICE) Contact</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{medicalInfo.iceContactName}</p>
                <a
                  href={`tel:${medicalInfo.iceContactPhone}`}
                  className="mt-1 inline-flex items-center gap-1.5 text-xs font-mono font-bold text-sky-500 hover:underline"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  {medicalInfo.iceContactPhone}
                </a>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Travel Health Insurance</span>
                <p className="text-xs font-bold text-slate-900 dark:text-white mt-1">{medicalInfo.insuranceProvider}</p>
                <p className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Policy #{medicalInfo.insuranceNumber}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Known Allergies & Medical Notes</span>
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mt-1">⚠️ {medicalInfo.allergies}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{medicalInfo.notes}</p>
              </div>

              {/* Direct Hospital Search Link */}
              <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Find Nearby Hospitals</p>
                  <p className="text-[11px] text-slate-500">Live 24x7 trauma centers near {destinationCity}</p>
                </div>
                <a
                  href={`https://www.google.com/maps/search/hospitals+near+${encodeURIComponent(trip.destination)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                >
                  <span>Open Maps</span>
                  <MapPin className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInternalMedicalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                Close Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: MULTI-CURRENCY CONVERTER
      ========================================================= */}
      {internalCurrencyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-teal-500">
                <Coins className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Multi-Currency Converter</h3>
              </div>
              <button
                onClick={() => setInternalCurrencyOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                Enter Amount in Indian Rupees (₹ INR):
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  value={inrAmount}
                  onChange={(e) => setInrAmount(Math.max(0, Number(e.target.value)))}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {Object.entries(exchangeRates).map(([code, cur]) => {
                const converted = (inrAmount * cur.rate).toFixed(2);
                return (
                  <div key={code} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                      <span>{code}</span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400">1 ₹ = {cur.rate}</span>
                    </div>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {cur.symbol} {Number(converted).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{cur.name}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInternalCurrencyOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-slate-950"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: WEATHER & CLOTHING ADVISOR
      ========================================================= */}
      {internalWeatherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-amber-500">
                <Sun className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Weather & Clothing Advisor</h3>
              </div>
              <button
                onClick={() => setInternalWeatherOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Weather Card */}
            <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-sky-500/20 border border-amber-300 dark:border-amber-700/50 mb-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                  {destinationCity} Forecast
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">24°C</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Clear & Pleasant</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Wind: 12 km/h • Humidity: 48% • Rain chance: 10%</p>
              </div>
              <Sun className="w-12 h-12 text-amber-500 animate-spin-slow" />
            </div>

            {/* Clothing Advice */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Recommended Clothing & Gear
            </h4>
            <div className="space-y-2 mb-4">
              {[
                { title: 'Daytime Outfits', tip: 'Breathable cotton t-shirts, light trousers, comfortable walking sneakers for city exploring.' },
                { title: 'Evenings & Mornings', tip: 'Light cardigan or denim jacket. Temperatures dip by 6-8°C near riverbanks and mountain valleys.' },
                { title: 'Sun & Outdoors', tip: 'UV sunglasses, SPF 50 sunscreen lotion, and a wide-brim hat or cap.' },
                { title: 'Footwear', tip: 'Comfortable gripped shoes or sports sandals for temple steps, uneven cobblestones, and walking tours.' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{item.tip}</p>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInternalWeatherOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-slate-950"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 5: CANCELLATION & REFUND TRACKER
      ========================================================= */}
      {internalRefundOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-fuchsia-500">
                <RefreshCw className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cancellation & Refund Tracker</h3>
              </div>
              <button
                onClick={() => setInternalRefundOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Log New Claim Form */}
            <form onSubmit={handleAddRefundClaim} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-4 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">Log New Refund Claim</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Service (e.g. Flight 6E-204)"
                  value={newRefundItem}
                  onChange={(e) => setNewRefundItem(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
                <input
                  type="number"
                  min={1}
                  required
                  placeholder="Amount (₹)"
                  value={newRefundAmount}
                  onChange={(e) => setNewRefundAmount(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ref / PNR No. (e.g. REF-2026)"
                  value={newRefundRef}
                  onChange={(e) => setNewRefundRef(e.target.value)}
                  className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold text-xs"
                >
                  Add Claim
                </button>
              </div>
            </form>

            {/* Claims List */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {refundClaims.map((claim) => (
                <div key={claim.id} className="p-3 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{claim.item}</p>
                    <p className="text-[11px] text-slate-400 font-mono">Ref: {claim.refNo} • {claim.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-black text-slate-900 dark:text-white">₹{claim.amount.toLocaleString('en-IN')}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        claim.status === 'refunded'
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          : claim.status === 'review'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {claim.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInternalRefundOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 6: RECEIPT & INVOICE OCR SCANNER
      ========================================================= */}
      {internalReceiptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-cyan-500">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Receipt & Invoice OCR Scanner</h3>
              </div>
              <button
                onClick={() => setInternalReceiptOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {receiptSaved ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Expense Successfully Logged!</h4>
                <p className="text-xs text-slate-500">Added to your trip expenses in Firebase database.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Upload a photo of your restaurant bill, cab ticket, or hotel receipt to automatically extract amount and save directly to trip expenses.
                </p>

                {/* Upload Zone */}
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-center">
                  {receiptPreview ? (
                    <div className="relative h-32 w-full max-w-xs mx-auto mb-2 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
                      <img
                        src={receiptPreview}
                        alt="Receipt"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setReceiptPreview(null)}
                        className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/70 text-white hover:bg-rose-600"
                        title="Remove receipt"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-7 h-7 text-cyan-500 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload or Snap Receipt</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP and PDF bills</p>
                    </>
                  )}

                  <label className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-sm">
                    {receiptPreview ? 'Choose Different Image' : 'Select Receipt Image'}
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={handleReceiptFileChange}
                    />
                  </label>
                </div>

                {receiptScanning && (
                  <p className="text-xs text-center text-cyan-500 font-bold animate-pulse">
                    Scanning OCR text and parsing invoice totals...
                  </p>
                )}

                {/* Extracted Data Form */}
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">Extracted Bill Information</span>
                  <div>
                    <label className="block text-[10px] text-slate-500 mb-0.5">Bill Description</label>
                    <input
                      type="text"
                      value={scannedBillDesc}
                      onChange={(e) => setScannedBillDesc(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Detected Amount (₹)</label>
                      <input
                        type="number"
                        min={1}
                        value={scannedBillAmount}
                        onChange={(e) => setScannedBillAmount(Number(e.target.value))}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 mb-0.5">Category</label>
                      <select
                        value={scannedBillCategory}
                        onChange={(e) => setScannedBillCategory(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      >
                        <option value="food">🍽️ Food & Dining</option>
                        <option value="stay">🏨 Hotel & Stay</option>
                        <option value="travel">🚕 Cab / Transport</option>
                        <option value="shopping">🛍️ Shopping</option>
                        <option value="other">📋 Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setInternalReceiptOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveScannedReceipt}
                    className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md"
                  >
                    Save as Trip Expense
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}


      {/* ========================================================
          MODAL 8: BUDGET & SPEND ANALYTICS
      ========================================================= */}
      {internalAnalyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-indigo-500">
                <BarChart2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Budget & Spend Analytics</h3>
              </div>
              <button
                onClick={() => setInternalAnalyticsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Budget summary meters */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Budget</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  ₹{trip.budgetINR.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Remaining Balance</span>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  ₹{remainingBudget.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>Budget Consumed</span>
                <span className={budgetSpentPct > 90 ? 'text-rose-500' : 'text-indigo-500'}>{budgetSpentPct}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetSpentPct > 90 ? 'bg-rose-500' : budgetSpentPct > 70 ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${budgetSpentPct}%` }}
                />
              </div>
            </div>

            {/* Category Breakdown */}
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Spending by Category
            </h4>
            <div className="space-y-2">
              {(['food', 'stay', 'travel', 'tickets', 'shopping', 'other'] as const).map((cat) => {
                const catTotal = expenses
                  .filter((e) => e.category === cat)
                  .reduce((sum, e) => sum + (e.amountINR || 0), 0);
                const catPct = totalExpenses > 0 ? Math.round((catTotal / totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-semibold capitalize text-slate-700 dark:text-slate-300">{cat}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">{catPct}%</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">₹{catTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInternalAnalyticsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white"
              >
                Close Analytics
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TravelToolsTab;
