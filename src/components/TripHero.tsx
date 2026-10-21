import React, { useState } from "react";

import {
  Calendar,
  MapPin,
  IndianRupee,
  Sparkles,
  Trash2,
  Clock,
  FileCheck,
  Edit2,
  X,
  UserPlus,
  UserMinus,
  Loader2,
  ShieldCheck,
  Compass,
  Users,
  Crown,
  CheckCircle2,
  AlertCircle,
  Camera,
  Maximize2,
  Eye,
  Upload,
  HandCoins
} from "lucide-react";

import {
  Trip,
  TripStatus,
  TripCollaborator,
  Activity,
  Expense,
  PackingItem,
} from "../types/travel.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { addTravellerByEmail } from "../services/travelService.ts";
import { resolvePlacePhoto } from "../data/explorePlaces.ts";
import { compressImageFile, uploadPhotoFile } from "../utils/fileUpload.ts";

interface TripHeroProps {
  trip: Trip;
  activities: Activity[];
  expenses: Expense[];
  packingItems: PackingItem[];
  isTripCreator?: boolean;
  pendingRequestsCount?: number;
  onOpenApprovals?: () => void;
  onUpdateStatus: (newStatus: TripStatus) => void;
  onUpdateTrip?: (updates: Partial<Trip>) => Promise<void>;
  onDeleteTrip: () => void;
  onRemoveTraveller?: (emailOrUid: string) => Promise<void>;
  onOpenAiPlanner: () => void;
}

