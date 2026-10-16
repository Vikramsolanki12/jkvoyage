import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Trash2,
  Calendar,
  CreditCard,
  Users,
  FileCheck,
  MessageSquare,
  AlertTriangle,
  Info,
  X,
  Send,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { TripNotification, NotificationType } from '../types/travel.ts';

interface NotificationCenterProps {
  notifications: TripNotification[];
  onMarkAsRead: (notifId: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notifId: string) => void;
  onSelectActionTab?: (tab: 'itinerary' | 'expenses' | 'wallet' | 'chat') => void;
  activeTripTitle?: string;
  onSendTripAlert?: (title: string, message: string, type: NotificationType) => Promise<void>;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onSelectActionTab,
  activeTripTitle,
  onSendTripAlert
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [showSendModal, setShowSendModal] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<NotificationType>('general');
  const [sending, setSending] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'itinerary':
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case 'expense':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'member':
        return <Users className="w-4 h-4 text-indigo-500" />;
      case 'wallet':
        return <FileCheck className="w-4 h-4 text-amber-500" />;
      case 'chat':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'approval':
        return <Sparkles className="w-4 h-4 text-rose-500" />;
      case 'budget':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Info className="w-4 h-4 text-sky-400" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recent';
    }
  };

  const handleSendAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertTitle.trim() || !alertMessage.trim() || !onSendTripAlert) return;
    setSending(true);
    try {
      await onSendTripAlert(alertTitle.trim(), alertMessage.trim(), alertType);
      setAlertTitle('');
      setAlertMessage('');
      setShowSendModal(false);
    } catch (err) {
      console.error('Failed to send alert:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Trip Notifications"
        aria-label="Trip Notifications"
        className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Popover Header */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Trip Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 text-[10px] font-bold">
                        {unreadCount} new
                      </span>
                    )}
                  </h3>
                  {activeTripTitle && (
                    <p className="text-[10px] text-slate-400 truncate max-w-[180px]">
                      {activeTripTitle}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllAsRead}
                    title="Mark all as read"
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-[11px] flex items-center gap-1 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Sub-bar: Filters & Post Alert */}
            <div className="px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/30 border-b border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    activeFilter === 'unread'
                      ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-sky-300 shadow-xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Unread ({unreadCount})
                </button>
              </div>

              {onSendTripAlert && (
                <button
                  onClick={() => setShowSendModal(true)}
                  className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>Broadcast Alert</span>
                </button>
              )}
            </div>

            {/* Notification List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredNotifications.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-400">
                    <Bell className="w-5 h-5 opacity-40" />
                  </div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto mt-0.5">
                    Updates regarding new itinerary stops, shared expenses, companions, and passes will appear here.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.read) onMarkAsRead(notif.id);
                      if (notif.actionTab && onSelectActionTab) {
                        onSelectActionTab(notif.actionTab);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3 text-left transition-colors flex items-start gap-2.5 cursor-pointer ${
                      notif.read
                        ? 'hover:bg-slate-50 dark:hover:bg-slate-800/40 opacity-80'
                        : 'bg-sky-50/50 dark:bg-sky-950/20 hover:bg-sky-50 dark:hover:bg-sky-950/30'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[140px]">
                          {notif.tripTitle}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {notif.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>

                      {notif.actionTab && (
                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                          <span>View in {notif.actionTab}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0 pt-0.5">
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(notif.id);
                        }}
                        title="Delete notification"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
                <span className="text-[10px] text-slate-400">
                  Real-time alerts for itinerary, expenses & companions
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Broadcast Alert Modal */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleSendAlert}
            className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5 text-slate-900 dark:text-slate-100"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-sky-500/10 text-sky-500">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Broadcast Trip Notice</h3>
                  <p className="text-[11px] text-slate-400">
                    Send real-time alert to all trip companions
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Notice Category
              </label>
              <select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value as NotificationType)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-sky-500"
              >
                <option value="general">Announcement / General</option>
                <option value="itinerary">Itinerary Schedule Update</option>
                <option value="expense">Expense & Split Reminder</option>
                <option value="wallet">Tickets / Pass Alert</option>
                <option value="budget">Budget Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Notice Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Departure Time Changed"
                value={alertTitle}
                onChange={(e) => setAlertTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Message Details *
              </label>
              <textarea
                required
                rows={3}
                placeholder="e.g. Please gather in the hotel lobby at 8:30 AM with your ID cards."
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-sky-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowSendModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send to Group'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
