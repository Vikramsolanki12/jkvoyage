import React, { useEffect, useMemo, useState } from "react";
import {
  Compass,
  Star,
  MapPin,
  Clock,
  Sparkles,
  Search,
  Plus,
  Check,
  Camera,
  Utensils,
  Landmark,
  Hotel,
  Loader2,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

import { Trip, ActivityCategory, ExplorePlace, Activity } from "../types/travel.ts";
import { resolvePlacePhoto, EXPLORE_PLACES, getGemsForDestination } from "../data/explorePlaces.ts";

import {
  searchNearbyPlaces,
  getPlacePhotoUrl,
  type GooglePlace,
  type PlaceSearchCategory,
} from "../services/placesApi";

import { findDestinationLocation } from "../services/geocodingApi";

interface ExploreTabProps {
  trip: Trip;
  activities?: Activity[];

  onAddActivity: (act: {
    day: number;
    time: string;
    title: string;
    category: ActivityCategory;
    location: string;
    costINR: number;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<void>;

  isPro: boolean;

  onOpenUpgrade: (msg?: string) => void;
}

type ExploreCategory = "all" | "attraction" | "restaurant" | "cafe" | "hotel";

interface ExploreResult extends ExplorePlace {
  googleMapsUri?: string;
  websiteUri?: string;
  latitude?: number;
  longitude?: number;
}

const CATEGORY_CONFIG: Array<{
  id: ExploreCategory;
  label: string;
  icon: React.ElementType;
}> = [
  {
    id: "all",
    label: "All Highlights",
    icon: Compass,
  },
  {
    id: "attraction",
    label: "Top Sights",
    icon: Landmark,
  },
  {
    id: "restaurant",
    label: "Restaurants",
    icon: Utensils,
  },
  {
    id: "cafe",
    label: "Cafes",
    icon: Utensils,
  },
  {
    id: "hotel",
    label: "Hotels",
    icon: Hotel,
  },
];

const CATEGORY_TO_API: Record<
  Exclude<ExploreCategory, "all">,
  PlaceSearchCategory
> = {
  attraction: "attraction",
  restaurant: "restaurant",
  cafe: "cafe",
  hotel: "hotel",
};

const getDisplayDestination = (destination: string) => {
  if (!destination?.trim()) {
    return "your destination";
  }

  return destination.split(",")[0].trim();
};

const getActivityCategory = (category: ExploreCategory): ActivityCategory => {
  switch (category) {
    case "restaurant":
    case "cafe":
      return "food";

    case "attraction":
      return "sightseeing";

    default:
      return "activity";
  }
};

const getPlaceCategory = (
  place: GooglePlace,
  selectedCategory: ExploreCategory,
): ExplorePlace["category"] => {
  if (selectedCategory === "restaurant" || selectedCategory === "cafe") {
    return "food";
  }

  if (
    place.primaryType?.includes("museum") ||
    place.primaryType?.includes("historical")
  ) {
    return "culture";
  }

  return "attraction";
};

const mapGooglePlace = async (
  place: GooglePlace,
  selectedCategory: ExploreCategory,
  destination: string,
): Promise<ExploreResult> => {
  const title = place.displayName?.text?.trim() || "Unknown Place";

  const address = place.formattedAddress?.trim() || "Address unavailable";

  const category = getPlaceCategory(place, selectedCategory);

  const tags = (
    place.types?.length ? place.types : [place.primaryType || "place"]
  )
    .map((type) =>
      type.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .slice(0, 5);

  // -----------------------------------------
  // Get REAL Google Places photo
  // -----------------------------------------
  let photoUrl: string | null = null;

  const photoName = place.photos?.[0]?.name;

  if (photoName) {
    photoUrl = await getPlacePhotoUrl(photoName);
  }

  return {
    id: place.id,

    title,

    address,

    destination,

    image: resolvePlacePhoto(title, destination, category, photoUrl ?? undefined),

    rating: place.rating ?? 0,

    reviewCount: place.userRatingCount ?? 0,

    category,

    bestTime:
      selectedCategory === "restaurant"
        ? "Check opening hours"
        : selectedCategory === "cafe"
          ? "Best during daytime"
          : selectedCategory === "hotel"
            ? "Check availability"
            : "Check opening hours",

    estCostINR: 0,

    insiderTip:
      "Check Google Maps for the latest opening hours, reviews and visitor information.",

    tags,

    googleMapsUri: place.googleMapsUri,

    websiteUri: place.websiteUri,

    latitude: place.location?.latitude,

    longitude: place.location?.longitude,
  };
};

export const ExploreTab: React.FC<ExploreTabProps> = ({
  trip,
  activities = [],
  onAddActivity,
  isPro,
  onOpenUpgrade,
}) => {
  const [selectedCategory, setSelectedCategory] =
    useState<ExploreCategory>("all");

  const [searchQuery, setSearchQuery] = useState("");

  const [addingId, setAddingId] = useState<string | null>(null);

  const [selectedDay, setSelectedDay] = useState<number>(1);

  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const [places, setPlaces] = useState<GooglePlace[]>([]);
  const [explorePlaces, setExplorePlaces] = useState<ExploreResult[]>([]);

  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const [placesError, setPlacesError] = useState<string | null>(null);

  const [destinationAddress, setDestinationAddress] = useState<string | null>(
    null,
  );

  const [destinationCoordinates, setDestinationCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const displayDestination = getDisplayDestination(trip.destination);

  /**
   * Load places whenever the trip destination
   * or selected category changes.
   *
   * For "All Highlights", we load attractions,
   * restaurants and cafes in parallel.
   */
  useEffect(() => {
    let cancelled = false;

    const loadPlacePhotos = async () => {
      if (places.length === 0) {
        setExplorePlaces([]);
        return;
      }

      try {
        const results = await Promise.all(
          places.map((place) =>
            mapGooglePlace(place, selectedCategory, trip.destination),
          ),
        );

        if (!cancelled) {
          setExplorePlaces(results);
        }
      } catch (error) {
        console.error("Failed to load place photos:", error);

        if (!cancelled) {
          // Even if photos fail, still show
          // the places themselves.
          const fallbackResults = places.map((place) => {
            const pTitle = place.displayName?.text || "Unknown Place";
            const pCat = getPlaceCategory(place, selectedCategory);
            return {
              id: place.id,

              title: pTitle,

              address: place.formattedAddress || "Address unavailable",

              destination: trip.destination,

              image: resolvePlacePhoto(pTitle, trip.destination, pCat),

              rating: place.rating ?? 0,

              reviewCount: place.userRatingCount ?? 0,

              category: pCat,

              bestTime: "Check opening hours",

              estCostINR: 0,

              insiderTip: "Check Google Maps for the latest information.",

              tags: (place.types ?? []).slice(0, 5),

              googleMapsUri: place.googleMapsUri,

              websiteUri: place.websiteUri,

              latitude: place.location?.latitude,

              longitude: place.location?.longitude,
            };
          });

          setExplorePlaces(fallbackResults as ExploreResult[]);
        }
      }
    };

    loadPlacePhotos();

    return () => {
      cancelled = true;
    };
  }, [places, selectedCategory, trip.destination]);
  useEffect(() => {
    let cancelled = false;

    const loadPlaces = async () => {
      if (!trip.destination?.trim()) {
        setPlaces([]);
        setPlacesError("This trip does not have a destination.");
        return;
      }

      setLoadingPlaces(true);
      setPlacesError(null);

      try {
        // -----------------------------------------
        // 1. Convert destination → coordinates
        // -----------------------------------------
        const location = await findDestinationLocation(trip.destination);

        if (!location) {
          throw new Error(
            `Could not find "${trip.destination}". Please check the trip destination.`,
          );
        }

        if (cancelled) return;

        setDestinationAddress(location.formattedAddress ?? null);

        setDestinationCoordinates({
          latitude: location.latitude,
          longitude: location.longitude,
        });

        // -----------------------------------------
        // 2. Search nearby places
        // -----------------------------------------
        if (selectedCategory === "all") {
          const categories: Exclude<ExploreCategory, "all">[] = [
            "attraction",
            "restaurant",
            "cafe",
          ];

          const results = await Promise.all(
            categories.map((category) =>
              searchNearbyPlaces(
                location.latitude,
                location.longitude,
                CATEGORY_TO_API[category],
                15000,
              ),
            ),
          );

          if (cancelled) return;

          const merged = results.flat();

          // Remove duplicate places returned by
          // multiple searches.
          const uniquePlaces = Array.from(
            new Map(merged.map((place) => [place.id, place])).values(),
          );

          // Sort by rating first.
          uniquePlaces.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

          setPlaces(uniquePlaces);
        } else {
          const results = await searchNearbyPlaces(
            location.latitude,
            location.longitude,
            CATEGORY_TO_API[selectedCategory],
            15000,
          );

          if (cancelled) return;

          setPlaces(results);
        }
      } catch (error) {
        console.warn("Notice loading live Google Places, loading curated local gems:", error);

        if (!cancelled) {
          const curatedGems = getGemsForDestination(trip.destination, selectedCategory);
          setExplorePlaces(curatedGems as ExploreResult[]);
          setPlacesError(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingPlaces(false);
        }
      }
    };

    loadPlaces();

    return () => {
      cancelled = true;
    };
  }, [trip.destination, selectedCategory]);

  /**
   * Convert Google Places → existing ExplorePlace
   * structure used by your UI.
   */

  /**
   * Local search.
   *
   * Important:
   * We don't call Google every time the user types.
   * We filter the already-loaded results locally.
   */
  const filteredPlaces = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return explorePlaces;
    }

    return explorePlaces.filter((place) => {
      return (
        place.title.toLowerCase().includes(query) ||
        place.address.toLowerCase().includes(query) ||
        place.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [explorePlaces, searchQuery]);

  /**
   * Add selected place to itinerary.
   */
  const handleQuickAdd = async (place: ExploreResult) => {
    const actCategory = getActivityCategory(
      selectedCategory === "all"
        ? place.category === "food"
          ? "restaurant"
          : "attraction"
        : selectedCategory,
    );

    setAddingId(place.id);

    try {
      const notes = [
        "Discovered through JKVoyage Explore.",
        place.googleMapsUri ? `Google Maps: ${place.googleMapsUri}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await onAddActivity({
        day: selectedDay,
        time: "10:00 AM",
        title: place.title,
        category: actCategory,
        location: place.address,
        costINR: place.estCostINR,
        notes,
        latitude: place.latitude,
        longitude: place.longitude,
      });

      setAddedIds((prev) => ({
        ...prev,
        [place.id]: true,
      }));
    } catch (error) {
      console.error("Failed to add explore stop:", error);
    } finally {
      setAddingId(null);
    }
  };

  const handleCategoryChange = (category: ExploreCategory) => {
    setSelectedCategory(category);
    setSearchQuery("");
  };

  const retryPlaces = () => {
    // Re-run the effect by changing category to
    // itself through a temporary refresh mechanism.
    setPlacesError(null);

    // The destination/category effect normally
    // handles loading. A simple page reload isn't
    // necessary.
    setSelectedCategory((current) => {
      return current === "all" ? "attraction" : "all";
    });
  };

  return (
    <div className="space-y-6">
      {/* =========================================
          HEADER
      ========================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-sky-100 mb-3">
            <Sparkles className="w-3.5 h-3.5" />

            <span>Live Local Discovery</span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Explore {displayDestination} & Beyond
          </h3>

          <p className="text-xs sm:text-sm text-sky-100/90 mt-1.5 leading-relaxed">
            Discover real places, restaurants, cafes and attractions around your
            trip destination. Add any place directly to your itinerary.
          </p>

          {destinationAddress && (
            <div className="flex items-center gap-2 mt-4 text-xs text-white/80">
              <MapPin className="w-3.5 h-3.5 shrink-0" />

              <span className="truncate">{destinationAddress}</span>

              {destinationCoordinates && (
                <span className="hidden sm:inline text-white/50">
                  • Within 15 km
                </span>
              )}
            </div>
          )}
        </div>

        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* =========================================
          FILTER + SEARCH
      ========================================== */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pb-1 md:pb-0">
          {CATEGORY_CONFIG.map((cat) => {
            const Icon = cat.icon;

            const active = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold shrink-0 transition-all ${
                  active
                    ? "bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/20"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />

                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-auto md:min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places, restaurants, cafes..."
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* =========================================
          LOADING
      ========================================== */}
      {loadingPlaces && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-14 px-6 text-center">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mx-auto" />

          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-4">
            Finding places near {displayDestination}
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Searching real places within 15 km of your trip destination...
          </p>
        </div>
      )}

      {/* =========================================
          ERROR
      ========================================== */}
      {!loadingPlaces && placesError && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 p-6 text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center">
            <MapPin className="w-6 h-6" />
          </div>

          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-4">
            Unable to load places
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            {placesError}
          </p>

          <button
            type="button"
            onClick={retryPlaces}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}

      {/* =========================================
          RESULTS
      ========================================== */}
      {!loadingPlaces && !placesError && filteredPlaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPlaces.map((place) => {
            const isAdded = !!addedIds[place.id];

            const isPickingDay = addingId === place.id;

            return (
              <div
                key={place.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* =================================
                        IMAGE
                    ================================== */}
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-950">
                    <img
                      src={place.image}
                      alt={place.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = resolvePlacePhoto(place.title, trip.destination, place.category);
                      }}
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                    {/* Rating */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-amber-400 text-xs font-bold border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-current" />

                      <span>
                        {place.rating > 0 ? place.rating.toFixed(1) : "New"}
                      </span>

                      {place.reviewCount > 0 && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({place.reviewCount})
                        </span>
                      )}
                    </div>

                    {/* Category */}
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-sky-500/90 text-slate-950 text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                      {place.category.replace("_", " ")}
                    </div>

                    {/* Title */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="text-base font-bold leading-tight drop-shadow-sm">
                        {place.title}
                      </h4>

                      <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-sky-400 shrink-0" />

                        <span className="truncate">{place.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* =================================
                        DETAILS
                    ================================== */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />

                        <span>{place.bestTime}</span>
                      </div>

                      <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase">
                        Live Place
                      </span>
                    </div>

                    {/* Insider tip */}
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-sky-600 dark:text-sky-400 mr-1">
                        Tip:
                      </span>

                      {place.insiderTip}
                    </div>

                    {/* Tags */}
                    {place.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {place.tags.map((tag, index) => (
                          <span
                            key={`${place.id}-${tag}-${index}`}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Google Maps */}
                    {place.googleMapsUri && (
                      <a
                        href={place.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* =================================
                      ADD TO ITINERARY
                  ================================== */}
                <div className="p-4 sm:p-5 pt-0">
                  {isAdded ? (
                    <div className="w-full py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4" />

                      <span>Added to Itinerary (Day {selectedDay})</span>
                    </div>
                  ) : isPickingDay ? (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Choose Day:
                        </span>

                        <select
                          value={selectedDay}
                          onChange={(e) =>
                            setSelectedDay(Number(e.target.value))
                          }
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-sky-600 dark:text-sky-400"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <option key={day} value={day}>
                              Day {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAddingId(null)}
                          className="flex-1 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          Cancel
                        </button>

                        <button
                          type="button"
                          onClick={() => handleQuickAdd(place)}
                          disabled={addingId === place.id}
                          className="flex-1 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1"
                        >
                          {addingId === place.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          Confirm Stop
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingId(place.id)}
                      className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/60"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-500" />

                      <span>Add to Itinerary</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================
          NO RESULTS
      ========================================== */}
      {!loadingPlaces && !placesError && filteredPlaces.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
          <Compass className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />

          <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Places Found
          </h4>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            No matching places were found near {displayDestination}. Try another
            category or search term.
          </p>
        </div>
      )}
    </div>
  );
};