export const TripHero: React.FC<TripHeroProps> = ({
  trip,
  activities,
  expenses,
  packingItems,
  isTripCreator,
  pendingRequestsCount = 0,
  onOpenApprovals,
  onUpdateStatus,
  onUpdateTrip,
  onDeleteTrip,
  onRemoveTraveller,
  onOpenAiPlanner,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addTravellerModalOpen, setAddTravellerModalOpen] = useState(false);
  const [travellerToRemove, setTravellerToRemove] = useState<TripCollaborator | null>(null);
  const [removingTraveller, setRemovingTraveller] = useState(false);
  const [newTravellerName, setNewTravellerName] = useState("");
  const [newTravellerEmail, setNewTravellerEmail] = useState("");
  const [newTravellerPhone, setNewTravellerPhone] = useState("");
  const [travellerError, setTravellerError] = useState("");
  const [travellerSaved, setTravellerSaved] = useState(false);
  const [addingTraveller, setAddingTraveller] = useState(false);

  // Exact rule: Creator is ALWAYS Trip Planner. Others are ALWAYS Travellers.
  const isTripPlanner = Boolean(
    isTripCreator ||
    (currentUser &&
      trip &&
      (trip.ownerId === currentUser.uid ||
        (trip.ownerEmail &&
          currentUser.email &&
          trip.ownerEmail.trim().toLowerCase() === currentUser.email.trim().toLowerCase())))
  );

  // =========================================================
  // Edit form state
  // =========================================================

  const [editTitle, setEditTitle] = useState(trip.title);
  const [editDestination, setEditDestination] = useState(trip.destination);
  const [editStartDate, setEditStartDate] = useState(trip.startDate);
  const [editEndDate, setEditEndDate] = useState(trip.endDate);
  const [editBudgetINR, setEditBudgetINR] = useState(trip.budgetINR);
  const [editNotes, setEditNotes] = useState(trip.notes || "");
  const [editCover, setEditCover] = useState(trip.coverImage || "");
  const [savingEdit, setSavingEdit] = useState(false);

  // High-clarity hero photo controls
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showChangeCoverModal, setShowChangeCoverModal] = useState(false);
  const [coverInputUrl, setCoverInputUrl] = useState("");
  const [savingCover, setSavingCover] = useState(false);

  const heroImageUrl = trip.coverImage?.trim() || resolvePlacePhoto(trip.title, trip.destination, 'hero');

  const handleUpdateCover = async (newUrl: string) => {
    if (!onUpdateTrip || !newUrl.trim()) return;
    setSavingCover(true);
    try {
      await onUpdateTrip({ coverImage: newUrl.trim() });
      setShowChangeCoverModal(false);
      setCoverInputUrl("");
    } catch (err) {
      console.error("Failed to update cover photo:", err);
    } finally {
      setSavingCover(false);
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpdateTrip) return;

    setSavingCover(true);
    try {
      const uploadRes = await uploadPhotoFile(file, trip.id, trip.ownerId);
      await onUpdateTrip({ coverImage: uploadRes.url });
      setShowChangeCoverModal(false);
      setCoverInputUrl("");
    } catch (err) {
      console.error("Failed to upload cover photo:", err);
    } finally {
      setSavingCover(false);
    }
  };

  // =========================================================
  // Budget & Personal Contribution calculations
  // =========================================================

  const totalSpent = expenses.reduce(
    (sum, item) => sum + (item.amountINR || 0),
    0,
  );

  const remainingBudget = trip.budgetINR - totalSpent;

  const budgetPercent = Math.min(
    100,
    Math.round((totalSpent / Math.max(1, trip.budgetINR)) * 100),
  );

  // Helper to identify if a transaction relates to current user
  const isMyIdentity = (nameOrUid?: string): boolean => {
    if (!nameOrUid) return false;
    const clean = nameOrUid.trim().toLowerCase();
    if (clean === "you") return true;
    if (currentUser?.uid && nameOrUid === currentUser.uid) return true;
    if (currentUser?.email && clean === currentUser.email.trim().toLowerCase()) return true;
    if (userProfile?.displayName && clean === userProfile.displayName.trim().toLowerCase()) return true;
    if (currentUser?.displayName && clean === currentUser.displayName.trim().toLowerCase()) return true;
    return false;
  };

  // Personal contribution calculations for Traveller:
  const myPaidExpenses = expenses
    .filter(
      (e) =>
        (!e.transactionType || e.transactionType === "expense" || e.transactionType === "deposit") &&
        (isMyIdentity(e.paidBy) || isMyIdentity(e.paidByUid) || isMyIdentity(e.createdBy))
    )
    .reduce((sum, item) => sum + (item.amountINR || 0), 0);

  const myPaymentsMade = expenses
    .filter(
      (e) =>
        e.transactionType === "payment_received" &&
        (isMyIdentity(e.paidBy) || isMyIdentity(e.paidByUid))
    )
    .reduce((sum, item) => sum + (item.amountINR || 0), 0);

  const myPaymentsReceived = expenses
    .filter(
      (e) =>
        e.transactionType === "payment_received" &&
        (isMyIdentity(e.receivedBy) || isMyIdentity(e.receivedByUid))
    )
    .reduce((sum, item) => sum + (item.amountINR || 0), 0);

  const myTotalContribution = myPaidExpenses + myPaymentsMade;

  const activeMembersCount = Math.max(1, (trip.collaborators?.length || 0) + 1);
  const myOwedShare = expenses
    .filter((e) => !e.transactionType || e.transactionType === "expense")
    .reduce((sum, e) => {
      if (e.splitMode === "single") {
        return sum + (isMyIdentity(e.splitTargetUser) ? e.amountINR : 0);
      }
      if (e.splitMode === "custom" && Array.isArray(e.splitWithUsers)) {
        return sum + (e.splitWithUsers.some(isMyIdentity) ? e.amountINR / Math.max(1, e.splitWithUsers.length) : 0);
      }
      return sum + e.amountINR / activeMembersCount;
    }, 0);

  const myNetBalance = myTotalContribution - myOwedShare - myPaymentsReceived;

  // =========================================================
  // Packing calculations
  // =========================================================

  const packedCount = packingItems.filter((item) => item.packed).length;

  const packingPercent =
    packingItems.length > 0
      ? Math.round((packedCount / packingItems.length) * 100)
      : 0;

  // =========================================================
  // Save edited trip
  // =========================================================

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onUpdateTrip) {
      return;
    }

    if (!editTitle.trim()) {
      return;
    }

    if (!editDestination.trim()) {
      return;
    }

    if (editStartDate && editEndDate && editEndDate < editStartDate) {
      alert("End date cannot be before start date.");
      return;
    }

    setSavingEdit(true);

    try {
      await onUpdateTrip({
        title: editTitle.trim(),
        destination: editDestination.trim(),
        startDate: editStartDate,
        endDate: editEndDate,
        budgetINR: Number(editBudgetINR),
        notes: editNotes.trim(),
        coverImage: editCover.trim(),
      });

      setEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update trip:", error);
    } finally {
      setSavingEdit(false);
    }
  };

  // =========================================================
  // Status colors
  // =========================================================

  const statusColors: Record<TripStatus, string> = {
    planning:
      "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/30",

    ongoing:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",

    completed: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
  };

  // =========================================================
  // Render
  // =========================================================

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-colors dark:border-slate-800 dark:bg-slate-900">
      {/* =====================================================
          HERO COVER - Crystal Clear High Definition
      ====================================================== */}

      <div className="relative min-h-[360px] sm:min-h-[360px] md:h-96 w-full overflow-hidden bg-slate-950 group flex flex-col justify-between p-4 sm:p-6 pb-6">
        {/* Cover image */}
        <img
          src={heroImageUrl}
          alt={trip.destination}
          className="absolute inset-0 h-full w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-102"
        />

        {/* Crisp subtle overlay for text readability without obscuring clarity */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/45 to-black/30" />

        {/* =================================================
            TOP BADGES
        ================================================== */}

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          {/* Status + Dates */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider backdrop-blur-md ${
                statusColors[trip.status]
              }`}
            >
              ● {trip.status}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white backdrop-blur-md">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              <span className="truncate max-w-[200px] sm:max-w-none">{trip.startDate} → {trip.endDate}</span>
            </span>
          </div>

          {/* Top actions */}
          <div className="flex items-center gap-2">
            {/* View Photo in Full Screen */}
            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 p-2 text-xs text-slate-200 backdrop-blur-md transition-colors hover:bg-slate-800 cursor-pointer"
              title="View full-resolution trip photo"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Photo</span>
            </button>

            {/* Change Cover Photo - Trip Planner Only */}
            {isTripPlanner && onUpdateTrip && (
              <button
                type="button"
                onClick={() => {
                  setCoverInputUrl(trip.coverImage || "");
                  setShowChangeCoverModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/80 p-2 text-xs text-sky-300 backdrop-blur-md transition-colors hover:bg-slate-800 cursor-pointer"
                title="Change cover photo (Trip Planner)"
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Change Photo</span>
              </button>
            )}

            {/* Edit Trip Details - Trip Planner Only */}
            {isTripPlanner && (
              <button
                type="button"
                onClick={() => {
                  setEditTitle(trip.title);
                  setEditDestination(trip.destination);
                  setEditStartDate(trip.startDate);
                  setEditEndDate(trip.endDate);
                  setEditBudgetINR(trip.budgetINR);
                  setEditNotes(trip.notes || "");
                  setEditCover(trip.coverImage || "");
                  setEditModalOpen(true);
                }}
                className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-2 text-sky-400 backdrop-blur-md transition-colors hover:bg-slate-800 cursor-pointer"
                title="Edit Trip Details (Trip Planner)"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Delete Trip - Trip Planner Only */}
            {isTripPlanner && (
              <button
                type="button"
                onClick={onDeleteTrip}
                className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2 text-rose-400 backdrop-blur-md transition-colors hover:bg-rose-500/20 cursor-pointer"
                title="Delete trip (Trip Planner)"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            HERO DETAILS
        ================================================== */}

        <div className="relative z-10 mt-auto pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {/* Trip information */}
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{trip.destination}</span>
              </div>

              <h1 className="text-xl font-extrabold tracking-tight text-white drop-shadow-md sm:text-3xl lg:text-4xl break-words">
                {trip.title}
              </h1>

              {trip.notes && (
                <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-slate-200 sm:text-sm">
                  {trip.notes}
                </p>
              )}
            </div>

            {/* =================================================
                HERO ACTIONS
            ================================================== */}

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Creator vs Traveller Fixed Role Badge */}
              {isTripPlanner ? (
                <div
                  className="flex items-center gap-1.5 rounded-xl border border-emerald-400/50 bg-emerald-500/25 px-3 py-2 text-xs font-black text-emerald-200 backdrop-blur-md shadow-sm"
                  title="Trip Planner (Creator of this journey - full planning rights)"
                >
                  <Crown className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                  <span>👑 Trip Planner</span>
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/20 px-3 py-2 text-xs font-bold text-sky-200 backdrop-blur-md shadow-sm"
                  title="Traveller (Joined member of this journey)"
                >
                  <Users className="h-3.5 w-3.5 text-sky-300 shrink-0" />
                  <span>🎒 Traveller</span>
                </div>
              )}

              {/* Pending Approvals Review Button */}
              {onOpenApprovals && (
                <button
                  type="button"
                  onClick={onOpenApprovals}
                  className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                    pendingRequestsCount > 0
                      ? 'border-amber-400 bg-amber-500 text-slate-950 font-black animate-pulse shadow-lg shadow-amber-500/30'
                      : 'border-white/20 bg-white/10 text-white hover:bg-white/20'
                  }`}
                  title="Review collaborator change requests"
                >
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>
                    {pendingRequestsCount > 0
                      ? `${pendingRequestsCount} Pending Approval${pendingRequestsCount > 1 ? 's' : ''}`
                      : 'Change Approvals'}
                  </span>
                </button>
              )}

              {/* ONLY Trip Planner can add travellers through email */}
              {isTripPlanner && (
                <button
                  type="button"
                  onClick={() => {
                    setTravellerError("");
                    setAddTravellerModalOpen(true);
                  }}
                  className="flex items-center gap-2 rounded-xl border border-sky-400/50 bg-sky-500/30 px-3.5 py-2 text-xs font-black text-white backdrop-blur-md transition-all hover:scale-[1.02] hover:bg-sky-500/40 cursor-pointer shadow-md shadow-sky-500/20"
                  title="Trip Planner: Add traveller by email to automatically join this trip"
                >
                  <UserPlus className="h-4 w-4 text-sky-300 shrink-0" />
                  <span>+ Add Traveller</span>
                </button>
              )}

              {/* Place & Dining Suggestions */}
              <button
                type="button"
                onClick={onOpenAiPlanner}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-400 px-3.5 py-2 text-xs font-black text-slate-950 shadow-lg shadow-sky-500/25 transition-all hover:scale-[1.02] hover:opacity-95 cursor-pointer"
              >
                <Compass className="h-4 w-4 text-slate-950 shrink-0" />
                <span>Place Suggestions</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ANALYTICS & BUDGET
      ====================================================== */}

      <div className="divide-y divide-slate-100 bg-white p-4 transition-colors dark:divide-slate-800 dark:bg-slate-900 sm:p-6">
        {/* =================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 pb-4 sm:grid-cols-4">
          {/* Card 1: Trip Budget for Planner, My Contribution for Traveller */}
          {isTripPlanner ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 min-w-0">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">Trip Budget</span>
                <IndianRupee className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
              </div>

              <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                ₹{trip.budgetINR.toLocaleString("en-IN")}
              </div>

              <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                INR Allocated
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 min-w-0">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">My Contribution</span>
                <HandCoins className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 shrink-0" />
              </div>

              <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
                ₹{myTotalContribution.toLocaleString("en-IN")}
              </div>

              <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                Paid by you
              </div>
            </div>
          )}

          {/* Card 2: Total Spent for Planner, My Net Balance for Traveller */}
          {isTripPlanner ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 min-w-0">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">Total Spent</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0 ${
                    budgetPercent > 90
                      ? "bg-rose-500/20 text-rose-500 dark:text-rose-400"
                      : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {budgetPercent}%
                </span>
              </div>

              <div
                className={`text-base sm:text-xl font-bold truncate ${
                  remainingBudget < 0
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-slate-900 dark:text-slate-100"
                }`}
              >
                ₹{totalSpent.toLocaleString("en-IN")}
              </div>

              <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {remainingBudget >= 0
                  ? `₹${remainingBudget.toLocaleString("en-IN")} left`
                  : `₹${Math.abs(remainingBudget).toLocaleString("en-IN")} over`}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 min-w-0">
              <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="truncate">My Net Balance</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[10px] font-semibold shrink-0 ${
                    myNetBalance >= 0
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-rose-500/20 text-rose-500 dark:text-rose-400"
                  }`}
                >
                  {myNetBalance >= 0 ? "Credit" : "Due"}
                </span>
              </div>

              <div
                className={`text-base sm:text-xl font-bold truncate ${
                  myNetBalance >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {myNetBalance >= 0
                  ? `+₹${Math.round(myNetBalance).toLocaleString("en-IN")}`
                  : `-₹${Math.round(Math.abs(myNetBalance)).toLocaleString("en-IN")}`}
              </div>

              <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {myNetBalance >= 0 ? "To receive back" : "To pay to group"}
              </div>
            </div>
          )}

          {/* Itinerary */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 min-w-0">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">Itinerary</span>
              <Clock className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
            </div>

            <div className="text-base sm:text-xl font-bold text-indigo-600 dark:text-indigo-300 truncate">
              {activities.length}{" "}
              <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                stops
              </span>
            </div>

            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Scheduled stops
            </div>
          </div>

          {/* Packing */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-3.5 dark:border-slate-800/80 dark:bg-slate-950/60 min-w-0">
            <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">Packing</span>
              <FileCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
            </div>

            <div className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-300 truncate">
              {packingPercent}%{" "}
              <span className="text-[11px] sm:text-xs font-normal text-slate-500 dark:text-slate-400">
                ({packedCount}/{packingItems.length})
              </span>
            </div>

            <div className="mt-0.5 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
              Luggage ready
            </div>
          </div>
        </div>

        {/* =================================================
            BUDGET PROGRESS + TRIP STATUS
        ================================================== */}

        <div className="flex flex-col justify-between gap-4 pt-4 sm:flex-row sm:items-center">
          {/* Budget progress for planner / Personal contribution status for traveller */}
          {isTripPlanner ? (
            <div className="max-w-lg flex-1">
              <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span>Budget Consumption Progress</span>

                <span>
                  ₹{totalSpent.toLocaleString("en-IN")} of ₹
                  {trip.budgetINR.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 p-0.5 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetPercent > 95
                      ? "bg-rose-500"
                      : budgetPercent > 75
                        ? "bg-amber-500"
                        : "bg-gradient-to-r from-sky-500 to-emerald-400"
                  }`}
                  style={{
                    width: `${budgetPercent}%`,
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="max-w-lg flex-1">
              <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <HandCoins className="w-4 h-4 text-sky-500" />
                  <span>My Contribution Status</span>
                </span>
                <span className="font-extrabold text-sky-600 dark:text-sky-400">
                  ₹{myTotalContribution.toLocaleString("en-IN")} contributed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Showing your individual contribution & settlement balance. Overall group expenses are private to the Trip Planner.
              </p>
            </div>
          )}

          {/* Trip status */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Trip Phase:
            </span>

            <select
              value={trip.status}
              onChange={(e) => onUpdateStatus(e.target.value as TripStatus)}
              className="rounded-xl border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="planning">Planning (Drafting)</option>

              <option value="ongoing">Ongoing (Active Journey)</option>

              <option value="completed">Completed (Archived)</option>
            </select>
          </div>
        </div>

        {/* =================================================
            TRIP MEMBERS & TRAVELLERS ROW
        ================================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-500" />
            {(() => {
              const seenEmails = new Set<string>();
              const seenUids = new Set<string>();
              const ownerEmailClean = (trip.ownerEmail || (trip.collaborators || []).find((c) => c.uid === trip.ownerId || c.role === 'planner')?.email || '').trim().toLowerCase();
              if (ownerEmailClean) seenEmails.add(ownerEmailClean);
              if (trip.ownerId) seenUids.add(trip.ownerId);

              const count = (trip.collaborators || []).filter((c) => {
                if (!c) return false;
                const emailClean = c.email?.trim().toLowerCase();
                const uidClean = c.uid?.trim();
                if (uidClean && seenUids.has(uidClean)) return false;
                if (emailClean && seenEmails.has(emailClean)) return false;
                if (c.role === 'planner') return false;
                if (emailClean) seenEmails.add(emailClean);
                if (uidClean) seenUids.add(uidClean);
                return true;
              }).length;

              return (
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Trip Members & Travellers ({1 + count})
                </span>
              );
            })()}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Trip Planner badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
              <Crown className="w-3.5 h-3.5 text-amber-500" />
              <span>{trip.ownerName}</span>
              <span className="text-[10px] uppercase tracking-wide bg-emerald-600 text-white px-1.5 py-0.2 rounded font-extrabold">Trip Planner</span>
            </div>

            {/* Added Travellers (Deduplicated so registered user with same email is only ONE) */}
            {(() => {
              const seenEmails = new Set<string>();
              const seenUids = new Set<string>();
              const ownerEmailClean = (trip.ownerEmail || (trip.collaborators || []).find((c) => c.uid === trip.ownerId || c.role === 'planner')?.email || '').trim().toLowerCase();
              if (ownerEmailClean) seenEmails.add(ownerEmailClean);
              if (trip.ownerId) seenUids.add(trip.ownerId);

              const uniqueTravellers: TripCollaborator[] = [];

              (trip.collaborators || []).forEach((c) => {
                if (!c) return;
                const emailClean = c.email?.trim().toLowerCase();
                const uidClean = c.uid?.trim();

                // Skip if this collaborator is the Trip Planner
                if (uidClean && seenUids.has(uidClean)) return;
                if (emailClean && seenEmails.has(emailClean)) return;
                if (c.role === 'planner') return;

                if (emailClean) seenEmails.add(emailClean);
                if (uidClean) seenUids.add(uidClean);

                // If this traveller is the current logged-in user, use their registered display name
                const isCurrent = (emailClean && currentUser?.email && emailClean === currentUser.email.trim().toLowerCase()) ||
                                  (uidClean && currentUser?.uid && uidClean === currentUser.uid);

                const effectiveName = isCurrent
                  ? (userProfile?.displayName || currentUser?.displayName || c.name)
                  : c.name;

                uniqueTravellers.push({
                  ...c,
                  name: effectiveName
                });
              });

              return uniqueTravellers.map((traveller) => {
                const isMe = (traveller.email && currentUser?.email && traveller.email.toLowerCase() === currentUser.email.toLowerCase()) ||
                             (traveller.uid && currentUser?.uid && traveller.uid === currentUser.uid);

                return (
                  <div
                    key={traveller.email || traveller.uid || traveller.name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium"
                  >
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span className="font-semibold">{traveller.name}</span>
                    {traveller.email && (
                      <span className="text-[10px] text-slate-400">({traveller.email})</span>
                    )}
                    <span className="text-[10px] bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-1.5 py-0.2 rounded">
                      {isMe ? 'Traveller (You)' : 'Traveller'}
                    </span>
                    {isTripPlanner && onRemoveTraveller && (
                      <button
                        type="button"
                        onClick={() => setTravellerToRemove(traveller)}
                        className="ml-1 p-0.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title={`Remove ${traveller.name} from journey`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              });
            })()}

            {isTripPlanner && (
              <button
                type="button"
                onClick={() => {
                  setTravellerError("");
                  setAddTravellerModalOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold transition-colors cursor-pointer border border-sky-500/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Traveller</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          EDIT TRIP MODAL
      ====================================================== */}

      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            {/* Modal header */}
            <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <Edit2 className="h-5 w-5 text-sky-500" />
                Edit Journey Details
              </h3>

              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Trip title */}
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Trip Title *
                </label>

                <input
                  type="text"
                  required
                  maxLength={150}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              {/* Destination */}
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Destination Location *
                </label>

                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editDestination}
                  onChange={(e) => setEditDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Start Date
                  </label>

                  <input
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    End Date
                  </label>

                  <input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Budget + Cover */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Budget (₹ INR)
                  </label>

                  <input
                    type="number"
                    min={1000}
                    value={editBudgetINR}
                    onChange={(e) => setEditBudgetINR(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 font-mono text-xs focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Cover Image URL
                  </label>

                  <input
                    type="url"
                    value={editCover}
                    onChange={(e) => setEditCover(e.target.value)}
                    className="w-full truncate rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Overview & Travel Notes
                </label>

                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950"
                />
              </div>

              {/* Form actions */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-3 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingEdit}
                  className="rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-colors hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingEdit ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          ADD TRAVELLER BY EMAIL MODAL (TRIP PLANNER ONLY)
      ========================================================== */}
      {addTravellerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/15 text-sky-500 border border-sky-500/30">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Add Traveller by Email
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add traveller to {trip.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddTravellerModalOpen(false);
                  setTravellerError("");
                }}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Role & Permissions Note */}
            <div className="my-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 p-3 text-xs text-sky-900 dark:text-sky-200">
              <div className="font-bold flex items-center gap-1.5 text-sky-700 dark:text-sky-300">
                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Trip Planner Action</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Enter the traveller's email address below. Once added, this journey will automatically link to their account and appear in their trips as a <strong>Traveller</strong>.
              </p>
            </div>

            {travellerSaved && (
              <div className="my-3 flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 p-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Traveller added! Journey automatically linked.</span>
              </div>
            )}

            {travellerError && (
              <div className="my-3 flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{travellerError}</span>
              </div>
            )}

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setTravellerError("");
                const emailClean = newTravellerEmail.trim().toLowerCase();
                if (!emailClean || !emailClean.includes("@")) {
                  setTravellerError("Please provide a valid email address.");
                  return;
                }

                setAddingTraveller(true);
                try {
                  const updatedTrip = await addTravellerByEmail(
                    trip.id,
                    emailClean,
                    newTravellerName.trim(),
                    newTravellerPhone.trim()
                  );

                  if (onUpdateTrip) {
                    await onUpdateTrip({
                      collaborators: updatedTrip.collaborators,
                      memberEmails: updatedTrip.memberEmails,
                      memberUids: updatedTrip.memberUids
                    });
                  }

                  setTravellerSaved(true);
                  setTimeout(() => {
                    setTravellerSaved(false);
                    setNewTravellerName("");
                    setNewTravellerEmail("");
                    setNewTravellerPhone("");
                    setAddTravellerModalOpen(false);
                  }, 400);
                } catch (err: any) {
                  setTravellerError(err?.message || "Failed to add traveller. Please try again.");
                } finally {
                  setAddingTraveller(false);
                }
              }}
              className="mt-3.5 space-y-3.5"
            >
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
                  Traveller Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. priya.sharma@example.com"
                  value={newTravellerEmail}
                  onChange={(e) => {
                    setNewTravellerEmail(e.target.value);
                    setTravellerError("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  When the traveller logs in with this email, the trip will be in their journeys list.
                </span>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Traveller Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={newTravellerName}
                  onChange={(e) => setNewTravellerName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Contact Phone (Optional)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={newTravellerPhone}
                  onChange={(e) => setNewTravellerPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 focus:border-sky-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>

              {/* Fixed Role Display - Non changeable */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Assigned Role:</span>
                  <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-600 dark:text-sky-300 font-extrabold text-[11px]">
                    🎒 Traveller (Fixed)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  The user who created the trip is always Trip Planner. All added users are always Travellers.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setAddTravellerModalOpen(false);
                    setTravellerError("");
                  }}
                  className="rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingTraveller}
                  className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md hover:bg-sky-400 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {addingTraveller ? (
                    <span>Adding Traveller...</span>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add to Journey</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen High-Resolution Photo Viewer Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-5xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 bg-slate-950/80 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-400" />
                <span className="text-sm font-bold">{trip.title} • {trip.destination}</span>
              </div>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[80vh] overflow-hidden flex items-center justify-center bg-black">
              <img
                src={heroImageUrl}
                alt={trip.title}
                className="w-full h-auto max-h-[78vh] object-contain"
              />
            </div>
            <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>High Definition Destination View</span>
              <button
                onClick={() => {
                  setShowPhotoModal(false);
                  setShowChangeCoverModal(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" />
                Change Cover Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Cover Photo Modal */}
      {showChangeCoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-sky-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Customize Trip Hero Image</h3>
              </div>
              <button
                onClick={() => setShowChangeCoverModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Choose a stunning high-definition photo preset matching your destination or paste your own custom image URL.
            </p>

            {/* Upload from Device or Snap */}
            <div className="mb-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Upload from Your Device:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{savingCover ? "Optimizing & Saving..." : "Select Device Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverFileUpload}
                    className="hidden"
                    disabled={savingCover}
                  />
                </label>
                <label className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-all">
                  <Camera className="w-3.5 h-3.5" />
                  <span>Snap Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleCoverFileUpload}
                    className="hidden"
                    disabled={savingCover}
                  />
                </label>
              </div>
            </div>

            {/* Custom URL Input */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Or Paste Image Link:
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={coverInputUrl}
                  onChange={(e) => setCoverInputUrl(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  disabled={!coverInputUrl.trim() || savingCover}
                  onClick={() => handleUpdateCover(coverInputUrl)}
                  className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-bold hover:bg-sky-400 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {savingCover ? "Saving..." : "Apply"}
                </button>
              </div>
            </div>

            {/* Curated High-Definition Presets */}
            <label className="block text-xs font-semibold mb-2 text-slate-700 dark:text-slate-300">
              Or pick an HD Destination Preset:
            </label>
            <div className="grid grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {[
                {
                  title: "Rishikesh Ganges & Mist",
                  url: "https://images.unsplash.com/photo-1600100397608-f010f4439c65?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Mussoorie Himalayan Ridge",
                  url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Rajasthan Amber Palace",
                  url: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Udaipur Pichola Lake",
                  url: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Goa Sunset Beach",
                  url: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Manali Snow Valley",
                  url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Kerala Alleppey Waters",
                  url: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Kashmir Dal Lake Shikara",
                  url: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Ladakh Pangong Tso",
                  url: "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1200&q=80",
                },
                {
                  title: "Paris Eiffel Tower",
                  url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80",
                },
              ].map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => handleUpdateCover(preset.url)}
                  className="group relative h-24 rounded-2xl overflow-hidden cursor-pointer border border-slate-200 dark:border-slate-800 hover:border-sky-500 transition-all shadow-sm"
                >
                  <img
                    src={preset.url}
                    alt={preset.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent flex items-end p-2">
                    <span className="text-[11px] font-bold text-white drop-shadow-sm leading-tight">
                      {preset.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setShowChangeCoverModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Remove Traveller Confirmation */}
      {travellerToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mx-auto mb-3 ring-8 ring-rose-500/5">
              <UserMinus className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Remove Traveller
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-800 dark:text-slate-200">{travellerToRemove.name} ({travellerToRemove.email})</strong> from this journey? They will no longer have access to this trip.
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={removingTraveller}
                onClick={() => setTravellerToRemove(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removingTraveller}
                onClick={async () => {
                  if (!onRemoveTraveller || !travellerToRemove) return;
                  setRemovingTraveller(true);
                  try {
                    await onRemoveTraveller(travellerToRemove.email || travellerToRemove.uid);
                    setTravellerToRemove(null);
                  } catch (err) {
                    console.error('Failed to remove traveller:', err);
                  } finally {
                    setRemovingTraveller(false);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/25 cursor-pointer flex items-center justify-center gap-2"
              >
                {removingTraveller ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripHero;
