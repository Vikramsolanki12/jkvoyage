import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../lib/firebase.ts';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors.ts';
import {
  Trip,
  TripCollaborator,
  Activity,
  Expense,
  DigitalDocument,
  PackingItem,
  ChatMessage,
  TripChangeRequest,
  TripNotification,
  NotificationType,
  JournalEntry
} from '../types/travel.ts';

const LOCAL_TRIPS_STORE = 'jkvoyage_user_trips_store';
const LOCAL_NOTIFICATIONS_STORE = 'jkvoyage_notifications_store';

// Clean initial state - no dummy or mock trips
export const SEED_TRIPS: Trip[] = [];

export const SEED_SPITI_ACTIVITIES: Activity[] = [
  {
    id: 'spiti_act_1',
    tripId: 'trip_spiti_expedition',
    day: 1,
    time: '10:00',
    title: 'Solang Valley Acclimatization & Mountain Stream Walk',
    category: 'activity',
    location: 'Solang Valley, Manali',
    costINR: 1500,
    notes: 'Pine forest walk and acclimatization briefing',
    createdBy: 'Engineering Lead',
    createdAt: '2026-10-01T10:00:00.000Z'
  },
  {
    id: 'spiti_act_2',
    tripId: 'trip_spiti_expedition',
    day: 2,
    time: '09:00',
    title: 'Atal Tunnel Crossing & Sissu Waterfall Exploration',
    category: 'sightseeing',
    location: 'Sissu, Lahaul Valley',
    costINR: 2200,
    notes: 'Crossing under Rohtang Ridge into Lahaul region',
    createdBy: 'Engineering Lead',
    createdAt: '2026-10-02T09:00:00.000Z'
  },
  {
    id: 'spiti_act_3',
    tripId: 'trip_spiti_expedition',
    day: 3,
    time: '11:30',
    title: 'Key Monastery & High-Altitude Valley Trek',
    category: 'sightseeing',
    location: 'Key Gompa, Spiti Valley',
    costINR: 3500,
    notes: 'Ancient Buddhist monastery and panoramic mountain views',
    createdBy: 'Engineering Lead',
    createdAt: '2026-10-03T11:30:00.000Z'
  }
];

export const SEED_SPITI_EXPENSES: Expense[] = [
  {
    id: 'spiti_exp_1',
    tripId: 'trip_spiti_expedition',
    amountINR: 4500,
    description: 'Mountain 4x4 Jeep Fuel & Rohtang Road Tax',
    category: 'travel',
    paidBy: 'Engineering Lead',
    paidByUid: 'seed_enginnering',
    date: '2026-10-20',
    splitMode: 'all',
    createdBy: 'Engineering Lead',
    createdAt: '2026-10-20T10:00:00.000Z'
  },
  {
    id: 'spiti_exp_2',
    tripId: 'trip_spiti_expedition',
    amountINR: 2800,
    description: 'Himachali Traditional Siddu & Thali Lunch',
    category: 'food',
    paidBy: 'Engineering Lead',
    paidByUid: 'seed_enginnering',
    date: '2026-10-21',
    splitMode: 'all',
    createdBy: 'Engineering Lead',
    createdAt: '2026-10-21T13:30:00.000Z'
  },
  {
    id: 'spiti_exp_3',
    tripId: 'trip_spiti_expedition',
    amountINR: 1600,
    description: 'High-Altitude Trekking Poles & Crampon Rental',
    category: 'tickets',
    paidBy: 'Engineering Lead',
    paidByUid: 'seed_enginnering',
    date: '2026-10-22',
    splitMode: 'all',
    createdBy: 'Engineering Lead',
    createdAt: '2026-10-22T09:15:00.000Z'
  }
];

export const SEED_SPITI_DOCS: DigitalDocument[] = [
  {
    id: 'spiti_doc_1',
    tripId: 'trip_spiti_expedition',
    title: 'Spiti Valley Inner-Line Trek Permit & Identity Proof',
    docType: 'id_card',
    ownerId: 'seed_enginnering',
    ownerName: 'Engineering Lead',
    fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    fileName: 'spiti_inner_line_permit.jpg',
    createdAt: '2026-10-15T00:00:00.000Z'
  }
];

export const SEED_SPITI_PACKING: PackingItem[] = [
  { id: 'spiti_p_1', tripId: 'trip_spiti_expedition', item: 'Thermal Windproof Down Jacket', category: 'clothing', packed: true, createdBy: 'Engineering Lead' },
  { id: 'spiti_p_2', tripId: 'trip_spiti_expedition', item: 'Ankle-Support Waterproof Trekking Boots', category: 'essentials', packed: true, createdBy: 'Engineering Lead' },
  { id: 'spiti_p_3', tripId: 'trip_spiti_expedition', item: 'Diamox Altitude Care & Personal First-Aid Kit', category: 'meds', packed: true, createdBy: 'Engineering Lead' },
  { id: 'spiti_p_4', tripId: 'trip_spiti_expedition', item: 'Polarized UV Sunglasses & High-SPF Sunscreen', category: 'toiletries', packed: false, createdBy: 'Engineering Lead' }
];

export const SEED_RAJASTHAN_ACTIVITIES: Activity[] = [
  {
    id: 'raj_act_1',
    tripId: 'trip_rajasthan_heritage',
    day: 1,
    time: '09:30',
    title: 'Arrival at Jaipur & Amber Palace Exploration',
    category: 'sightseeing',
    location: 'Amber Fort, Jaipur',
    costINR: 2400,
    notes: 'Tour Sheesh Mahal mirror palace with royal audio guide',
    createdBy: 'Aarav Sharma',
    createdAt: '2026-10-05T09:30:00.000Z'
  },
  {
    id: 'raj_act_2',
    tripId: 'trip_rajasthan_heritage',
    day: 1,
    time: '13:30',
    title: 'Authentic Rajasthani Thali Feast',
    category: 'food',
    location: 'LMB Restaurant, Johari Bazaar',
    costINR: 1800,
    notes: 'Dal Baati Churma and Ker Sangri',
    createdBy: 'Aarav Sharma',
    createdAt: '2026-10-05T13:30:00.000Z'
  },
  {
    id: 'raj_act_3',
    tripId: 'trip_rajasthan_heritage',
    day: 2,
    time: '10:00',
    title: 'Hawa Mahal Palace & City Palace Royal Museum',
    category: 'sightseeing',
    location: 'Badi Choupad, Jaipur',
    costINR: 1200,
    notes: 'Photography permits and royal textiles collection',
    createdBy: 'Aarav Sharma',
    createdAt: '2026-10-06T10:00:00.000Z'
  }
];

export const SEED_RAJASTHAN_EXPENSES: Expense[] = [
  {
    id: 'raj_exp_1',
    tripId: 'trip_rajasthan_heritage',
    amountINR: 4200,
    description: 'Heritage Havelis Tour & Photography Pass',
    category: 'tickets',
    paidBy: 'Aarav Sharma',
    paidByUid: 'jksoftonics_demo_pro',
    date: '2026-11-10',
    splitMode: 'all',
    createdBy: 'Aarav Sharma',
    createdAt: '2026-11-10T10:00:00.000Z'
  },
  {
    id: 'raj_exp_2',
    tripId: 'trip_rajasthan_heritage',
    amountINR: 2600,
    description: 'Royal Thali Dinner at Chokhi Dhani',
    category: 'food',
    paidBy: 'Aarav Sharma',
    paidByUid: 'jksoftonics_demo_pro',
    date: '2026-11-11',
    splitMode: 'all',
    createdBy: 'Aarav Sharma',
    createdAt: '2026-11-11T20:00:00.000Z'
  }
];

