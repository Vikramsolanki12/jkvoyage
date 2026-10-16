export type ActivityCategory =
  | 'Sightseeing'
  | 'Dining'
  | 'Hotel'
  | 'Transit'
  | 'Adventure'
  | 'Leisure'
  | 'Culture'
  | 'Nightlife';

export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface Activity {
  id: string;
  title: string;
  category: ActivityCategory;
  timeSlot: TimeSlot;
  time: string;
  location: string;
  address?: string;
  cost?: number;
  currency?: string;
  status: 'planned' | 'completed' | 'skipped';
  notes?: string;
  bookingRef?: string;
  photoUrl?: string;
  votes?: { up: number; down: number };
  assignedTravellerIds?: string[];
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  note?: string;
  activities: Activity[];
}

export type MainTabType = 'itinerary' | 'places' | 'expenses' | 'wallet' | 'hub';

export interface Traveller {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'Organizer' | 'Co-Lead' | 'Explorer' | 'Finance' | 'Creator (Admin)';
  phone?: string;
  emergencyContact?: string;
  dietary?: string;
  color?: string;
}

export type SplitMode = 'equal' | 'selected' | 'exact' | 'percentage' | 'shares' | 'single';

export interface ExpenseSplit {
  travellerId: string;
  amount: number;
  percentage?: number;
  shares?: number;
  settled?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  currency: string;
  category: 'Stay' | 'Food' | 'Transport' | 'Activities' | 'Shopping' | 'General';
  date: string;
  paidById: string;
  splitType: SplitMode;
  splits: ExpenseSplit[];
  receiptUrl?: string;
  notes?: string;
}

export interface SettlementDebt {
  fromTravellerId: string;
  toTravellerId: string;
  amount: number;
  currency: string;
  settled: boolean;
  method?: string;
  settledAt?: string;
}

export interface Review {
  id: string;
  userName: string;
  userAvatar: string;
  rating: number;
  date: string;
  comment: string;
  photos?: string[];
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'hotel' | 'restaurant' | 'attraction' | 'cafe' | 'nightlife';
  rating: number;
  reviewsCount: number;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  distance: string;
  address: string;
  image: string;
  description: string;
  openingHours: string;
  tags: string[];
  signatureHighlight: string;
  userReviews: Review[];
  lat?: number;
  lng?: number;
}

export interface WalletItem {
  id: string;
  type: 'boarding-pass' | 'hotel-voucher' | 'train-ticket' | 'event-pass' | 'visa-permit';
  title: string;
  subtitle: string;
  issuer: string;
  confirmationCode: string;
  barcode: string;
  qrValue: string;
  validDates: string;
  seatOrRoom?: string;
  terminalGate?: string;
  status: 'active' | 'archived';
  accentColor: string;
  details: Record<string, string>;
  ownerId?: string;
}

export interface TravelDocument {
  id: string;
  type: 'passport' | 'visa' | 'insurance' | 'id-card' | 'vaccination' | 'booking-confirmation';
  title: string;
  holderName: string;
  docNumber: string;
  expiryDate: string;
  issuerCountry: string;
  fileUrl?: string;
  notes?: string;
  isVerified: boolean;
  uploaderId?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'flight' | 'expense' | 'itinerary' | 'weather' | 'chat' | 'emergency';
  read: boolean;
  actionLabel?: string;
}

export interface EmailItem {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  bodyHtml: string;
  date: string;
  isRead: boolean;
  category: 'airline' | 'hotel' | 'insurance' | 'invite';
}

export interface WeatherDay {
  day: string;
  temp: number;
  icon: string;
  condition: string;
}

export interface WeatherInfo {
  destination: string;
  temp: number;
  condition: string;
  icon: string;
  high: number;
  low: number;
  humidity: number;
  wind: string;
  uvIndex: number;
  clothingAdvice: string;
  forecast: WeatherDay[];
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  text: string;
  timestamp: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  photoUrl?: string;
}

export interface TravelMemory {
  id: string;
  title: string;
  date: string;
  location: string;
  photoUrl: string;
  note: string;
  mood: 'happy' | 'amazed' | 'peaceful' | 'excited' | 'foodie';
  taggedTravellerIds: string[];
}

export interface ChecklistItem {
  id: string;
  task: string;
  category: 'pre-departure' | 'packing' | 'post-trip';
  completed: boolean;
  assignedTo?: string;
  notes?: string;
}

export interface RefundClaim {
  id: string;
  itemTitle: string;
  provider: string;
  amount: number;
  currency: string;
  status: 'requested' | 'processing' | 'refunded' | 'rejected';
  bookingRef: string;
  requestDate: string;
  refundMethod: string;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  homeCurrency: string;
  bio?: string;
  authMethod: 'mobile' | 'email' | 'google';
  passportNumber?: string;
  emergencyContact?: string;
  isPro?: boolean;
}

export interface Trip {
  id: string;
  creatorId: string;
  title: string;
  destination: string;
  country: string;
  flag: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  currency: string;
  totalBudget: number;
  currentUserId: string;
  travellers: Traveller[];
  days: DayPlan[];
  expenses: Expense[];
  settlements: SettlementDebt[];
  nearbyPlaces: NearbyPlace[];
  walletItems: WalletItem[];
  documents: TravelDocument[];
  notifications: NotificationItem[];
  emails: EmailItem[];
  weather: WeatherInfo;
  memories: TravelMemory[];
  checklist: ChecklistItem[];
  refundClaims: RefundClaim[];
  sharedCode: string;
  notes?: string;
}
