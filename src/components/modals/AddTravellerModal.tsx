import React, { useState } from 'react';
import { Trip, Traveller } from '../../types/trip.ts';
import { Users, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddTravellerModalProps {
  trip: Trip;
  onUpdateTrip: (updated: Trip) => void;
  onClose: () => void;
}

export const AddTravellerModal: React.FC<AddTravellerModalProps> = ({
  trip,
  onUpdateTrip,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Traveller['role']>('Explorer');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [dietary, setDietary] = useState('None');

  const avatarPresets = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=300&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&auto=format&fit=crop',
  ];
  const [avatar, setAvatar] = useState(avatarPresets[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newTraveller: Traveller = {
      id: `u-${Date.now()}`,
      name: name.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@jkvoyage.io`,
      avatar,
      role,
      phone: phone || '+91 98765 00100',
      emergencyContact,
      dietary,
      color: '#8b5cf6',
    };

    onUpdateTrip({
      ...trip,
      travellers: [...trip.travellers, newTraveller],
    });
    confetti({ particleCount: 30, spread: 50 });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl space-y-3.5 animate-in fade-in zoom-in-95 text-white"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold">Add Travel Companion</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name:</label>
          <input
            type="text"
            required
            placeholder="e.g. Leo Vance"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Email:</label>
          <input
            type="email"
            placeholder="leo@jkvoyage.io"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Expedition Role:</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Explorer">Explorer</option>
              <option value="Co-Lead">Co-Lead</option>
              <option value="Finance">Finance Lead</option>
              <option value="Organizer">Organizer</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Dietary Restriction:</label>
            <input
              type="text"
              placeholder="e.g. Vegetarian"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-300 block mb-1">Select Avatar:</label>
          <div className="flex gap-2">
            {avatarPresets.map((av, idx) => (
              <img
                key={idx}
                src={av}
                alt="preset"
                onClick={() => setAvatar(av)}
                className={`w-9 h-9 rounded-full object-cover cursor-pointer ring-2 transition-transform ${
                  avatar === av ? 'ring-indigo-400 scale-110' : 'ring-transparent opacity-60'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 rounded-xl btn-cyan text-slate-950 text-xs font-bold shadow-md cursor-pointer"
          >
            Add to Group
          </button>
        </div>
      </form>
    </div>
  );
};
