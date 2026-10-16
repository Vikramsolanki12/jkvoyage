import React, { useEffect, useState, useRef } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Star,
  Camera,
  Calendar,
  Sparkles,
  Printer,
  Smile,
  ShieldCheck,
  Check,
  X,
  Upload,
  Image as ImageIcon,
  Maximize2,
  MapPin,
  Clock,
  User,
  Heart,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Trip, Activity, Expense, DigitalDocument, PackingItem, JournalEntry } from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  subscribeJournalEntries,
  addJournalEntry,
  deleteJournalEntry
} from '../services/travelService.ts';
import { compressImageFile, uploadPhotoFile } from '../utils/fileUpload.ts';

interface JournalTabProps {
  trip: Trip;
  activities: Activity[];
  expenses: Expense[];
  documents: DigitalDocument[];
  packingItems: PackingItem[];
  isPro: boolean;
  onOpenUpgrade: (msg?: string) => void;
}

export const JournalTab: React.FC<JournalTabProps> = ({
  trip,
  activities,
  expenses,
  documents,
  packingItems,
  isPro,
  onOpenUpgrade
}) => {
  const { currentUser, userProfile } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);
  const [activePhotoModal, setActivePhotoModal] = useState<{
    photos: string[];
    currentIndex: number;
    title: string;
    story: string;
    day?: number;
  } | null>(null);

  // Form State
  const [day, setDay] = useState(1);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(5);
  const [mood, setMood] = useState('Happy & Energized ✨');
  const [attachedPhotos, setAttachedPhotos] = useState<string[]>([]);
  const [customUrlInput, setCustomUrlInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [compressingPhotos, setCompressingPhotos] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe directly to Firebase Firestore
  useEffect(() => {
    if (!trip?.id) return;
    const unsub = subscribeJournalEntries(trip.id, (loadedEntries) => {
      setEntries(loadedEntries);
    });
    return () => unsub();
  }, [trip?.id]);

  const totalSpent = expenses.reduce((sum, e) => sum + e.amountINR, 0);

  // Handle local image file upload, cloud storage upload & high-performance compression
  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressingPhotos(true);
    setErrorMessage(null);

    const newPhotos: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);
        if (!isImg) continue;

        // Auto-compress and securely upload to cloud storage endpoint (/api/documents/upload)
        const uploadResult = await uploadPhotoFile(file, trip.id, currentUser?.uid);
        if (uploadResult.url) {
          newPhotos.push(uploadResult.url);
        }
      }

      if (newPhotos.length > 0) {
        setAttachedPhotos((prev) => [...prev, ...newPhotos].slice(0, 8)); // max 8 photos per entry
      }
    } catch (err: any) {
      console.error('Failed to process/upload photos:', err);
      setErrorMessage('Could not process photo. Please try a different image.');
    } finally {
      setCompressingPhotos(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  };

  const handleAddCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setAttachedPhotos((prev) => [...prev, customUrlInput.trim()].slice(0, 8));
    setCustomUrlInput('');
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setAttachedPhotos((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !trip?.id) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const finalPhotos = [...attachedPhotos];
      if (customUrlInput.trim() && !finalPhotos.includes(customUrlInput.trim())) {
        finalPhotos.push(customUrlInput.trim());
      }
      const primaryPhoto = finalPhotos[0] || undefined;

      const newEntry: JournalEntry = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tripId: trip.id,
        day,
        date: `Day ${day} • ${trip.title}`,
        title: title.trim(),
        content: content.trim(),
        rating,
        mood,
        photoUrl: primaryPhoto,
        photos: finalPhotos,
        authorName: userProfile?.displayName || currentUser?.displayName || 'Traveler',
        authorId: currentUser?.uid,
        createdAt: new Date().toISOString()
      };

      // Optimistic update so photos and entry appear immediately with zero delay
      setEntries((prev) => [newEntry, ...prev.filter((e) => e.id !== newEntry.id)]);

      // Clean form and close modal immediately
      setTitle('');
      setContent('');
      setAttachedPhotos([]);
      setCustomUrlInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      setModalOpen(false);

      // Persist to storage and Firestore
      await addJournalEntry(trip.id, newEntry, trip.title);
    } catch (err: any) {
      console.error('Failed to save reflection to Firestore:', err);
      setErrorMessage(err?.message || 'Failed to save reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!trip?.id) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    try {
      await deleteJournalEntry(trip.id, id);
    } catch (err) {
      console.error('Failed to delete memory from Firestore:', err);
    }
  };

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-sky-500" />
              <span>Trip Diary & Photo Journal</span>
            </h3>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold border border-sky-500/30">
              Synced with Cloud Database
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Add photos, record moments, capture memories, and generate an official trip dossier for {trip.title}.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowDossierModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export Trip Dossier</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Photo & Reflection</span>
          </button>
        </div>
      </div>

      {/* Journal Entries Stream */}
      {entries.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <Camera className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No travel memories recorded yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Capture photos of street food, majestic sights, or quiet sunrises from {trip.destination} and write your personal reflections.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add First Photo & Story
          </button>
        </div>
      ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {entries.map((entry) => {
            const allEntryPhotos = (entry.photos && entry.photos.length > 0)
              ? entry.photos
              : (entry.photoUrl ? [entry.photoUrl] : []);
            const hasPhotos = allEntryPhotos.length > 0;
            const primaryPhoto = allEntryPhotos[0];

            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Header */}
                  {hasPhotos && (
                    <div className="space-y-2">
                      <div
                        onClick={() =>
                          setActivePhotoModal({
                            photos: allEntryPhotos,
                            currentIndex: 0,
                            title: entry.title,
                            story: entry.content,
                            day: entry.day
                          })
                        }
                        className="relative h-56 w-full bg-slate-950 overflow-hidden cursor-pointer group"
                      >
                        <img
                          src={primaryPhoto}
                          alt={entry.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        
                        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-sky-400" />
                          <span>Day {entry.day}</span>
                        </div>

                        {allEntryPhotos.length > 1 && (
                          <div className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-slate-950/80 text-white backdrop-blur-md text-[11px] font-black border border-white/15 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-sky-400" />
                            <span>{allEntryPhotos.length} Photos</span>
                          </div>
                        )}

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="text-base font-bold drop-shadow-sm leading-tight line-clamp-1">
                            {entry.title}
                          </h4>
                        </div>
                      </div>

                      {/* Multi-Photo Thumbnail Bar */}
                      {allEntryPhotos.length > 1 && (
                        <div className="px-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                          {allEntryPhotos.map((photo, pIdx) => (
                            <button
                              key={pIdx}
                              type="button"
                              onClick={() =>
                                setActivePhotoModal({
                                  photos: allEntryPhotos,
                                  currentIndex: pIdx,
                                  title: entry.title,
                                  story: entry.content,
                                  day: entry.day
                                })
                              }
                              className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:border-sky-500 shrink-0 cursor-pointer transition-all"
                            >
                              <img
                                src={photo}
                                alt={`Thumbnail ${pIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black/10 hover:bg-transparent" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 space-y-3">
                    {!hasPhotos && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Day {entry.day} Journal
                        </span>
                        <span className="text-[11px] text-slate-400">{entry.authorName}</span>
                      </div>
                    )}

                    {!hasPhotos && (
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {entry.title}
                        </h4>
                        <div className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: entry.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                    )}

                    {hasPhotos && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1 text-[11px]">
                          <User className="w-3 h-3 text-slate-400" />
                          {entry.authorName}
                        </span>
                        <div className="flex items-center text-amber-400 text-xs">
                          {Array.from({ length: entry.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                      {entry.content}
                    </p>

                    <div className="pt-2 flex items-center justify-between text-[11px]">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                        {entry.mood}
                      </span>
                      <span className="text-slate-400">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 flex justify-end">
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Delete memory"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write Memory & Upload Photo Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mb-1 flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-500" />
              <span>Add Photo & Write Diary Story</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Attach travel pictures and describe your memorable moments from {trip.title}.
            </p>

            <form onSubmit={handleAddEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trip Day
                  </label>
                  <select
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-sky-600 dark:text-sky-400 focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 21].map((d) => (
                      <option key={d} value={d}>
                        Day {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Moment Rating
                  </label>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star
                          className={`w-4 h-4 ${star <= rating ? 'fill-current' : 'text-slate-300 dark:text-slate-700'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Title of the Memory / Photo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise view at the mountain ridge"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Photo Upload & Gallery Attachment Options */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Add Photos to Memory (Upload or Snap)
                  </label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full">
                    {attachedPhotos.length}/8 Photos • Auto-Compressed ⚡
                  </span>
                </div>

                {/* Upload & Camera Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    multiple
                    onChange={handleFilesChange}
                    className="hidden"
                    id="journal-photo-files"
                  />
                  <label
                    htmlFor="journal-photo-files"
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Photos</span>
                  </label>

                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFilesChange}
                    className="hidden"
                    id="journal-camera-snap"
                  />
                  <label
                    htmlFor="journal-camera-snap"
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Photo</span>
                  </label>

                  <span className="text-[11px] text-slate-400">or paste image link</span>
                </div>

                {/* Compressing State */}
                {compressingPhotos && (
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Compressing & optimizing photos for cloud sync...</span>
                  </div>
                )}

                {/* Direct Image URL input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomUrl}
                    disabled={!customUrlInput.trim()}
                    className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
                  >
                    Add Link
                  </button>
                </div>

                {/* Attached Photos Preview Strip */}
                {attachedPhotos.length > 0 && (
                  <div className="pt-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                      Attached Photos ({attachedPhotos.length})
                    </span>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {attachedPhotos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative group h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950"
                        >
                          <img
                            src={photo}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePhoto(idx)}
                            className="absolute top-1 right-1 p-1 rounded-md bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                            title="Remove photo"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-0 inset-x-0 bg-sky-500 text-slate-950 text-[8px] font-black uppercase text-center py-0.5">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Travel Mood Tag
                </label>
                <select
                  value={mood}
                  onChange={(e) => setMood(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="Happy & Energized ✨">Happy & Energized ✨</option>
                  <option value="Awe-Inspired & Majestic 🏰">Awe-Inspired & Majestic 🏰</option>
                  <option value="Peaceful & Relaxed 🌅">Peaceful & Relaxed 🌅</option>
                  <option value="Foodie Bliss 🥟">Foodie Bliss 🥟</option>
                  <option value="Wild Adventure 🏔️">Wild Adventure 🏔️</option>
                  <option value="Exhausted but Thrilled 🎒">Exhausted but Thrilled 🎒</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Story & Reflections *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe this moment. What happened? What sights, tastes, laughter, and sounds stood out?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Reflection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Photo Modal / Multi-Photo Lightbox */}
      {activePhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/95 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800 text-white shrink-0">
              <div className="flex items-center gap-2.5 truncate mr-2">
                {activePhotoModal.day && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold text-[10px] shrink-0 border border-sky-500/30">
                    Day {activePhotoModal.day}
                  </span>
                )}
                <h4 className="text-sm font-bold truncate">{activePhotoModal.title}</h4>
                {activePhotoModal.photos.length > 1 && (
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    ({activePhotoModal.currentIndex + 1}/{activePhotoModal.photos.length})
                  </span>
                )}
              </div>
              <button
                onClick={() => setActivePhotoModal(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                title="Close viewer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Photo Viewport with Left / Right Navigation */}
            <div className="relative flex-1 min-h-[300px] max-h-[62vh] overflow-hidden flex items-center justify-center bg-black">
              {activePhotoModal.photos[activePhotoModal.currentIndex] && (
                <img
                  src={activePhotoModal.photos[activePhotoModal.currentIndex]}
                  alt={`${activePhotoModal.title} photo ${activePhotoModal.currentIndex + 1}`}
                  className="w-full h-auto max-h-[60vh] object-contain select-none"
                />
              )}

              {/* Prev / Next Arrows */}
              {activePhotoModal.photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex:
                                prev.currentIndex === 0
                                  ? prev.photos.length - 1
                                  : prev.currentIndex - 1
                            }
                          : null
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                    title="Previous photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActivePhotoModal((prev) =>
                        prev
                          ? {
                              ...prev,
                              currentIndex:
                                prev.currentIndex === prev.photos.length - 1
                                  ? 0
                                  : prev.currentIndex + 1
                            }
                          : null
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 transition-all cursor-pointer shadow-lg"
                    title="Next photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Strip if multiple photos */}
            {activePhotoModal.photos.length > 1 && (
              <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-2 overflow-x-auto shrink-0">
                {activePhotoModal.photos.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      setActivePhotoModal((prev) => (prev ? { ...prev, currentIndex: idx } : null))
                    }
                    className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      activePhotoModal.currentIndex === idx
                        ? 'border-sky-500 scale-105 shadow-md shadow-sky-500/30'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={p} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Story / Description Footer */}
            {activePhotoModal.story && (
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-300 max-h-32 overflow-y-auto shrink-0">
                <p className="whitespace-pre-line leading-relaxed">{activePhotoModal.story}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exportable Trip Dossier Modal - Complete with Diary Photos & Write-ups */}
      {showDossierModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setShowDossierModal(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors print:hidden"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Dossier Header */}
            <div className="border-b-2 border-slate-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-sky-600 block">
                  Official Travel Dossier & Journey Chronicles
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">{trip.title}</h2>
                <p className="text-xs text-slate-600 mt-1">
                  Destination: <strong>{trip.destination}</strong> • Window: {trip.startDate} to {trip.endDate}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-xs font-bold text-slate-900">JKVoyage System</div>
                <div className="text-[11px] text-sky-600 font-semibold">Owned by JKSoftonics</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Comprehensive Travel Dossier</div>
              </div>
            </div>

            {/* Crew Details */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-slate-700">👑 Trip Planner: </span>
                <span className="font-extrabold text-slate-900">{trip.ownerName} ({trip.ownerEmail})</span>
              </div>
              <div>
                <span className="font-bold text-slate-700">🎒 Crew: </span>
                <span className="font-semibold text-slate-800">
                  {(trip.collaborators || []).length} traveler{(trip.collaborators || []).length === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Budget</span>
                <span className="text-lg font-black text-slate-900 font-mono">₹{trip.budgetINR.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Logged Spends</span>
                <span className="text-lg font-black text-amber-600 font-mono">₹{totalSpent.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Scheduled Stops</span>
                <span className="text-lg font-black text-sky-600 font-mono">{activities.length} Stops</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Diary Memories</span>
                <span className="text-lg font-black text-emerald-600 font-mono">{entries.length} Logged</span>
              </div>
            </div>

            {/* TRIP DIARY & VISUAL CHRONICLES (Photos & Stories in Dossier) */}
            <div className="mb-6">
              <h4 className="text-sm font-black uppercase tracking-wider text-slate-900 mb-3 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>Trip Diary & Photo Chronicles</span>
                <span className="text-xs font-normal text-slate-500 font-mono">{entries.length} reflections recorded</span>
              </h4>

              {entries.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No diary reflections recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {entries.map((entry) => {
                    const photos = (entry.photos && entry.photos.length > 0)
                      ? entry.photos
                      : (entry.photoUrl ? [entry.photoUrl] : []);

                    return (
                      <div key={entry.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 break-inside-avoid">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <h5 className="text-base font-bold text-slate-900">{entry.title}</h5>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                              Day {entry.day}
                            </span>
                          </div>

                          {photos.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {photos.map((p, idx) => (
                                <div key={idx} className="h-32 rounded-xl overflow-hidden bg-slate-900">
                                  <img
                                    src={p}
                                    alt={`${entry.title} photo ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                            {entry.content}
                          </p>

                          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                            <span>Mood: <strong>{entry.mood}</strong></span>
                            <span>Recorded by {entry.authorName}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Itinerary Timeline */}
            <div className="mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 mb-3 border-b border-slate-200 pb-1.5">
                Confirmed Day Itinerary
              </h4>
              <div className="space-y-2">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-sky-600 mr-2">Day {act.day} • {act.time}</span>
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{act.location}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-700">₹{act.costINR}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Print Action Bar */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs text-slate-500">
                Prepared by JKVoyage • Owned by JKSoftonics
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDossierModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  onClick={handlePrintDossier}
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
