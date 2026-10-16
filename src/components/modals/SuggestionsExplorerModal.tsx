import React, { useState } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Utensils,
  Camera,
  Clock,
  IndianRupee,
  Plus,
  Check,
  Search,
  Compass,
  Building,
  Navigation
} from 'lucide-react';
import { Activity, ActivityCategory, Trip } from '../../types/travel.ts';
import { detectNearbyPlaces, NearbyRecommendation } from '../../services/nearbyRecommendations.ts';
import { EXPLORE_PLACES } from '../../data/explorePlaces.ts';

interface SuggestionsExplorerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  tripDays: number;
  isTripCreator: boolean;
  onAddActivity: (act: Activity) => Promise<void>;
  onProposeActivity?: (act: Activity) => Promise<void>;
}

export const SuggestionsExplorerModal: React.FC<SuggestionsExplorerModalProps> = ({
  isOpen,
  onClose,
  trip,
  tripDays,
  isTripCreator,
  onAddActivity,
  onProposeActivity
}) => {
  const [activeTab, setActiveTab] = useState<'places' | 'restaurants' | 'ideas'>('places');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedTime, setSelectedTime] = useState<string>('10:00');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItemIds, setAddedItemIds] = useState<string[]>([]);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const destCity = trip.destination.split(',')[0].trim().toLowerCase();
  const autoNearby = detectNearbyPlaces(searchQuery || destCity, trip.destination);

  // Filter curated places matching trip destination first
  const destMatches = (p: { destination: string }) => {
    const pDest = p.destination.toLowerCase();
    return pDest.includes(destCity) || destCity.includes(pDest.split(',')[0].trim());
  };

  const matchingPlaces = EXPLORE_PLACES.filter(destMatches);
  const placesPool = matchingPlaces.length > 0 ? matchingPlaces : EXPLORE_PLACES;

  // Pre-curated places from data
  const explorePlaces = placesPool.filter(
    (p) =>
      p.category === 'attraction' ||
      p.category === 'culture' ||
      p.category === 'hidden_gem'
  );

  const exploreRestaurants = placesPool.filter(
    (p) => p.category === 'food' || p.category === 'nightlife'
  );

  // Specific recommendations based on activeTab
  const items = activeTab === 'places'
    ? explorePlaces
    : activeTab === 'restaurants'
    ? exploreRestaurants
    : explorePlaces;

  const handleAddSuggestion = async (item: any) => {
    setAddingId(item.id);
    const category: ActivityCategory =
      activeTab === 'restaurants'
        ? 'food'
        : item.category === 'culture'
        ? 'sightseeing'
        : 'sightseeing';

    const newActivity: Activity = {
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tripId: trip.id,
      day: selectedDay,
      time: selectedTime,
      title: item.title || item.name,
      category,
      location: item.address || item.title || trip.destination,
      costINR: item.estCostINR || 0,
      notes: item.insiderTip || item.description || '',
      createdBy: 'currentUser',
      createdAt: new Date().toISOString()
    };

    try {
      if (isTripCreator) {
        await onAddActivity(newActivity);
        setFeedbackMessage(`Added "${newActivity.title}" directly to Day ${selectedDay}!`);
      } else if (onProposeActivity) {
        await onProposeActivity(newActivity);
        setFeedbackMessage(`Submitted proposal for "${newActivity.title}" to trip planner!`);
      }
      setAddedItemIds((prev) => [...prev, item.id]);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      console.error('Failed to add suggestion:', err);
    } finally {
      setAddingId(null);
    }
  };

  const daysCount = Math.max(1, tripDays || 3);
  const daysList = Array.from({ length: daysCount }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Place, Itinerary & Restaurant Suggestions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick curated places and dining spots to add individually to your schedule. No automated forced schedules.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {/* Controls: Target Day & Time for Added Item */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">Add Selection To:</span>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-500">Day:</label>
              <select
                value={selectedDay}
                onChange={(e) => setSelectedDay(Number(e.target.value))}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
              >
                {daysList.map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-slate-500">Time:</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {isTripCreator ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                👑 Trip Planner (Direct Add)
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-bold">
                👥 Collaborator (Submits for Confirmation)
              </span>
            )}
          </div>
        </div>

        {/* Category Tabs: Places, Restaurants, Itinerary Ideas */}
        <div className="flex rounded-2xl bg-slate-100 dark:bg-slate-950 p-1 mb-4 border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('places')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'places'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Suggested Sights & Places</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('restaurants')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'restaurants'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>Top Restaurants & Dining</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ideas')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ideas'
                ? 'bg-sky-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Itinerary Stops & Highlights</span>
          </button>
        </div>

        {/* Live Auto-Detected Nearby Spots Ribbon */}
        <div className="mb-4 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900/40">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-black text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-indigo-500" />
              <span>Auto-Detected Nearby Highlights Around {destCity}</span>
            </span>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
              GPS Radius: 1 - 5 km
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {autoNearby.slice(0, 4).map((nb) => (
              <div
                key={nb.id}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-2 shadow-xs"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {nb.name}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {nb.distance} • ⭐ {nb.rating} • {nb.category}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={addedItemIds.includes(nb.id) || addingId === nb.id}
                  onClick={() => handleAddSuggestion(nb)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold shrink-0 transition-all cursor-pointer disabled:opacity-50"
                >
                  {addedItemIds.includes(nb.id) ? 'Added' : '+ Add'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable List of Suggestions */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {items.map((item) => {
            const isAdded = addedItemIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 hover:border-sky-500/40 transition-all flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between"
              >
                <div className="flex items-start sm:items-center gap-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 ring-1 ring-slate-200 dark:ring-slate-800"
                    />
                  )}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {item.title}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        ⭐ {item.rating} ({item.reviewCount || 420})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 max-w-lg">
                      {item.insiderTip}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-sky-600 dark:text-sky-400">
                        <IndianRupee className="w-3 h-3" />
                        {item.estCostINR > 0 ? `₹${item.estCostINR.toLocaleString('en-IN')}` : 'Free Entry'}
                      </span>
                      {item.bestTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{item.bestTime}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add CTA */}
                <button
                  type="button"
                  disabled={isAdded || addingId === item.id}
                  onClick={() => handleAddSuggestion(item)}
                  className={`w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 flex items-center justify-center gap-1.5 cursor-pointer ${
                    isAdded
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
                  }`}
                >
                  {isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Added to Day {selectedDay}</span>
                    </>
                  ) : addingId === item.id ? (
                    <span>Adding...</span>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add to Day {selectedDay}</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
