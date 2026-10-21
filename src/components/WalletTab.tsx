import React, { useState, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Shield,
  Plane,
  Building,
  CreditCard,
  QrCode,
  Calendar,
  Check,
  ShieldCheck,
  AlertCircle,
  Upload,
  Download,
  Eye,
  X,
  File,
  Image as ImageIcon,
  ExternalLink,
  Maximize2,
  Camera,
  Loader2
} from 'lucide-react';
import { DigitalDocument, DocumentType, Trip } from '../types/travel.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { processUploadedDocument, uploadDocumentToPrivateCloud } from '../utils/fileUpload.ts';

interface WalletTabProps {
  trip: Trip;
  documents: DigitalDocument[];
  isTripCreator: boolean;
  onAddDocument: (docItem: DigitalDocument) => Promise<void>;
  onProposeDocument?: (docItem: DigitalDocument) => Promise<void>;
  onDeleteDocument: (id: string) => Promise<void>;
}

export const WalletTab: React.FC<WalletTabProps> = ({
  trip,
  documents,
  isTripCreator,
  onAddDocument,
  onProposeDocument,
  onDeleteDocument
}) => {
  const { currentUser, userProfile } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [viewingDoc, setViewingDoc] = useState<DigitalDocument | null>(null);
  const [safeBlobUrl, setSafeBlobUrl] = useState<string | null>(null);

  // Convert data URLs to Blob URLs so Chrome never blocks PDF rendering or downloads
  React.useEffect(() => {
    if (!viewingDoc?.fileUrl) {
      setSafeBlobUrl(null);
      return;
    }

    const url = viewingDoc.fileUrl;
    if (url.startsWith('data:')) {
      try {
        const parts = url.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || (viewingDoc.fileType === 'pdf' ? 'application/pdf' : 'image/jpeg');
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const createdBlobUrl = URL.createObjectURL(blob);
        setSafeBlobUrl(createdBlobUrl);

        return () => {
          URL.revokeObjectURL(createdBlobUrl);
        };
      } catch (err) {
        console.warn('Could not create Blob URL from data string:', err);
        setSafeBlobUrl(url);
      }
    } else {
      setSafeBlobUrl(url);
    }
  }, [viewingDoc]);

  // Safe file download that bypasses Chrome navigation blocks on data: URLs
  const handleDownloadDoc = (fileUrl?: string, docFileName?: string) => {
    if (!fileUrl) return;
    try {
      if (fileUrl.startsWith('data:')) {
        const parts = fileUrl.split(',');
        const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = docFileName || (mime === 'application/pdf' ? 'document.pdf' : 'document.jpg');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
      } else {
        const a = document.createElement('a');
        a.href = fileUrl;
        a.download = docFileName || 'document';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (e) {
      console.error('Download error:', e);
      window.open(fileUrl, '_blank');
    }
  };

  // Form states
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<DocumentType>(isTripCreator ? 'ticket' : 'id_card');
  const [docNumber, setDocNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState<'pdf' | 'image' | 'other'>('other');
  const [fileSize, setFileSize] = useState('');
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const docIcons: Record<DocumentType, { icon: React.ReactNode; label: string; bg: string }> = {
    ticket: { icon: <Plane className="w-4 h-4 text-sky-500" />, label: 'Boarding Pass / Train Ticket', bg: 'bg-white dark:bg-slate-900 border-sky-500/30' },
    hotel_voucher: { icon: <Building className="w-4 h-4 text-indigo-500" />, label: 'Hotel Booking', bg: 'bg-white dark:bg-slate-900 border-indigo-500/30' },
    passport: { icon: <Shield className="w-4 h-4 text-emerald-500" />, label: 'Passport', bg: 'bg-white dark:bg-slate-900 border-emerald-500/30' },
    visa: { icon: <FileText className="w-4 h-4 text-purple-500" />, label: 'Visa / Permit', bg: 'bg-white dark:bg-slate-900 border-purple-500/30' },
    insurance: { icon: <Shield className="w-4 h-4 text-amber-500" />, label: 'Travel Insurance', bg: 'bg-white dark:bg-slate-900 border-amber-500/30' },
    id_card: { icon: <CreditCard className="w-4 h-4 text-teal-500" />, label: 'National ID / Aadhaar Card', bg: 'bg-white dark:bg-slate-900 border-teal-500/30' },
    other: { icon: <FileText className="w-4 h-4 text-slate-500" />, label: 'Document', bg: 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700' }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingFile(true);
    setUploadWarning(null);

    try {
      const processed = await processUploadedDocument(file, trip.id, currentUser?.uid);
      setFileData(processed.cloudUrl || processed.dataUrl);
      setFileName(processed.fileName);
      setFileType(processed.fileType);
      setFileSize(processed.formattedSize);

      if (processed.error) {
        setUploadWarning(processed.error);
      }
    } catch (err: any) {
      console.error('File process failed:', err);
      setUploadWarning('Failed to process file. Please try again.');
    } finally {
      setProcessingFile(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (!isTripCreator && (docType === 'ticket' || docType === 'hotel_voucher')) {
      setErrorMessage('Travellers are not allowed to add tickets or hotel bookings. These are managed exclusively by the Trip Planner.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      let finalUrl = fileData || fileUrlInput.trim() || '';
      const detectedType = fileType || (finalUrl.endsWith('.pdf') ? 'pdf' : 'image');
      const effectiveOwnerId = currentUser?.uid || trip.ownerId || 'traveler_me';

      // If document was uploaded locally as dataUrl, securely upload to private cloud platform
      if (fileData && fileData.startsWith('data:')) {
        try {
          const cloudRes = await uploadDocumentToPrivateCloud({
            fileName: fileName || (detectedType === 'pdf' ? 'document.pdf' : 'document.jpg'),
            fileType: (detectedType as any) || 'other',
            fileData: fileData,
            tripId: trip.id,
            ownerId: effectiveOwnerId
          });
          if (cloudRes.fileUrl) {
            finalUrl = cloudRes.fileUrl;
          }
        } catch (uploadErr) {
          console.warn('Private cloud upload fallback to local preview:', uploadErr);
        }
      }

      const newDoc: DigitalDocument = {
        id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        tripId: trip.id,
        title: title.trim(),
        docType,
        docNumber: docNumber.trim() || '',
        expiryDate: expiryDate.trim() || '',
        notes: notes.trim() || '',
        fileUrl: finalUrl || '',
        fileName: fileName || (finalUrl ? 'ticket_attachment' : ''),
        fileType: detectedType,
        fileSize: fileSize || '',
        ownerId: effectiveOwnerId,
        createdAt: new Date().toISOString()
      };

      // Close modal and reset form immediately so UI never blocks
      setModalOpen(false);
      setTitle('');
      setDocNumber('');
      setExpiryDate('');
      setNotes('');
      setFileData(null);
      setFileName('');
      setFileUrlInput('');
      setFileSize('');
      setUploadWarning(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';

      setFeedback(`Saved "${newDoc.title}" to digital wallet!`);
      setTimeout(() => setFeedback(null), 3500);

      // Call onAddDocument directly
      if (onAddDocument) {
        await onAddDocument(newDoc);
      } else if (onProposeDocument) {
        await onProposeDocument(newDoc);
      }
    } catch (err: any) {
      console.error('Failed to add document:', err);
      setErrorMessage(err?.message || 'Failed to save document. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    if (filterType === 'all') return true;
    if (filterType === 'tickets') return d.docType === 'ticket';
    if (filterType === 'hotels') return d.docType === 'hotel_voucher';
    if (filterType === 'ids') return d.docType === 'passport' || d.docType === 'visa' || d.docType === 'id_card';
    if (filterType === 'insurance') return d.docType === 'insurance';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Role Banner */}
      {!isTripCreator && (
        <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-500 shrink-0" />
            <span>
              <strong>Traveller Access:</strong> Official flight tickets, train passes, and hotel reservations are managed exclusively by the Trip Planner. You can view all confirmed travel tickets below, and upload your personal ID or passport.
            </span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-sky-500 text-slate-950 font-black text-[10px] shrink-0">
            TRAVELLER
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-sky-500" />
            Digital Travel Wallet & Passes
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Store flight tickets, train PNRs, hotel bookings, and IDs with PDF/image attachments for easy airport and hotel check-in.
          </p>
        </div>

        {isTripCreator ? (
          <button
            onClick={() => {
              setDocType('ticket');
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ticket / Booking</span>
          </button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <Shield className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span>Tickets & Bookings Managed by Planner</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setDocType('id_card');
                setModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 transition-all cursor-pointer shadow-sm"
              title="Upload your personal government ID, passport, or visa"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload Personal ID / Doc</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: `All Passes (${documents.length})` },
          { id: 'tickets', label: '✈️ Flights & Trains' },
          { id: 'hotels', label: '🏨 Hotel Bookings' },
          { id: 'ids', label: '🪪 IDs & Passports' },
          { id: 'insurance', label: '🛡️ Insurance & Policies' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterType(f.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              filterType === f.id
                ? 'bg-sky-500 text-slate-950 font-bold'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Verified Aadhaar Quick Card */}
      {userProfile?.aadhaarNumber && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-indigo-500/10 to-emerald-500/10 border border-sky-300 dark:border-sky-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500 text-slate-950 font-bold shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Government Aadhaar Card (Verified Traveler)
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  ✓ Verified Account
                </span>
              </div>
              <p className="text-xs font-mono font-bold tracking-wider text-slate-700 dark:text-slate-300 mt-0.5">
                UIDAI: {userProfile.aadhaarNumber}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Linked to {userProfile.displayName}
          </span>
        </div>
      )}

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 shadow-sm">
          <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">No travel passes or bookings stored</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            {isTripCreator
              ? 'Upload flight tickets, train PNR PDFs, hotel confirmation vouchers, and ID scans for instant access on the road.'
              : 'Flight tickets, train passes, and hotel reservations will appear here once uploaded by the Trip Planner.'}
          </p>
          {isTripCreator ? (
            <button
              onClick={() => {
                setDocType('ticket');
                setModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Ticket / Booking
            </button>
          ) : (
            <button
              onClick={() => {
                setDocType('id_card');
                setModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-500 text-slate-950 hover:bg-sky-400 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Upload Personal ID / Pass
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const conf = docIcons[doc.docType] || docIcons.other;
            const hasAttachment = Boolean(doc.fileUrl);
            const isPdf = doc.fileType === 'pdf' || doc.fileName?.toLowerCase().endsWith('.pdf') || doc.fileUrl?.includes('application/pdf');

            return (
              <div
                key={doc.id}
                className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-sky-500/40 transition-all shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sky-500 shrink-0">
                        {conf.icon}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                          {conf.label}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">
                          {doc.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {hasAttachment && (
                        <button
                          type="button"
                          onClick={() => setViewingDoc(doc)}
                          className="p-1.5 rounded-xl text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-950/40 transition-colors cursor-pointer"
                          title="View attached document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}

                      {isTripCreator && (
                        <button
                          type="button"
                          onClick={() => onDeleteDocument(doc.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Delete pass"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {doc.docNumber && (
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-3 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">PNR / Booking ID:</span>
                      <span className="text-xs font-mono font-bold tracking-wider text-slate-900 dark:text-white">
                        {doc.docNumber}
                      </span>
                    </div>
                  )}

                  {doc.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 leading-relaxed">
                      {doc.notes}
                    </p>
                  )}

                  {/* Attachment Preview Box */}
                  {hasAttachment && (
                    <div className="mb-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {isPdf ? (
                          <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold text-[10px] flex items-center gap-1 shrink-0">
                            <File className="w-3.5 h-3.5" />
                            PDF
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold text-[10px] flex items-center gap-1 shrink-0">
                            <ImageIcon className="w-3.5 h-3.5" />
                            IMG
                          </div>
                        )}
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {doc.fileName || 'Attachment Document'}
                        </span>
                        {doc.fileSize && (
                          <span className="text-[10px] text-slate-400 shrink-0">({doc.fileSize})</span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingDoc(doc)}
                        className="px-2.5 py-1 rounded-xl bg-sky-500 text-slate-950 text-[11px] font-bold hover:bg-sky-400 transition-colors flex items-center gap-1 shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>
                    </div>
                  )}
                </div>

                {doc.expiryDate && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>Valid / Travel Date:</span>
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {doc.expiryDate}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Propose Ticket Modal with File Upload */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-black mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-sky-500" />
              <span>{isTripCreator ? "Add Ticket, Booking or Pass" : "Upload Personal ID or Travel Document"}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isTripCreator
                ? "Upload your flight tickets, train PNR PDFs, hotel confirmation slips, or insurance cards."
                : "Upload your personal passport, national ID card, visa, or travel insurance policy."}
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  {isTripCreator ? "Document / Ticket Title *" : "Document / ID Title *"}
                </label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={isTripCreator ? "e.g. Air India Flight Ticket, Hotel Taj Haveli Voucher" : "e.g. My Passport, Aadhaar Card, Travel Insurance"}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as DocumentType)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200"
                  >
                    {isTripCreator ? (
                      <>
                        <option value="ticket">✈️ Flight / Train Ticket</option>
                        <option value="hotel_voucher">🏨 Hotel Voucher</option>
                        <option value="passport">🛂 Passport</option>
                        <option value="visa">📄 Visa / Permit</option>
                        <option value="insurance">🛡️ Travel Insurance</option>
                        <option value="id_card">🪪 Aadhaar / National ID</option>
                        <option value="other">📋 Other Document</option>
                      </>
                    ) : (
                      <>
                        <option value="id_card">🪪 Aadhaar / National ID</option>
                        <option value="passport">🛂 Passport</option>
                        <option value="visa">📄 Visa / Permit</option>
                        <option value="insurance">🛡️ Travel Insurance</option>
                        <option value="other">📋 Other Personal Document</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    PNR / Booking No.
                  </label>
                  <input
                    type="text"
                    maxLength={100}
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. PNR-83921A"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* ATTACHMENT: File Upload (PDF or Image) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                    Attach Ticket or Document (PDF / Image)
                  </label>
                  <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-full">
                    Auto-Optimized ⚡
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* File Upload input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf,image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="wallet-document-file"
                  />
                  <label
                    htmlFor="wallet-document-file"
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload File</span>
                  </label>

                  {/* Camera Snap input for mobile tickets / paper receipts */}
                  <input
                    type="file"
                    ref={cameraInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="wallet-document-camera"
                  />
                  <label
                    htmlFor="wallet-document-camera"
                    className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Snap Photo</span>
                  </label>

                  <span className="text-[11px] text-slate-400">or paste web link</span>
                </div>

                {/* Processing State */}
                {processingFile && (
                  <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center gap-2 text-xs text-sky-600 dark:text-sky-400 font-bold animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Optimizing document for instant cloud sync...</span>
                  </div>
                )}

                {/* Size Warning if any */}
                {uploadWarning && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                    <span>{uploadWarning}</span>
                  </div>
                )}

                <input
                  type="url"
                  placeholder="https://drive.google.com/... or online voucher link"
                  value={fileUrlInput}
                  onChange={(e) => setFileUrlInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                />

                {/* File Upload Preview */}
                {(fileName || fileData) && (
                  <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/40 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold truncate">
                        {fileType === 'pdf' ? (
                          <div className="p-1 rounded bg-rose-500/15 text-rose-500">
                            <File className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="p-1 rounded bg-sky-500/15 text-sky-500">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="truncate">{fileName}</span>
                        {fileSize && (
                          <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded">
                            {fileSize}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFileData(null);
                          setFileName('');
                          setFileSize('');
                          setUploadWarning(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                          if (cameraInputRef.current) cameraInputRef.current.value = '';
                        }}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-500 cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Image Thumbnail preview if image */}
                    {fileType === 'image' && fileData && (
                      <div className="relative h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950 flex items-center justify-center">
                        <img
                          src={fileData}
                          alt="Ticket preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )}
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
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Travel / Expiry Date
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Seat / Room / Notes
                </label>
                <textarea
                  maxLength={1000}
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Flight Seat 14A, Deluxe Suite Room 204 with Mountain View"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-sky-500 resize-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-sky-500 text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-colors shadow-md shadow-sky-500/20 cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save to Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Attachment Modal (PDF or Image viewer) */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl text-white">
            <div className="flex items-center justify-between p-4 bg-slate-950 border-b border-slate-800">
              <div>
                <h4 className="text-sm font-bold truncate">{viewingDoc.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono">
                  {viewingDoc.docNumber ? `Ref: ${viewingDoc.docNumber}` : 'Document Preview'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {safeBlobUrl && (
                  <>
                    <button
                      type="button"
                      onClick={() => window.open(safeBlobUrl, '_blank')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer text-slate-200 hover:text-white"
                      title="Open in new window"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                      <span>Open in New Tab</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadDoc(viewingDoc.fileUrl, viewingDoc.fileName)}
                      className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </>
                )}
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* In-app Document Container */}
            <div className="max-h-[75vh] min-h-[360px] overflow-auto flex flex-col items-center justify-center p-3 sm:p-5 bg-black/95">
              {safeBlobUrl ? (
                viewingDoc.fileType === 'pdf' || viewingDoc.fileName?.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-full flex flex-col items-center space-y-3">
                    <object
                      data={safeBlobUrl}
                      type="application/pdf"
                      className="w-full h-[65vh] rounded-2xl border border-slate-800 bg-white shadow-inner"
                    >
                      {/* Fallback iframe inside object tag */}
                      <iframe
                        src={safeBlobUrl}
                        title={viewingDoc.title}
                        className="w-full h-full rounded-2xl"
                      >
                        <div className="p-8 text-center text-slate-300">
                          <FileText className="w-12 h-12 text-sky-400 mx-auto mb-3" />
                          <p className="font-bold text-sm">PDF Document Ready</p>
                          <p className="text-xs text-slate-400 mt-1 mb-4">
                            Your browser blocked inline embedded plugins. Click below to view directly.
                          </p>
                          <button
                            type="button"
                            onClick={() => window.open(safeBlobUrl, '_blank')}
                            className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 font-black text-xs inline-flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>Open PDF Document</span>
                          </button>
                        </div>
                      </iframe>
                    </object>

                    <div className="w-full flex items-center justify-between px-2 py-1 text-[11px] text-slate-400">
                      <span>Ref: {viewingDoc.docNumber || 'Standard Pass'}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => window.open(safeBlobUrl, '_blank')}
                          className="hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Full Window View</span>
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={() => handleDownloadDoc(viewingDoc.fileUrl, viewingDoc.fileName)}
                          className="hover:text-sky-400 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3 h-3" />
                          <span>Save PDF Copy</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <img
                    src={safeBlobUrl}
                    alt={viewingDoc.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-2xl border border-slate-800"
                  />
                )
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No visual attachment available for this pass.</p>
                </div>
              )}
            </div>

            {viewingDoc.notes && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-slate-400">Notes: </span>
                {viewingDoc.notes}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default WalletTab;
