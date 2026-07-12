import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Calendar, FileText, Trash2, ArrowRight, CheckCircle2, AlertTriangle, BookOpen, Edit, X, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getCachedTrackers, setCachedTrackers, invalidateTrackerCache } from '../utils/trackerCache';

export interface ResumeGap { gap: string; suggestion: string; }

export interface TrackedApplication {
  id: number;
  company_name: string;
  job_title: string;
  jd_snippet: string;
  match_score: number;
  ats_keywords: string[];
  topics_to_study: string[];
  resume_gaps: ResumeGap[];
  date_analyzed: string;
  status: string;
  notes: string | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';
const STATUSES = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

// ─── Toast ───────────────────────────────────────────────────────────────────
interface Toast { id: number; message: string; type: 'error' | 'success'; }

const ToastContainer = ({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: number) => void }) => (
  <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        className={`pointer-events-auto flex items-start gap-3 px-5 py-4 border shadow-lg max-w-xs animate-in slide-in-from-bottom-2 fade-in duration-300 ${
          t.type === 'error'
            ? 'bg-cream border-red/40 text-red'
            : 'bg-cream border-[#0D6640]/30 text-[#0D6640]'
        }`}
      >
        {t.type === 'error'
          ? <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" />
          : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
        <p className="text-[12px] font-semibold leading-relaxed flex-1">{t.message}</p>
        <button
          onClick={() => dismiss(t.id)}
          className="ml-1 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    ))}
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ open, title, message, onConfirm, onCancel }: ConfirmModalProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[150] flex items-center justify-center bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === overlayRef.current && onCancel()}
    >
      <div className="bg-cream border border-ink-20 p-8 max-w-sm w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 shadow-xl">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-10 h-10 border border-red/30 bg-red/5 flex items-center justify-center shrink-0">
            <Trash2 className="w-4 h-4 text-red" />
          </div>
          <div>
            <h4 className="font-display font-black text-base uppercase tracking-tight text-ink mb-1">{title}</h4>
            <p className="text-[13px] text-ink-60 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 border border-ink-20 text-[11px] font-bold uppercase tracking-wider text-ink-60 hover:border-ink hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 bg-red text-cream text-[11px] font-bold uppercase tracking-wider hover:bg-ink transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export const TrackerPage = () => {
  const { user, token, signInWithGoogle, loading: authLoading } = useAuth();
  const [apps, setApps] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active detailed inspection application
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  
  // Note inline editing states
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);
  const addToast = useCallback((message: string, type: 'error' | 'success' = 'error') => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);
  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; appId: number | null }>({
    open: false,
    appId: null,
  });

  // Fetch applications on load
  const fetchApps = useCallback(async (force = false) => {
    if (!token || !user) return;

    if (!force) {
      const cached = getCachedTrackers(user.uid);
      if (cached) {
        setApps(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tracker`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error(`Failed to load applications: ${res.status}`);
      }
      const data = await res.json();
      setApps(data);
      setCachedTrackers(user.uid, data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (token && user) {
      fetchApps(false);
    } else {
      setApps([]);
      if (!authLoading) setLoading(false);
    }
  }, [token, user, authLoading, fetchApps]);

  // Update intersection reveals whenever lists update
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [apps, selectedAppId]);

  // Handle inline status update
  const handleStatusChange = async (appId: number, nextStatus: string) => {
    // Update local state and cache immediately for instant feedback
    setApps((prev) => {
      const updated = prev.map((a) => (a.id === appId ? { ...a, status: nextStatus } : a));
      if (user) setCachedTrackers(user.uid, updated);
      return updated;
    });

    try {
      const res = await fetch(`${API_BASE}/tracker/${appId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        throw new Error('Failed to update status on server');
      }
    } catch {
      // Revert state and cache if server update fails
      invalidateTrackerCache();
      fetchApps(true);
      addToast('Failed to update status. Please try again.');
    }
  };

  // Handle inline note save
  const handleSaveNote = async (appId: number) => {
    setApps((prev) => {
      const updated = prev.map((a) => (a.id === appId ? { ...a, notes: noteDraft || null } : a));
      if (user) setCachedTrackers(user.uid, updated);
      return updated;
    });
    setEditingNoteId(null);

    try {
      const res = await fetch(`${API_BASE}/tracker/${appId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: noteDraft.trim() || null }),
      });
      if (!res.ok) {
        throw new Error('Failed to save notes');
      }
    } catch {
      invalidateTrackerCache();
      fetchApps(true);
      addToast('Failed to save notes. Please try again.');
    }
  };

  // Handle application delete — opens confirm modal
  const handleDelete = (appId: number) => {
    setConfirmModal({ open: true, appId });
  };

  const confirmDelete = async () => {
    const appId = confirmModal.appId;
    setConfirmModal({ open: false, appId: null });
    if (appId === null) return;

    // Optimistic deletion
    setApps((prev) => {
      const updated = prev.filter((a) => a.id !== appId);
      if (user) setCachedTrackers(user.uid, updated);
      return updated;
    });
    if (selectedAppId === appId) {
      setSelectedAppId(null);
    }

    try {
      const res = await fetch(`${API_BASE}/tracker/${appId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to delete application record');
      }
    } catch {
      invalidateTrackerCache();
      fetchApps(true);
      addToast('Failed to delete application. Please try again.');
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Offer':
        return 'border-[#0D6640]/30 bg-[#0D6640]/5 text-[#0D6640]';
      case 'Rejected':
        return 'border-ink-60 bg-ink-20/10 text-ink-60';
      case 'Interviewing':
        return 'border-red/30 bg-red/5 text-red';
      default:
        return 'border-ink-20 bg-cream/10 text-ink';
    }
  };

  const selectedApp = apps.find(a => a.id === selectedAppId);

  if (authLoading) {
    return (
      <main className="min-h-screen bg-cream text-ink pt-28 pb-32 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-ink-60" />
        <p className="text-[13px] text-ink-60 font-semibold tracking-wider uppercase">Checking authentication...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-cream text-ink pt-28 pb-32 flex flex-col items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center space-y-6 border border-ink-20 p-12 bg-cream/35">
          <span className="accent-tag">Access Restricted</span>
          <h2 
            className="font-black uppercase text-ink leading-tight"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '2.2rem' }}
          >
            Sign in to use the <span className="text-red">tracker</span>
          </h2>
          <p className="text-[13px] text-ink-60 leading-relaxed max-w-sm mx-auto">
            Save keyword audits, index interview study guides, and track application stages dynamically across multiple roles.
          </p>
          <div className="pt-2">
            <button
              onClick={signInWithGoogle}
              className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3.5 text-[12px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200 cursor-pointer"
            >
              Sign In with Google <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
    <ToastContainer toasts={toasts} dismiss={dismissToast} />
    <ConfirmModal
      open={confirmModal.open}
      title="Delete Record"
      message="Are you sure you want to remove this application from the tracker? This action cannot be undone."
      onConfirm={confirmDelete}
      onCancel={() => setConfirmModal({ open: false, appId: null })}
    />
    <main className="min-h-screen bg-cream text-ink pt-28 pb-32">
      <div className="max-w-6xl mx-auto px-[5vw]">

        {/* Page Header */}
        <div className="mb-14 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
          <div className="space-y-4">
            <span className="accent-tag">Application Tracker</span>
            <h1
              className="font-black uppercase text-ink leading-none mb-2"
              style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(3rem, 8vw, 6rem)' }}
            >
              Track your <span className="text-red">pipeline</span>
            </h1>
            <p className="text-[14px] text-ink-60 max-w-sm leading-relaxed">
              Monitor interview phases, store keyword insights, and review study guides for logged applications.
            </p>
          </div>

          <Link
            to="/analyze"
            className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3.5 text-[12px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200 self-start shrink-0"
          >
            Analyze New Role <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-ink-60" />
            <p className="text-[13px] text-ink-60 font-semibold tracking-wider uppercase">Loading tracker logs...</p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="flex items-start gap-3 border border-red/30 bg-red/5 px-5 py-4 text-red mb-8">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h5 className="font-bold text-[14px] uppercase tracking-wide">Sync Error</h5>
              <p className="text-[13px] mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && apps.length === 0 && (
          <div className="border border-ink-20 p-12 text-center space-y-6 max-w-xl mx-auto my-12 reveal">
            <span className="accent-tag inline-block">System Idle</span>
            <h3 
              className="font-display font-black text-3xl uppercase text-ink leading-tight"
            >
              No active logs in the tracker pipeline.
            </h3>
            <p className="text-[13px] text-ink-60 leading-relaxed max-w-sm mx-auto">
              Run your first resume analysis, extract missing keywords, and save the snapshot record to track it inline.
            </p>
            <div className="pt-4">
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3.5 text-[12px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200"
              >
                Analyze Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Active Tracker List */}
        {!loading && apps.length > 0 && (
          <div className="grid grid-cols-12 gap-y-12 lg:gap-x-12 items-start">
            
            {/* List block */}
            <div className={`col-span-12 ${selectedAppId ? 'lg:col-span-6' : 'lg:col-span-12'} space-y-4`}>
              <div className="grid grid-cols-1 gap-4">
                {apps.map((app, i) => (
                  <div
                    key={app.id}
                    className={`reveal reveal-delay-${(i % 3) + 1} border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all duration-300 ${
                      selectedAppId === app.id 
                        ? 'border-red bg-cream/45 shadow-sm' 
                        : 'border-ink-20 bg-cream/30 hover:border-ink'
                    }`}
                  >
                    {/* Left: Metadata */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="stat-number text-2xl text-red">{app.match_score}%</span>
                        <div>
                          <h4 className="font-display font-black text-base uppercase text-ink tracking-tight leading-tight">
                            {app.company_name}
                          </h4>
                          <p className="text-[12px] text-ink-60 font-semibold">{app.job_title}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-60 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-red" /> {app.date_analyzed}
                        </span>
                        {app.notes && (
                          <span className="flex items-center gap-1 font-serif italic max-w-[200px] truncate">
                            "{app.notes}"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Inline Status Dropdown */}
                      <div className="relative">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value)}
                          className={`px-3 py-1.5 border text-[11px] font-bold uppercase tracking-wider rounded-none cursor-pointer outline-none transition-colors ${getStatusBadgeStyle(app.status)}`}
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st} className="text-ink bg-cream font-sans uppercase">
                              {st}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Detail Inspect */}
                      <button
                        onClick={() => setSelectedAppId(selectedAppId === app.id ? null : app.id)}
                        className={`w-9 h-9 border flex items-center justify-center transition-colors ${
                          selectedAppId === app.id 
                            ? 'bg-ink text-cream border-ink' 
                            : 'border-ink-20 hover:border-red hover:text-red text-ink'
                        }`}
                        title="View Analysis Snapshot"
                      >
                        <FileText className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(app.id)}
                        className="w-9 h-9 border border-ink-20 text-ink-60 hover:text-red hover:border-red flex items-center justify-center transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

            {/* Inspect Side Drawer Panel */}
            {selectedAppId && selectedApp && (
              <div className="col-span-12 lg:col-span-6 border border-red p-8 bg-cream/45 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300 relative">
                {/* Close Drawer Button */}
                <button
                  onClick={() => setSelectedAppId(null)}
                  className="absolute top-6 right-6 text-[11px] font-bold uppercase tracking-widest text-ink-60 hover:text-red transition-colors"
                >
                  Close Inspect ✕
                </button>

                {/* Inspect Header */}
                <div className="space-y-2 border-b border-ink-20 pb-6 pr-20">
                  <div className="flex items-center gap-3">
                    <span className="stat-number text-4xl text-red">{selectedApp.match_score}%</span>
                    <div>
                      <h3 className="font-display font-black text-2xl uppercase tracking-tight text-ink leading-tight">
                        {selectedApp.company_name}
                      </h3>
                      <p className="text-[13px] text-ink-60 font-semibold">{selectedApp.job_title}</p>
                    </div>
                  </div>
                </div>

                {/* Note Editor Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h5 className="text-[11px] font-bold uppercase tracking-widest text-ink-60">Personal Notes</h5>
                    {editingNoteId !== selectedApp.id ? (
                      <button
                        onClick={() => {
                          setEditingNoteId(selectedApp.id);
                          setNoteDraft(selectedApp.notes || '');
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-red hover:underline"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveNote(selectedApp.id)}
                          className="text-[11px] font-bold text-[#0D6640] hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="text-[11px] font-bold text-ink-60 hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingNoteId === selectedApp.id ? (
                    <textarea
                      className="w-full bg-cream border border-ink border-red-20 px-3 py-2 text-[13px] outline-none min-h-[90px] font-sans"
                      placeholder="Input pipeline notes, salary ranges, contact details..."
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                    />
                  ) : (
                    <p className="text-[13px] text-ink font-serif italic bg-cream/20 p-4 border border-ink-20/40 rounded-sm">
                      {selectedApp.notes ? `"${selectedApp.notes}"` : 'No custom notes logged yet.'}
                    </p>
                  )}
                </div>

                {/* Keywords Summary */}
                <div className="space-y-3">
                  <h5 className="text-[11px] font-bold uppercase tracking-widest text-ink-60">ATS Keywords Logged</h5>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedApp.ats_keywords.map((kw) => (
                      <span
                        key={kw}
                        className="px-2.5 py-1 border border-ink-20 text-[11px] font-semibold uppercase tracking-wider text-ink"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Accordion Study Topics */}
                <div className="border border-ink-20">
                  <div className="px-5 py-4 border-b border-ink-20 flex items-center gap-2 bg-cream">
                    <BookOpen className="w-4 h-4 text-red shrink-0" />
                    <span className="font-display font-black text-sm uppercase tracking-wider text-ink">
                      Index of study topics ({selectedApp.topics_to_study.length})
                    </span>
                  </div>
                  <div className="divide-y divide-ink-20 bg-cream/15 max-h-[160px] overflow-y-auto">
                    {selectedApp.topics_to_study.map((t, i) => (
                      <div key={t} className="px-5 py-2.5 flex items-center gap-3 text-[12px] font-medium text-ink">
                        <span className="stat-number text-xs w-4">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accordion Gap Sugggestions */}
                <div className="border border-ink-20">
                  <div className="px-5 py-4 border-b border-ink-20 flex items-center gap-2 bg-cream">
                    <AlertTriangle className="w-4 h-4 text-red shrink-0" />
                    <span className="font-display font-black text-sm uppercase tracking-wider text-ink">
                      Flagged resume gaps ({selectedApp.resume_gaps.length})
                    </span>
                  </div>
                  <div className="divide-y divide-ink-20 bg-cream/15 max-h-[220px] overflow-y-auto">
                    {selectedApp.resume_gaps.map((g, i) => (
                      <div key={i} className="px-5 py-3.5 space-y-1 text-[12px] leading-relaxed">
                        <div className="flex items-center gap-1.5 font-bold text-ink">
                          <CheckCircle2 className="w-3.5 h-3.5 text-red shrink-0" />
                          <span>{g.gap}</span>
                        </div>
                        <p className="text-ink-60 pl-5">{g.suggestion}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </main>
    </>
  );
};
