import React, { useState } from 'react';
import { Plus, X, MapPin, IndianRupee, Image, Upload, Camera } from 'lucide-react';
import { Trip } from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { compressImageFile, uploadPhotoFile } from '../utils/fileUpload.ts';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTrip: (trip: Trip) => Promise<void>;
}

const DESTINATION_PRESETS = [
  {
    title: 'Goa Coastal Getaway & Sunset Cruising',
    destination: 'Goa, India',
    budgetINR: 45000,
    coverImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
    notes: 'Sun, sand, water sports at Baga & Calangute, and heritage churches in Old Goa.'
  },
  {
    title: 'Ladakh High Passes & Pangong Expedition',
    destination: 'Leh Ladakh, India',
    budgetINR: 65000,
    coverImage: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1200&q=80',
    notes: 'High-altitude road trip via Khardung La, Nubra Valley sand dunes, and crystal blue Pangong Lake.'
  },
  {
    title: 'Kerala Backwaters & Munnar Tea Trails',
    destination: 'Kochi, Munnar & Alleppey, India',
    budgetINR: 52000,
    coverImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
    notes: 'Serene houseboat stays on Vembanad Lake, tea plantations, and spice gardens.'
  },
  {
    title: 'Dubai Sky & Desert Safari Odyssey',
    destination: 'Dubai, UAE',
    budgetINR: 120000,
    coverImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    notes: 'Burj Khalifa observation deck, dune bashing in red desert sands, and Dubai Mall fountain show.'
  },
  {
    title: 'Bali Island Sanctuary & Ubud Waterfalls',
    destination: 'Bali, Indonesia',
    budgetINR: 95000,
    coverImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
    notes: 'Tegallalang rice terraces, Uluwatu cliff temple, and coastal seafood dining in Jimbaran Bay.'
  }
];

export const NewTripModal: React.FC<NewTripModalProps> = ({
  isOpen,
  onClose,
  onCreateTrip
}) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetINR, setBudgetINR] = useState<number>(50000);
  const [coverImage, setCoverImage] = useState(
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80'
  );
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const uploadRes = await uploadPhotoFile(file);
      setCoverImage(uploadRes.url);
    } catch (err) {
      console.error('Failed to process cover image:', err);
    } finally {
      setUploadingCover(false);
    }
  };

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof DESTINATION_PRESETS[0]) => {
    setTitle(preset.title);
    setDestination(preset.destination);
    setBudgetINR(preset.budgetINR);
    setCoverImage(preset.coverImage);
    setNotes(preset.notes);

    const today = new Date();
    const start = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
    const end = new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !destination.trim() || !currentUser) return;
    setSubmitting(true);

    try {
      const tripId = 'trip_' + Date.now();
      const ownerEmailClean = currentUser.email ? currentUser.email.trim().toLowerCase() : '';
      const newTrip: Trip = {
        id: tripId,
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || 'Trip Planner',
        ownerEmail: ownerEmailClean,
        memberUids: [currentUser.uid],
        memberEmails: ownerEmailClean ? [ownerEmailClean] : [],
        collaborators: [
          {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Trip Planner',
            email: ownerEmailClean,
            role: 'planner',
            addedAt: new Date().toISOString()
          }
        ],
        title: title.trim(),
        destination: destination.trim(),
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        budgetINR: Number(budgetINR) || 25000,
        coverImage: coverImage.trim() || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1200&q=80',
        status: 'planning',
        notes: notes.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await onCreateTrip(newTrip);
      onClose();
      setTitle('');
      setDestination('');
      setNotes('');
    } catch (err) {
      console.error('Failed to create trip:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 dark:text-sky-400 border border-sky-500/20">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create New Trip Itinerary</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Synced directly to your Firebase Firestore database</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets Carousel */}
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Or pick a curated travel theme:
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {DESTINATION_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-sky-500 text-slate-700 dark:text-slate-300 whitespace-nowrap transition-all"
              >
                {preset.destination.split(',')[0]}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trip Title *
            </label>
            <input
              type="text"
              required
              maxLength={150}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Goa Monsoon Beach Retreat"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Destination Location *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                maxLength={120}
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. North Goa, India"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Allocated Budget (₹ INR) *
              </label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  min={1000}
                  value={budgetINR}
                  onChange={(e) => setBudgetINR(Number(e.target.value))}
                  placeholder="50000"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Cover Photo
                </label>
                <label className="text-[11px] font-bold text-sky-500 hover:text-sky-400 cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  <span>{uploadingCover ? 'Optimizing...' : 'Upload Device Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="hidden"
                    disabled={uploadingCover}
                  />
                </label>
              </div>
              <div className="relative">
                <Image className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  maxLength={500}
                  value={coverImage.startsWith('data:') ? 'Custom Photo Uploaded ✓' : coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 truncate"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Trip Overview & Group Notes
            </label>
            <textarea
              maxLength={2000}
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key highlights, hotel booking details, or travel goals..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 resize-none"
            />
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
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/25"
            >
              {submitting ? 'Creating Journey...' : 'Create Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
