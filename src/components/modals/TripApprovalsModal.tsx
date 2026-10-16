import React, { useState } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { Trip, TripChangeRequest } from '../../types/travel.ts';

interface TripApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  requests: TripChangeRequest[];
  isTripCreator: boolean;
  onApprove: (request: TripChangeRequest) => Promise<void>;
  onReject: (request: TripChangeRequest) => Promise<void>;
}

export const TripApprovalsModal: React.FC<TripApprovalsModalProps> = ({
  isOpen,
  onClose,
  trip,
  requests,
  isTripCreator,
  onApprove,
  onReject
}) => {
  const [activeFilter, setActiveFilter] = useState<'pending' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const displayedRequests = activeFilter === 'pending' ? pendingRequests : requests;

  const handleAction = async (request: TripChangeRequest, approve: boolean) => {
    setProcessingId(request.id);
    try {
      if (approve) {
        await onApprove(request);
      } else {
        await onReject(request);
      }
    } catch (err) {
      console.error('Failed to process request:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeIcon = (type: TripChangeRequest['type']) => {
    switch (type) {
      case 'expense':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'ticket':
        return <FileText className="w-4 h-4 text-sky-500" />;
      case 'activity':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Trip Change Requests & Approvals
              </h3>
              {pendingRequests.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  {pendingRequests.length} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isTripCreator
                ? 'As the trip planner, review and confirm proposed expenses, tickets, and activities before they are added to the journey.'
                : 'Only the trip planner can confirm additions. Track the approval status of your proposals below.'}
            </p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'pending'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Pending Approvals ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            All History ({requests.length})
          </button>
        </div>

        {/* Requests List */}
        {displayedRequests.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No pending change requests
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              When collaborator travelers suggest new tickets, expenses, or itinerary stops, they will appear here for your confirmation.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                      {getTypeIcon(req.type)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {req.title}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <User className="w-3 h-3" />
                        <span>Requested by {req.requestedByName}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{new Date(req.requestedAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {req.status === 'pending' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                        ● Pending Planner Review
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                        ✓ Confirmed & Added to Trip
                      </span>
                    )}
                    {req.status === 'rejected' && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                        ✕ Declined
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & Payload Details */}
                {req.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    {req.description}
                  </p>
                )}

                {/* Action Buttons (For Trip Creator on Pending items) */}
                {req.status === 'pending' && isTripCreator && (
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() => handleAction(req, false)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      disabled={processingId === req.id}
                      onClick={() => handleAction(req, true)}
                      className="px-4 py-1.5 rounded-xl text-xs font-black bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm & Add to Trip</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
