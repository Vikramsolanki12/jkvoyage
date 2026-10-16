import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CreditCard,
  Briefcase,
  CheckSquare,
  MessageSquare,
  Wrench,
  Plus,
  Compass,
  Sparkles,
  Database,
  ShieldCheck,
  Crown,
  Lock,
  BookOpen,
  Users,
  Bell,
  X,
  LogIn,
  MapPin,
  UserCheck,
  Trash2,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { TripHero } from './components/TripHero.tsx';
import { ItineraryTab } from './components/ItineraryTab.tsx';
import { ExploreTab } from './components/ExploreTab.tsx';
import { ExpensesTab } from './components/ExpensesTab.tsx';
import { WalletTab } from './components/WalletTab.tsx';
import { PackingTab } from './components/PackingTab.tsx';
import { JournalTab } from './components/JournalTab.tsx';
import { ChatTab } from './components/ChatTab.tsx';
import { TravelToolsTab } from './components/TravelToolsTab.tsx';
import { NewTripModal } from './components/NewTripModal.tsx';
import { SuggestionsExplorerModal } from './components/modals/SuggestionsExplorerModal.tsx';
import { TripApprovalsModal } from './components/modals/TripApprovalsModal.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { LandingPage } from './components/LandingPage.tsx';
import { RazorpayModal } from './components/RazorpayModal.tsx';
import { ProFeatureGate } from './components/ProFeatureGate.tsx';
import { ProfileModal } from './components/ProfileModal.tsx';
import {
  Trip,
  Activity,
  ActivityCategory,
  Expense,
  DigitalDocument,
  PackingItem,
  ChatMessage,
  TripStatus,
  TripChangeRequest,
  TripNotification,
  NotificationType
} from './types/travel.ts';
import {
  subscribeUserTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  removeTravellerFromTrip,
  subscribeActivities,
  addActivity,
  deleteActivity,
  subscribeExpenses,
  addExpense,
  deleteExpense,
  subscribeDocuments,
  addDocument,
  deleteDocument,
  subscribePackingItems,
  togglePackingItem,
  addPackingItem,
  deletePackingItem,
  subscribeMessages,
  sendChatMessage,
  subscribeChangeRequests,
  submitChangeRequest,
  updateChangeRequestStatus,
  subscribeTripNotifications,
  generateTripNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from './services/travelService.ts';

type ActiveTab = 'itinerary' | 'explore' | 'expenses' | 'wallet' | 'packing' | 'journal' | 'chat' | 'tools';

// Sample fallback trip ONLY for guest exploration before user logs in or registers
const GUEST_SAMPLE_TRIP: Trip = {
  id: 'guest_rajasthan_trip',
  ownerId: 'guest_user',
  ownerName: 'Guest Explorer',
  title: 'Rajasthan Royal Heritage & Desert Safari',
  destination: 'Jaipur, Jodhpur & Udaipur, India',
  startDate: '2026-11-10',
  endDate: '2026-11-17',
  budgetINR: 85000,
  status: 'planning',
  coverImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  notes: '7-day heritage expedition exploring Amber Palace, desert camel tents, and Lake Pichola.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const GUEST_ACTIVITIES: Activity[] = [
  {
    id: 'g_act_1',
    tripId: 'guest_rajasthan_trip',
    day: 1,
    time: '09:30',
    title: 'Arrival at Jaipur & Amber Palace Exploration',
    category: 'sightseeing',
    location: 'Amber Fort, Jaipur',
    costINR: 2400,
    notes: 'Tour Sheesh Mahal mirror palace with royal audio guide',
    createdBy: 'guest',
    createdAt: new Date().toISOString()
  },
  {
    id: 'g_act_2',
    tripId: 'guest_rajasthan_trip',
    day: 1,
    time: '13:30',
    title: 'Authentic Rajasthani Thali Feast',
    category: 'food',
    location: 'LMB Restaurant, Johari Bazaar',
    costINR: 1800,
    notes: 'Dal Baati Churma and Ker Sangri',
    createdBy: 'guest',
    createdAt: new Date().toISOString()
  },
  {
    id: 'g_act_3',
    tripId: 'guest_rajasthan_trip',
    day: 2,
    time: '10:00',
    title: 'Hawa Mahal Palace & City Palace Royal Museum',
    category: 'sightseeing',
    location: 'Badi Choupad, Jaipur',
    costINR: 1200,
    notes: 'Photography permits and royal textiles collection',
    createdBy: 'guest',
    createdAt: new Date().toISOString()
  }
];

const GUEST_EXPENSES: Expense[] = [
  {
    id: 'g_exp_1',
    tripId: 'guest_rajasthan_trip',
    description: 'Heritage Haveli Hotel Deposit (3 Nights Jaipur)',
    amountINR: 18500,
    paidBy: 'Aarav Sharma',
    paidByUid: 'guest_1',
    category: 'stay',
    date: '2026-11-10',
    createdBy: 'guest',
    createdAt: new Date().toISOString(),
    splitMode: 'all'
  },
  {
    id: 'g_exp_2',
    tripId: 'guest_rajasthan_trip',
    description: 'LMB Royal Thali & Sweets for Group',
    amountINR: 3200,
    paidBy: 'Rohan Verma',
    paidByUid: 'guest_2',
    category: 'food',
    date: '2026-11-10',
    createdBy: 'guest',
    createdAt: new Date().toISOString(),
    splitMode: 'all'
  }
];

const GUEST_DOCS: DigitalDocument[] = [
  {
    id: 'g_doc_1',
    tripId: 'guest_rajasthan_trip',
    title: 'IndiGo Flight 6E-204 Boarding Pass',
    docType: 'ticket',
    docNumber: 'PNR-JK892F',
    expiryDate: '2026-11-18',
    notes: 'Terminal 2 Delhi to Jaipur. Seat 12F (Window)',
    ownerId: 'guest',
    createdAt: new Date().toISOString()
  }
];

const GUEST_PACKING: PackingItem[] = [
  { id: 'g_pk_1', tripId: 'guest_rajasthan_trip', item: 'Aadhaar Card / Government ID & Passport', category: 'documents', packed: true, createdBy: 'guest' },
  { id: 'g_pk_2', tripId: 'guest_rajasthan_trip', item: 'Light Cotton Kurtas & Scarf for Desert Sun', category: 'clothing', packed: true, createdBy: 'guest' },
  { id: 'g_pk_3', tripId: 'guest_rajasthan_trip', item: '20,000mAh Powerbank & Multi-Charger', category: 'electronics', packed: false, createdBy: 'guest' },
  { id: 'g_pk_4', tripId: 'guest_rajasthan_trip', item: 'UV Polarized Sunglasses & SPF 50+ Sunscreen', category: 'essentials', packed: false, createdBy: 'guest' },
  { id: 'g_pk_5', tripId: 'guest_rajasthan_trip', item: 'Electrolyte Sachets & Travel First Aid Kit', category: 'meds', packed: false, createdBy: 'guest' }
];

const GUEST_MESSAGES: ChatMessage[] = [
  {
    id: 'g_msg_1',
    tripId: 'guest_rajasthan_trip',
    senderId: 'guest_system',
    senderName: 'JKVoyage Concierge',
    text: 'Welcome to JKVoyage! Group chat, split balances, and live notifications are enabled for this journey.',
    createdAt: new Date().toISOString()
  }
];

const GUEST_CHANGE_REQUESTS: TripChangeRequest[] = [
  {
    id: 'g_cr_1',
    tripId: 'guest_rajasthan_trip',
    type: 'activity',
    title: 'Nahargarh Sunset Cycling Expedition',
    description: 'Guided morning or sunset cycling along the Aravali hills ramparts.',
    data: {
      id: 'prop_act_1',
      tripId: 'guest_rajasthan_trip',
      day: 3,
      time: '16:45',
      title: 'Nahargarh Fort Sunset Cycling',
      category: 'activity',
      location: 'Nahargarh Fort Road, Jaipur',
      costINR: 1500,
      notes: 'Bicycle rentals with helmet and safety escort',
      createdBy: 'rohan',
      createdAt: new Date().toISOString()
    },
    requestedByUid: 'guest_rohan',
    requestedByName: 'Rohan Verma',
    requestedAt: new Date().toISOString(),
    status: 'pending'
  }
];

function MainContent() {
  const { currentUser, userProfile, loading: authLoading, getSavedAccounts, loginWithEmail } = useAuth();

  // Subscription Enforcement feature state
  const [subscriptionEnforced, setSubscriptionEnforced] = useState<boolean>(false);

  const handleToggleSubscriptionEnforced = (enforced: boolean) => {
    setSubscriptionEnforced(enforced);
    localStorage.setItem('jkvoyage_subscription_enforced', String(enforced));
  };

  const isPro = true;

  // View state: if false and not logged in, show Landing Page / Welcome Portal
  const [exploringDemo, setExploringDemo] = useState(false);

  // Firestore Trips state - Empty by default, populated ONLY with user's genuine trips upon login
  const [trips, setTrips] = useState<Trip[]>([]);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [tripsLoading, setTripsLoading] = useState(true);

  // Subcollections for active trip
  const [activities, setActivities] = useState<Activity[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [documents, setDocuments] = useState<DigitalDocument[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [changeRequests, setChangeRequests] = useState<TripChangeRequest[]>([]);
  const [notifications, setNotifications] = useState<TripNotification[]>([]);

  // Toast alert state
  const [toastMessage, setToastMessage] = useState<{ title: string; message: string; type: NotificationType } | null>(null);

  // Exact rule: A user created trip is always Trip Planner. Others are Travellers.
  const isTripPlanner = Boolean(
    currentUser &&
      activeTrip &&
      (activeTrip.ownerId === currentUser.uid ||
        (activeTrip.ownerEmail &&
          currentUser.email &&
          activeTrip.ownerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
        (Array.isArray(activeTrip.collaborators) &&
          activeTrip.collaborators.some(
            (c) =>
              c.role === 'planner' &&
              ((currentUser.email && c.email?.trim().toLowerCase() === currentUser.email.trim().toLowerCase()) ||
                (currentUser.uid && c.uid === currentUser.uid))
          )))
  );
  // Direct alias for tab permission compatibility
  const isTripCreator = isTripPlanner;
  const pendingRequests = changeRequests.filter((r) => r.status === 'pending');

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('itinerary');

  // Modals state
  const [newTripModalOpen, setNewTripModalOpen] = useState(false);
  const [suggestionsModalOpen, setSuggestionsModalOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [razorpayModalOpen, setRazorpayModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [deleteTripModalOpen, setDeleteTripModalOpen] = useState(false);
  const [isDeletingTrip, setIsDeletingTrip] = useState(false);
  const [lockedReason, setLockedReason] = useState<string>('');

  const triggerToast = (title: string, message: string, type: NotificationType = 'general') => {
    setToastMessage({ title, message, type });
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleQuickSignIn = async (acc: { email: string; displayName: string; password?: string }) => {
    try {
      setTripsLoading(true);
      await loginWithEmail(acc.email, acc.password || 'password123');
      triggerToast('Signed In', `Welcome back, ${acc.displayName}! Loading your travel workspace...`, 'general');
    } catch (err: any) {
      triggerToast('Login Failed', err.message || 'Please sign in with password.', 'general');
      handleOpenAuth('login');
    }
  };

  // Subscribe to user trips when authenticated
  // CRITICAL REQUIREMENT: Do NOT show demo trips after login or register.
  // ONLY show trips which were created by the user or where the user is a member/collaborator.
  useEffect(() => {
    if (authLoading) return;

    if (currentUser) {
      setTripsLoading(true);
      // Immediately reset any guest demo data from state
      setActivities([]);
      setExpenses([]);
      setDocuments([]);
      setPackingItems([]);
      setMessages([]);
      setChangeRequests([]);
      setNotifications([]);

      const safetyTimer = setTimeout(() => {
        setTripsLoading(false);
      }, 900);

      const unsub = subscribeUserTrips(
        currentUser.uid,
        currentUser.email || undefined,
        userProfile?.displayName || currentUser.displayName || undefined,
        (fetchedTrips) => {
          clearTimeout(safetyTimer);
          // Strictly verify: only trips belonging to this user or where they are a member
          const validTrips = fetchedTrips.filter(
            (t) =>
              t.id !== 'guest_rajasthan_trip' &&
              t.ownerId !== 'guest_user' &&
              !t.id.startsWith('guest_')
          );

          setTrips(validTrips);
          setTripsLoading(false);

          setActiveTrip((prev) => {
            if (!prev || prev.id === 'guest_rajasthan_trip') {
              return validTrips[0] || null;
            }
            const stillExists = validTrips.find((t) => t.id === prev.id);
            return stillExists || validTrips[0] || null;
          });

          // If no trips exist for this user, ensure subcollections are clean
          if (validTrips.length === 0) {
            setActivities([]);
            setExpenses([]);
            setDocuments([]);
            setPackingItems([]);
            setMessages([]);
            setChangeRequests([]);
            setNotifications([]);
          }
        },
        (err) => {
          clearTimeout(safetyTimer);
          console.warn('Trips fetch warning:', err);
          setTripsLoading(false);
        }
      );
      return () => {
        clearTimeout(safetyTimer);
        unsub();
      };
    } else {
      // User is not logged in: only show sample trip if explicitly in demo preview mode
      if (exploringDemo) {
        setTrips([GUEST_SAMPLE_TRIP]);
        setActiveTrip(GUEST_SAMPLE_TRIP);
        setActivities(GUEST_ACTIVITIES);
        setExpenses(GUEST_EXPENSES);
        setDocuments(GUEST_DOCS);
        setPackingItems(GUEST_PACKING);
        setMessages(GUEST_MESSAGES);
        setChangeRequests(GUEST_CHANGE_REQUESTS);
      } else {
        setTrips([]);
        setActiveTrip(null);
      }
      setTripsLoading(false);
    }
  }, [currentUser, authLoading, exploringDemo]);

  // Subscribe to subcollections when activeTrip changes and currentUser exists
  useEffect(() => {
    if (!currentUser || !activeTrip) return;

    // Do NOT subscribe to subcollections for guest sample trip when logged in
    if (activeTrip.id === 'guest_rajasthan_trip') return;

    const unsubs = [
      subscribeActivities(activeTrip.id, setActivities),
      subscribeExpenses(activeTrip.id, setExpenses),
      subscribeDocuments(activeTrip.id, setDocuments),
      subscribePackingItems(activeTrip.id, setPackingItems),
      subscribeMessages(activeTrip.id, setMessages),
      subscribeChangeRequests(activeTrip.id, setChangeRequests),
      subscribeTripNotifications(activeTrip.id, setNotifications)
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [currentUser, activeTrip?.id]);

  const handleOpenUpgrade = (msg?: string) => {
    setLockedReason(msg || 'Upgrade with Razorpay to unlock all pro features!');
    setRazorpayModalOpen(true);
  };

  // Handlers for Firestore Mutations
  const handleCreateTrip = async (newTrip: Trip) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    // CRITICAL: Immediately update state so the newly created trip shows up in UI without delay
    setTrips((prev) => [newTrip, ...prev.filter((t) => t.id !== newTrip.id)]);
    setActiveTrip(newTrip);

    try {
      await createTrip(newTrip);
      triggerToast('New Trip Created', `"${newTrip.title}" is ready. You are the Trip Planner!`, 'general');
    } catch (err) {
      console.warn('Trip created locally (Firestore warning):', err);
      triggerToast('New Trip Created', `"${newTrip.title}" is ready. You are the Trip Planner!`, 'general');
    }
  };

  const handleUpdateTripDetails = async (updates: Partial<Trip>) => {
    if (!activeTrip) return;
    if (currentUser) {
      await updateTrip(activeTrip.id, updates);
      setActiveTrip({ ...activeTrip, ...updates });
      triggerToast('Trip Updated', `Changes saved for "${activeTrip.title}".`, 'general');
    } else {
      setActiveTrip({ ...activeTrip, ...updates });
    }
  };

  const handleOpenDeleteTripModal = () => {
    if (!activeTrip) return;
    if (!isTripPlanner) {
      triggerToast('Permission Denied', 'Only the Trip Planner can delete this journey.', 'general');
      return;
    }
    setDeleteTripModalOpen(true);
  };

  const handleConfirmDeleteTrip = async () => {
    if (!activeTrip || !isTripPlanner) return;
    setIsDeletingTrip(true);
    try {
      const tripTitle = activeTrip.title;
      const tripId = activeTrip.id;

      await deleteTrip(tripId);

      const remaining = trips.filter((t) => t.id !== tripId);
      setTrips(remaining);
      setActiveTrip(remaining[0] || null);

      if (remaining.length === 0) {
        setActivities([]);
        setExpenses([]);
        setDocuments([]);
        setPackingItems([]);
        setMessages([]);
        setChangeRequests([]);
        setNotifications([]);
      }

      setDeleteTripModalOpen(false);
      triggerToast('Trip Deleted', `"${tripTitle}" was permanently deleted.`, 'general');
    } catch (err: any) {
      console.error('Delete trip error:', err);
      triggerToast('Error Deleting Trip', err.message || 'Could not delete trip.', 'general');
    } finally {
      setIsDeletingTrip(false);
    }
  };

  const handleRemoveTraveller = async (emailOrUid: string) => {
    if (!activeTrip || !isTripPlanner) return;
    try {
      const updated = await removeTravellerFromTrip(activeTrip.id, emailOrUid);
      setActiveTrip(updated);
      setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      triggerToast('Traveller Removed', 'The traveller was removed from this journey.', 'general');
    } catch (err: any) {
      triggerToast('Removal Failed', err.message || 'Could not remove traveller.', 'general');
    }
  };

  // Activity handlers
  const handleAddActivity = async (act: Activity) => {
    if (!activeTrip) return;
    // Optimistically update local state immediately so UI updates with zero delay
    setActivities((prev) => [...prev.filter((a) => a.id !== act.id), act]);

    if (isTripCreator) {
      triggerToast('Activity Added', `"${act.title}" added to Day ${act.day}.`, 'itinerary');
      if (currentUser) {
        try {
          await addActivity(activeTrip.id, act, activeTrip.title);
        } catch (err) {
          console.warn('Backend sync warning for activity:', err);
        }
      }
    } else {
      // Collaborator proposing activity -> requires trip planner approval
      const req: TripChangeRequest = {
        id: 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        tripId: activeTrip.id,
        type: 'activity',
        title: `Itinerary: ${act.title} (Day ${act.day})`,
        description: `Time: ${act.time} • Location: ${act.location} • Category: ${act.category}${act.costINR > 0 ? ` • Cost: ₹${act.costINR}` : ''}`,
        data: act,
        requestedByUid: currentUser?.uid || 'collaborator',
        requestedByName: userProfile?.displayName || currentUser?.displayName || 'Traveler Member',
        requestedAt: new Date().toISOString(),
        status: 'pending'
      };
      setChangeRequests((prev) => [req, ...prev.filter((r) => r.id !== req.id)]);
      triggerToast('Proposal Submitted', `Activity proposal submitted for planner confirmation.`, 'approval');
      if (currentUser) {
        try {
          await submitChangeRequest(activeTrip.id, req, activeTrip.title);
        } catch (err) {
          console.warn('Backend sync warning for proposal:', err);
        }
      }
    }
  };

  const handleAddExploreActivity = async (item: {
    day: number;
    time: string;
    title: string;
    category: ActivityCategory;
    location: string;
    costINR: number;
    notes?: string;
  }) => {
    if (!activeTrip) return;
    const newAct: Activity = {
      id: 'act_' + Date.now(),
      tripId: activeTrip.id,
      day: item.day,
      time: item.time,
      title: item.title,
      category: item.category,
      location: item.location,
      costINR: item.costINR,
      notes: item.notes,
      createdBy: currentUser?.uid || 'guest',
      createdAt: new Date().toISOString()
    };
    await handleAddActivity(newAct);
  };

  const handleDeleteActivity = async (actId: string) => {
    if (!activeTrip) return;
    setActivities((prev) => prev.filter((a) => a.id !== actId));
    if (currentUser) {
      try {
        await deleteActivity(activeTrip.id, actId);
      } catch (err) {
        console.warn('Backend delete error:', err);
      }
    }
  };

  // Expense handlers
  const handleAddExpense = async (exp: Expense) => {
    if (!activeTrip) return;
    // Optimistically update local state immediately so expense displays with zero delay
    setExpenses((prev) => [exp, ...prev.filter((e) => e.id !== exp.id)]);

    try {
      await addExpense(activeTrip.id, exp, activeTrip.title);
    } catch (err) {
      console.warn('Backend sync warning for expense:', err);
    }

    if (isTripCreator) {
      triggerToast('Expense Recorded', `₹${exp.amountINR.toLocaleString('en-IN')} logged by ${exp.paidBy}.`, 'expense');
    } else {
      triggerToast('Expense Recorded', `₹${exp.amountINR.toLocaleString('en-IN')} recorded in your ledger.`, 'expense');
    }
  };

  const handleDeleteExpense = async (expId: string) => {
    if (!activeTrip) return;
    setExpenses((prev) => prev.filter((e) => e.id !== expId));
    if (currentUser) {
      try {
        await deleteExpense(activeTrip.id, expId);
      } catch (err) {
        console.warn('Backend delete error:', err);
      }
    }
  };

  // Document / Ticket handlers
  const handleAddDocument = async (docItem: DigitalDocument) => {
    if (!activeTrip) return;
    // Optimistically update documents immediately
    setDocuments((prev) => [docItem, ...prev.filter((d) => d.id !== docItem.id)]);

    if (currentUser) {
      try {
        await addDocument(activeTrip.id, docItem, activeTrip.title);
      } catch (err) {
        console.warn('Backend sync warning for document:', err);
      }
    }

    if (isTripCreator) {
      triggerToast('Document Added', `"${docItem.title}" saved to Wallet.`, 'wallet');
    } else {
      triggerToast('Document Added', `"${docItem.title}" saved to your Travel Wallet.`, 'wallet');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!activeTrip) return;
    if (currentUser) {
      await deleteDocument(activeTrip.id, docId);
    } else {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    }
  };

  // Trip Change Request Approvals (Executed by Trip Planner)
  const handleApproveChangeRequest = async (req: TripChangeRequest) => {
    if (!activeTrip) return;
    try {
      if (req.type === 'expense') {
        if (currentUser) await addExpense(activeTrip.id, req.data, activeTrip.title);
        else setExpenses((prev) => [req.data, ...prev]);
      } else if (req.type === 'ticket') {
        if (currentUser) await addDocument(activeTrip.id, req.data, activeTrip.title);
        else setDocuments((prev) => [...prev, req.data]);
      } else if (req.type === 'activity') {
        if (currentUser) await addActivity(activeTrip.id, req.data, activeTrip.title);
        else setActivities((prev) => [...prev, req.data]);
      }

      if (currentUser) {
        await updateChangeRequestStatus(activeTrip.id, req.id, 'approved', req.title, 'Confirmed by Trip Planner', activeTrip.title);
      } else {
        setChangeRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, status: 'approved' } : r))
        );
      }
      triggerToast('Proposal Approved', `"${req.title}" has been integrated into the trip.`, 'approval');
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleRejectChangeRequest = async (req: TripChangeRequest) => {
    if (!activeTrip) return;
    try {
      if (currentUser) {
        await updateChangeRequestStatus(activeTrip.id, req.id, 'rejected', req.title, 'Declined by planner', activeTrip.title);
      } else {
        setChangeRequests((prev) =>
          prev.map((r) => (r.id === req.id ? { ...r, status: 'rejected' } : r))
        );
      }
      triggerToast('Proposal Rejected', `"${req.title}" proposal was declined.`, 'approval');
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  // Packing handlers
  const handleTogglePacking = async (itemId: string, packed: boolean) => {
    if (!activeTrip) return;
    if (currentUser) {
      await togglePackingItem(activeTrip.id, itemId, packed);
    } else {
      setPackingItems((prev) =>
        prev.map((p) => (p.id === itemId ? { ...p, packed } : p))
      );
    }
  };

  const handleAddPackingItem = async (item: PackingItem) => {
    if (!activeTrip) return;
    if (currentUser) {
      await addPackingItem(activeTrip.id, item);
    } else {
      setPackingItems((prev) => [...prev, item]);
    }
  };

  const handleDeletePackingItem = async (itemId: string) => {
    if (!activeTrip) return;
    if (currentUser) {
      await deletePackingItem(activeTrip.id, itemId);
    } else {
      setPackingItems((prev) => prev.filter((p) => p.id !== itemId));
    }
  };

  // Chat message handlers
  const handleSendMessage = async (msg: ChatMessage) => {
    if (!activeTrip) return;
    // Optimistically update message list so everyone sees messages immediately
    setMessages((prev) => [...prev.filter((m) => m.id !== msg.id), msg]);
    if (currentUser) {
      try {
        await sendChatMessage(activeTrip.id, msg, activeTrip.title);
      } catch (err) {
        console.warn('Chat message sync notice:', err);
      }
    }
  };

  const handleUpdateStatus = (newStatus: TripStatus) => {
    handleUpdateTripDetails({ status: newStatus });
  };

  // Notification handlers
  const handleMarkNotificationAsRead = async (notifId: string) => {
    if (!activeTrip) return;
    await markNotificationAsRead(activeTrip.id, notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotificationsAsRead = async () => {
    if (!activeTrip) return;
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    await markAllNotificationsAsRead(activeTrip.id, ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleDeleteNotification = async (notifId: string) => {
    if (!activeTrip) return;
    await deleteNotification(activeTrip.id, notifId);
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleSendTripAlert = async (title: string, message: string, type: NotificationType) => {
    if (!activeTrip) return;
    await generateTripNotification(
      activeTrip.id,
      activeTrip.title,
      title,
      message,
      type,
      'itinerary',
      userProfile?.displayName || currentUser?.displayName || 'Traveler'
    );
    triggerToast(title, message, type);
  };

  // If user is NOT logged in, show the Landing Page with compulsory registration
  if (!currentUser) {
    return (
      <>
        <LandingPage
          onSignIn={() => handleOpenAuth('login')}
          onRegister={() => handleOpenAuth('register')}
          onOpenUpgrade={handleOpenUpgrade}
          subscriptionEnforced={subscriptionEnforced}
          onToggleSubscriptionEnforced={handleToggleSubscriptionEnforced}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
        />
        <RazorpayModal
          isOpen={razorpayModalOpen}
          onClose={() => setRazorpayModalOpen(false)}
          featureLockedMessage={lockedReason}
        />
      </>
    );
  }

  const visibleExpensesCount = isTripPlanner
    ? expenses.length
    : expenses.filter(
        (exp) =>
          exp.paidByUid === currentUser?.uid ||
          exp.createdBy === currentUser?.uid ||
          exp.receivedByUid === currentUser?.uid ||
          exp.paidBy === 'You' ||
          exp.receivedBy === 'You' ||
          (userProfile?.displayName &&
            (exp.paidBy?.trim().toLowerCase() === userProfile.displayName.trim().toLowerCase() ||
              exp.receivedBy?.trim().toLowerCase() === userProfile.displayName.trim().toLowerCase())) ||
          (currentUser?.email &&
            (exp.paidBy?.trim().toLowerCase() === currentUser.email.trim().toLowerCase() ||
              exp.receivedBy?.trim().toLowerCase() === currentUser.email.trim().toLowerCase()))
      ).length;

  const tabs: { key: ActiveTab; label: string; icon: React.ReactNode; isProOnly?: boolean; count?: number }[] = [
    { key: 'itinerary', label: 'Itinerary Schedule', icon: <Calendar className="w-4 h-4" />, count: activities.length },
    { key: 'explore', label: 'Explore & Local Gems', icon: <Compass className="w-4 h-4" /> },
    { key: 'expenses', label: 'Expenses & Split', icon: <CreditCard className="w-4 h-4" />, count: visibleExpensesCount },
    { key: 'wallet', label: 'Passes & Wallet', icon: <Briefcase className="w-4 h-4" />, count: documents.length },
    { key: 'packing', label: 'Packing Checklist', icon: <CheckSquare className="w-4 h-4" />, count: packingItems.length },
    { key: 'journal', label: 'Trip Diary & Dossier', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'chat', label: 'Trip Group Room', icon: <MessageSquare className="w-4 h-4" />, count: messages.length },
    { key: 'tools', label: 'Utilities & Medical SOS', icon: <Wrench className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Navbar
        trips={trips}
        activeTrip={activeTrip}
        onSelectTrip={(t) => setActiveTrip(t)}
        onOpenNewTripModal={() => setNewTripModalOpen(true)}
        onOpenAuthModal={() => handleOpenAuth('login')}
        onOpenUpgrade={() => handleOpenUpgrade('Upgrade to JKVoyage Pro for unlimited access')}
        onOpenProfile={() => setProfileModalOpen(true)}
        subscriptionEnforced={subscriptionEnforced}
        onToggleSubscriptionEnforced={handleToggleSubscriptionEnforced}
        notifications={notifications}
        onMarkNotificationAsRead={handleMarkNotificationAsRead}
        onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
        onDeleteNotification={handleDeleteNotification}
        onSelectActionTab={(tab) => setActiveTab(tab)}
        onSendTripAlert={handleSendTripAlert}
      />

      {/* Real-time Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-sky-500/30 shadow-2xl animate-in slide-in-from-top-3 fade-in duration-200 max-w-sm">
          <div className="p-2 rounded-xl bg-sky-500/15 text-sky-500 shrink-0">
            <Bell className="w-4 h-4 animate-bounce" />
          </div>
          <div className="min-w-0 pr-1 flex-1">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">{toastMessage.title}</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{toastMessage.message}</p>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {currentUser && trips.length === 0 && !tripsLoading && !activeTrip ? (
          /* Clean empty state for authenticated user who has not created or joined any trips yet */
          <div className="text-center py-20 px-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[2px] mx-auto mb-4">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Compass className="w-8 h-8 text-sky-500 dark:text-sky-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">No Journeys Planned Yet</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
              Welcome, {userProfile?.displayName || currentUser.displayName || 'Traveler'}! You are currently not part of any journeys. Plan your own custom expedition as a <strong>Trip Planner</strong>, or ask an existing Trip Planner to add your email to their journey.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setNewTripModalOpen(true)}
                className="px-6 py-3 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>+ Plan Your First Trip</span>
              </button>
            </div>
          </div>
        ) : activeTrip ? (
          <div>
            {/* Trip Hero with Cover Art, Budget & Progress */}
            <TripHero
              trip={activeTrip}
              activities={activities}
              expenses={expenses}
              packingItems={packingItems}
              isTripCreator={isTripPlanner}
              pendingRequestsCount={pendingRequests.length}
              onOpenApprovals={() => setApprovalsModalOpen(true)}
              onUpdateStatus={handleUpdateStatus}
              onUpdateTrip={handleUpdateTripDetails}
              onDeleteTrip={handleOpenDeleteTripModal}
              onRemoveTraveller={handleRemoveTraveller}
              onOpenAiPlanner={() => setSuggestionsModalOpen(true)}
            />

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 scrollbar-none">
              {tabs.map((t) => {
                const isActive = activeTab === t.key;

                return (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`}
                  >
                    {t.icon}
                    <span>{t.label}</span>
                    {typeof t.count === 'number' && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-slate-950 text-white font-black'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {t.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active Tab Views */}
            <div className="space-y-6">
              {activeTab === 'itinerary' && (
                <ItineraryTab
                  trip={activeTrip}
                  activities={activities}
                  onAddActivity={handleAddActivity}
                  onProposeActivity={handleAddActivity}
                  onDeleteActivity={handleDeleteActivity}
                  onOpenSuggestions={() => setSuggestionsModalOpen(true)}
                  isTripCreator={isTripCreator}
                />
              )}

              {activeTab === 'explore' && (
                <ExploreTab
                  trip={activeTrip}
                  activities={activities}
                  onAddActivity={handleAddExploreActivity}
                  isPro={isPro}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {activeTab === 'expenses' && (
                <ExpensesTab
                  trip={activeTrip}
                  expenses={expenses}
                  onAddExpense={handleAddExpense}
                  onProposeExpense={handleAddExpense}
                  onDeleteExpense={handleDeleteExpense}
                  isTripCreator={isTripCreator}
                />
              )}

              {activeTab === 'wallet' && (
                <WalletTab
                  trip={activeTrip}
                  documents={documents}
                  onAddDocument={handleAddDocument}
                  onDeleteDocument={handleDeleteDocument}
                  isTripCreator={isTripCreator}
                />
              )}

              {activeTab === 'packing' && (
                <PackingTab
                  trip={activeTrip}
                  packingItems={packingItems}
                  onToggleItem={handleTogglePacking}
                  onAddItem={handleAddPackingItem}
                  onDeleteItem={handleDeletePackingItem}
                />
              )}

              {activeTab === 'journal' && (
                <JournalTab
                  trip={activeTrip}
                  activities={activities}
                  expenses={expenses}
                  documents={documents}
                  packingItems={packingItems}
                  isPro={isPro}
                  onOpenUpgrade={handleOpenUpgrade}
                />
              )}

              {activeTab === 'chat' && (
                <ChatTab
                  trip={activeTrip}
                  messages={messages}
                  onSendMessage={handleSendMessage}
                />
              )}

              {activeTab === 'tools' && (
                <TravelToolsTab
                  trip={activeTrip}
                  activities={activities}
                  expenses={expenses}
                  documents={documents}
                  packingItems={packingItems}
                  onTabChange={(tab) => setActiveTab(tab as ActiveTab)}
                  onOpenAiAssistant={() => setSuggestionsModalOpen(true)}
                  onAddExpense={handleAddExpense}
                />
              )}
            </div>
          </div>
        ) : tripsLoading ? (
          <div className="text-center py-20 px-4 max-w-md mx-auto animate-in fade-in duration-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-4 shadow-lg shadow-sky-500/20">
              <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Syncing your travel workspace...</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Loading journeys, itineraries, expenses, and travel documents.
            </p>
          </div>
        ) : (
          /* Authenticated workspace state when user has no active journey selected */
          <div className="py-12 sm:py-16 max-w-2xl w-full mx-auto space-y-7 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-sky-500/20">
              <Compass className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Traveler Profile Active • {userProfile?.homeCity || 'India'}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Welcome, {userProfile?.displayName || currentUser.displayName || 'Traveler'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Your traveler profile and digital identity are verified and active. You are ready to plan or join journeys.
              </p>
            </div>

            {/* If user was added to trips that can be selected */}
            {trips.length > 0 ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-3 text-left">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-sky-500" />
                  <span>Your Journeys ({trips.length})</span>
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {trips.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTrip(t)}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-sky-500 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-left transition-all cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</p>
                        <p className="text-xs text-slate-400">{t.destination} • {t.startDate} to {t.endDate}</p>
                      </div>
                      <span className="text-xs font-bold text-sky-600 dark:text-sky-400">Open Journey →</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="max-w-sm mx-auto space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No active journey selected
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Create a new journey as a Trip Planner, or ask your trip leader to add your registered email:
                  </p>
                  <p className="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 py-1.5 px-3 rounded-xl inline-block border border-sky-200 dark:border-sky-800">
                    {currentUser.email}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNewTripModalOpen(true)}
                    className="px-6 py-2.5 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all shadow-md shadow-sky-500/20 cursor-pointer flex items-center gap-2 hover:scale-[1.02]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Plan a New Journey</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExploringDemo(true)}
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Compass className="w-4 h-4 text-sky-500" />
                    <span>Preview Demo Journey (Rajasthan)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-900 bg-white/90 dark:bg-slate-950/90 py-6 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">JKVoyage</span>
            <span>•</span>
            <span className="font-semibold text-sky-600 dark:text-sky-400">Owned by JKSoftonics</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Database className="w-3 h-3" />
              Automatic Backup
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-3 h-3" />
              Safe & Secure
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <Crown className="w-3 h-3" />
              100% Free Access
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <NewTripModal
        isOpen={newTripModalOpen}
        onClose={() => setNewTripModalOpen(false)}
        onCreateTrip={handleCreateTrip}
      />

      {activeTrip && (
        <SuggestionsExplorerModal
          isOpen={suggestionsModalOpen}
          onClose={() => setSuggestionsModalOpen(false)}
          trip={activeTrip}
          tripDays={Math.max(1, activities.length ? Math.max(...activities.map((a) => a.day)) : 3)}
          isTripCreator={isTripCreator}
          onAddActivity={handleAddActivity}
          onProposeActivity={handleAddActivity}
        />
      )}

      {activeTrip && (
        <TripApprovalsModal
          isOpen={approvalsModalOpen}
          onClose={() => setApprovalsModalOpen(false)}
          trip={activeTrip}
          requests={changeRequests}
          isTripCreator={isTripCreator}
          onApprove={handleApproveChangeRequest}
          onReject={handleRejectChangeRequest}
        />
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      <RazorpayModal
        isOpen={razorpayModalOpen}
        onClose={() => setRazorpayModalOpen(false)}
        featureLockedMessage={lockedReason}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onOpenUpgrade={() => {
          setProfileModalOpen(false);
          setRazorpayModalOpen(true);
        }}
        subscriptionEnforced={subscriptionEnforced}
        onToggleSubscriptionEnforced={handleToggleSubscriptionEnforced}
      />

      {/* In-App Delete Trip Confirmation Modal (Only for Trip Planner) */}
      {deleteTripModalOpen && activeTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-500/5">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Journey
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              Are you sure you want to delete <strong className="text-slate-800 dark:text-slate-200">"{activeTrip.title}"</strong>? 
              All associated itineraries, expenses, documents, and packing lists will be permanently removed.
              <span className="block mt-2 font-semibold text-rose-600 dark:text-rose-400">
                This action is only available to the Trip Planner and cannot be undone.
              </span>
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isDeletingTrip}
                onClick={() => setDeleteTripModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingTrip}
                onClick={handleConfirmDeleteTrip}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/25 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeletingTrip ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Journey</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
