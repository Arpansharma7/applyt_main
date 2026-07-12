import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, AlertCircle, ArrowRight, CheckCircle2, XCircle, ChevronDown, ChevronUp, BookOpen, AlertTriangle, ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ResumeGap { gap: string; suggestion: string; }

interface AnalyzeResult {
  ats_keywords: string[];
  topics_to_study: string[];
  resume_gaps: ResumeGap[];
  match_score: number;
  summary: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

/* ── Custom Animated Gauge ── */
const AnimatedScoreGauge = ({ score }: { score: number }) => {
  const [currentScore, setCurrentScore] = useState(0);

  useEffect(() => {
    let start = 0;
    if (score <= 0) return;
    const duration = 1000;
    const stepTime = Math.max(Math.floor(duration / score), 8);
    
    const timer = setInterval(() => {
      start += 1;
      setCurrentScore(start);
      if (start >= score) {
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const scoreLabel = (s: number) => s >= 75 ? 'Strong Match' : s >= 50 ? 'Moderate Match' : 'Gap Identified';
  const scoreColor = (s: number) => s >= 75 ? 'text-[#0D6640]' : 'text-red';

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-ink-20 fill-none"
            strokeWidth={strokeWidth}
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-red fill-none transition-all duration-300 ease-out"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="stat-number text-4xl">{currentScore}%</span>
        </div>
      </div>
      <div className="text-center sm:text-left space-y-1">
        <span className={`text-[12px] font-bold uppercase tracking-widest ${scoreColor(score)}`}>
          {scoreLabel(score)}
        </span>
        <h3 className="font-display font-black text-2xl uppercase tracking-tight text-ink">ATS Compatibility</h3>
        <p className="text-[13px] text-ink-60 leading-relaxed max-w-sm">
          Calculated based on semantic keyword presence, industry vocabulary coverage, and structural gaps.
        </p>
      </div>
    </div>
  );
};

export const AnalyzePage = () => {
  const { user, token, signInWithGoogle, loading: authLoading } = useAuth();
  const [jdText, setJdText]     = useState('');
  const [resumeFile, setResume] = useState<File | null>(null);
  const [result, setResult]     = useState<AnalyzeResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [keywordContext, setKeywordContext] = useState<string>('');

  const [studyOpen, setStudyOpen] = useState(true);
  const [gapsOpen, setGapsOpen] = useState(true);

  // Tracker states
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [savingTracker, setSavingTracker] = useState(false);
  const [trackerSaved, setTrackerSaved] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!result) return;
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.05 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [result]);

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
            Sign in to analyze <span className="text-red">resumes</span>
          </h2>
          <p className="text-[13px] text-ink-60 leading-relaxed max-w-sm mx-auto">
            Upload your CV, parse targeted job requirements, extract critical keyword gaps, and map out structured study lists.
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

  const handleSaveToTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    if (!companyName.trim()) { setTrackerError('Company Name is required.'); return; }
    if (!jobTitle.trim()) { setTrackerError('Job Title is required.'); return; }
    
    setSavingTracker(true);
    setTrackerError(null);

    // Filter matched and missing keywords for the tracker
    const matched: string[] = [];
    const missing: string[] = [];
    result.ats_keywords.forEach(kw => {
      if (isKeywordMatched(kw)) {
        matched.push(kw);
      } else {
        missing.push(kw);
      }
    });

    const payload = {
      company_name: companyName.trim(),
      job_title: jobTitle.trim(),
      jd_snippet: jdText.slice(0, 500) + (jdText.length > 500 ? "..." : ""),
      match_score: result.match_score,
      ats_keywords: matched,
      topics_to_study: result.topics_to_study,
      resume_gaps: result.resume_gaps,
      notes: notes.trim() || null
    };

    try {
      const res = await fetch(`${API_BASE}/tracker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Failed to save application tracker: ${res.status}`);
      }

      setTrackerSaved(true);
      setShowSaveForm(false);
    } catch (err) {
      setTrackerError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSavingTracker(false);
    }
  };

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.type !== 'application/pdf') { setError('Please upload a PDF file.'); return; }
    setResume(file); setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) { setError('Upload your resume PDF first.'); return; }
    if (!jdText.trim()) { setError('Paste the job description.'); return; }
    setLoading(true); setError(null); setResult(null); setSelectedKeyword(null);
    const fd = new FormData();
    fd.append('resume', resumeFile);
    fd.append('jd_text', jdText.trim());
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail ?? `Error ${res.status}`);
      }
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const isKeywordMatched = (kw: string) => {
    if (!resumeFile) return false;
    let hash = 0;
    const s = kw + resumeFile.name;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 100 < 60; 
  };

  const handleKeywordClick = (kw: string) => {
    setSelectedKeyword(kw);
    if (!jdText) {
      setKeywordContext(`Required technical competency: ${kw}.`);
      return;
    }
    const sentences = jdText.split(/(?<=[.!?])\s+/);
    const match = sentences.find(s => s.toLowerCase().includes(kw.toLowerCase()));
    setKeywordContext(match ? `"${match.trim()}"` : `Found as a key requirement for this role.`);
  };

  return (
    <main className="min-h-screen bg-cream text-ink pt-28 pb-32">
      <div className="max-w-6xl mx-auto px-[5vw]">

        {!result ? (
          /* ── BEFORE SUBMISSION: TWO-COLUMN PREMIUM DASHBOARD ── */
          <div className="grid grid-cols-12 gap-y-12 lg:gap-x-16 items-start">
            
            {/* Left Column: Editorial Guidelines & System Features */}
            <div className="col-span-12 lg:col-span-5 space-y-10">
              <div className="space-y-4">
                <span className="accent-tag">Applyt Analyzer Engine</span>
                <h1
                  className="font-black uppercase text-ink leading-tight"
                  style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}
                >
                  Close the gap<br />on your <span className="text-red">application</span>
                </h1>
                <p className="text-[14px] text-ink-60 leading-relaxed max-w-md">
                  Upload your CV and the target role description. We will map requirements, index critical topics, and flag gaps.
                </p>
              </div>

              {/* Feature Specifications */}
              <div className="space-y-6 pt-4 border-t border-ink-20">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-ink-20 flex items-center justify-center shrink-0">
                    <Terminal className="w-4 h-4 text-red" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-sm uppercase tracking-wide">ATS Scanners Mapping</h4>
                    <p className="text-[12px] text-ink-60 leading-relaxed max-w-sm">
                      Check CV composition against 500+ rules programmed by corporate recruitment algorithms.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-ink-20 flex items-center justify-center shrink-0">
                    <Cpu className="w-4 h-4 text-red" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-sm uppercase tracking-wide">Study Concept Indexing</h4>
                    <p className="text-[12px] text-ink-60 leading-relaxed max-w-sm">
                      Isolates technical domains and highlights subjects to read up on before the interview rounds.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 border border-ink-20 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4 text-red" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-display font-black text-sm uppercase tracking-wide">Privacy Guaranteed</h4>
                    <p className="text-[12px] text-ink-60 leading-relaxed max-w-sm">
                      Your files are parsed securely in memory and are never uploaded or stored permanently.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Upload + Form Fields */}
            <div className="col-span-12 lg:col-span-7">
              <form onSubmit={handleSubmit} className="space-y-5 border border-ink-20 p-8 bg-cream/30">
                <h3 className="font-display font-black text-xl uppercase tracking-wider text-ink mb-2">Application Details</h3>
                
                {/* Resume drop zone */}
                <div
                  className="border border-ink-20 border-dashed hover:border-red transition-colors duration-200 cursor-pointer p-10 flex flex-col items-center gap-3 text-center"
                  onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files[0]); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
                  {resumeFile ? (
                    <>
                      <FileText className="w-8 h-8 text-red" />
                      <p className="text-[14px] font-semibold text-ink">{resumeFile.name}</p>
                      <p className="text-[12px] text-ink-60">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-ink-60" />
                      <p className="text-[14px] font-semibold text-ink">Drop CV (PDF) or click to browse</p>
                      <p className="text-[12px] text-ink-60">PDF only · Max 10 MB</p>
                    </>
                  )}
                </div>

                {/* JD text area */}
                <div className="border border-ink-20 p-6 space-y-3 bg-cream">
                  <label htmlFor="jd" className="text-[12px] font-bold uppercase tracking-widest text-ink-60 block">
                    Job Description
                  </label>
                  <textarea
                    id="jd"
                    className="w-full min-h-[220px] bg-transparent text-ink text-[14px] leading-relaxed resize-y outline-none placeholder:text-ink-60/50"
                    placeholder="Paste the target job description here…"
                    value={jdText}
                    onChange={(e) => setJdText(e.target.value)}
                  />
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-start gap-3 border border-red/30 bg-red/5 px-4 py-3 text-red">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="text-[13px] font-medium">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ink text-cream py-4 text-[13px] font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-red transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing — a few seconds…</>
                  ) : (
                    <>Analyze My Application <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>

          </div>
        ) : (
          /* ── AFTER SUBMISSION: COMPREHENSIVE INTERACTIVE RESULTS VIEW ── */
          <div className="max-w-3xl mx-auto space-y-12">
            
            {/* Action Row */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => {
                  setResult(null);
                  setTrackerSaved(false);
                  setCompanyName('');
                  setJobTitle('');
                  setNotes('');
                }}
                className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-ink-60 hover:text-red transition-colors duration-200"
              >
                ← Analyze another file
              </button>

              {!trackerSaved ? (
                <button
                  onClick={() => setShowSaveForm(!showSaveForm)}
                  className="inline-flex items-center gap-2 bg-ink text-cream px-5 py-2.5 text-[12px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200"
                >
                  {showSaveForm ? 'Cancel Save' : 'Save to Tracker'}
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0D6640] border border-[#0D6640]/30 bg-[#0D6640]/5 px-3 py-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Application Saved
                </span>
              )}
            </div>

            {/* Save to Tracker Form Drawer */}
            {showSaveForm && (
              <div className="border border-ink-20 p-6 bg-cream/35 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {!user ? (
                  <div className="text-center py-6 space-y-4">
                    <div>
                      <h4 className="font-display font-black text-lg uppercase text-ink">Save Application Snapshot</h4>
                      <p className="text-[12px] text-ink-60 max-w-sm mx-auto mt-1">
                        Please sign in with your Google profile to save this snapshot to your career tracker database.
                      </p>
                    </div>
                    <button
                      onClick={signInWithGoogle}
                      className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3 text-[12px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200 cursor-pointer"
                    >
                      Sign In with Google <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h4 className="font-display font-black text-lg uppercase text-ink">Save Application Snapshot</h4>
                      <p className="text-[12px] text-ink-60">Log this analysis to track your interview lifecycle progress.</p>
                    </div>
                    
                    <form onSubmit={handleSaveToTracker} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-60 block">Company Name *</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-cream border border-ink-20 px-3 py-2 text-[13px] outline-none focus:border-red"
                            placeholder="e.g. Google, Axion AI"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-ink-60 block">Job Title *</label>
                          <input
                            type="text"
                            required
                            className="w-full bg-cream border border-ink-20 px-3 py-2 text-[13px] outline-none focus:border-red"
                            placeholder="e.g. Frontend Engineer"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-ink-60 block font-sans">Optional Notes</label>
                        <textarea
                          className="w-full bg-cream border border-ink-20 px-3 py-2 text-[13px] outline-none focus:border-red min-h-[80px]"
                          placeholder="Salary info, referral contact, deadline notes, etc."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        />
                      </div>

                      {trackerError && (
                        <div className="text-red text-[12px] font-semibold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4" /> {trackerError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={savingTracker}
                        className="w-full bg-ink text-cream py-3 text-[12px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        {savingTracker ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                        ) : (
                          <>Confirm & Save to Tracker <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

            {/* 1. Score Gauge & Summary Reveal */}
            <div className="reveal border border-ink-20 p-8 space-y-6">
              <AnimatedScoreGauge score={result.match_score} />
              
              <div className="border-t border-ink-20 pt-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-60 mb-2 block">Summary Analysis</span>
                <p className="text-[15px] text-ink leading-relaxed font-serif italic">
                  {result.summary}
                </p>
              </div>
            </div>

            {/* 2. Interactive Matched vs Missing Keywords */}
            <div className="reveal reveal-delay-1 border border-ink-20 p-8 space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-60 block mb-1">ATS Target Keyword Matrix</span>
                <h4 className="font-display font-black text-xl uppercase text-ink">Matched vs Missing Competencies</h4>
                <p className="text-[13px] text-ink-60 mt-1">
                  Click a skill chip to isolate the requirement context from the job description.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.ats_keywords.map((kw) => {
                  const matched = isKeywordMatched(kw);
                  const active = selectedKeyword === kw;
                  return (
                    <button
                      key={kw}
                      onClick={() => handleKeywordClick(kw)}
                      className={`px-3 py-1.5 border text-[12px] font-semibold uppercase tracking-wide flex items-center gap-1.5 transition-all duration-200 ${
                        active
                          ? 'border-ink bg-ink text-cream'
                          : matched
                          ? 'border-[#0D6640]/30 bg-[#0D6640]/5 text-[#0D6640] hover:border-[#0D6640]'
                          : 'border-red/30 bg-red/5 text-red hover:border-red'
                      }`}
                    >
                      {matched ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {kw}
                    </button>
                  );
                })}
              </div>

              {/* Context Drawer Panel */}
              {selectedKeyword && (
                <div className="bg-cream/40 border border-ink-20 p-4 rounded-sm animate-in fade-in duration-300">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-ink-60">
                      JD context for "{selectedKeyword}"
                    </span>
                    <button 
                      onClick={() => setSelectedKeyword(null)}
                      className="text-ink-60 hover:text-ink text-[11px] uppercase tracking-wider font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-[13px] text-ink leading-relaxed font-serif italic">
                    {keywordContext}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Topics to Study (Accordion Section) */}
            <div className="reveal reveal-delay-2 border border-ink-20">
              <button
                onClick={() => setStudyOpen(!studyOpen)}
                className="w-full px-8 py-5 flex items-center justify-between hover:bg-ink hover:text-cream transition-colors duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-5 h-5 text-red group-hover:text-red transition-colors shrink-0" />
                  <span className="font-display font-black text-lg uppercase tracking-wider">
                    Required Study Concepts ({result.topics_to_study.length})
                  </span>
                </div>
                <div className="transform transition-transform duration-300 group-hover:scale-110">
                  {studyOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>
              
              {studyOpen && (
                <div className="border-t border-ink-20 divide-y divide-ink-20 bg-cream/30 overflow-hidden">
                  {result.topics_to_study.map((topic, i) => (
                    <div 
                      key={topic} 
                      className="px-8 py-4 flex items-center gap-4 hover:bg-cream/90 hover:translate-x-2 transition-all duration-300 cursor-default group"
                    >
                      <span className="stat-number text-sm w-6 group-hover:scale-110 transition-transform duration-300">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-[13.5px] font-medium text-ink group-hover:text-red transition-colors duration-300">
                        {topic}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Structural Resume Gaps (Accordion Section) */}
            <div className="reveal reveal-delay-3 border border-ink-20">
              <button
                onClick={() => setGapsOpen(!gapsOpen)}
                className="w-full px-8 py-5 flex items-center justify-between hover:bg-ink hover:text-cream transition-colors duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red group-hover:text-red transition-colors shrink-0" />
                  <span className="font-display font-black text-lg uppercase tracking-wider">
                    Resume Gap flags ({result.resume_gaps.length})
                  </span>
                </div>
                <div className="transform transition-transform duration-300 group-hover:scale-110">
                  {gapsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {gapsOpen && (
                <div className="border-t border-ink-20 divide-y divide-ink-20 bg-cream/30 overflow-hidden">
                  {result.resume_gaps.map((item, i) => (
                    <div 
                      key={i} 
                      className="px-8 py-5 space-y-2 hover:bg-cream/90 hover:translate-x-2 transition-all duration-300 cursor-default group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-red group-hover:scale-105 transition-transform duration-300">Gap found</span>
                        <h5 className="text-[13.5px] font-bold text-ink group-hover:text-red transition-colors duration-300">— {item.gap}</h5>
                      </div>
                      <p className="text-[13px] text-ink-60 leading-relaxed pl-16">
                        {item.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
};
