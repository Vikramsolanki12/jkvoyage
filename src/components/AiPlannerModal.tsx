import React, { useState } from 'react';
import { Sparkles, X, Loader2, Compass } from 'lucide-react';
import { Activity, Trip } from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface AiPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onAddActivities: (activities: Activity[]) => Promise<void>;
}

export const AiPlannerModal: React.FC<AiPlannerModalProps> = ({
  isOpen,
  onClose,
  trip,
  onAddActivities
}) => {
  const { currentUser } = useAuth();
  const [vibe, setVibe] = useState<'heritage' | 'adventure' | 'foodie' | 'scenic' | 'nightlife'>('heritage');
  const [pace, setPace] = useState<'balanced' | 'packed' | 'relaxed'>('balanced');
  const [generating, setGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!currentUser) return;
    setGenerating(true);

    try {
      const generated: Activity[] = [];
      const dest = trip.destination.split(',')[0].trim();

      if (vibe === 'heritage') {
        generated.push(
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '09:00',
            title: `Heritage Walk through ${dest} Old Town`,
            category: 'sightseeing',
            location: `${dest} Historical Quarter`,
            costINR: 1500,
            notes: 'Guided storytelling walk exploring ancient archways and architectural wonders.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '13:00',
            title: `Traditional Feast at ${dest} Heritage Haveli`,
            category: 'food',
            location: `${dest} Royal Dining Room`,
            costINR: 1800,
            notes: 'Authentic multi-course regional platter prepared using ancestral recipes.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 2,
            time: '17:30',
            title: `Sunset Fortress Panorama & Sound-and-Light Show`,
            category: 'activity',
            location: `${dest} Citadel Overlook`,
            costINR: 1200,
            notes: 'Golden hour photography followed by historical sound and light projection.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          }
        );
      } else if (vibe === 'adventure') {
        generated.push(
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '06:30',
            title: `Sunrise Trek & Ridge Viewpoint in ${dest}`,
            category: 'activity',
            location: `${dest} Peak Trailhead`,
            costINR: 1200,
            notes: 'Early morning hike for panoramic cloud-line views and wildlife spotting.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '14:00',
            title: `Off-Road 4x4 Trail or Water Rapids Session`,
            category: 'activity',
            location: `${dest} Outdoor Adventure Center`,
            costINR: 3500,
            notes: 'Adrenaline pumping outdoor expedition with safety certified instructors.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          }
        );
      } else if (vibe === 'foodie') {
        generated.push(
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '11:00',
            title: `Street Food Trail: Iconic Chaat & Local Delicacies`,
            category: 'food',
            location: `${dest} Central Bazaar`,
            costINR: 800,
            notes: 'Sampling legendary street stalls, sweets, spiced tea and savory bites.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '19:30',
            title: `Rooftop Candlelight Dinner with Panoramic Skyline`,
            category: 'food',
            location: `${dest} Horizon Lounge`,
            costINR: 2800,
            notes: 'Handcrafted cocktails and fusion delicacies overlooking city lights.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          }
        );
      } else {
        generated.push(
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 1,
            time: '10:00',
            title: `Scenic Botanical Gardens & Lake Walk`,
            category: 'sightseeing',
            location: `${dest} Waterfront Promenade`,
            costINR: 600,
            notes: 'Gentle stroll along peaceful lakefront gardens and artisanal handicraft shops.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          },
          {
            id: 'ai_' + Math.random().toString(36).substring(2, 9),
            tripId: trip.id,
            day: 2,
            time: '16:00',
            title: `Artisanal Pottery Workshop & High Tea`,
            category: 'activity',
            location: `${dest} Craft Atelier`,
            costINR: 1500,
            notes: 'Hands-on clay pottery session followed by premium Darjeeling tea and scones.',
            createdBy: currentUser.uid,
            createdAt: new Date().toISOString()
          }
        );
      }

      await onAddActivities(generated);
      onClose();
    } catch (err) {
      console.error('Error generating AI itinerary:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 text-slate-950">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Smart Itinerary Planner</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Curates day schedules for {trip.destination}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Trip vibe selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Select Trip Atmosphere & Style:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'heritage', label: '🏛️ Heritage & Culture' },
                { id: 'adventure', label: '🧗 Adventure & Outdoors' },
                { id: 'foodie', label: '🍛 Street Food & Cafes' },
                { id: 'scenic', label: '🌅 Scenic & Sunset' },
                { id: 'nightlife', label: '🍸 Rooftops & Social' }
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setVibe(item.id as any)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                    vibe === item.id
                      ? 'bg-sky-500/15 border-sky-500 text-sky-600 dark:text-sky-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pace selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Schedule Pace:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'relaxed', label: 'Relaxed (1-2 stops)' },
                { id: 'balanced', label: 'Balanced (2-3 stops)' },
                { id: 'packed', label: 'High Energy (4+ stops)' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPace(p.id as any)}
                  className={`p-2 rounded-xl border text-center text-xs font-medium transition-all ${
                    pace === p.id
                      ? 'bg-indigo-500/15 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" />
              <span>Smart Itinerary Optimization</span>
            </div>
            <p>
              Activities will be automatically appended to your trip timeline with timings, estimated costs in ₹ INR, and practical tips.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-lg shadow-sky-500/25 transition-all disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Planning Schedule...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Activities</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
