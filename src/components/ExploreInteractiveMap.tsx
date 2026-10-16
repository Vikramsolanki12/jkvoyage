import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Compass,
  Navigation,
  Clock,
  ExternalLink,
  Layers,
  Sparkles,
  Calendar,
  IndianRupee,
  Plus,
  Check,
  Eye,
  Info,
  Maximize2
} from 'lucide-react';
import { Trip, Activity, ActivityCategory } from '../types/travel.ts';
import { resolvePlacePhoto } from '../data/explorePlaces.ts';
import { GooglePlace } from '../services/placesApi.ts';

export interface MapStop {
  id: string;
  title: string;
  location: string;
  category: string;
  day?: number;
  time?: string;
  costINR?: number;
  latitude: number;
  longitude: number;
  image?: string;
  source: 'saved_activity' | 'google_places';
  googleMapsUri?: string;
  rating?: number;
}

interface ExploreInteractiveMapProps {
  trip: Trip;
  activities?: Activity[];
  googlePlaces?: GooglePlace[];
  destinationCoordinates?: { latitude: number; longitude: number } | null;
  onAddActivity?: (act: {
    day: number;
    time: string;
    title: string;
    category: ActivityCategory;
    location: string;
    costINR: number;
    notes?: string;
  }) => Promise<void>;
}

