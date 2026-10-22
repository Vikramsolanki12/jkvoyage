import React, { useState, useEffect } from 'react';
import {
  IndianRupee,
  Plus,
  Trash2,
  PieChart as PieChartIcon,
  Users,
  CreditCard,
  Receipt,
  User,
  Check,
  CheckSquare,
  Square,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  HandCoins,
  BarChart3,
  ArrowDownLeft,
  ArrowUpRight,
  Shield,
  Layers,
  Calendar,
  Lock,
  Crown,
  Filter,
  Edit3,
  History,
  Search,
  ChevronRight,
  UserCheck,
  Eye
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import {
  Expense,
  ExpenseCategory,
  Trip,
  ExpenseSplit,
  ExpenseTransactionType
} from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface ExpensesTabProps {
  trip: Trip;
  expenses: Expense[];
  isTripCreator: boolean;
  onAddExpense: (expense: Expense) => Promise<void>;
  onUpdateExpense?: (expense: Expense) => Promise<void>;
  onProposeExpense?: (expense: Expense) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  trip,
  expenses,
  isTripCreator,
  onAddExpense,
  onUpdateExpense,
  onProposeExpense,
  onDeleteExpense
}) => {
  const { currentUser, userProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Sub-tab: Ledger vs Individual Traveller History vs Visual Analytics
  const [activeView, setActiveView] = useState<'ledger' | 'travellers' | 'charts'>('ledger');
  const [selectedHistoryTraveller, setSelectedHistoryTraveller] = useState<string>('all');
  const [travellerTxnSearch, setTravellerTxnSearch] = useState<string>('');
  const [travellerTxnFilter, setTravellerTxnFilter] = useState<'all' | 'paid' | 'share' | 'settlement'>('all');

  // Privacy & Role determination - Trip planner is owner/creator; others are travellers
  const isTripPlanner = Boolean(
    isTripCreator ||
    (currentUser &&
      trip &&
      (trip.ownerId === currentUser.uid ||
        (trip.ownerEmail &&
          currentUser.email &&
          trip.ownerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
        (Array.isArray(trip.collaborators) &&
          trip.collaborators.some(
            (c) =>
              c.role === 'planner' &&
              ((currentUser.email && c.email?.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
                (currentUser.uid && c.uid === currentUser.uid))
          ))))
  );
  const currentUserName = userProfile?.displayName || currentUser?.displayName || 'You';
  // For Trip Planner: filter to 'all' or by specific traveller. For Traveller: strictly their own expenses!
  const [plannerFilter, setPlannerFilter] = useState<string>('all');

  // Form states
  const [transactionType, setTransactionType] = useState<ExpenseTransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountINR, setAmountINR] = useState<number>(0);
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState(currentUserName);
  const [receivedBy, setReceivedBy] = useState(currentUserName);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cash' | 'Bank Transfer' | 'Card'>('UPI');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Enhanced Multi-User Splitting States:
  const [splitMode, setSplitMode] = useState<'all' | 'single' | 'custom'>('all');
  const [singleTargetUser, setSingleTargetUser] = useState<string>(currentUserName);
  const [customSelectedUsers, setCustomSelectedUsers] = useState<string[]>([currentUserName]);

  // User-added custom travelers for this specific trip (persisted per trip)
  const [extraTravelers, setExtraTravelers] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`trip_travelers_${trip.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [newTravelerName, setNewTravelerName] = useState('');
  const [showAddTraveler, setShowAddTraveler] = useState(false);

  // Helper to determine if a name string represents the current logged in user
  const isMyTravelerName = React.useCallback((name?: string): boolean => {
    if (!name) return false;
    const n = name.trim().toLowerCase();
    if (n === 'you' || n === 'me' || n === 'myself') return true;

    const myProfileName = (userProfile?.displayName || '').trim().toLowerCase();
    const myAuthName = (currentUser?.displayName || '').trim().toLowerCase();
    const myEmail = (currentUser?.email || '').trim().toLowerCase();
    const emailPrefix = myEmail ? myEmail.split('@')[0] : '';

    if (myProfileName && n === myProfileName) return true;
    if (myAuthName && n === myAuthName) return true;
    if (myEmail && n === myEmail) return true;
    if (emailPrefix && n === emailPrefix) return true;

    if (currentUser?.uid && (n === currentUser.uid.toLowerCase() || name === currentUser.uid)) return true;

    // Check if any collaborator matching the user's email or uid had this name
    if (Array.isArray(trip.collaborators)) {
      const myCollab = trip.collaborators.find(
        (c) => (myEmail && c.email?.trim().toLowerCase() === myEmail) || (currentUser?.uid && c.uid === currentUser.uid)
      );
      if (myCollab?.name && n === myCollab.name.trim().toLowerCase()) return true;
      if (myCollab?.email && n === myCollab.email.trim().toLowerCase()) return true;
      if (myCollab?.uid && (n === myCollab.uid.toLowerCase() || name === myCollab.uid)) return true;
    }

    return false;
  }, [currentUser, userProfile, trip.collaborators]);

  // Dynamically resolve actual trip members without duplicate or conflicting names
  const activeTravelers = React.useMemo(() => {
    const travelersMap = new Map<string, string>(); // lowercase clean identifier -> display name
    const myEmail = currentUser?.email?.trim().toLowerCase();
    const myName = (userProfile?.displayName || currentUser?.displayName || '').trim();
    const ownerEmail = (trip.ownerEmail || (trip.collaborators || []).find((c) => c.uid === trip.ownerId || c.role === 'planner')?.email || '').trim().toLowerCase();
    const ownerName = trip.ownerName?.trim() || 'Trip Planner';

    // 1. Owner / Trip Planner
    travelersMap.set(ownerName.toLowerCase(), ownerName);
    if (ownerEmail) {
      travelersMap.set(ownerEmail, ownerName);
    }
    if (trip.ownerId) {
      travelersMap.set(trip.ownerId, ownerName);
    }

    // 2. Collaborators (Deduplicated so registered user with same email is only ONE)
    const seenEmails = new Set<string>();
    const seenUids = new Set<string>();
    if (ownerEmail) seenEmails.add(ownerEmail);
    if (trip.ownerId) seenUids.add(trip.ownerId);

    (trip.collaborators || []).forEach((c) => {
      if (!c) return;
      const cEmail = c.email?.trim().toLowerCase();
      const cUid = c.uid?.trim();
      if (cUid && seenUids.has(cUid)) return;
      if (cEmail && seenEmails.has(cEmail)) return;
      if (c.role === 'planner') return;

      if (cEmail) seenEmails.add(cEmail);
      if (cUid) seenUids.add(cUid);

      // Is this collaborator the logged-in user?
      const isMe = (cEmail && myEmail && cEmail === myEmail) || (currentUser?.uid && cUid === currentUser.uid);
      const displayName = isMe ? (myName || c.name) : c.name;
      if (displayName && displayName.trim().toLowerCase() !== 'you') {
        const cleanName = displayName.trim();
        travelersMap.set(cleanName.toLowerCase(), cleanName);
        if (cEmail) travelersMap.set(cEmail, cleanName);
        if (cUid) travelersMap.set(cUid, cleanName);
      }
    });

    // 3. Current user (if not owner and not added yet)
    if (myName && (!ownerEmail || myEmail !== ownerEmail) && currentUser?.uid !== trip.ownerId) {
      if (!travelersMap.has(myName.toLowerCase()) && (!myEmail || !travelersMap.has(myEmail))) {
        travelersMap.set(myName.toLowerCase(), myName);
      }
    }

    // 4. Any custom extra travelers
    extraTravelers.forEach((extra) => {
      const clean = extra.trim();
      if (clean && !travelersMap.has(clean.toLowerCase())) {
        travelersMap.set(clean.toLowerCase(), clean);
      }
    });

    // Extract unique display names only
    const uniqueNames = Array.from(new Set(Array.from(travelersMap.values())));
    return uniqueNames.length > 0 ? uniqueNames : [myName || 'You'];
  }, [trip, userProfile, currentUser, extraTravelers]);

  // Keep singleTargetUser and customSelectedUsers in sync with valid travelers
  React.useEffect(() => {
    if (!activeTravelers.includes(singleTargetUser) && activeTravelers.length > 0) {
      setSingleTargetUser(activeTravelers[0]);
    }
    if (customSelectedUsers.length === 0 && activeTravelers.length > 0) {
      setCustomSelectedUsers([activeTravelers[0]]);
    }
  }, [activeTravelers]);

  React.useEffect(() => {
    if (modalOpen) {
      setPaidBy(currentUserName);
      setReceivedBy(currentUserName);
      if (!isTripPlanner) {
        setSingleTargetUser(currentUserName);
        // Default to 'all' or 'single'
        setSplitMode('all');
      }
    }
  }, [modalOpen, currentUserName, isTripPlanner]);

  const handleAddTraveler = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTravelerName.trim();
    if (!clean) return;
    if (!activeTravelers.some((t) => t.toLowerCase() === clean.toLowerCase())) {
      const next = [...extraTravelers, clean];
      setExtraTravelers(next);
      try {
        localStorage.setItem(`trip_travelers_${trip.id}`, JSON.stringify(next));
      } catch (err) {
        console.error(err);
      }
      setCustomSelectedUsers((prev) => [...prev, clean]);
    }
    setNewTravelerName('');
    setShowAddTraveler(false);
  };

  const handleRemoveExtraTraveler = (nameToRemove: string) => {
    const next = extraTravelers.filter((t) => t !== nameToRemove);
    setExtraTravelers(next);
    try {
      localStorage.setItem(`trip_travelers_${trip.id}`, JSON.stringify(next));
    } catch (err) {
      console.error(err);
    }
    setCustomSelectedUsers((prev) => prev.filter((u) => u !== nameToRemove));
  };

  // Helper to check if an identifier belongs to the trip planner / creator
  const isPlannerIdentifier = React.useCallback((ident?: string): boolean => {
    if (!ident) return false;
    const clean = ident.trim().toLowerCase();
    if (trip.ownerId && clean === trip.ownerId.toLowerCase()) return true;
    if (trip.ownerEmail && clean === trip.ownerEmail.trim().toLowerCase()) return true;
    if (trip.ownerName && clean === trip.ownerName.trim().toLowerCase()) return true;
    if (clean === 'trip planner' || clean === 'planner') return true;
    if (Array.isArray(trip.collaborators)) {
      return trip.collaborators.some(
        (c) =>
          c.role === 'planner' &&
          (c.name.trim().toLowerCase() === clean ||
            (c.email && c.email.trim().toLowerCase() === clean) ||
            (c.uid && c.uid.toLowerCase() === clean))
      );
    }
    return false;
  }, [trip]);

  // Helper to determine the traveller's individual share of an expense:
  // (e.g. 1000 INR split across 5 travellers = strictly 200 INR for this traveller)
  
  const getTravellerShare = React.useCallback(
    (exp: Expense): number => {
      // Payments and deposits: show the full amount
      if (
        exp.transactionType === 'payment_received' ||
        exp.transactionType === 'deposit'
      ) {
        return exp.amountINR;
      }

      const totalMembers = Math.max(1, activeTravelers.length);
      const defaultEqualShare = Math.round(exp.amountINR / totalMembers);

      // 1. Single target user
      if (exp.splitMode === 'single') {
        return isMyTravelerName(exp.splitTargetUser) ? exp.amountINR : 0;
      }

      // 2. Custom split among specific users
      if (exp.splitMode === 'custom') {
        if (Array.isArray(exp.splits) && exp.splits.length > 0) {
          const mySplit = exp.splits.find((s) => isMyTravelerName(s.userName));
          if (mySplit) return Math.round(mySplit.amount);
        }
        if (Array.isArray(exp.splitWithUsers) && exp.splitWithUsers.length > 0) {
          const isIncluded = exp.splitWithUsers.some((u) => isMyTravelerName(u));
          return isIncluded ? Math.round(exp.amountINR / Math.max(1, exp.splitWithUsers.length)) : 0;
        }
        return 0;
      }

      // 3. Split across all travellers (splitMode === 'all' or default):
      // First check if explicit per-member splits list contains this user
      if (Array.isArray(exp.splits) && exp.splits.length > 0) {
        const mySplit = exp.splits.find((s) => isMyTravelerName(s.userName));
        if (mySplit) {
          return Math.round(mySplit.amount);
        }
      }

      // For all travellers split: always return their equal share (e.g. 1000 INR / 5 = 200 INR)
      return defaultEqualShare;
    },
    [activeTravelers, isMyTravelerName]
  );

  // Helper to determine if an expense is relevant to the current traveller
  const isMyOwnExpense = React.useCallback((exp: Expense): boolean => {
    // Payments & deposits
    if (exp.transactionType === 'payment_received' || exp.transactionType === 'deposit') {
      return (
        isMyTravelerName(exp.paidBy) ||
        isMyTravelerName(exp.receivedBy) ||
        exp.paidByUid === currentUser?.uid ||
        exp.receivedByUid === currentUser?.uid ||
        exp.createdBy === currentUser?.uid
      );
    }

    // 1. Group expense split among all travellers is ALWAYS relevant to every traveller
    if (!exp.splitMode || exp.splitMode === 'all') {
      return true;
    }

    // 2. Single target user
    if (exp.splitMode === 'single') {
      return (
        isMyTravelerName(exp.splitTargetUser) ||
        isMyTravelerName(exp.paidBy) ||
        exp.paidByUid === currentUser?.uid ||
        exp.createdBy === currentUser?.uid
      );
    }

    // 3. Custom selected users
    if (exp.splitMode === 'custom') {
      const inCustom = Array.isArray(exp.splitWithUsers) && exp.splitWithUsers.some((u) => isMyTravelerName(u));
      const inSplits = Array.isArray(exp.splits) && exp.splits.some((s) => isMyTravelerName(s.userName));
      return (
        inCustom ||
        inSplits ||
        isMyTravelerName(exp.paidBy) ||
        exp.paidByUid === currentUser?.uid ||
        exp.createdBy === currentUser?.uid
      );
    }

    // 4. Default: relevant if traveller has a share in it or paid it
    return (
      getTravellerShare(exp) > 0 ||
      isMyTravelerName(exp.paidBy) ||
      exp.paidByUid === currentUser?.uid ||
      exp.createdBy === currentUser?.uid
    );
  }, [currentUser, isMyTravelerName, getTravellerShare]);

  // For Trip Planner: Show all travellers' expenses! Can filter by individual traveller or view 'all'
  // For Traveller: Strictly show ONLY their own expenses and transactions
  const visibleExpenses = expenses.filter((exp) => {
    if (isTripPlanner) {
      if (plannerFilter === 'all') {
        return true;
      }
      const target = plannerFilter.trim().toLowerCase();
      const payer = (exp.paidBy || '').trim().toLowerCase();
      const receiver = (exp.receivedBy || '').trim().toLowerCase();
      const splitTarget = (exp.splitTargetUser || '').trim().toLowerCase();
      const inCustom = Array.isArray(exp.splitWithUsers) && exp.splitWithUsers.some((u) => u.trim().toLowerCase() === target);
      return payer === target || receiver === target || splitTarget === target || inCustom;
    }
    return isMyOwnExpense(exp);
  });

  // Calculate personal totals for Traveller:
  const myPaidExpenses = expenses
    .filter(
      (e) =>
        (!e.transactionType || e.transactionType === 'expense') &&
        (isMyTravelerName(e.paidBy) || e.paidByUid === currentUser?.uid || e.createdBy === currentUser?.uid)
    )
    .reduce((sum, e) => sum + (e.amountINR || 0), 0);

  const myPaymentsMade = expenses
    .filter(
      (e) =>
        (e.transactionType === 'payment_received' || e.transactionType === 'deposit') &&
        (isMyTravelerName(e.paidBy) || e.paidByUid === currentUser?.uid || e.createdBy === currentUser?.uid)
    )
    .reduce((sum, e) => sum + (e.amountINR || 0), 0);

  const myPaymentsReceived = expenses
    .filter(
      (e) =>
        e.transactionType === 'payment_received' &&
        (isMyTravelerName(e.receivedBy) || e.receivedByUid === currentUser?.uid)
    )
    .reduce((sum, e) => sum + (e.amountINR || 0), 0);

  const myTotalContribution = myPaidExpenses + myPaymentsMade;

  // For Traveller: Sum strictly their own expense shares across visible expenses (e.g. 200 INR of 1000 INR)
  const myTotalExpenseShare = visibleExpenses
    .filter((e) => !e.transactionType || e.transactionType === 'expense')
    .reduce((sum, e) => sum + getTravellerShare(e), 0);

  // Calculate totals:
  // For Trip Planner: total spent across all group expenses
  // For Traveller: strictly their personal share of expenses
  const totalSpent = isTripPlanner
    ? visibleExpenses
        .filter((e) => !e.transactionType || e.transactionType === 'expense')
        .reduce((sum, e) => sum + (e.amountINR || 0), 0)
    : myTotalExpenseShare;

  const totalPaymentsReceived = isTripPlanner
    ? visibleExpenses
        .filter((e) => e.transactionType === 'payment_received' || e.transactionType === 'deposit')
        .reduce((sum, e) => sum + (e.amountINR || 0), 0)
    : myPaymentsReceived;

  const budgetINR = trip.budgetINR || 1;
  const remainingBudget = budgetINR - totalSpent;

  // Category aggregations for expenses: strictly traveller's share for non-planners
  const categoryTotals = visibleExpenses
    .filter((e) => !e.transactionType || e.transactionType === 'expense')
    .reduce((acc, exp) => {
      const amt = isTripPlanner ? exp.amountINR : getTravellerShare(exp);
      acc[exp.category] = (acc[exp.category] || 0) + amt;
      return acc;
    }, {} as Record<ExpenseCategory, number>);

  const categoryColors: Record<
    ExpenseCategory,
    { label: string; color: string; badge: string }
  > = {
    stay: {
      label: 'Hotel & Stay',
      color: '#6366f1',
      badge: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30'
    },
    food: {
      label: 'Dining & Cafes',
      color: '#f59e0b',
      badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
    },
    travel: {
      label: 'Transit & Fuel',
      color: '#10b981',
      badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    },
    tickets: {
      label: 'Entry & Passes',
      color: '#0ea5e9',
      badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
    },
    shopping: {
      label: 'Bazaar & Gifts',
      color: '#ec4899',
      badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/30'
    },
    other: {
      label: 'Miscellaneous',
      color: '#8b5cf6',
      badge: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
    }
  };

  // Toggle user in custom split selection
  const toggleCustomUser = (traveler: string) => {
    if (customSelectedUsers.includes(traveler)) {
      if (customSelectedUsers.length > 1) {
        setCustomSelectedUsers(customSelectedUsers.filter((u) => u !== traveler));
      }
    } else {
      setCustomSelectedUsers([...customSelectedUsers, traveler]);
    }
  };

  // Calculate per person share in modal preview
  const calculatePerPersonPreview = () => {
    if (!amountINR || amountINR <= 0) return 0;
    if (splitMode === 'all') {
      return Math.round(amountINR / Math.max(1, activeTravelers.length));
    }
    if (splitMode === 'single') {
      return amountINR;
    }
    if (splitMode === 'custom') {
      const count = Math.max(1, customSelectedUsers.length);
      return Math.round(amountINR / count);
    }
    return amountINR;
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setTransactionType(exp.transactionType || 'expense');
    setDescription(exp.description);
    setAmountINR(exp.amountINR);
    setCategory(exp.category || 'food');
    setPaidBy(exp.paidBy || currentUserName);
    setReceivedBy(exp.receivedBy || currentUserName);
    setPaymentMethod(exp.paymentMethod || 'UPI');
    setDate(exp.date || new Date().toISOString().split('T')[0]);
    setSplitMode(exp.splitMode || 'all');
    if (exp.splitTargetUser) setSingleTargetUser(exp.splitTargetUser);
    if (Array.isArray(exp.splitWithUsers) && exp.splitWithUsers.length > 0) {
      setCustomSelectedUsers(exp.splitWithUsers);
    }
    setModalOpen(true);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTripPlanner) return;
    if (!description.trim() || amountINR <= 0) return;
    setSubmitting(true);

    try {
      let splits: ExpenseSplit[] = [];
      let splitWithUsers: string[] = [];

      if (transactionType === 'expense') {
        if (splitMode === 'all') {
          const perPerson = Math.round(amountINR / Math.max(1, activeTravelers.length));
          splitWithUsers = [...activeTravelers];
          splits = activeTravelers.map((name) => ({
            userName: name,
            amount: perPerson,
            settled: false
          }));
        } else if (splitMode === 'single') {
          splitWithUsers = [singleTargetUser];
          splits = [
            {
              userName: singleTargetUser,
              amount: amountINR,
              settled: false
            }
          ];
        } else if (splitMode === 'custom') {
          const count = Math.max(1, customSelectedUsers.length);
          const perPerson = Math.round(amountINR / count);
          splitWithUsers = [...customSelectedUsers];
          splits = customSelectedUsers.map((name) => ({
            userName: name,
            amount: perPerson,
            settled: false
          }));
        }
      }

      const creatorUid = currentUser?.uid || 'user_local';
      const payerName = paidBy.trim() || currentUserName;
      const receiverName = receivedBy.trim() || currentUserName;

      if (editingExpenseId) {
        const existing = expenses.find((e) => e.id === editingExpenseId);
        const updatedExp: Expense = {
          ...existing,
          id: editingExpenseId,
          tripId: trip.id,
          description: description.trim(),
          amountINR: Number(amountINR),
          paidBy: payerName,
          paidByUid: existing?.paidByUid || currentUser?.uid || 'user_local',
          category,
          date: date || new Date().toISOString().split('T')[0],
          createdBy: existing?.createdBy || creatorUid,
          createdAt: existing?.createdAt || new Date().toISOString(),
          splitMode: transactionType === 'expense' ? splitMode : undefined,
          splitTargetUser:
            transactionType === 'expense' && splitMode === 'single'
              ? singleTargetUser
              : undefined,
          splitWithUsers: transactionType === 'expense' ? splitWithUsers : undefined,
          splits: transactionType === 'expense' ? splits : undefined,
          transactionType,
          receivedBy: transactionType === 'payment_received' ? receiverName : undefined,
          receivedByUid:
            transactionType === 'payment_received' && (receiverName === currentUserName || receiverName === 'You')
              ? currentUser?.uid
              : undefined,
          paymentMethod: transactionType !== 'expense' ? paymentMethod : undefined
        };

        if (onUpdateExpense) {
          await onUpdateExpense(updatedExp);
        } else {
          await onAddExpense(updatedExp);
        }
        setFeedback(`Updated transaction "${updatedExp.description}"!`);
        setModalOpen(false);
        setEditingExpenseId(null);
        setDescription('');
        setAmountINR(0);
        setTimeout(() => setFeedback(null), 3500);
        return;
      }

      const newExp: Expense = {
        id: 'exp_' + Date.now(),
        tripId: trip.id,
        description: description.trim(),
        amountINR: Number(amountINR),
        paidBy: payerName,
        paidByUid: currentUser?.uid || 'user_local',
        category,
        date: date || new Date().toISOString().split('T')[0],
        createdBy: creatorUid,
        createdAt: new Date().toISOString(),
        splitMode: transactionType === 'expense' ? splitMode : undefined,
        splitTargetUser:
          transactionType === 'expense' && splitMode === 'single'
            ? singleTargetUser
            : undefined,
        splitWithUsers: transactionType === 'expense' ? splitWithUsers : undefined,
        splits: transactionType === 'expense' ? splits : undefined,
        transactionType,
        receivedBy: transactionType === 'payment_received' ? receiverName : undefined,
        receivedByUid:
          transactionType === 'payment_received' && (receiverName === currentUserName || receiverName === 'You')
            ? currentUser?.uid
            : undefined,
        paymentMethod: transactionType !== 'expense' ? paymentMethod : undefined
      };

      await onAddExpense(newExp);
      setFeedback(
        transactionType === 'expense'
          ? `Recorded ₹${newExp.amountINR.toLocaleString('en-IN')} expense in ledger!`
          : `Recorded ₹${newExp.amountINR.toLocaleString('en-IN')} payment received from ${newExp.paidBy}!`
      );

      // Automatically close modal and clear inputs immediately upon successful submit
      setModalOpen(false);
      setDescription('');
      setAmountINR(0);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error('Failed to save transaction:', err);
      // Auto close even on background warning so user isn't stuck
      setModalOpen(false);
      setDescription('');
      setAmountINR(0);
      setEditingExpenseId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-user Debt / Settlement & Payment Received Calculation
  const memberBalances: Record<string, { paid: number; owes: number; received: number }> = {};
  activeTravelers.forEach((t) => {
    memberBalances[t] = { paid: 0, owes: 0, received: 0 };
  });

  const myCanonicalMember = activeTravelers.find(isMyTravelerName) || currentUserName;
  if (!memberBalances[myCanonicalMember]) {
    memberBalances[myCanonicalMember] = { paid: 0, owes: 0, received: 0 };
  }

  if (isTripPlanner) {
    expenses.forEach((exp) => {
      const rawPayer = exp.paidBy || currentUserName;
      const payer = isMyTravelerName(rawPayer) ? myCanonicalMember : (activeTravelers.find((t) => t.toLowerCase() === rawPayer.toLowerCase()) || rawPayer);
      if (!memberBalances[payer]) {
        memberBalances[payer] = { paid: 0, owes: 0, received: 0 };
      }

      // Payment Received by traveller
      if (exp.transactionType === 'payment_received') {
        const rawReceiver = exp.receivedBy || currentUserName;
        const receiver = isMyTravelerName(rawReceiver) ? myCanonicalMember : (activeTravelers.find((t) => t.toLowerCase() === rawReceiver.toLowerCase()) || rawReceiver);
        if (!memberBalances[receiver]) {
          memberBalances[receiver] = { paid: 0, owes: 0, received: 0 };
        }
        // Payer transferred money to receiver (settlement)
        memberBalances[payer].paid += exp.amountINR;
        memberBalances[receiver].received += exp.amountINR;
        return;
      }

      // Deposit added to group pool
      if (exp.transactionType === 'deposit') {
        memberBalances[payer].paid += exp.amountINR;
        return;
      }

      // Regular expense
      memberBalances[payer].paid += exp.amountINR;

      if (exp.splitMode === 'single' && exp.splitTargetUser) {
        const rawDebtor = exp.splitTargetUser;
        const debtor = isMyTravelerName(rawDebtor) ? myCanonicalMember : rawDebtor;
        if (!memberBalances[debtor]) memberBalances[debtor] = { paid: 0, owes: 0, received: 0 };
        memberBalances[debtor].owes += exp.amountINR;
      } else if (exp.splitMode === 'custom' && exp.splitWithUsers && exp.splitWithUsers.length > 0) {
        const share = exp.amountINR / exp.splitWithUsers.length;
        exp.splitWithUsers.forEach((user) => {
          const debtor = isMyTravelerName(user) ? myCanonicalMember : user;
          if (!memberBalances[debtor]) memberBalances[debtor] = { paid: 0, owes: 0, received: 0 };
          memberBalances[debtor].owes += share;
        });
      } else {
        const share = exp.amountINR / Math.max(1, activeTravelers.length);
        activeTravelers.forEach((t) => {
          if (!memberBalances[t]) memberBalances[t] = { paid: 0, owes: 0, received: 0 };
          memberBalances[t].owes += share;
        });
      }
    });
  } else {
    // For Traveller: Strictly calculate only their own individual paid amounts and their allocated expense share
    // (e.g. 1000 INR expense distributed across 5 travellers = strictly 200 INR owed share)
    expenses.forEach((exp) => {
      const rawPayer = exp.paidBy || currentUserName;
      const isPayerMe = isMyTravelerName(rawPayer) || exp.paidByUid === currentUser?.uid || exp.createdBy === currentUser?.uid;

      if (exp.transactionType === 'payment_received') {
        const rawReceiver = exp.receivedBy || currentUserName;
        const isReceiverMe = isMyTravelerName(rawReceiver) || exp.receivedByUid === currentUser?.uid;
        if (isPayerMe) {
          memberBalances[myCanonicalMember].paid += exp.amountINR;
        }
        if (isReceiverMe) {
          memberBalances[myCanonicalMember].received += exp.amountINR;
        }
        return;
      }

      if (exp.transactionType === 'deposit') {
        if (isPayerMe) {
          memberBalances[myCanonicalMember].paid += exp.amountINR;
        }
        return;
      }

      // Regular expense:
      if (isPayerMe) {
        memberBalances[myCanonicalMember].paid += exp.amountINR;
      }

      // The traveller's allocated share of this expense (e.g. 200 INR of 1000 INR across 5 travellers)
      const myShare = getTravellerShare(exp);
      memberBalances[myCanonicalMember].owes += myShare;
    });
  }

  // Helper to get detailed breakdown of an expense for a specific member
  const getMemberTransactionDetails = React.useCallback(
    (memberName: string, exp: Expense) => {
      const isTargetMember = (name?: string) => {
        if (!name) return false;
        if (name.trim().toLowerCase() === memberName.trim().toLowerCase()) return true;
        if (isMyTravelerName(memberName) && isMyTravelerName(name)) return true;
        return false;
      };

      const isPayer =
        isTargetMember(exp.paidBy) ||
        (isMyTravelerName(memberName) && (exp.paidByUid === currentUser?.uid || exp.createdBy === currentUser?.uid));

      // Handle Settlement / Payment Received
      if (exp.transactionType === 'payment_received') {
        const isReceiver =
          isTargetMember(exp.receivedBy) ||
          (isMyTravelerName(memberName) && exp.receivedByUid === currentUser?.uid);

        if (isPayer) {
          return {
            isIncluded: true,
            role: 'settlement_sent' as const,
            memberPaid: exp.amountINR,
            memberShare: 0,
            netImpact: exp.amountINR,
            roleLabel: `Paid Settlement to ${exp.receivedBy || 'Group'}`,
            roleBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
            descriptionNote: `Settlement transfer sent to ${exp.receivedBy || 'Group'}`
          };
        }
        if (isReceiver) {
          return {
            isIncluded: true,
            role: 'settlement_received' as const,
            memberPaid: 0,
            memberShare: 0,
            netImpact: -exp.amountINR,
            roleLabel: `Received Settlement from ${exp.paidBy || 'Member'}`,
            roleBadgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
            descriptionNote: `Payment received from ${exp.paidBy || 'Member'}`
          };
        }
        return {
          isIncluded: false,
          role: 'share' as const,
          memberPaid: 0,
          memberShare: 0,
          netImpact: 0,
          roleLabel: '',
          roleBadgeClass: '',
          descriptionNote: ''
        };
      }

      // Handle Group Deposit
      if (exp.transactionType === 'deposit') {
        if (isPayer) {
          return {
            isIncluded: true,
            role: 'paid' as const,
            memberPaid: exp.amountINR,
            memberShare: 0,
            netImpact: exp.amountINR,
            roleLabel: 'Added Deposit to Group Pool',
            roleBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
            descriptionNote: 'Funded group travel wallet pool'
          };
        }
        return {
          isIncluded: false,
          role: 'share' as const,
          memberPaid: 0,
          memberShare: 0,
          netImpact: 0,
          roleLabel: '',
          roleBadgeClass: '',
          descriptionNote: ''
        };
      }

      // Handle Regular Expense: calculate member share
      let memberShare = 0;
      let inSplit = false;

      if (exp.splitMode === 'single') {
        if (isTargetMember(exp.splitTargetUser)) {
          memberShare = exp.amountINR;
          inSplit = true;
        }
      } else if (exp.splitMode === 'custom') {
        if (Array.isArray(exp.splits) && exp.splits.length > 0) {
          const s = exp.splits.find((split) => isTargetMember(split.userName));
          if (s) {
            memberShare = Math.round(s.amount);
            inSplit = true;
          }
        } else if (Array.isArray(exp.splitWithUsers) && exp.splitWithUsers.length > 0) {
          if (exp.splitWithUsers.some(isTargetMember)) {
            memberShare = Math.round(exp.amountINR / exp.splitWithUsers.length);
            inSplit = true;
          }
        }
      } else {
        // splitMode === 'all' or default
        if (Array.isArray(exp.splits) && exp.splits.length > 0) {
          const s = exp.splits.find((split) => isTargetMember(split.userName));
          if (s) {
            memberShare = Math.round(s.amount);
            inSplit = true;
          }
        } else {
          memberShare = Math.round(exp.amountINR / Math.max(1, activeTravelers.length));
          inSplit = true;
        }
      }

      const memberPaid = isPayer ? exp.amountINR : 0;
      const isIncluded = isPayer || inSplit;

      if (!isIncluded) {
        return {
          isIncluded: false,
          role: 'share' as const,
          memberPaid: 0,
          memberShare: 0,
          netImpact: 0,
          roleLabel: '',
          roleBadgeClass: '',
          descriptionNote: ''
        };
      }

      if (isPayer && memberShare > 0) {
        return {
          isIncluded: true,
          role: 'paid' as const,
          memberPaid,
          memberShare,
          netImpact: memberPaid - memberShare,
          roleLabel: 'Paid Full Bill & Split Share',
          roleBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          descriptionNote: `Paid ₹${memberPaid.toLocaleString('en-IN')}; their share is ₹${memberShare.toLocaleString('en-IN')}`
        };
      }

      if (isPayer && memberShare === 0) {
        return {
          isIncluded: true,
          role: 'paid' as const,
          memberPaid,
          memberShare: 0,
          netImpact: memberPaid,
          roleLabel: 'Paid on Behalf of Others',
          roleBadgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          descriptionNote: `Covered ₹${memberPaid.toLocaleString('en-IN')} fully for other members`
        };
      }

      return {
        isIncluded: true,
        role: 'share' as const,
        memberPaid: 0,
        memberShare,
        netImpact: -memberShare,
        roleLabel: 'Consumed Split Share',
        roleBadgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
        descriptionNote: `Consumed ₹${memberShare.toLocaleString('en-IN')} share (paid by ${exp.paidBy || 'Member'})`
      };
    },
    [activeTravelers, currentUser?.uid, isMyTravelerName]
  );

  const getMemberTransactionCount = React.useCallback(
    (memberName: string) => {
      return expenses.filter((e) => getMemberTransactionDetails(memberName, e).isIncluded).length;
    },
    [expenses, getMemberTransactionDetails]
  );

  // Quick Action Handlers for a specific traveller
  const handleQuickRecordPayment = (targetMember: string) => {
    setEditingExpenseId(null);
    setDescription(`Settlement from ${targetMember}`);
    setAmountINR(0);
    setPaidBy(targetMember);
    setReceivedBy(currentUserName);
    setPaymentMethod('UPI');
    setTransactionType('payment_received');
    setModalOpen(true);
  };

  const handleQuickRecordExpense = (targetMember: string) => {
    setEditingExpenseId(null);
    setDescription('');
    setAmountINR(0);
    setPaidBy(targetMember);
    setCategory('food');
    setSplitMode('all');
    setTransactionType('expense');
    setModalOpen(true);
  };

  // ---------------------------------------------------------------------------
  // RECHARTS DATA PREPARATION:
  // 1. Pie Chart: Category breakdown
  // 2. Bar Chart: Spending per day
  // ---------------------------------------------------------------------------
  const categoryChartData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0)
    .map(([catKey, value]) => ({
      name: categoryColors[catKey as ExpenseCategory]?.label || catKey,
      value,
      color: categoryColors[catKey as ExpenseCategory]?.color || '#8b5cf6'
    }));

  const dailySpendingMap: Record<string, { date: string; amount: number; count: number }> = {};
  visibleExpenses
    .filter((e) => !e.transactionType || e.transactionType === 'expense')
    .forEach((exp) => {
      const d = exp.date || 'Undated';
      if (!dailySpendingMap[d]) {
        dailySpendingMap[d] = { date: d, amount: 0, count: 0 };
      }
      dailySpendingMap[d].amount += isTripPlanner ? exp.amountINR : getTravellerShare(exp);
      dailySpendingMap[d].count += 1;
    });

  const dailyChartData = Object.values(dailySpendingMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => {
      let formattedDate = item.date;
      try {
        const parts = item.date.split('-');
        if (parts.length === 3) {
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          formattedDate = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
      } catch (e) {}
      return {
        ...item,
        formattedDate
      };
    });

  // Custom tooltips for Recharts
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percent = totalSpent > 0 ? ((data.value / totalSpent) * 100).toFixed(1) : '0';
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-white text-xs">
          <p className="font-bold flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: data.payload.color }}
            />
            {data.name}
          </p>
          <p className="text-sky-400 font-extrabold mt-0.5">
            ₹{data.value.toLocaleString('en-IN')} ({percent}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-xl shadow-xl text-white text-xs">
          <p className="font-bold text-slate-300 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            {data.formattedDate} ({data.date})
          </p>
          <p className="text-sky-400 font-black text-sm mt-0.5">
            ₹{data.amount.toLocaleString('en-IN')}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">{data.count} expense receipts logged</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Role & Visibility Banner */}
      {isTripPlanner ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>👑 Trip Planner View: All Travellers' Expenses Ledger</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold">
                  {expenses.length} Total
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Showing all recorded expenses and payment transactions across all travellers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400">Filter:</span>
            <select
              value={plannerFilter}
              onChange={(e) => setPlannerFilter(e.target.value)}
              className="text-xs font-bold bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">All Travellers ({expenses.length})</option>
              {activeTravelers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>🧭 Traveller View: My Expenses & Transactions</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold">
                  {visibleExpenses.length} Entries
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Showing strictly your personal expenses, payments, and settlements. Other travellers' transactions are private.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Spent / Expense Share */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>
              {isTripPlanner
                ? plannerFilter === 'all'
                  ? 'Total Expenses (All Travellers)'
                  : `Expenses (${plannerFilter})`
                : 'My Expense Share'}
            </span>
            <Receipt className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center">
            <IndianRupee className="w-5 h-5 text-sky-500 mr-1" />
            {totalSpent.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isTripPlanner
              ? `Trip Budget: ₹${trip.budgetINR.toLocaleString('en-IN')}`
              : `Your individual share across ${visibleExpenses.filter(e => !e.transactionType || e.transactionType === 'expense').length} expenses`}
          </div>
        </div>

        {/* Card 2: Payments Received for Planner / My Paid Contribution for Traveller */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>{isTripPlanner ? 'Payments Received (Inflow)' : 'My Paid Contribution'}</span>
            {isTripPlanner ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" /> : <HandCoins className="w-4 h-4 text-emerald-500" />}
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center">
            <IndianRupee className="w-5 h-5 mr-1" />
            {(isTripPlanner ? totalPaymentsReceived : myTotalContribution).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {isTripPlanner ? 'Traveler settlements & kitty added' : 'Expenses paid by you + settlements transferred'}
          </div>
        </div>

        {/* Card 3: Remaining Budget for Planner / Balance Status for Traveller */}
        {isTripPlanner ? (
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Remaining Budget</span>
              <CreditCard className="w-4 h-4 text-indigo-500" />
            </div>
            <div
              className={`text-2xl font-black flex items-center ${
                remainingBudget < 0
                  ? 'text-rose-500 dark:text-rose-400'
                  : 'text-indigo-600 dark:text-indigo-400'
              }`}
            >
              <IndianRupee className="w-5 h-5 mr-1" />
              {Math.abs(remainingBudget).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {remainingBudget >= 0 ? 'Within budget limit' : 'Budget limit exceeded'}
            </div>
          </div>
        ) : (
          (() => {
            const myKey = myCanonicalMember;
            const b = memberBalances[myKey] || { paid: myPaidExpenses, owes: myPaidExpenses, received: myPaymentsReceived };
            const net = b.paid - b.owes - b.received;
            return (
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                  <span>My Balance Status</span>
                  <HandCoins className="w-4 h-4 text-sky-500" />
                </div>
                <div
                  className={`text-2xl font-black flex items-center ${
                    net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <IndianRupee className="w-5 h-5 mr-1" />
                  {Math.abs(Math.round(net)).toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] font-bold mt-1">
                  <span className={net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                    {net >= 0 ? 'You will receive from group' : 'You owe to group / planner'}
                  </span>
                </div>
              </div>
            );
          })()
        )}

        {/* Active View Switcher */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Mode View</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveView('ledger')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeView === 'ledger'
                  ? 'bg-sky-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ledger</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('travellers')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeView === 'travellers'
                  ? 'bg-sky-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Traveller</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('charts')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                activeView === 'charts'
                  ? 'bg-sky-500 text-slate-950 shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChartIcon className="w-3.5 h-3.5" />
              <span>Visuals</span>
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DATA VISUALIZATION SECTION (RECHARTS PIE & BAR CHARTS)
      ========================================================================= */}
      {activeView === 'charts' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Category Pie Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-sky-500" />
                    <span>Expense Category Breakdown</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proportion of spending across stay, dining, transit, and passes
                  </p>
                </div>
                <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 rounded-xl border border-sky-200 dark:border-sky-800">
                  ₹{totalSpent.toLocaleString('en-IN')}
                </span>
              </div>

              {categoryChartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip content={<CustomPieTooltip />} />
                      <RechartsLegend
                        verticalAlign="bottom"
                        iconType="circle"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <PieChartIcon className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
                  <p>No category expenses recorded yet.</p>
                </div>
              )}
            </div>

            {/* 2. Daily Spending Bar Chart */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span>Daily Spending Timeline</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Day-by-day expenditure throughout your journey
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  {dailyChartData.length} active days
                </span>
              </div>

              {dailyChartData.length > 0 ? (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dailyChartData}
                      margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        dataKey="formattedDate"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        tickFormatter={(v) => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
                      />
                      <RechartsTooltip content={<CustomBarTooltip />} />
                      <Bar
                        dataKey="amount"
                        name="Spending (₹)"
                        fill="#0ea5e9"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[260px] flex flex-col items-center justify-center text-center text-slate-400 text-xs">
                  <BarChart3 className="w-10 h-10 mb-2 opacity-40 text-slate-400" />
                  <p>Log expenses to view your daily spending chart.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Traveler Balances & Fair-Share Breakdown */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <HandCoins className="w-4 h-4 text-sky-500" />
              <span>{isTripPlanner ? '👑 All Traveler Balances & Settlements' : '🧭 My Personal Balance & Fair-Share Summary'}</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isTripPlanner
                ? `Net balance and breakdown for all ${activeTravelers.length} members in this journey.`
                : 'Your individual expenditure, calculated fair-share, and net settlement status.'}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {isTripPlanner && (
              !showAddTraveler ? (
                <button
                  type="button"
                  onClick={() => setShowAddTraveler(true)}
                  className="w-full sm:w-auto justify-center flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 bg-sky-50 dark:bg-sky-950/40 px-3 py-2 sm:py-1.5 rounded-xl border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member to Split</span>
                </button>
              ) : (
                <form onSubmit={handleAddTraveler} className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                  <input
                    type="text"
                    value={newTravelerName}
                    onChange={(e) => setNewTravelerName(e.target.value)}
                    placeholder="Traveler name..."
                    className="flex-1 sm:w-36 px-2.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!newTravelerName.trim()}
                    className="px-3 py-1.5 text-xs font-bold bg-sky-500 text-slate-950 rounded-xl hover:bg-sky-400 disabled:opacity-40 cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddTraveler(false);
                      setNewTravelerName('');
                    }}
                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-400 cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(isTripPlanner
            ? activeTravelers.filter((member) => (plannerFilter === 'all' || member === plannerFilter))
            : [myCanonicalMember]
          ).map((member) => {
              const b = memberBalances[member] || { paid: myPaidExpenses, owes: myPaidExpenses, received: myPaymentsReceived };
              const net = b.paid - b.owes - b.received;
              const isExtra = extraTravelers.includes(member);
              return (
                <div
                  key={member}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-1.5 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{member}</span>
                      {isMyTravelerName(member) && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                          You
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                          net >= 0
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {net >= 0 ? `Gets ₹${Math.round(net)}` : `Owes ₹${Math.abs(Math.round(net))}`}
                      </span>
                      {isExtra && isTripPlanner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraTraveler(member)}
                          title="Remove member"
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-rose-500 transition-opacity"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between pt-1">
                    <span>Paid: ₹{Math.round(b.paid)}</span>
                    <span>Share: ₹{Math.round(b.owes)}</span>
                  </div>
                  {b.received > 0 && (
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 pt-0.5">
                      <ArrowDownLeft className="w-3 h-3" />
                      <span>Received: ₹{Math.round(b.received)}</span>
                    </div>
                  )}
                  {isTripPlanner && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHistoryTraveller(member);
                        setActiveView('travellers');
                      }}
                      className="w-full mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:text-sky-500 flex items-center justify-between group-hover:text-sky-500 cursor-pointer transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3" />
                        <span>View History ({getMemberTransactionCount(member)})</span>
                      </span>
                      <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* =========================================================================
          GROUP EXPENSES LEDGER (CHRONOLOGICAL)
      ========================================================================= */}
      {activeView === 'ledger' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header Bar with Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isTripPlanner ? "All Travellers' Expenses Ledger" : "My Expenses Ledger"}</span>
            <span className="text-xs font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {visibleExpenses.length} {visibleExpenses.length === 1 ? 'entry' : 'entries'}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isTripPlanner
              ? 'Complete list of all user expenses and payment settlements across all travellers.'
              : 'Displaying your personal expenses and payment receipts only.'}
          </p>
        </div>

        {isTripPlanner ? (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setEditingExpenseId(null);
                setDescription('');
                setAmountINR(0);
                setTransactionType('payment_received');
                setModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 shrink-0" />
              <span>Add Payment Received</span>
            </button>

            <button
              onClick={() => {
                setEditingExpenseId(null);
                setDescription('');
                setAmountINR(0);
                setTransactionType('expense');
                setModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Record Group Expense</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
            <Lock className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>Trip Planner manages group expenses & settlements</span>
          </div>
        )}
      </div>

      {/* Expenses & Payments List */}
      {visibleExpenses.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
          <Receipt className="w-12 h-12 text-sky-500/40 mx-auto mb-3" />
          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {isTripPlanner ? 'No entries found in group ledger' : 'No personal contributions or expenses found'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {isTripPlanner
              ? 'Keep track of hotel deposits, dining, entry tickets, and settlements between members.'
              : 'Transactions and expense contributions will appear here once recorded by the Trip Planner.'}
          </p>
          {isTripPlanner && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => {
                  setEditingExpenseId(null);
                  setDescription('');
                  setAmountINR(0);
                  setTransactionType('expense');
                  setModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-sky-500 text-slate-950 hover:bg-sky-400 transition-all cursor-pointer"
              >
                Record First Expense
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleExpenses.map((exp) => {
            const isPaymentReceived = exp.transactionType === 'payment_received';
            const isDeposit = exp.transactionType === 'deposit';
            const cat = categoryColors[exp.category] || categoryColors.other;

            const splitLabel = !isTripPlanner
  ? '👤 Your share'
  : exp.splitMode === 'single'
  ? `👤 1 User (${exp.splitTargetUser || 'Single'})`
  : exp.splitMode === 'custom' && exp.splitWithUsers
  ? `👫 ${exp.splitWithUsers.length} Users (${exp.splitWithUsers.join(', ')})`
  : `👥 All Users (${activeTravelers.length} traveler${activeTravelers.length === 1 ? '' : 's'})`;
            return (
              <div
                key={exp.id}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isPaymentReceived
                    ? 'border-emerald-500/30 hover:border-emerald-500/50'
                    : isDeposit
                    ? 'border-teal-500/30 hover:border-teal-500/50'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div
                    className={`p-2.5 rounded-xl border shrink-0 ${
                      isPaymentReceived
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : isDeposit
                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                        : cat.badge
                    }`}
                  >
                    {isPaymentReceived ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : isDeposit ? (
                      <HandCoins className="w-4 h-4" />
                    ) : (
                      <Receipt className="w-4 h-4" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {exp.description}
                      </h4>
                      {isPaymentReceived ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <span>PAYMENT RECEIVED</span>
                          {exp.paymentMethod && <span>({exp.paymentMethod})</span>}
                        </span>
                      ) : isDeposit ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/30">
                          ADDED MONEY
                        </span>
                      ) : (
                        <>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cat.badge}`}
                          >
                            {cat.label}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {splitLabel}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isPaymentReceived ? (
                        <>
                          Paid by <strong>{isMyTravelerName(exp.paidBy) ? 'You' : exp.paidBy}</strong> → Received by{' '}
                          <strong>{isMyTravelerName(exp.receivedBy || '') ? 'You' : (exp.receivedBy || currentUserName)}</strong> • {exp.date}
                        </>
                      ) : (
                        <>
                          Paid by <strong>{isMyTravelerName(exp.paidBy) ? 'You' : exp.paidBy}</strong> • {exp.date}
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <div
                      className={`text-base font-black flex items-center justify-end ${
                        isPaymentReceived || isDeposit
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      <IndianRupee className="w-4 h-4 mr-0.5" />
                      <span>
  {(isTripPlanner
    ? exp.amountINR
    : (!isPaymentReceived && !isDeposit
        ? getTravellerShare(exp)
        : exp.amountINR)
  ).toLocaleString('en-IN')}
</span>
                    </div>
                    {!isTripPlanner && !isPaymentReceived && !isDeposit && (
  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block">
    Your share
  </span>
)}
                    {isTripPlanner && !isPaymentReceived && !isDeposit && exp.splitMode === 'custom' && exp.splitWithUsers && (
                      <span className="text-[10px] text-slate-500">
                        ₹{Math.round(exp.amountINR / exp.splitWithUsers.length)} / person
                      </span>
                    )}
                    {isTripPlanner && !isPaymentReceived && !isDeposit && (!exp.splitMode || exp.splitMode === 'all') && (
                      <span className="text-[10px] text-slate-500">
                        ₹{Math.round(exp.amountINR / Math.max(1, activeTravelers.length))} / person
                      </span>
                    )}
                    {isPaymentReceived && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Settled via {exp.paymentMethod || 'UPI'}
                      </span>
                    )}
                  </div>

                  {(isTripCreator || isTripPlanner) && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleStartEditExpense(exp)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                        title="Edit transaction"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
        </div>
      )}

      {/* =========================================================================
          INDIVIDUAL TRAVELLER TRANSACTION HISTORY SECTION
      ========================================================================= */}
      {activeView === 'travellers' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <History className="w-4 h-4" />
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Individual Traveller Transaction History
                </h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-md">
                  {isTripPlanner ? 'Trip Planner Audit' : 'My Audit Trail'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isTripPlanner
                  ? 'Audit individual transaction logs, itemized split consumption, payments made, and settlement history for every traveller.'
                  : 'Review your complete personal transaction ledger, expenses covered, consumed shares, and payment receipts.'}
              </p>
            </div>

            {isTripPlanner && selectedHistoryTraveller !== 'all' && (
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleQuickRecordPayment(selectedHistoryTraveller)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 transition-all cursor-pointer"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>+ Record Payment</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickRecordExpense(selectedHistoryTraveller)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sm transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Record Bill</span>
                </button>
              </div>
            )}
          </div>

          {/* Traveller Selector Ribbon (for Trip Planner) */}
          {isTripPlanner && (
            <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-500" />
                  <span>Select Traveller ({activeTravelers.length})</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Switch traveller to view itemized breakdown
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedHistoryTraveller('all');
                    setTravellerTxnFilter('all');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                    selectedHistoryTraveller === 'all'
                      ? 'bg-sky-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All Travellers Overview</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                    selectedHistoryTraveller === 'all'
                      ? 'bg-slate-950/20 text-slate-950 font-black'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {activeTravelers.length}
                  </span>
                </button>

                {activeTravelers.map((member) => {
                  const b = memberBalances[member] || { paid: 0, owes: 0, received: 0 };
                  const net = b.paid - b.owes - b.received;
                  const isSelected = selectedHistoryTraveller === member;
                  const txnCount = getMemberTransactionCount(member);
                  const isMe = isMyTravelerName(member);

                  return (
                    <button
                      key={member}
                      type="button"
                      onClick={() => {
                        setSelectedHistoryTraveller(member);
                        setTravellerTxnFilter('all');
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer border ${
                        isSelected
                          ? 'bg-sky-500 text-slate-950 font-black border-sky-400 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <User className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{member}</span>
                      {isMe && (
                        <span className={`text-[9px] font-black uppercase px-1 py-0.2 rounded ${
                          isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
                        }`}>
                          You
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isSelected
                          ? 'bg-slate-950/15 text-slate-950'
                          : net >= 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}>
                        {net >= 0 ? `+₹${Math.round(net)}` : `-₹${Math.abs(Math.round(net))}`}
                      </span>
                      <span className={`text-[10px] font-mono px-1 py-0.2 rounded ${
                        isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                      }`}>
                        {txnCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW A: SPECIFIC TRAVELLER SELECTED (OR TRAVELLER VIEWING OWN AUDIT) */}
          {(selectedHistoryTraveller !== 'all' || !isTripPlanner) && (() => {
            const currentMember = !isTripPlanner ? myCanonicalMember : selectedHistoryTraveller;
            const b = memberBalances[currentMember] || { paid: 0, owes: 0, received: 0 };
            const net = b.paid - b.owes - b.received;
            const isMe = isMyTravelerName(currentMember);

            // Compute member specific transactions
            const memberTxns = expenses
              .map((exp) => ({
                exp,
                details: getMemberTransactionDetails(currentMember, exp)
              }))
              .filter((item) => item.details.isIncluded)
              .sort((a, b) => new Date(b.exp.date || 0).getTime() - new Date(a.exp.date || 0).getTime());

            // Summary counts
            const paidCount = memberTxns.filter((t) => t.details.role === 'paid').length;
            const shareCount = memberTxns.filter((t) => t.details.role === 'share').length;
            const settleCount = memberTxns.filter((t) => t.details.role === 'settlement_sent' || t.details.role === 'settlement_received').length;

            // Apply search & role filter
            const filteredTxns = memberTxns.filter(({ exp, details }) => {
              if (travellerTxnFilter === 'paid' && details.role !== 'paid') return false;
              if (travellerTxnFilter === 'share' && details.role !== 'share') return false;
              if (travellerTxnFilter === 'settlement' && (details.role !== 'settlement_sent' && details.role !== 'settlement_received')) return false;

              if (travellerTxnSearch.trim()) {
                const q = travellerTxnSearch.toLowerCase();
                const desc = (exp.description || '').toLowerCase();
                const cat = (exp.category || '').toLowerCase();
                const pMethod = (exp.paymentMethod || '').toLowerCase();
                const amt = String(exp.amountINR);
                return desc.includes(q) || cat.includes(q) || pMethod.includes(q) || amt.includes(q);
              }
              return true;
            });

            return (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Traveller Financial Profile Card */}
                <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                        {currentMember.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-900 dark:text-white">
                            {currentMember}
                          </h4>
                          {isMe && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400">
                              You
                            </span>
                          )}
                          {isPlannerIdentifier(currentMember) && (
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <Crown className="w-3 h-3 text-purple-500" />
                              <span>Planner</span>
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {memberTxns.length} total transaction {memberTxns.length === 1 ? 'event' : 'events'} recorded in this journey
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
                        net >= 0
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                      }`}>
                        {net >= 0 ? (
                          <>
                            <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                            <span>Gets ₹{Math.round(net).toLocaleString('en-IN')} from group</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                            <span>Owes ₹{Math.abs(Math.round(net)).toLocaleString('en-IN')} to group</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 Financial Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Paid Out-of-Pocket
                      </span>
                      <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                        ₹{Math.round(b.paid).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Bills & payments covered
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Fair Share Consumed
                      </span>
                      <div className="text-lg sm:text-xl font-black text-amber-600 dark:text-amber-400">
                        ₹{Math.round(b.owes).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Portion of shared bills
                      </span>
                    </div>

                    <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Settlements / Received
                      </span>
                      <div className="text-lg sm:text-xl font-black text-purple-600 dark:text-purple-400">
                        ₹{Math.round(b.received).toLocaleString('en-IN')}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Transfers credited
                      </span>
                    </div>

                    <div className={`p-3.5 sm:p-4 rounded-2xl border ${
                      net >= 0
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-rose-500/5 border-rose-500/20'
                    }`}>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                        Net Balance Position
                      </span>
                      <div className={`text-lg sm:text-xl font-black ${
                        net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {net >= 0 ? `+₹${Math.round(net).toLocaleString('en-IN')}` : `-₹${Math.abs(Math.round(net)).toLocaleString('en-IN')}`}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {net >= 0 ? 'In credit / gets refunded' : 'To settle with planner'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={travellerTxnSearch}
                      onChange={(e) => setTravellerTxnSearch(e.target.value)}
                      placeholder={`Search ${currentMember}'s transactions (e.g. dinner, fuel, UPI)...`}
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
                    />
                    {travellerTxnSearch && (
                      <button
                        type="button"
                        onClick={() => setTravellerTxnSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setTravellerTxnFilter('all')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        travellerTxnFilter === 'all'
                          ? 'bg-sky-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      All ({memberTxns.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravellerTxnFilter('paid')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        travellerTxnFilter === 'paid'
                          ? 'bg-emerald-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Paid Bills ({paidCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravellerTxnFilter('share')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        travellerTxnFilter === 'share'
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Consumed Share ({shareCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravellerTxnFilter('settlement')}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                        travellerTxnFilter === 'settlement'
                          ? 'bg-purple-500 text-slate-950 font-black'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Settlements ({settleCount})
                    </button>
                  </div>
                </div>

                {/* Itemized Chronological Transaction List */}
                {filteredTxns.length > 0 ? (
                  <div className="space-y-3">
                    {filteredTxns.map(({ exp, details }) => {
                      const catInfo = categoryColors[exp.category as ExpenseCategory] || categoryColors.other;
                      const formattedDate = exp.date
                        ? new Date(exp.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })
                        : 'No date';

                      return (
                        <div
                          key={exp.id}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
                                style={{
                                  backgroundColor: `${catInfo.color}18`,
                                  color: catInfo.color
                                }}
                              >
                                {exp.category === 'stay' && <Calendar className="w-5 h-5" />}
                                {exp.category === 'food' && <Receipt className="w-5 h-5" />}
                                {exp.category === 'travel' && <IndianRupee className="w-5 h-5" />}
                                {exp.category === 'tickets' && <CreditCard className="w-5 h-5" />}
                                {exp.category === 'shopping' && <PieChartIcon className="w-5 h-5" />}
                                {exp.category === 'other' && <Layers className="w-5 h-5" />}
                              </div>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h5 className="text-sm font-black text-slate-900 dark:text-white">
                                    {exp.description}
                                  </h5>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${details.roleBadgeClass}`}>
                                    {details.roleLabel}
                                  </span>
                                  {exp.paymentMethod && (
                                    <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                                      {exp.paymentMethod}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  <span>{formattedDate}</span>
                                  <span>•</span>
                                  <span>{catInfo.label}</span>
                                  <span>•</span>
                                  <span>{details.descriptionNote}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center sm:items-end justify-between sm:justify-start gap-4 shrink-0 sm:flex-col">
                              <div className="text-right">
                                <div className="text-sm sm:text-base font-black">
                                  {details.netImpact > 0 ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      +₹{details.netImpact.toLocaleString('en-IN')}
                                    </span>
                                  ) : details.netImpact < 0 ? (
                                    <span className="text-rose-600 dark:text-rose-400">
                                      -₹{Math.abs(details.netImpact).toLocaleString('en-IN')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-500">₹0</span>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-400 block">
                                  Total: ₹{exp.amountINR.toLocaleString('en-IN')}
                                </span>
                              </div>

                              {isTripPlanner && (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditExpense(exp)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                                    title="Edit record"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => onDeleteExpense(exp.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Split Details Breakdown Sub-bar */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2 bg-slate-50/50 dark:bg-slate-950/30 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
                            <div className="flex items-center gap-1.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>
                                {exp.splitMode === 'single'
                                  ? `Single Member: ${exp.splitTargetUser || 'Specific traveller'}`
                                  : exp.splitMode === 'custom'
                                  ? `Custom Split (${exp.splitWithUsers?.length || 0} members: ${exp.splitWithUsers?.join(', ') || ''})`
                                  : `Split equally across all ${activeTravelers.length} group members`}
                              </span>
                            </div>
                            <div>
                              <span>Paid by: <strong className="text-slate-700 dark:text-slate-200">{exp.paidBy || 'Member'}</strong></span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 p-10 text-center space-y-3">
                    <History className="w-8 h-8 text-slate-400 mx-auto opacity-40" />
                    <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      No transactions found for this filter
                    </h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {travellerTxnSearch
                        ? `No transactions matching "${travellerTxnSearch}". Try clearing your search.`
                        : `No transactions recorded under this category for ${currentMember}.`}
                    </p>
                    {travellerTxnSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setTravellerTxnSearch('');
                          setTravellerTxnFilter('all');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                      >
                        Reset Search Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* VIEW B: ALL TRAVELLERS OVERVIEW */}
          {selectedHistoryTraveller === 'all' && isTripPlanner && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-500" />
                  <span>All Travellers Individual Ledgers ({activeTravelers.length})</span>
                </h4>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Select any traveller card to inspect their complete transaction trail
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeTravelers.map((member) => {
                  const b = memberBalances[member] || { paid: 0, owes: 0, received: 0 };
                  const net = b.paid - b.owes - b.received;
                  const isMe = isMyTravelerName(member);
                  const memberTxns = expenses
                    .map((exp) => ({
                      exp,
                      details: getMemberTransactionDetails(member, exp)
                    }))
                    .filter((item) => item.details.isIncluded)
                    .sort((a, b) => new Date(b.exp.date || 0).getTime() - new Date(a.exp.date || 0).getTime());

                  const recentTxns = memberTxns.slice(0, 3);

                  return (
                    <div
                      key={member}
                      className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        {/* Member Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-xs">
                              {member.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-900 dark:text-white text-sm">
                                  {member}
                                </span>
                                {isMe && (
                                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    You
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">
                                {memberTxns.length} total transactions
                              </span>
                            </div>
                          </div>

                          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                            net >= 0
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          }`}>
                            {net >= 0 ? `Gets ₹${Math.round(net).toLocaleString('en-IN')}` : `Owes ₹${Math.abs(Math.round(net)).toLocaleString('en-IN')}`}
                          </span>
                        </div>

                        {/* Financial Mini Stats */}
                        <div className="grid grid-cols-3 gap-2 text-center py-1 bg-slate-50 dark:bg-slate-950/50 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Paid</span>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                              ₹{Math.round(b.paid).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Share</span>
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                              ₹{Math.round(b.owes).toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block">Received</span>
                            <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                              ₹{Math.round(b.received).toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        {/* Recent Transactions Snippet */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                            Recent Activity
                          </span>
                          {recentTxns.length > 0 ? (
                            recentTxns.map(({ exp, details }) => (
                              <div
                                key={exp.id}
                                className="flex items-center justify-between p-2 rounded-xl bg-slate-50/60 dark:bg-slate-950/30 text-xs border border-slate-100 dark:border-slate-800/60"
                              >
                                <div className="truncate mr-2">
                                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                                    {exp.description}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {details.roleLabel}
                                  </span>
                                </div>
                                <span className={`font-black shrink-0 ${
                                  details.netImpact > 0
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : details.netImpact < 0
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-slate-400'
                                }`}>
                                  {details.netImpact > 0 ? `+₹${details.netImpact}` : details.netImpact < 0 ? `-₹${Math.abs(details.netImpact)}` : '₹0'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="text-xs text-slate-400 italic p-2 text-center">
                              No transactions recorded yet
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card Footer Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedHistoryTraveller(member);
                          setTravellerTxnFilter('all');
                        }}
                        className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
                      >
                        <History className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        <span>Inspect {member}'s Complete History ({memberTxns.length})</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add / Propose Modal - Only accessible to Trip Planner */}
      {modalOpen && isTripPlanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            {/* Transaction Type Selector */}
            <div className="grid grid-cols-2 rounded-2xl bg-slate-100 dark:bg-slate-950 p-1.5 mb-4 border border-slate-200 dark:border-slate-800 gap-1.5">
              <button
                type="button"
                onClick={() => setTransactionType('expense')}
                className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  transactionType === 'expense'
                    ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Record Expense</span>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('payment_received')}
                className={`py-2 px-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center ${
                  transactionType === 'payment_received'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Payment Received</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-black mb-1 flex items-center gap-2">
              {transactionType === 'expense' ? (
                <>
                  <Plus className="w-5 h-5 text-sky-500" />
                  <span>{isTripPlanner ? 'Record Group Expense' : 'Record My Expense'}</span>
                </>
              ) : (
                <>
                  <ArrowDownLeft className="w-5 h-5 text-emerald-500" />
                  <span>Record Payment Received / Added Money</span>
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {transactionType === 'expense'
                ? isTripPlanner
                  ? 'Record a trip expense with equal split, single user, or select travelers.'
                  : 'Record an expense paid by you for this journey.'
                : 'Log money received by a traveler from another member (e.g. UPI transfer, cash settlement).'}
            </p>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {transactionType === 'expense' ? 'Description / Item *' : 'Payment Details / Note *'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    transactionType === 'expense'
                      ? 'e.g. Dinner at 1135 AD, Amber Fort Guides, Highway Toll'
                      : 'e.g. Rohan paid Aarav for hotel bill via UPI'
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Amount (₹ INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={10000000}
                      value={amountINR || ''}
                      onChange={(e) => setAmountINR(Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {transactionType === 'expense' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="stay">Hotel & Stay</option>
                      <option value="food">Dining & Cafes</option>
                      <option value="travel">Transit & Fuel</option>
                      <option value="tickets">Entry & Passes</option>
                      <option value="shopping">Bazaar & Gifts</option>
                      <option value="other">Miscellaneous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Paid By
                    </label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      {activeTravelers.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Paid By (Sender)
                    </label>
                    <select
                      value={paidBy}
                      onChange={(e) => setPaidBy(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      {activeTravelers.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Received By
                    </label>
                    <select
                      value={receivedBy}
                      onChange={(e) => setReceivedBy(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      {activeTravelers.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      Method
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100 cursor-pointer"
                    >
                      <option value="UPI">UPI (GPay / PhonePe)</option>
                      <option value="Cash">Cash Handover</option>
                      <option value="Bank Transfer">Bank Transfer (IMPS)</option>
                      <option value="Card">Card</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Multi-mode Split Options (for Expenses only) */}
              {transactionType === 'expense' && (
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-900 dark:text-slate-100">
                      Who is this expense for?
                    </label>
                    <span className="text-[11px] font-black text-sky-600 dark:text-sky-400">
                      {splitMode === 'all' && `Divided across all ${activeTravelers.length} members`}
                      {splitMode === 'single' && 'Allocated to 1 user'}
                      {splitMode === 'custom' && `Divided across ${customSelectedUsers.length} members`}
                    </span>
                  </div>

                  {/* Split mode selection buttons */}
                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    <button
                      type="button"
                      onClick={() => setSplitMode('all')}
                      className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        splitMode === 'all'
                          ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-xs font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] sm:text-xs truncate">All Users</div>
                      <div className="text-[9px] sm:text-[10px] opacity-80 font-normal truncate">
                        {activeTravelers.length} {activeTravelers.length === 1 ? 'person' : 'people'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode('single')}
                      className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        splitMode === 'single'
                          ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-xs font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] sm:text-xs truncate">1 User</div>
                      <div className="text-[9px] sm:text-[10px] opacity-80 font-normal truncate">Single person</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSplitMode('custom')}
                      className={`p-2 sm:p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                        splitMode === 'custom'
                          ? 'bg-sky-500 text-slate-950 border-sky-500 shadow-xs font-black'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-[11px] sm:text-xs truncate">Custom 2+</div>
                      <div className="text-[9px] sm:text-[10px] opacity-80 font-normal truncate">Select users</div>
                    </button>
                  </div>

                  {/* Sub-selector 1: When Single User */}
                  {splitMode === 'single' && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Select Person Who Owes This Bill:
                      </label>
                      <select
                        value={singleTargetUser}
                        onChange={(e) => setSingleTargetUser(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
                      >
                        {activeTravelers.map((t) => (
                          <option key={t} value={t}>
                            {t} (100% of ₹{amountINR || 0})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sub-selector 2: When Custom 2 or More Users */}
                  {splitMode === 'custom' && (
                    <div className="pt-1 space-y-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Select Which Members Share This Bill ({customSelectedUsers.length} selected):
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {activeTravelers.map((t) => {
                          const checked = customSelectedUsers.includes(t);
                          return (
                            <div
                              key={t}
                              onClick={() => toggleCustomUser(t)}
                              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                                checked
                                  ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 text-sky-900 dark:text-sky-200'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
                              }`}
                            >
                              {checked ? (
                                <CheckSquare className="w-4 h-4 text-sky-500 shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span className="truncate">{t}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Live Split Preview Box */}
                  {amountINR > 0 && (
                    <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300 font-medium">
                      <span>
                        {splitMode === 'all' && `Divided across all ${activeTravelers.length} travelers:`}
                        {splitMode === 'single' && `Exclusively allocated to ${singleTargetUser}:`}
                        {splitMode === 'custom' && `Divided between ${customSelectedUsers.length} selected members:`}
                      </span>
                      <span className="font-black text-sky-600 dark:text-sky-400">
                        ₹{calculatePerPersonPreview().toLocaleString('en-IN')} / person
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-md shadow-sky-500/20 cursor-pointer text-center"
                >
                  {submitting
                    ? 'Saving...'
                    : editingExpenseId
                    ? 'Save Changes'
                    : transactionType === 'expense'
                    ? isTripPlanner
                      ? 'Record Group Expense'
                      : 'Record My Expense'
                    : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExpensesTab;
