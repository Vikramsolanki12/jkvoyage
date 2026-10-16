import React, { useState } from 'react';
import {
  Compass,
  Plus,
  LogIn,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Users,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { Trip, TripNotification, NotificationType } from '../types/travel.ts';
import { JKLogo } from './JKLogo.tsx';
import { NotificationCenter } from './NotificationCenter.tsx';

interface NavbarProps {
  trips: Trip[];
  activeTrip: Trip | null;
  onSelectTrip: (trip: Trip) => void;
  onOpenNewTripModal: () => void;
  onOpenAuthModal: () => void;
  onOpenUpgrade?: () => void;
  onOpenProfile: () => void;
  subscriptionEnforced?: boolean;
  onToggleSubscriptionEnforced?: (enforced: boolean) => void;
  notifications?: TripNotification[];
  onMarkNotificationAsRead?: (notifId: string) => void;
  onMarkAllNotificationsAsRead?: () => void;
  onDeleteNotification?: (notifId: string) => void;
  onSelectActionTab?: (tab: 'itinerary' | 'expenses' | 'wallet' | 'chat') => void;
  onSendTripAlert?: (title: string, message: string, type: NotificationType) => Promise<void>;
}

export const Navbar: React.FC<NavbarProps> = ({
  trips,
  activeTrip,
  onSelectTrip,
  onOpenNewTripModal,
  onOpenAuthModal,
  onOpenProfile,
  notifications = [],
  onMarkNotificationAsRead = () => {},
  onMarkAllNotificationsAsRead = () => {},
  onDeleteNotification = () => {},
  onSelectActionTab,
  onSendTripAlert
}) => {
  const { currentUser, userProfile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand Logo & Title */}
        <JKLogo size="md" subtitleText="Owned by JKSoftonics" />

        {/* Center: Trip Selector Dropdown (When logged in) */}
        {currentUser && trips.length > 0 && (
          <div className="relative flex-1 max-w-[150px] sm:max-w-[240px]">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 shrink-0 animate-pulse"></span>
                <span className="font-semibold truncate">
                  {activeTrip ? activeTrip.title : 'Select Trip'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute left-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 py-2 divide-y divide-slate-100 dark:divide-slate-800">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Your Journeys ({trips.length})</span>
                    <span className="text-[10px] lowercase font-normal">Active or Member</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {trips.map((t) => {
                      const isOwner = t.ownerId === currentUser.uid;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSelectTrip(t);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors ${
                            activeTrip?.id === t.id
                              ? 'bg-sky-500/10 text-sky-600 dark:text-sky-300 font-bold'
                              : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate font-semibold flex items-center gap-1.5">
                              <span>{t.title}</span>
                              {!isOwner && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/15 text-indigo-500 font-bold shrink-0">
                                  Member
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{t.destination}</div>
                          </div>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 shrink-0 font-mono">
                            ₹{t.budgetINR.toLocaleString('en-IN')}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenNewTripModal();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Plan Another Journey
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Right Actions: Theme Toggle, Notifications, New Trip, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-500" />
            )}
          </button>

          {/* Trip Notifications Center (When user is logged in) */}
          {currentUser && (
            <NotificationCenter
              notifications={notifications}
              onMarkAsRead={onMarkNotificationAsRead}
              onMarkAllAsRead={onMarkAllNotificationsAsRead}
              onDeleteNotification={onDeleteNotification}
              onSelectActionTab={onSelectActionTab}
              activeTripTitle={activeTrip?.title}
              onSendTripAlert={onSendTripAlert}
            />
          )}

          {currentUser ? (
            <>
              {/* New Trip Button (desktop & tablet) */}
              <button
                onClick={onOpenNewTripModal}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Trip</span>
              </button>

              {/* Mobile Quick Add Trip */}
              <button
                onClick={onOpenNewTripModal}
                className="sm:hidden p-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md shadow-sky-500/20 transition-transform active:scale-95 cursor-pointer"
                title="Create New Trip"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Profile Avatar trigger */}
              <div className="flex items-center gap-1 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-800">
                <button
                  onClick={onOpenProfile}
                  title="Edit traveler profile"
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                >
                  {userProfile?.photoURL || currentUser.photoURL ? (
                    <img
                      src={userProfile?.photoURL || currentUser.photoURL || ''}
                      alt={currentUser.displayName || 'User'}
                      className="w-8 h-8 rounded-full ring-2 ring-sky-500/40 object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-xs ring-2 ring-indigo-500/30 shrink-0">
                      {currentUser.displayName?.[0] || 'U'}
                    </div>
                  )}

                  <div className="hidden lg:block">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[110px]">
                      {userProfile?.displayName || currentUser.displayName || 'Traveler'}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <span>Traveler Profile</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={logout}
                  title="Sign out of account"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-extrabold bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/25 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
