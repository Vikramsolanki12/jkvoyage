import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  IndianRupee,
  Plus,
  Trash2,
  Plane,
  Building2,
  Camera,
  Utensils,
  Car,
  Ticket,
  Calendar,
  Sparkles,
  Navigation,
  Compass,
  Check,
  ShieldCheck,
  AlertCircle,
  X,
  ExternalLink,
  Edit3,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Activity, ActivityCategory, Trip } from "../types/travel.ts";
import { useAuth } from "../context/AuthContext.tsx";
import { detectNearbyPlaces, NearbyRecommendation } from "../services/nearbyRecommendations.ts";
import { resolveLocationCoordinates, getGoogleMapsPinUrl } from "../services/coordinateResolver.ts";

interface ItineraryTabProps {
  trip: Trip;
  activities: Activity[];
  isTripCreator: boolean;
  onAddActivity: (activity: Activity) => Promise<void>;
  onUpdateActivity?: (activity: Activity) => Promise<void>;
  onProposeActivity?: (activity: Activity) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
  onOpenSuggestions: () => void;
}

export const ItineraryTab: React.FC<ItineraryTabProps> = ({
  trip,
  activities,
  isTripCreator,
  onAddActivity,
  onUpdateActivity,
  onProposeActivity,
  onDeleteActivity,
  onOpenSuggestions,
}) => {
  const { currentUser } = useAuth();
  // Strictly day by day navigation (no all days)
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<ActivityCategory | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  // Form states
  const [day, setDay] = useState<number>(1);
  const [time, setTime] = useState("10:00");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ActivityCategory>("sightseeing");
  const [location, setLocation] = useState("");
  const [costINR, setCostINR] = useState<number>(0);
  const [notes, setNotes] = useState("");

  // Nearby discovery panel state in timeline
  const [showNearbyForDay, setShowNearbyForDay] = useState<number | null>(null);

  // Clear justAdded highlight after a few seconds
  useEffect(() => {
    if (justAddedId) {
      const timer = setTimeout(() => setJustAddedId(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [justAddedId]);

  // Trip duration in days
  const tripDays = (() => {
    if (!trip.startDate || !trip.endDate) return 1;
    const start = new Date(`${trip.startDate}T00:00:00`);
    const end = new Date(`${trip.endDate}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 1;
    const diff = end.getTime() - start.getTime();
    return Math.max(1, Math.floor(diff / (1000 * 60 * 60 * 24)) + 1);
  })();

  const daysList = Array.from({ length: tripDays }, (_, index) => index + 1);

  // Strictly Day-by-Day schedule view (all days removed)
  const filteredActivities = activities.filter((act) => {
    if (act.day !== selectedDay) return false;
    if (selectedCategory !== "all" && act.category !== selectedCategory) return false;
    return true;
  });

  // Auto-detect nearby places for current form location
  const detectedNearby = detectNearbyPlaces(location || trip.destination, trip.destination);

  const categoryIcons: Record<
    ActivityCategory,
    { icon: React.ReactNode; label: string; color: string }
  > = {
    flight: {
      icon: <Plane className="w-4 h-4" />,
      label: "Flight",
      color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30",
    },
    hotel: {
      icon: <Building2 className="w-4 h-4" />,
      label: "Hotel/Stay",
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    },
    sightseeing: {
      icon: <Camera className="w-4 h-4" />,
      label: "Sightseeing",
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
    },
    food: {
      icon: <Utensils className="w-4 h-4" />,
      label: "Dining",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    },
    transport: {
      icon: <Car className="w-4 h-4" />,
      label: "Transit",
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    },
    activity: {
      icon: <Ticket className="w-4 h-4" />,
      label: "Experience",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
    },
  };

  const handleStartEditActivity = (act: Activity) => {
    setEditingActivityId(act.id);
    setDay(act.day);
    setTime(act.time || '10:00');
    setTitle(act.title);
    setCategory(act.category || 'sightseeing');
    setLocation(act.location || '');
    setCostINR(act.costINR || 0);
    setNotes(act.notes || '');
    setModalOpen(true);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);

    try {
      // Automatically resolve GPS coordinates so it pins on the map
      const locTarget = location.trim() || title.trim() || trip.destination;
      const coords = await resolveLocationCoordinates(
        locTarget,
        trip.destination,
        activities.length
      );

      if (editingActivityId) {
        const existing = activities.find((a) => a.id === editingActivityId);
        const updatedActivity: Activity = {
          ...existing,
          id: editingActivityId,
          tripId: trip.id,
          day: Number(day),
          time,
          title: title.trim(),
          category,
          location: location.trim() || trip.destination,
          costINR: Number(costINR) || 0,
          notes: notes.trim(),
          createdBy: existing?.createdBy || currentUser?.uid || "user_local",
          createdAt: existing?.createdAt || new Date().toISOString(),
          latitude: coords.latitude || existing?.latitude,
          longitude: coords.longitude || existing?.longitude
        };

        if (onUpdateActivity) {
          await onUpdateActivity(updatedActivity);
        } else {
          await onAddActivity(updatedActivity);
        }
        setFeedback(`Updated "${updatedActivity.title}"!`);
        setModalOpen(false);
        setEditingActivityId(null);
        setTimeout(() => setFeedback(null), 5000);
        return;
      }

      const newActivity: Activity = {
        id: "act_" + Date.now(),
        tripId: trip.id,
        day: Number(day),
        time,
        title: title.trim(),
        category,
        location: location.trim() || trip.destination,
        costINR: Number(costINR) || 0,
        notes: notes.trim(),
        createdBy: currentUser?.uid || "user_local",
        createdAt: new Date().toISOString(),
        latitude: coords.latitude,
        longitude: coords.longitude
      };

      if (isTripCreator || !onProposeActivity) {
        await onAddActivity(newActivity);
        setFeedback(`Added "${newActivity.title}" to Day ${newActivity.day}!`);
      } else {
        await onProposeActivity(newActivity);
        setFeedback(`Proposed "${newActivity.title}" to Trip Planner!`);
      }

      setJustAddedId(newActivity.id);

      setModalOpen(false);
      setTitle("");
      setLocation("");
      setCostINR(0);
      setNotes("");
      setTimeout(() => setFeedback(null), 5000);
    } catch (err) {
      console.error("Failed to save activity:", err);
      setModalOpen(false);
      setTitle("");
      setLocation("");
      setCostINR(0);
      setEditingActivityId(null);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper when clicking an auto-detected nearby place
  const handleSelectNearbyPlace = (rec: NearbyRecommendation) => {
    setTitle(rec.name);
    setLocation(rec.address || rec.name);
    if (rec.estCostINR > 0) setCostINR(rec.estCostINR);
    if (rec.type === 'restaurant') setCategory('food');
    else setCategory('sightseeing');
    if (rec.recommendedTime) setTime(rec.recommendedTime.split(' ')[0]);
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

      {/* Role Banner */}
      {!isTripCreator && (
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 text-xs flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              <strong>Traveller Access:</strong> Official bookings and activities are managed by the Trip Planner. Suggested places will be confirmed before appearing on the final itinerary.
            </span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 font-black text-[10px] shrink-0">
            TRAVELLER
          </span>
        </div>
      )}

      {/* Day by Day Switcher Bar (All Days removed) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Left: Day Stepper & Day Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            disabled={selectedDay <= 1}
            onClick={() => setSelectedDay((prev) => Math.max(1, prev - 1))}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {daysList.map((d) => {
            const countForDay = activities.filter((a) => a.day === d).length;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedDay === d
                    ? "bg-sky-500 text-slate-950 font-black shadow-md shadow-sky-500/25 scale-[1.02]"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                <span>Day {d}</span>
                {countForDay > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      selectedDay === d
                        ? "bg-slate-950/20 text-slate-950 font-black"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}
                  >
                    {countForDay}
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            disabled={selectedDay >= tripDays}
            onClick={() => setSelectedDay((prev) => Math.min(tripDays, prev + 1))}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Suggested Places & Add Activity */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={onOpenSuggestions}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Suggested Places</span>
          </button>

          <button
            onClick={() => {
              setEditingActivityId(null);
              setDay(selectedDay);
              setTitle("");
              setLocation("");
              setCostINR(0);
              setNotes("");
              setTime("10:00");
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{isTripCreator ? "Add Activity" : "Propose Activity"}</span>
          </button>
        </div>
      </div>

      {/* Activity Timeline List */}
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 dark:text-sky-400 flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
                <Calendar className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No activities scheduled for this selection
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-6">
                Explore curated place and restaurant suggestions for {trip.destination}, or add custom sightseeing stops to pin on your map.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer"
                >
                  Add First Activity
                </button>
                <button
                  onClick={onOpenSuggestions}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors cursor-pointer"
                >
                  Browse Place Suggestions
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map((act) => {
                const cat = categoryIcons[act.category] || categoryIcons.sightseeing;
                const isJustAdded = justAddedId === act.id;

                return (
                  <div
                    key={act.id}
                    id={`activity-${act.id}`}
                    className={`group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/60 border transition-all shadow-xs ${
                      isJustAdded
                        ? 'border-emerald-500/50 ring-2 ring-emerald-500/20 bg-emerald-50/15 dark:bg-emerald-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left info */}
                      <div className="flex items-start gap-3.5">
                        <div className={`p-2.5 rounded-xl border shrink-0 ${cat.color}`}>
                          {cat.icon}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                              Day {act.day}
                            </span>
                            <span className="text-xs font-mono font-bold text-sky-600 dark:text-sky-400">
                              {act.time}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                              {act.title}
                            </h4>
                            {isJustAdded && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 animate-bounce">
                                NEW ACTIVITY
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-sky-500" />
                              <span className="font-medium text-slate-700 dark:text-slate-300">{act.location}</span>
                            </span>
                            {act.latitude && act.longitude && (
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline">
                                ({act.latitude.toFixed(3)}, {act.longitude.toFixed(3)})
                              </span>
                            )}
                            {act.costINR > 0 && (
                              <span className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400">
                                <IndianRupee className="w-3 h-3" />
                                <span>{act.costINR.toLocaleString('en-IN')}</span>
                              </span>
                            )}
                          </div>

                          {act.notes && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 pt-0.5">
                              {act.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">

                        <a
                          href={getGoogleMapsPinUrl(act.location, {
                            latitude: act.latitude || 0,
                            longitude: act.longitude || 0
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        <button
                          type="button"
                          onClick={() => setShowNearbyForDay(showNearbyForDay === act.day ? null : act.day)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-colors"
                        >
                          <Navigation className="w-3 h-3 text-sky-500" />
                          <span>Nearby</span>
                        </button>

                        {isTripCreator && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStartEditActivity(act)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors cursor-pointer"
                              title="Edit activity"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteActivity(act.id)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                              title="Remove activity"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Auto-detected nearby spots dropdown for this day */}
                    {showNearbyForDay === act.day && (
                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          <span className="flex items-center gap-1">
                            <Navigation className="w-3.5 h-3.5 text-sky-500" />
                            <span>Auto-Detected Places & Restaurants Nearby:</span>
                          </span>
                          <button
                            onClick={() => setShowNearbyForDay(null)}
                            className="text-slate-400 hover:text-slate-600 text-xs"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {detectNearbyPlaces(act.location, trip.destination).slice(0, 2).map((nb) => (
                            <div
                              key={nb.id}
                              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="font-bold truncate text-slate-900 dark:text-white">{nb.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{nb.distance} • {nb.category}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setTitle(nb.name);
                                  setLocation(nb.address || nb.name);
                                  setCategory(nb.type === 'restaurant' ? 'food' : 'sightseeing');
                                  setDay(act.day);
                                  setModalOpen(true);
                                  setShowNearbyForDay(null);
                                }}
                                className="px-2 py-0.5 rounded bg-sky-500 hover:bg-sky-400 text-slate-950 text-[10px] font-bold shrink-0"
                              >
                                + Schedule
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

      {/* Add / Propose Activity Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-black mb-1 flex items-center gap-2">
              {editingActivityId ? (
                <Edit3 className="w-5 h-5 text-sky-500" />
              ) : (
                <Plus className="w-5 h-5 text-sky-500" />
              )}
              <span>
                {editingActivityId
                  ? "Edit Scheduled Activity"
                  : isTripCreator
                  ? "Schedule Itinerary Activity"
                  : "Propose Itinerary Activity"}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {editingActivityId
                ? "Update activity details, timing, notes, or estimated cost."
                : isTripCreator
                ? "This activity will be directly scheduled in your journey timeline."
                : "As a collaborator, this proposal will be sent to the trip planner for confirmation."}
            </p>

            <form onSubmit={handleCreateActivity} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Amber Palace Mirror Tour, Traditional Thali Feast"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Day Number
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                  >
                    {daysList.map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Time (24h)
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="sightseeing">🏛️ Sightseeing</option>
                    <option value="food">🍛 Dining / Restaurant</option>
                    <option value="flight">✈️ Flight</option>
                    <option value="hotel">🏨 Hotel / Stay</option>
                    <option value="transport">🚗 Transit / Cab</option>
                    <option value="activity">🎟️ Experience</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Estimated Cost (₹ INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={costINR || ''}
                    onChange={(e) => setCostINR(Number(e.target.value))}
                    placeholder="0"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Location Input with Auto-Detected Nearby Spots */}
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Location / Destination *
                </label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    maxLength={200}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={`e.g. Amber Fort, Johari Bazaar, ${trip.destination}`}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Map Pinning live status banner */}
                <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300">
                  <span className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-pulse" />
                    <span>Live GPS Pinning:</span>
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold truncate ml-2">
                    Pins on map at: <strong>{location.trim() || trip.destination}</strong>
                  </span>
                </div>

                {/* Auto-detected nearby places suggestions right inside form */}
                <div className="mt-2.5 p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40">
                  <div className="flex items-center justify-between text-[11px] font-black text-sky-900 dark:text-sky-300 mb-1.5">
                    <span className="flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-sky-500" />
                      <span>Auto-Detected Nearby Places & Restaurants</span>
                    </span>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">1-Click Auto-Fill</span>
                  </div>

                  <div className="space-y-1.5">
                    {detectedNearby.slice(0, 3).map((spot) => (
                      <div
                        key={spot.id}
                        onClick={() => handleSelectNearbyPlace(spot)}
                        className="p-2 rounded-lg bg-white dark:bg-slate-900 hover:bg-sky-100/50 dark:hover:bg-slate-800 border border-sky-100 dark:border-sky-900/40 cursor-pointer flex items-center justify-between gap-2 transition-all"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {spot.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                            {spot.distance} • {spot.category} {spot.estCostINR > 0 ? `• ₹${spot.estCostINR}` : '• Free'}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full shrink-0">
                          Use This
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Notes & Recommendations
                </label>
                <textarea
                  maxLength={1000}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Audio guide included, photography permits allowed"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  {submitting
                    ? "Saving..."
                    : editingActivityId
                    ? "Save Changes"
                    : isTripCreator
                    ? "Save to Itinerary"
                    : "Submit Request to Planner"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