export const ExploreInteractiveMap: React.FC<ExploreInteractiveMapProps> = ({
  trip,
  activities = [],
  googlePlaces = [],
  destinationCoordinates,
  onAddActivity
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'saved' | 'discovered'>('saved');
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [addedMapIds, setAddedMapIds] = useState<Record<string, boolean>>({});

  // Center coordinates (fallback to New Delhi / Jaipur if not yet fetched)
  const baseLat = destinationCoordinates?.latitude || 26.9124;
  const baseLng = destinationCoordinates?.longitude || 75.7873;

  // Synthesize and merge mapped locations from saved activities and Google Places
  const allStops: MapStop[] = useMemo(() => {
    const stops: MapStop[] = [];

    // 1. Saved Activities from Itinerary
    activities.forEach((act, idx) => {
      // Find matching coordinates from Google Places if available
      const matchedPlace = googlePlaces.find(
        (p) =>
          p.displayName?.text?.toLowerCase().includes(act.title.toLowerCase()) ||
          act.location.toLowerCase().includes(p.displayName?.text?.toLowerCase() || '')
      );

      // Deterministic slight offset if matching place not found so pins are distributed
      const angle = (idx * (360 / Math.max(1, activities.length)) * Math.PI) / 180;
      const radius = 0.015 + (idx % 3) * 0.008;
      const lat =
        act.latitude || matchedPlace?.location?.latitude || baseLat + Math.sin(angle) * radius;
      const lng =
        act.longitude || matchedPlace?.location?.longitude || baseLng + Math.cos(angle) * radius;

      stops.push({
        id: `act_${act.id}`,
        title: act.title,
        location: act.location,
        category: act.category,
        day: act.day,
        time: act.time,
        costINR: act.costINR,
        latitude: lat,
        longitude: lng,
        image: resolvePlacePhoto(act.title, trip.destination, act.category),
        source: 'saved_activity',
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${act.title} ${act.location}`
        )}`
      });
    });

    // 2. Discovered Places from Google Places API
    googlePlaces.slice(0, 15).forEach((place) => {
      if (!place.location?.latitude || !place.location?.longitude) return;

      const pTitle = place.displayName?.text || 'Discovered Spot';
      const pAddr = place.formattedAddress || trip.destination;
      const pCat = place.primaryType?.includes('restaurant') ? 'food' : 'attraction';

      stops.push({
        id: `gp_${place.id}`,
        title: pTitle,
        location: pAddr,
        category: pCat,
        latitude: place.location.latitude,
        longitude: place.location.longitude,
        rating: place.rating,
        image: resolvePlacePhoto(pTitle, trip.destination, pCat),
        source: 'google_places',
        googleMapsUri:
          place.googleMapsUri ||
          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${pTitle} ${pAddr}`
          )}`
      });
    });

    return stops;
  }, [activities, googlePlaces, baseLat, baseLng, trip.destination]);

  // Filter stops according to user selections
  const filteredStops = useMemo(() => {
    return allStops.filter((stop) => {
      if (filterMode === 'saved' && stop.source !== 'saved_activity') return false;
      if (filterMode === 'discovered' && stop.source !== 'google_places') return false;
      if (selectedDay !== 'all' && stop.day !== undefined && stop.day !== selectedDay) {
        return false;
      }
      return true;
    });
  }, [allStops, filterMode, selectedDay]);

  // Currently active or highlighted stop
  const activeStop = useMemo(() => {
    if (!selectedStopId) return filteredStops[0] || null;
    return allStops.find((s) => s.id === selectedStopId) || filteredStops[0] || null;
  }, [selectedStopId, filteredStops, allStops]);

  // Available days for filter
  const uniqueDays = useMemo(() => {
    const days = new Set<number>();
    activities.forEach((a) => days.add(a.day));
    return Array.from(days).sort((a, b) => a - b);
  }, [activities]);

  const handleAddStopToItinerary = async (stop: MapStop) => {
    if (!onAddActivity) return;
    try {
      await onAddActivity({
        day: 1,
        time: '11:00 AM',
        title: stop.title,
        category: (stop.category as ActivityCategory) || 'sightseeing',
        location: stop.location,
        costINR: stop.costINR || 0,
        notes: `Saved from Google Places Map: ${stop.googleMapsUri || ''}`
      });
      setAddedMapIds((prev) => ({ ...prev, [stop.id]: true }));
    } catch (e) {
      console.error('Failed to add map stop:', e);
    }
  };

  // Embed Google Maps query
  const mapQueryLocation = activeStop
    ? `${activeStop.latitude},${activeStop.longitude}`
    : trip.destination;
  const embedMapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    mapQueryLocation
  )}&z=14&output=embed`;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400">
              <Navigation className="w-4 h-4" />
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Interactive Itinerary & Places Map
            </h3>
            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              GPS Powered
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View saved itinerary stops and Google Places locations around {trip.destination}. Click
            any marker to inspect details and get directions.
          </p>
        </div>

        {/* View Filter Toggle */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setFilterMode('saved')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterMode === 'saved'
                ? 'bg-sky-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Saved Stops ({activities.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('discovered')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterMode === 'discovered'
                ? 'bg-sky-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Google Places ({googlePlaces.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({allStops.length})
          </button>
        </div>
      </div>

      {/* Day Filter Pills (when viewing saved stops) */}
      {uniqueDays.length > 0 && filterMode !== 'discovered' && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-500" />
            <span>Itinerary Day:</span>
          </span>
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
              selectedDay === 'all'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Days
          </button>
          {uniqueDays.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                selectedDay === d
                  ? 'bg-sky-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Day {d}
            </button>
          ))}
        </div>
      )}

      {/* Map + Stop Details Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Interactive Map View */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="relative w-full h-[360px] sm:h-[420px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner bg-slate-950">
            <iframe
              src={embedMapUrl}
              title="Google Places Interactive Map"
              className="w-full h-full border-0 filter contrast-[1.02]"
              loading="lazy"
              allowFullScreen
            />

            {/* Overlaid Active Pin Badge */}
            {activeStop && (
              <div className="absolute top-3 left-3 right-3 sm:right-auto max-w-sm bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 bg-slate-200">
                    <img
                      src={activeStop.image}
                      alt={activeStop.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="truncate">
                    <h5 className="font-bold text-slate-900 dark:text-white truncate">
                      {activeStop.title}
                    </h5>
                    <p className="text-[10px] text-slate-500 truncate">{activeStop.location}</p>
                  </div>
                </div>

                <a
                  href={activeStop.googleMapsUri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-xl bg-sky-500 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0 hover:bg-sky-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Navigate</span>
                </a>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>
                Displaying <strong>{filteredStops.length}</strong> location coordinates on map
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              Center: {trip.destination} ({baseLat.toFixed(4)}, {baseLng.toFixed(4)})
            </span>
          </div>
        </div>

        {/* Right Side: Stops Sequence List & Details */}
        <div className="lg:col-span-4 flex flex-col space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1 pb-1">
            <span>Location Stops List</span>
            <span>{filteredStops.length} locations</span>
          </div>

          {filteredStops.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Compass className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No locations match this filter.</p>
            </div>
          ) : (
            filteredStops.map((stop, idx) => {
              const isSelected = activeStop?.id === stop.id;
              const isSaved = stop.source === 'saved_activity';
              const isAdded = !!addedMapIds[stop.id];

              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-400 dark:border-sky-500 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-slate-200">
                      <img
                        src={stop.image}
                        alt={stop.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-slate-900/80 text-white text-[9px] font-black rounded-tl flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    <div className="truncate">
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {stop.title}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                        <span className="truncate">{stop.location}</span>
                      </div>
                      {isSaved && stop.day && (
                        <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">
                          Day {stop.day} • {stop.time || 'Scheduled'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {isSaved ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        Saved
                      </span>
                    ) : isAdded ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddStopToItinerary(stop);
                        }}
                        className="p-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition-colors cursor-pointer"
                        title="Add to Itinerary"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={stop.googleMapsUri}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-slate-400 hover:text-sky-500 p-1 transition-colors"
                      title="Open in Google Maps"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreInteractiveMap;