export const SEED_RAJASTHAN_DOCS: DigitalDocument[] = [
  {
    id: 'raj_doc_1',
    tripId: 'trip_rajasthan_heritage',
    title: 'Jaipur Composite Monument Entry & Audio Pass',
    docType: 'ticket',
    ownerId: 'jksoftonics_demo_pro',
    ownerName: 'Aarav Sharma',
    fileUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
    fileName: 'jaipur_composite_pass.jpg',
    createdAt: '2026-11-01T00:00:00.000Z'
  }
];

export const SEED_RAJASTHAN_PACKING: PackingItem[] = [
  { id: 'raj_p_1', tripId: 'trip_rajasthan_heritage', item: 'Cotton Linen Kurtas & Scarves', category: 'clothing', packed: true, createdBy: 'Aarav Sharma' },
  { id: 'raj_p_2', tripId: 'trip_rajasthan_heritage', item: 'Desert Safari Sunglasses & Sunscreen', category: 'toiletries', packed: true, createdBy: 'Aarav Sharma' },
  { id: 'raj_p_3', tripId: 'trip_rajasthan_heritage', item: 'DSLR Camera & Extra Memory Cards', category: 'electronics', packed: false, createdBy: 'Aarav Sharma' }
];

export function getStoredTripActivities(tripId: string): Activity[] {
  try {
    const raw = localStorage.getItem(`jkvoyage_activities_${tripId}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  if (tripId === 'trip_spiti_expedition') return SEED_SPITI_ACTIVITIES;
  if (tripId === 'trip_rajasthan_heritage' || tripId === 'guest_rajasthan_trip') return SEED_RAJASTHAN_ACTIVITIES;
  return [];
}

export function getStoredTripExpenses(tripId: string): Expense[] {
  try {
    const raw = localStorage.getItem(`jkvoyage_expenses_${tripId}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  if (tripId === 'trip_spiti_expedition') return SEED_SPITI_EXPENSES;
  if (tripId === 'trip_rajasthan_heritage' || tripId === 'guest_rajasthan_trip') return SEED_RAJASTHAN_EXPENSES;
  return [];
}

export function getStoredTripDocuments(tripId: string): DigitalDocument[] {
  try {
    const raw = localStorage.getItem(`jkvoyage_documents_${tripId}`);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  if (tripId === 'trip_spiti_expedition') return SEED_SPITI_DOCS;
  if (tripId === 'trip_rajasthan_heritage' || tripId === 'guest_rajasthan_trip') return SEED_RAJASTHAN_DOCS;
  return [];
}

export function getStoredTripPacking(tripId: string): PackingItem[] {
  try {
    const raw = localStorage.getItem(`jkvoyage_packing_${tripId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  if (tripId === 'trip_spiti_expedition') return SEED_SPITI_PACKING;
  if (tripId === 'trip_rajasthan_heritage' || tripId === 'guest_rajasthan_trip') return SEED_RAJASTHAN_PACKING;
  return [];
}

export function getStoredTripMessages(tripId: string): ChatMessage[] {
  try {
    const raw = localStorage.getItem(`jkvoyage_messages_${tripId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

/**
 * Recursively cleans any object intended for Firestore by removing keys with undefined values.
 * Firestore strictly rejects undefined with: "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}

// Helper to filter valid user trips: ONLY trips user created or is member of, NEVER demo trips
export function filterUserAuthorizedTrips(trips: Trip[], userId: string, userEmail?: string): Trip[] {
  const normalizedEmail = userEmail?.trim().toLowerCase() || '';
  return trips.filter((trip) => {
    // 1. Exclude any demo trip
    if (!trip || !trip.id) return false;
    if (
      trip.id === 'guest_rajasthan_trip' ||
      trip.ownerId === 'guest_user' ||
      trip.id.startsWith('guest_')
    ) {
      return false;
    }

    // 2. Must be either the owner
    const isOwner = trip.ownerId === userId || (Boolean(normalizedEmail) && trip.ownerEmail?.toLowerCase() === normalizedEmail);
    if (isOwner) return true;

    // 3. Or a member / collaborator
    const inMemberUids = Array.isArray(trip.memberUids) && trip.memberUids.includes(userId);
    if (inMemberUids) return true;

    const inMemberEmails =
      Boolean(normalizedEmail) &&
      Array.isArray(trip.memberEmails) &&
      trip.memberEmails.some((e) => e?.toLowerCase() === normalizedEmail);
    if (inMemberEmails) return true;

    const inCollaborators =
      Array.isArray(trip.collaborators) &&
      trip.collaborators.some(
        (c) => c.uid === userId || (Boolean(normalizedEmail) && c.email?.toLowerCase() === normalizedEmail)
      );
    if (inCollaborators) return true;

    return false;
  });
}

function getStoredTrips(): Trip[] {
  try {
    const raw = localStorage.getItem(LOCAL_TRIPS_STORE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local trips store:', e);
  }
  return [];
}

export function clearAllLocalTripData(): void {
  try {
    localStorage.removeItem(LOCAL_TRIPS_STORE);
    localStorage.removeItem(LOCAL_NOTIFICATIONS_STORE);
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('jkvoyage_activities_') || key.startsWith('jkvoyage_expenses_') || key.startsWith('jkvoyage_documents_') || key.startsWith('jkvoyage_packing_') || key.startsWith('jkvoyage_messages_') || key.startsWith('jkvoyage_change_requests_') || key.startsWith('jkvoyage_journal_'))) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {}
  inMemoryTrips = [];
  notifyTripSubscribers();
}

function saveStoredTrips(trips: Trip[]) {
  try {
    localStorage.setItem(LOCAL_TRIPS_STORE, JSON.stringify(trips));
  } catch (e) {
    console.warn('Error saving local trips store:', e);
  }
}

function getStoredNotifications(tripId?: string): TripNotification[] {
  try {
    const raw = localStorage.getItem(LOCAL_NOTIFICATIONS_STORE);
    if (raw) {
      const all: TripNotification[] = JSON.parse(raw);
      if (tripId) return all.filter((n) => n.tripId === tripId);
      return all;
    }
  } catch (e) {
    console.warn('Error reading local notifications:', e);
  }
  return [];
}

function saveStoredNotification(notif: TripNotification) {
  try {
    const all = getStoredNotifications();
    const updated = [notif, ...all.filter((n) => n.id !== notif.id)].slice(0, 100);
    localStorage.setItem(LOCAL_NOTIFICATIONS_STORE, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local notification:', e);
  }
}

// In-memory cache of Firestore trips initialized from local store for instant UI readiness
let inMemoryTrips: Trip[] = getStoredTrips();

// Global subscribers for real-time local sync across tabs and sessions
const activeMessageSubscribers = new Map<string, Set<(msgs: ChatMessage[]) => void>>();

export function notifyMessageSubscribers(tripId: string) {
  const listeners = activeMessageSubscribers.get(tripId);
  const items = getStoredTripMessages(tripId);
  if (listeners && listeners.size > 0) {
    listeners.forEach((cb) => {
      try { cb(items); } catch (e) {}
    });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jkvoyage_messages_updated', { detail: { tripId } }));
  }
}

const activeExpenseSubscribers = new Map<string, Set<(exps: Expense[]) => void>>();

export function notifyExpenseSubscribers(tripId: string) {
  const listeners = activeExpenseSubscribers.get(tripId);
  const items = getStoredTripExpenses(tripId);
  if (listeners && listeners.size > 0) {
    listeners.forEach((cb) => {
      try { cb(items); } catch (e) {}
    });
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jkvoyage_expenses_updated', { detail: { tripId } }));
  }
}

// Global subscribers set to immediately notify active UI listeners on any local or remote trip mutation
const activeTripSubscribers = new Set<() => void>();

function notifyTripSubscribers() {
  activeTripSubscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {}
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('jkvoyage_trips_updated'));
  }
}

// ---------------- TRIPS (FIREBASE DATABASE INTEGRATED) ----------------

export function subscribeUserTrips(
  userId: string,
  userEmail: string | undefined,
  userDisplayName: string | undefined,
  onData: (trips: Trip[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  // Always refresh inMemoryTrips from local storage if available
  const stored = getStoredTrips();
  if (stored.length > 0) {
    const map = new Map<string, Trip>();
    stored.forEach((t) => map.set(t.id, t));
    inMemoryTrips.forEach((t) => map.set(t.id, t));
    inMemoryTrips = Array.from(map.values());
  }

  const emitCurrent = () => {
    inMemoryTrips = inMemoryTrips.map((t) => normalizeAndDeduplicateTrip(t, userId, userEmail, userDisplayName));
    const valid = filterUserAuthorizedTrips(inMemoryTrips, userId, userEmail);
    valid.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    onData(valid);
  };

  // Emit current data immediately so loading state clears with zero latency
  emitCurrent();

  // Register in-memory subscriber for instant updates
  activeTripSubscribers.add(emitCurrent);

  // Safety fallback timer to ensure trips loading never hangs
  const safetyTimer = setTimeout(() => {
    emitCurrent();
  }, 800);

  const tripsRef = collection(db, 'trips');
  let unsubFirestore: Unsubscribe | null = null;

  try {
    unsubFirestore = onSnapshot(
      tripsRef,
      (snapshot) => {
        clearTimeout(safetyTimer);
        const firestoreTrips: Trip[] = [];
        snapshot.forEach((docSnap) => {
          firestoreTrips.push(docSnap.data() as Trip);
        });

        // CRITICAL: Merge Firestore trips with existing inMemoryTrips, DO NOT wipe local trips if Firestore is empty!
        const mergedMap = new Map<string, Trip>();
        inMemoryTrips.forEach((t) => mergedMap.set(t.id, t));
        firestoreTrips.forEach((t) => {
          mergedMap.set(t.id, normalizeAndDeduplicateTrip(t, userId, userEmail, userDisplayName));
        });
        inMemoryTrips = Array.from(mergedMap.values());
        saveStoredTrips(inMemoryTrips);
        emitCurrent();
      },
      (error) => {
        clearTimeout(safetyTimer);
        console.warn('Firestore onSnapshot error, falling back to local trips store:', error);
        if (onError) onError(error);
        emitCurrent();
      }
    );
  } catch (err) {
    clearTimeout(safetyTimer);
    if (onError) onError(err);
    emitCurrent();
  }

  return () => {
    clearTimeout(safetyTimer);
    activeTripSubscribers.delete(emitCurrent);
    if (unsubFirestore) unsubFirestore();
  };
}

export async function createTrip(trip: Trip): Promise<void> {
  const ownerEmailNormalized = trip.ownerEmail?.trim().toLowerCase() || '';
  // Ensure creator is ALWAYS Trip Planner with role: 'planner'
  const creatorCollaborator: TripCollaborator = {
    uid: trip.ownerId,
    name: trip.ownerName || 'Trip Planner',
    email: ownerEmailNormalized,
    role: 'planner',
    addedAt: new Date().toISOString()
  };

  const existingCollabs = (trip.collaborators || []).filter((c) => c.uid !== trip.ownerId);

  const ensuredTrip: Trip = {
    ...trip,
    ownerEmail: ownerEmailNormalized,
    memberUids: Array.from(new Set([...(trip.memberUids || []), trip.ownerId])),
    memberEmails: Array.from(
      new Set([...(trip.memberEmails || []).map((e) => e.toLowerCase()), ...(ownerEmailNormalized ? [ownerEmailNormalized] : [])])
    ),
    collaborators: [creatorCollaborator, ...existingCollabs]
  };

  // 1. Immediately update in-memory cache so UI shows the trip without a millisecond of lag
  inMemoryTrips = [ensuredTrip, ...inMemoryTrips.filter((t) => t.id !== trip.id)];
  saveStoredTrips(inMemoryTrips);
  notifyTripSubscribers();

  // 2. Write directly to Firebase Firestore
  try {
    const tripRef = doc(db, 'trips', trip.id);
    await setDoc(tripRef, cleanForFirestore(ensuredTrip));
  } catch (err) {
    console.warn('Trip saved locally; Firestore sync deferred:', err);
  }

  // 3. Generate initial notification
  await generateTripNotification(
    ensuredTrip.id,
    ensuredTrip.title,
    'Trip Created Successfully',
    `"${ensuredTrip.title}" to ${ensuredTrip.destination} is now ready for planning!`,
    'general',
    'itinerary',
    ensuredTrip.ownerName
  );

  notifyTripSubscribers();
}

export async function updateTrip(tripId: string, updates: Partial<Trip>): Promise<void> {
  const index = inMemoryTrips.findIndex((t) => t.id === tripId);
  if (index !== -1) {
    inMemoryTrips[index] = {
      ...inMemoryTrips[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    saveStoredTrips(inMemoryTrips);
    notifyTripSubscribers();
  }

  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, cleanForFirestore({
      ...updates,
      updatedAt: new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Failed to update trip in Firestore:', err);
  }
}

export async function deleteTrip(tripId: string): Promise<void> {
  inMemoryTrips = inMemoryTrips.filter((t) => t.id !== tripId);
  saveStoredTrips(inMemoryTrips);
  notifyTripSubscribers();

  // Clear all locally stored subcollections for this trip
  try {
    localStorage.removeItem(`jkvoyage_activities_${tripId}`);
    localStorage.removeItem(`jkvoyage_expenses_${tripId}`);
    localStorage.removeItem(`jkvoyage_documents_${tripId}`);
    localStorage.removeItem(`jkvoyage_packing_${tripId}`);
    localStorage.removeItem(`jkvoyage_messages_${tripId}`);
    localStorage.removeItem(`jkvoyage_change_requests_${tripId}`);
    localStorage.removeItem(`jkvoyage_journal_${tripId}`);
  } catch (e) {}

  try {
    const tripRef = doc(db, 'trips', tripId);
    await deleteDoc(tripRef);
  } catch (err) {
    console.warn('Trip delete notice from Firestore:', err);
    // Do NOT throw error so local UI delete succeeds even if offline or document absent
  }
}

// Remove traveller: Only trip planner can remove a joined traveller from a trip
export async function removeTravellerFromTrip(
  tripId: string,
  emailOrUid: string
): Promise<Trip> {
  const normalized = emailOrUid.trim().toLowerCase();
  let trip = inMemoryTrips.find((t) => t.id === tripId);
  if (!trip) {
    try {
      const snap = await getDoc(doc(db, 'trips', tripId));
      if (snap.exists()) trip = snap.data() as Trip;
    } catch (e) {}
  }
  if (!trip) throw new Error('Trip not found.');

  // Safety check: Cannot remove the trip owner/creator
  if (trip.ownerId === emailOrUid || trip.ownerEmail?.toLowerCase() === normalized) {
    throw new Error('Cannot remove the Trip Planner from the trip.');
  }

  // Find matching collaborator(s) to get all related UIDs and emails
  const targetCollabs = (trip.collaborators || []).filter(
    (c) => c.uid === emailOrUid || c.email?.toLowerCase() === normalized
  );
  const targetUids = new Set([emailOrUid, ...targetCollabs.map((c) => c.uid).filter(Boolean)]);
  const targetEmails = new Set([normalized, ...targetCollabs.map((c) => c.email?.toLowerCase()).filter(Boolean)]);

  const updatedCollaborators = (trip.collaborators || []).filter(
    (c) => !targetUids.has(c.uid) && (!c.email || !targetEmails.has(c.email.toLowerCase()))
  );
  const updatedMemberEmails = (trip.memberEmails || []).filter(
    (e) => !targetEmails.has(e.toLowerCase())
  );
  const updatedMemberUids = (trip.memberUids || []).filter(
    (uid) => !targetUids.has(uid)
  );

  const updatedTrip: Trip = {
    ...trip,
    collaborators: updatedCollaborators,
    memberEmails: updatedMemberEmails,
    memberUids: updatedMemberUids,
    updatedAt: new Date().toISOString()
  };

  inMemoryTrips = inMemoryTrips.map((t) => (t.id === tripId ? updatedTrip : t));
  saveStoredTrips(inMemoryTrips);
  notifyTripSubscribers();

  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      collaborators: cleanForFirestore(updatedCollaborators),
      memberEmails: cleanForFirestore(updatedMemberEmails),
      memberUids: cleanForFirestore(updatedMemberUids),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to remove traveller from Firestore:', err);
  }

  return updatedTrip;
}

// Normalize and deduplicate collaborators to guarantee exactly one entry per email
export function normalizeAndDeduplicateTrip(
  trip: Trip,
  currentUserId?: string,
  currentUserEmail?: string,
  currentUserDisplayName?: string
): Trip {
  const ownerEmailNormalized = trip.ownerEmail?.trim().toLowerCase() || '';
  const myEmail = currentUserEmail?.trim().toLowerCase();

  const seenEmails = new Set<string>();
  if (ownerEmailNormalized) {
    seenEmails.add(ownerEmailNormalized);
  }

  const cleanCollaborators: TripCollaborator[] = [];

  (trip.collaborators || []).forEach((c) => {
    if (!c) return;
    const email = c.email?.trim().toLowerCase();

    // Skip owner in added travellers list (owner is already shown in Trip Planner crown pill)
    if (c.uid === trip.ownerId || (email && email === ownerEmailNormalized)) {
      return;
    }

    if (!email) {
      if (!cleanCollaborators.some((existing) => existing.uid === c.uid)) {
        cleanCollaborators.push(c);
      }
      return;
    }

    if (seenEmails.has(email)) {
      // Merge duplicate entry for same email into ONE unified record
      const existingIdx = cleanCollaborators.findIndex((existing) => existing.email?.toLowerCase() === email);
      if (existingIdx !== -1) {
        const existing = cleanCollaborators[existingIdx];
        cleanCollaborators[existingIdx] = {
          ...existing,
          uid: (currentUserId && email === myEmail) ? currentUserId : (c.uid && !c.uid.startsWith('usr_temp') ? c.uid : existing.uid),
          name: (currentUserDisplayName && email === myEmail) ? currentUserDisplayName : (existing.name || c.name),
          phone: existing.phone || c.phone,
          role: 'traveller'
        };
      }
      return;
    }

    seenEmails.add(email);

    // If this collaborator matches the current logged in user:
    if (myEmail && email === myEmail) {
      cleanCollaborators.push({
        ...c,
        uid: currentUserId || c.uid,
        name: currentUserDisplayName || c.name,
        role: 'traveller'
      });
    } else {
      cleanCollaborators.push({
        ...c,
        role: 'traveller'
      });
    }
  });

  const cleanMemberEmails = Array.from(
    new Set([
      ...(ownerEmailNormalized ? [ownerEmailNormalized] : []),
      ...cleanCollaborators.map((c) => c.email.trim().toLowerCase()).filter(Boolean)
    ])
  );

  const cleanMemberUids = Array.from(
    new Set([
      trip.ownerId,
      ...(currentUserId && myEmail && cleanMemberEmails.includes(myEmail) ? [currentUserId] : []),
      ...cleanCollaborators.map((c) => c.uid).filter(Boolean)
    ])
  );

  return {
    ...trip,
    ownerEmail: ownerEmailNormalized,
    collaborators: cleanCollaborators,
    memberEmails: cleanMemberEmails,
    memberUids: cleanMemberUids
  };
}

// Sync registered user's account with any trips they were added to by email
export async function syncUserWithTrips(
  uid: string,
  email: string,
  displayName?: string
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;

  let tripsChanged = false;
  inMemoryTrips = inMemoryTrips.map((trip) => {
    let tripChanged = false;
    const ownerEmail = trip.ownerEmail?.trim().toLowerCase();

    // Check if this user is in collaborators
    let updatedCollabs: TripCollaborator[] = (trip.collaborators || []).map((c) => {
      if (c.email && c.email.trim().toLowerCase() === normalizedEmail) {
        tripChanged = true;
        const assignedRole: 'planner' | 'traveller' =
          trip.ownerId === uid || ownerEmail === normalizedEmail ? 'planner' : 'traveller';
        return {
          ...c,
          uid,
          name: displayName || c.name,
          role: assignedRole
        };
      }
      return c;
    });

    // Deduplicate collaborators by email
    const seen = new Set<string>();
    if (ownerEmail) seen.add(ownerEmail);

    updatedCollabs = updatedCollabs.filter((c) => {
      const e = c.email?.trim().toLowerCase();
      if (!e) return true;
      if (seen.has(e)) {
        tripChanged = true;
        return false;
      }
      seen.add(e);
      return true;
    });

    let updatedMemberUids = trip.memberUids || [];
    if (
      (ownerEmail === normalizedEmail ||
        (trip.memberEmails || []).some((e) => e.toLowerCase() === normalizedEmail)) &&
      !updatedMemberUids.includes(uid)
    ) {
      updatedMemberUids = [...updatedMemberUids, uid];
      tripChanged = true;
    }

    if (tripChanged) {
      tripsChanged = true;
      const updatedTrip = {
        ...trip,
        collaborators: updatedCollabs,
        memberUids: updatedMemberUids,
        updatedAt: new Date().toISOString()
      };

      try {
        const tripRef = doc(db, 'trips', trip.id);
        updateDoc(tripRef, {
          collaborators: cleanForFirestore(updatedCollabs),
          memberUids: cleanForFirestore(updatedMemberUids),
          updatedAt: new Date().toISOString()
        }).catch((e) => console.warn('Background sync warning:', e));
      } catch (e) {}

      return updatedTrip;
    }
    return trip;
  });

  if (tripsChanged) {
    saveStoredTrips(inMemoryTrips);
    notifyTripSubscribers();
  }
}

// Add traveller through email: Only trip planner can add, fixed role 'traveller', joins automatically
export async function addTravellerByEmail(
  tripId: string,
  email: string,
  name?: string,
  phone?: string
): Promise<Trip> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  let trip = inMemoryTrips.find((t) => t.id === tripId);
  if (!trip) {
    try {
      const snap = await getDoc(doc(db, 'trips', tripId));
      if (snap.exists()) trip = snap.data() as Trip;
    } catch (e) {}
  }
  if (!trip) throw new Error('Trip not found.');

  // Check if planner is trying to add themselves
  if (trip.ownerEmail && trip.ownerEmail.trim().toLowerCase() === normalizedEmail) {
    throw new Error('You are already the Trip Planner for this journey.');
  }

  const existingEmails = (trip.memberEmails || []).map((e) => e.toLowerCase());
  const existingCollabEmails = (trip.collaborators || []).map((c) => c.email.toLowerCase());

  if (existingEmails.includes(normalizedEmail) || existingCollabEmails.includes(normalizedEmail)) {
    throw new Error(`Traveller with email "${normalizedEmail}" is already part of this trip.`);
  }

  // Check if user is already registered in local storage accounts dictionary
  let existingUserUid: string | null = null;
  let resolvedName = name?.trim() || '';
  try {
    const raw = localStorage.getItem('jkvoyage_registered_accounts');
    if (raw) {
      const accounts = JSON.parse(raw);
      if (accounts[normalizedEmail]?.user?.uid) {
        existingUserUid = accounts[normalizedEmail].user.uid;
        if (!resolvedName && accounts[normalizedEmail].user.displayName) {
          resolvedName = accounts[normalizedEmail].user.displayName;
        }
      }
    }
  } catch {}

  const travellerName = resolvedName || normalizedEmail.split('@')[0];
  const capitalizedName = travellerName.charAt(0).toUpperCase() + travellerName.slice(1);
  const newTravellerUid = existingUserUid || ('usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6));

  const newCollaborator: TripCollaborator = {
    uid: newTravellerUid,
    name: capitalizedName,
    email: normalizedEmail,
    role: 'traveller', // Fixed role: always traveller, never changeable
    phone: phone?.trim() || '',
    addedAt: new Date().toISOString()
  };

  // Filter out any existing matching collaborator to ensure only ONE record exists
  const otherCollabs = (trip.collaborators || []).filter(
    (c) => c.email?.trim().toLowerCase() !== normalizedEmail && c.uid !== newTravellerUid
  );
  const updatedCollaborators = [...otherCollabs, newCollaborator];
  const updatedMemberEmails = Array.from(new Set([...existingEmails, normalizedEmail]));
  const updatedMemberUids = Array.from(new Set([...(trip.memberUids || []), newTravellerUid]));

  const updatedTrip: Trip = {
    ...trip,
    collaborators: updatedCollaborators,
    memberEmails: updatedMemberEmails,
    memberUids: updatedMemberUids,
    updatedAt: new Date().toISOString()
  };

  // Update in memory, persist locally, and notify active listeners
  inMemoryTrips = inMemoryTrips.map((t) => (t.id === tripId ? updatedTrip : t));
  saveStoredTrips(inMemoryTrips);
  notifyTripSubscribers();

  // Save directly to Firestore
  try {
    const tripRef = doc(db, 'trips', tripId);
    await updateDoc(tripRef, {
      collaborators: cleanForFirestore(updatedCollaborators),
      memberEmails: cleanForFirestore(updatedMemberEmails),
      memberUids: cleanForFirestore(updatedMemberUids),
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to add traveller in Firestore (saved in local store):', err);
  }

  // Create notification
  await generateTripNotification(
    tripId,
    trip.title,
    'Traveller Joined Journey',
    `${trip.ownerName} added ${capitalizedName} (${normalizedEmail}) as a Traveller.`,
    'member',
    'chat',
    trip.ownerName
  );

  notifyTripSubscribers();
  return updatedTrip;
}

// Add member/companion to a trip
export async function addMemberToTrip(
  tripId: string,
  member: TripCollaborator,
  tripTitle?: string
): Promise<void> {
  let existing = inMemoryTrips.find((t) => t.id === tripId);
  if (!existing) {
    try {
      const snap = await getDoc(doc(db, 'trips', tripId));
      if (snap.exists()) existing = snap.data() as Trip;
    } catch (e) {}
  }

  const currentCollabs = existing?.collaborators || [];
  // Enforce role: if not the owner, role is 'traveller'
  const isOwner = existing && (existing.ownerId === member.uid || (existing.ownerEmail && member.email && existing.ownerEmail.toLowerCase() === member.email.toLowerCase()));
  const memberWithEnforcedRole: TripCollaborator = {
    ...member,
    role: isOwner ? 'planner' : 'traveller'
  };

  const updatedCollabs = [...currentCollabs.filter((c) => c.uid !== member.uid), memberWithEnforcedRole];
  const updatedMemberUids = Array.from(new Set([...(existing?.memberUids || []), member.uid]));
  const updatedMemberEmails = Array.from(
    new Set([...(existing?.memberEmails || []).map((e) => e.toLowerCase()), member.email.toLowerCase()])
  );

  const updates: Partial<Trip> = {
    collaborators: updatedCollabs,
    memberUids: updatedMemberUids,
    memberEmails: updatedMemberEmails,
    updatedAt: new Date().toISOString()
  };

  await updateTrip(tripId, updates);

  await generateTripNotification(
    tripId,
    tripTitle || existing?.title || 'Trip',
    'Traveller Joined Journey',
    `${member.name} joined as a Traveller!`,
    'member',
    'chat',
    member.name
  );
}

// ---------------- NOTIFICATIONS ----------------

export function subscribeTripNotifications(
  tripId: string,
  onData: (notifs: TripNotification[]) => void
): Unsubscribe {
  // Emit local notifications first
  const localNotifs = getStoredNotifications(tripId);
  if (localNotifs.length > 0) {
    onData(localNotifs);
  }

  try {
    const notifsRef = collection(db, 'trips', tripId, 'notifications');
    return onSnapshot(
      notifsRef,
      (snapshot) => {
        const items: TripNotification[] = [];
        snapshot.forEach((docSnap) => items.push(docSnap.data() as TripNotification));
        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Cache them
        items.forEach((item) => saveStoredNotification(item));
        onData(items);
      },
      () => {
        // Fallback to local
        onData(getStoredNotifications(tripId));
      }
    );
  } catch (err) {
    onData(getStoredNotifications(tripId));
    return () => {};
  }
}

export async function addTripNotification(tripId: string, notification: TripNotification): Promise<void> {
  saveStoredNotification(notification);
  try {
    const notifRef = doc(db, 'trips', tripId, 'notifications', notification.id);
    await setDoc(notifRef, cleanForFirestore(notification));
  } catch (err) {
    console.warn('Notification stored locally:', err);
  }
}

export async function generateTripNotification(
  tripId: string,
  tripTitle: string,
  title: string,
  message: string,
  type: NotificationType = 'general',
  actionTab?: 'itinerary' | 'expenses' | 'wallet' | 'chat',
  actorName?: string
): Promise<TripNotification> {
  const notif: TripNotification = {
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    tripId,
    tripTitle,
    title,
    message,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    actionTab,
    actorName
  };

  await addTripNotification(tripId, notif);
  return notif;
}

export async function markNotificationAsRead(tripId: string, notifId: string): Promise<void> {
  // Update local
  try {
    const all = getStoredNotifications();
    const updated = all.map((n) => (n.id === notifId ? { ...n, read: true } : n));
    localStorage.setItem(LOCAL_NOTIFICATIONS_STORE, JSON.stringify(updated));
  } catch (e) {}

  try {
    const notifRef = doc(db, 'trips', tripId, 'notifications', notifId);
    await updateDoc(notifRef, { read: true });
  } catch (err) {}
}

export async function markAllNotificationsAsRead(tripId: string, notifIds: string[]): Promise<void> {
  try {
    const all = getStoredNotifications();
    const setIds = new Set(notifIds);
    const updated = all.map((n) => (setIds.has(n.id) ? { ...n, read: true } : n));
    localStorage.setItem(LOCAL_NOTIFICATIONS_STORE, JSON.stringify(updated));
  } catch (e) {}

  for (const id of notifIds) {
    try {
      const notifRef = doc(db, 'trips', tripId, 'notifications', id);
      await updateDoc(notifRef, { read: true });
    } catch (e) {}
  }
}

export async function deleteNotification(tripId: string, notifId: string): Promise<void> {
  try {
    const all = getStoredNotifications().filter((n) => n.id !== notifId);
    localStorage.setItem(LOCAL_NOTIFICATIONS_STORE, JSON.stringify(all));
  } catch (e) {}

  try {
    const notifRef = doc(db, 'trips', tripId, 'notifications', notifId);
    await deleteDoc(notifRef);
  } catch (e) {}
}

// ---------------- ACTIVITIES ----------------

export function subscribeActivities(
  tripId: string,
  onData: (items: Activity[]) => void
): Unsubscribe {
  // Emit local cache / seed activities immediately so UI loads with 0ms latency
  const initial = getStoredTripActivities(tripId);
  if (initial.length > 0) {
    onData(initial);
  }

  const actRef = collection(db, 'trips', tripId, 'activities');
  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      actRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: Activity[] = [];
          snapshot.forEach((docSnap) => items.push(docSnap.data() as Activity));
          items.sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));
          try {
            localStorage.setItem(`jkvoyage_activities_${tripId}`, JSON.stringify(items));
          } catch (e) {}
          onData(items);
        } else {
          onData(getStoredTripActivities(tripId));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/activities`);
        onData(getStoredTripActivities(tripId));
      }
    );
  } catch (err) {
    onData(getStoredTripActivities(tripId));
  }
  return unsub;
}

export async function addActivity(tripId: string, activity: Activity, tripTitle?: string): Promise<void> {
  try {
    const current = getStoredTripActivities(tripId);
    const updated = [...current.filter((a) => a.id !== activity.id), activity];
    localStorage.setItem(`jkvoyage_activities_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/activities/${activity.id}`;
  try {
    const actRef = doc(db, 'trips', tripId, 'activities', activity.id);
    await setDoc(actRef, cleanForFirestore(activity));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  // Create notification
  await generateTripNotification(
    tripId,
    tripTitle || 'Trip',
    'New Activity Scheduled',
    `Day ${activity.day}: "${activity.title}" added (${activity.location || 'Planned'})`,
    'itinerary',
    'itinerary',
    activity.createdBy
  );
}

export async function updateActivity(tripId: string, activity: Activity, tripTitle?: string): Promise<void> {
  try {
    const current = getStoredTripActivities(tripId);
    const updated = current.map((a) => (a.id === activity.id ? activity : a));
    localStorage.setItem(`jkvoyage_activities_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/activities/${activity.id}`;
  try {
    const actRef = doc(db, 'trips', tripId, 'activities', activity.id);
    await setDoc(actRef, cleanForFirestore(activity), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  // Create notification
  await generateTripNotification(
    tripId,
    tripTitle || 'Trip',
    'Activity Updated',
    `Day ${activity.day}: "${activity.title}" was updated`,
    'itinerary',
    'itinerary',
    activity.createdBy
  );
}

export async function deleteActivity(tripId: string, activityId: string): Promise<void> {
  try {
    const current = getStoredTripActivities(tripId);
    const updated = current.filter((a) => a.id !== activityId);
    localStorage.setItem(`jkvoyage_activities_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/activities/${activityId}`;
  try {
    const actRef = doc(db, 'trips', tripId, 'activities', activityId);
    await deleteDoc(actRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------- EXPENSES ----------------

export function subscribeExpenses(
  tripId: string,
  onData: (items: Expense[]) => void
): Unsubscribe {
  if (!activeExpenseSubscribers.has(tripId)) {
    activeExpenseSubscribers.set(tripId, new Set());
  }
  activeExpenseSubscribers.get(tripId)!.add(onData);

  const initial = getStoredTripExpenses(tripId);
  onData(initial);

  const handleCustomUpdate = (e: any) => {
    if (e?.detail?.tripId === tripId) {
      onData(getStoredTripExpenses(tripId));
    }
  };
  const handleStorage = (e: StorageEvent) => {
    if (e.key === `jkvoyage_expenses_${tripId}`) {
      onData(getStoredTripExpenses(tripId));
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('jkvoyage_expenses_updated', handleCustomUpdate);
    window.addEventListener('storage', handleStorage);
  }

  const expRef = collection(db, 'trips', tripId, 'expenses');
  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      expRef,
      (snapshot) => {
        // When Firestore returns docs, this snapshot is the authoritative real-time state
        const items: Expense[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Expense;
          items.push({ ...data, id: data.id || docSnap.id });
        });
        items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        try {
          localStorage.setItem(`jkvoyage_expenses_${tripId}`, JSON.stringify(items));
        } catch (e) {}
        onData(items);
      },
      (error) => {
        console.warn('Expenses snapshot notice, using local cache:', error);
        onData(getStoredTripExpenses(tripId));
      }
    );
  } catch (err) {
    onData(getStoredTripExpenses(tripId));
  }

  return () => {
    activeExpenseSubscribers.get(tripId)?.delete(onData);
    if (typeof window !== 'undefined') {
      window.removeEventListener('jkvoyage_expenses_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
    }
    unsub();
  };
}

export async function addExpense(tripId: string, expense: Expense, tripTitle?: string): Promise<void> {
  try {
    const current = getStoredTripExpenses(tripId);
    const updated = [expense, ...current.filter((e) => e.id !== expense.id)];
    localStorage.setItem(`jkvoyage_expenses_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  notifyExpenseSubscribers(tripId);

  const path = `trips/${tripId}/expenses/${expense.id}`;
  try {
    const expRef = doc(db, 'trips', tripId, 'expenses', expense.id);
    await setDoc(expRef, cleanForFirestore(expense));
  } catch (err) {
    console.warn('Expense saved locally; Firestore sync deferred:', err);
  }

  // Create notification
  await generateTripNotification(
    tripId,
    tripTitle || 'Trip',
    'New Expense Recorded',
    `₹${expense.amountINR.toLocaleString('en-IN')} paid by ${expense.paidBy} for "${expense.description}"`,
    'expense',
    'expenses',
    expense.paidBy
  );
}

export async function updateExpense(tripId: string, expense: Expense, tripTitle?: string): Promise<void> {
  try {
    const current = getStoredTripExpenses(tripId);
    const updated = current.map((e) => (e.id === expense.id ? expense : e));
    localStorage.setItem(`jkvoyage_expenses_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  notifyExpenseSubscribers(tripId);

  const path = `trips/${tripId}/expenses/${expense.id}`;
  try {
    const expRef = doc(db, 'trips', tripId, 'expenses', expense.id);
    await setDoc(expRef, cleanForFirestore(expense), { merge: true });
  } catch (err) {
    console.warn('Expense updated locally; Firestore sync deferred:', err);
  }

  // Create notification
  await generateTripNotification(
    tripId,
    tripTitle || 'Trip',
    'Expense Updated',
    `₹${expense.amountINR.toLocaleString('en-IN')} updated for "${expense.description}"`,
    'expense',
    'expenses',
    expense.paidBy
  );
}

export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  try {
    const current = getStoredTripExpenses(tripId);
    const updated = current.filter((e) => e.id !== expenseId);
    localStorage.setItem(`jkvoyage_expenses_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  notifyExpenseSubscribers(tripId);

  const path = `trips/${tripId}/expenses/${expenseId}`;
  try {
    const expRef = doc(db, 'trips', tripId, 'expenses', expenseId);
    await deleteDoc(expRef);
  } catch (err) {
    console.warn('Expense deleted locally; Firestore sync deferred:', err);
  }
}

// ---------------- DOCUMENTS & PASSES ----------------

export function subscribeDocuments(
  tripId: string,
  onData: (items: DigitalDocument[]) => void
): Unsubscribe {
  const initial = getStoredTripDocuments(tripId);
  onData(initial);

  const handleStorage = (e: StorageEvent) => {
    if (e.key === `jkvoyage_documents_${tripId}`) {
      onData(getStoredTripDocuments(tripId));
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  const docRef = collection(db, 'trips', tripId, 'documents');
  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      docRef,
      (snapshot) => {
        const items: DigitalDocument[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data() as DigitalDocument;
          items.push({ ...d, id: d.id || docSnap.id });
        });
        try {
          localStorage.setItem(`jkvoyage_documents_${tripId}`, JSON.stringify(items));
        } catch (e) {}
        onData(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/documents`);
        onData(getStoredTripDocuments(tripId));
      }
    );
  } catch (err) {
    onData(getStoredTripDocuments(tripId));
  }
  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    unsub();
  };
}

export async function addDocument(tripId: string, documentItem: DigitalDocument, tripTitle?: string): Promise<void> {
  try {
    const current = getStoredTripDocuments(tripId);
    const updated = [documentItem, ...current.filter((d) => d.id !== documentItem.id)];
    localStorage.setItem(`jkvoyage_documents_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/documents/${documentItem.id}`;
  try {
    const docRef = doc(db, 'trips', tripId, 'documents', documentItem.id);
    await Promise.race([
      setDoc(docRef, cleanForFirestore(documentItem)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 3500))
    ]);
  } catch (err) {
    console.warn('Firestore setDoc document warning (saved locally & to cloud storage):', err);
  }

  // Create notification
  try {
    await Promise.race([
      generateTripNotification(
        tripId,
        tripTitle || 'Trip',
        'Pass / Ticket Added',
        `New travel document "${documentItem.title}" uploaded to Wallet`,
        'wallet',
        'wallet'
      ),
      new Promise((res) => setTimeout(res, 2000))
    ]);
  } catch (e) {}
}

export async function updateDocument(tripId: string, documentItem: DigitalDocument, tripTitle?: string): Promise<void> {
  try {
    const current = getStoredTripDocuments(tripId);
    const updated = current.map((d) => (d.id === documentItem.id ? documentItem : d));
    localStorage.setItem(`jkvoyage_documents_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/documents/${documentItem.id}`;
  try {
    const docRef = doc(db, 'trips', tripId, 'documents', documentItem.id);
    await setDoc(docRef, cleanForFirestore(documentItem), { merge: true });
  } catch (err) {
    console.warn('Firestore update document warning:', err);
  }

  // Create notification
  try {
    await generateTripNotification(
      tripId,
      tripTitle || 'Trip',
      'Pass / Ticket Updated',
      `Travel document "${documentItem.title}" was updated in Wallet`,
      'wallet',
      'wallet'
    );
  } catch (e) {}
}

export async function deleteDocument(tripId: string, docId: string): Promise<void> {
  try {
    const current = getStoredTripDocuments(tripId);
    const updated = current.filter((d) => d.id !== docId);
    localStorage.setItem(`jkvoyage_documents_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/documents/${docId}`;
  try {
    const docRef = doc(db, 'trips', tripId, 'documents', docId);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------- PACKING LIST ----------------

export function subscribePackingItems(
  tripId: string,
  onData: (items: PackingItem[]) => void
): Unsubscribe {
  const initial = getStoredTripPacking(tripId);
  if (initial.length > 0) {
    onData(initial);
  }

  const packRef = collection(db, 'trips', tripId, 'packingItems');
  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      packRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: PackingItem[] = [];
          snapshot.forEach((docSnap) => items.push(docSnap.data() as PackingItem));
          try {
            localStorage.setItem(`jkvoyage_packing_${tripId}`, JSON.stringify(items));
          } catch (e) {}
          onData(items);
        } else {
          onData(getStoredTripPacking(tripId));
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/packingItems`);
        onData(getStoredTripPacking(tripId));
      }
    );
  } catch (err) {
    onData(getStoredTripPacking(tripId));
  }
  return unsub;
}

export async function togglePackingItem(
  tripId: string,
  itemId: string,
  packed: boolean
): Promise<void> {
  const path = `trips/${tripId}/packingItems/${itemId}`;
  try {
    const packRef = doc(db, 'trips', tripId, 'packingItems', itemId);
    await updateDoc(packRef, { packed });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

export async function addPackingItem(tripId: string, item: PackingItem): Promise<void> {
  const path = `trips/${tripId}/packingItems/${item.id}`;
  try {
    const packRef = doc(db, 'trips', tripId, 'packingItems', item.id);
    await setDoc(packRef, cleanForFirestore(item));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function deletePackingItem(tripId: string, itemId: string): Promise<void> {
  const path = `trips/${tripId}/packingItems/${itemId}`;
  try {
    const packRef = doc(db, 'trips', tripId, 'packingItems', itemId);
    await deleteDoc(packRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

// ---------------- GROUP CHAT MESSAGES ----------------

export function subscribeMessages(
  tripId: string,
  onData: (items: ChatMessage[]) => void
): Unsubscribe {
  if (!activeMessageSubscribers.has(tripId)) {
    activeMessageSubscribers.set(tripId, new Set());
  }
  activeMessageSubscribers.get(tripId)!.add(onData);

  // Emit local cached messages immediately so room is responsive without latency
  const initial = getStoredTripMessages(tripId);
  onData(initial);

  const handleCustomUpdate = (e: any) => {
    if (e?.detail?.tripId === tripId) {
      onData(getStoredTripMessages(tripId));
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('jkvoyage_messages_updated', handleCustomUpdate);
  }

  const msgRef = collection(db, 'trips', tripId, 'messages');
  let unsub: Unsubscribe = () => {};

  try {
    unsub = onSnapshot(
      msgRef,
      (snapshot) => {
        const firestoreItems: ChatMessage[] = [];
        snapshot.forEach((docSnap) => firestoreItems.push(docSnap.data() as ChatMessage));

        // Merge firestore messages with local cache
        const localItems = getStoredTripMessages(tripId);
        const map = new Map<string, ChatMessage>();
        localItems.forEach((m) => map.set(m.id, m));
        firestoreItems.forEach((m) => map.set(m.id, m));

        const combined = Array.from(map.values());
        combined.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        try {
          localStorage.setItem(`jkvoyage_messages_${tripId}`, JSON.stringify(combined));
        } catch (e) {}

        onData(combined);
      },
      (error) => {
        console.warn('Chat messages snapshot notice, using local cache:', error);
        onData(getStoredTripMessages(tripId));
      }
    );
  } catch (err) {
    console.warn('Chat listener subscription notice:', err);
    onData(getStoredTripMessages(tripId));
  }

  return () => {
    activeMessageSubscribers.get(tripId)?.delete(onData);
    if (typeof window !== 'undefined') {
      window.removeEventListener('jkvoyage_messages_updated', handleCustomUpdate);
    }
    unsub();
  };
}

export async function sendChatMessage(tripId: string, msg: ChatMessage, tripTitle?: string): Promise<void> {
  // 1. Immediately store in local cache so sender sees the message without waiting
  try {
    const current = getStoredTripMessages(tripId);
    const updated = [...current.filter((m) => m.id !== msg.id), msg];
    updated.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    localStorage.setItem(`jkvoyage_messages_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  notifyMessageSubscribers(tripId);

  // 2. Persist to Firestore subcollection
  try {
    const msgRef = doc(db, 'trips', tripId, 'messages', msg.id);
    await setDoc(msgRef, cleanForFirestore(msg));
  } catch (err) {
    console.warn('Failed to sync chat message to Firestore (kept in local session):', err);
  }

  // 3. Generate chat notification for other members without failing message send
  try {
    await generateTripNotification(
      tripId,
      tripTitle || 'Trip',
      `Message from ${msg.senderName}`,
      msg.text.length > 70 ? msg.text.slice(0, 70) + '...' : msg.text,
      'chat',
      'chat',
      msg.senderName
    );
  } catch (notifErr) {
    console.warn('Could not generate chat notification:', notifErr);
  }
}

// ---------------- CHANGE REQUESTS & APPROVALS (CREATOR ONLY MUTATIONS) ----------------

export function subscribeChangeRequests(
  tripId: string,
  onData: (items: TripChangeRequest[]) => void
): Unsubscribe {
  const reqRef = collection(db, 'trips', tripId, 'changeRequests');
  return onSnapshot(
    reqRef,
    (snapshot) => {
      const items: TripChangeRequest[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as TripChangeRequest));
      items.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `trips/${tripId}/changeRequests`);
    }
  );
}

export async function submitChangeRequest(
  tripId: string,
  request: TripChangeRequest,
  tripTitle?: string
): Promise<void> {
  const path = `trips/${tripId}/changeRequests/${request.id}`;
  try {
    const reqRef = doc(db, 'trips', tripId, 'changeRequests', request.id);
    await setDoc(reqRef, cleanForFirestore(request));
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }

  // Create notification for planner
  await generateTripNotification(
    tripId,
    tripTitle || 'Trip',
    'Proposal Awaiting Approval',
    `${request.requestedByName} proposed: "${request.title}" (${request.type})`,
    'approval',
    'itinerary',
    request.requestedByName
  );
}

export async function updateChangeRequestStatus(
  tripId: string,
  requestId: string,
  status: 'approved' | 'rejected',
  requestTitle?: string,
  reviewNote?: string,
  tripTitle?: string
): Promise<void> {
  const path = `trips/${tripId}/changeRequests/${requestId}`;
  try {
    const reqRef = doc(db, 'trips', tripId, 'changeRequests', requestId);
    await updateDoc(reqRef, {
      status,
      reviewedAt: new Date().toISOString(),
      reviewNote: reviewNote || ''
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }

  // Create notification
  await generateTripNotification(
    tripId,
    tripTitle || 'Trip',
    status === 'approved' ? 'Proposal Approved' : 'Proposal Rejected',
    `"${requestTitle || 'Change request'}" was ${status} by the trip planner.${reviewNote ? ' Note: ' + reviewNote : ''}`,
    'approval',
    'itinerary'
  );
}

// ---------------- JOURNAL & MEMORIES (TRIP DIARY & DOSSIER) ----------------

export function getStoredJournalEntries(tripId: string): JournalEntry[] {
  try {
    const raw = localStorage.getItem(`jkvoyage_journal_${tripId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

export function subscribeJournalEntries(
  tripId: string,
  onData: (items: JournalEntry[]) => void
): Unsubscribe {
  // Emit locally cached entries first for instant UI response
  const cached = getStoredJournalEntries(tripId);
  if (cached.length > 0) {
    onData(cached);
  }

  const memRef = collection(db, 'trips', tripId, 'memories');
  let unsub: Unsubscribe = () => {};
  try {
    unsub = onSnapshot(
      memRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const items: JournalEntry[] = [];
          snapshot.forEach((docSnap) => items.push(docSnap.data() as JournalEntry));
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          try {
            localStorage.setItem(`jkvoyage_journal_${tripId}`, JSON.stringify(items));
          } catch (e) {}
          onData(items);
        } else {
          onData(getStoredJournalEntries(tripId));
        }
      },
      (error) => {
        console.warn('Firestore memories subscription warning:', error);
        onData(getStoredJournalEntries(tripId));
      }
    );
  } catch (err) {
    onData(getStoredJournalEntries(tripId));
  }
  return unsub;
}

export async function addJournalEntry(
  tripId: string,
  entry: JournalEntry,
  tripTitle?: string
): Promise<void> {
  // Optimistically store in localStorage
  try {
    const current = getStoredJournalEntries(tripId);
    const updated = [entry, ...current.filter((e) => e.id !== entry.id)];
    localStorage.setItem(`jkvoyage_journal_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/memories/${entry.id}`;
  try {
    const memRef = doc(db, 'trips', tripId, 'memories', entry.id);
    await Promise.race([
      setDoc(memRef, cleanForFirestore(entry)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 3500))
    ]);
  } catch (err) {
    console.warn('Firestore setDoc memory warning (saved locally & to cloud storage):', err);
  }

  // Create notification
  try {
    await Promise.race([
      generateTripNotification(
        tripId,
        tripTitle || 'Trip',
        'New Reflection Recorded',
        `${entry.authorName} captured a memory: "${entry.title}" (Day ${entry.day})`,
        'general',
        'itinerary',
        entry.authorName
      ),
      new Promise((res) => setTimeout(res, 2000))
    ]);
  } catch (e) {}
}

export async function deleteJournalEntry(tripId: string, entryId: string): Promise<void> {
  try {
    const current = getStoredJournalEntries(tripId);
    const updated = current.filter((e) => e.id !== entryId);
    localStorage.setItem(`jkvoyage_journal_${tripId}`, JSON.stringify(updated));
  } catch (e) {}

  const path = `trips/${tripId}/memories/${entryId}`;
  try {
    const memRef = doc(db, 'trips', tripId, 'memories', entryId);
    await deleteDoc(memRef);
  } catch (err) {
    console.warn('Firestore deleteDoc memory warning:', err);
  }
}

