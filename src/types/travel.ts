export type TripStatus = 'planning' | 'ongoing' | 'completed';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  homeCity?: string;
  address?: string;
  phone?: string;
  aadhaarNumber?: string; // 12-digit UIDAI Aadhaar Card
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  passportOrId?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  travelStyle?: string;
  dietaryPreference?: string;
  bloodGroup?: string;
  bio?: string;
  theme?: 'light' | 'dark';
  preferredCurrency?: string;
  registrationCompleted?: boolean;
  isPro?: boolean;
  proPlan?: string;
  proPaymentId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TravelerRegistrationData {
  displayName: string;
  email: string;
  password?: string;
  phone: string;
  homeCity: string;
  address?: string;
  aadhaarNumber: string; // 12-digit Indian Aadhaar Card (Compulsory for registration)
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  passportOrId?: string;
  emergencyContactName: string;
  emergencyContactRelation?: string;
  emergencyContactPhone: string;
  travelStyle: string;
  dietaryPreference: string;
  bloodGroup: string;
  preferredCurrency: string;
  photoURL?: string;
  bio?: string;
}

export interface TripCollaborator {
  uid: string;
  name: string;
  email: string;
  role: 'planner' | 'traveller' | 'collaborator' | 'Co-Planner' | 'Companion' | 'Explorer' | 'Photographer';
  phone?: string;
  avatar?: string;
  addedAt?: string;
}

export interface Trip {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail?: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetINR: number;
  coverImage?: string;
  status: TripStatus;
  notes?: string;
  collaborators?: TripCollaborator[];
  memberUids?: string[];
  memberEmails?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export type NotificationType =
  | 'member'
  | 'itinerary'
  | 'expense'
  | 'wallet'
  | 'chat'
  | 'approval'
  | 'budget'
  | 'general';

export interface TripNotification {
  id: string;
  tripId: string;
  tripTitle: string;
  title: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  actionTab?: 'itinerary' | 'expenses' | 'wallet' | 'chat';
  actorName?: string;
}

export type ActivityCategory = 'flight' | 'hotel' | 'sightseeing' | 'food' | 'transport' | 'activity';

export interface Activity {
  id: string;
  tripId: string;
  day: number;
  time: string;
  title: string;
  category: ActivityCategory;
  location: string;
  costINR: number;
  notes?: string;
  createdBy: string;
  createdAt?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export type ExpenseCategory = 'food' | 'stay' | 'travel' | 'tickets' | 'shopping' | 'other';
export type ExpenseTransactionType = 'expense' | 'payment_received' | 'deposit';

export interface ExpenseSplit {
  userId?: string;
  userName: string;
  amount: number;
  settled?: boolean;
}

export interface Expense {
  id: string;
  tripId: string;
  description: string;
  amountINR: number;
  paidBy: string;
  paidByUid: string;
  category: ExpenseCategory;
  date: string;
  createdBy: string;
  createdAt?: string;
  splitMode?: 'all' | 'single' | 'custom';
  splitTargetUser?: string;
  splitWithUsers?: string[];
  splits?: ExpenseSplit[];
  transactionType?: ExpenseTransactionType;
  receivedBy?: string;
  receivedByUid?: string;
  paymentMethod?: 'UPI' | 'Cash' | 'Bank Transfer' | 'Card';
}

export type ChangeRequestType = 'expense' | 'ticket' | 'activity' | 'packing';

export interface TripChangeRequest {
  id: string;
  tripId: string;
  type: ChangeRequestType;
  title: string;
  description: string;
  data: any;
  requestedByUid: string;
  requestedByName: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNote?: string;
}

export type DocumentType = 'passport' | 'visa' | 'ticket' | 'insurance' | 'hotel_voucher' | 'id_card' | 'other';

export interface DigitalDocument {
  id: string;
  tripId: string;
  title: string;
  docType: DocumentType;
  docNumber?: string;
  expiryDate?: string;
  notes?: string;
  ownerId: string;
  ownerName?: string;
  isPrivate?: boolean;
  createdAt?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: 'pdf' | 'image' | 'other';
  fileSize?: string;
}

export type PackingCategory = 'essentials' | 'clothing' | 'electronics' | 'toiletries' | 'meds' | 'documents';

export interface PackingItem {
  id: string;
  tripId: string;
  item: string;
  category: PackingCategory;
  packed: boolean;
  createdBy: string;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  tripId: string;
  senderId: string;
  senderName: string;
  senderEmail?: string;
  senderPhoto?: string;
  text: string;
  createdAt: string;
}

export type PlaceCategory = 'attraction' | 'food' | 'hidden_gem' | 'culture' | 'nightlife';

export interface ExplorePlace {
  id: string;
  title: string;
  category: PlaceCategory;
  destination: string;
  rating: number;
  reviewCount: number;
  estCostINR: number;
  address: string;
  image: string;
  insiderTip: string;
  bestTime: string;
  tags: string[];
}

export interface JournalEntry {
  id: string;
  tripId: string;
  day: number;
  date: string;
  title: string;
  content: string;
  rating: number; // 1 to 5 stars
  mood: string;
  photoUrl?: string;
  photos?: string[];
  authorName: string;
  authorId?: string;
  createdAt: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // array of user UIDs
}

export interface GroupPoll {
  id: string;
  tripId: string;
  question: string;
  options: PollOption[];
  createdBy: string;
  createdByName: string;
  createdAt: string;
  active: boolean;
}

export interface EmergencyMedicalInfo {
  bloodGroup?: string;
  iceContactName?: string;
  iceContactPhone?: string;
  insuranceNumber?: string;
  insuranceProvider?: string;
  allergies?: string;
  notes?: string;
}
