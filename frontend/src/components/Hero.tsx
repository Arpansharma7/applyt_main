import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

/* ── Scroll-reveal hook ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const STATS = [
  { num: '3×', label: 'More interview callbacks' },
  { num: '78%', label: 'Avg ATS match score' },
  { num: '<30s', label: 'To surface hidden keywords' },
];

export const Hero = () => {
  useReveal();

  return (
    <div className="bg-cream">
      {/* ── Editorial Hero Section ── */}
      <section className="relative min-h-[95vh] flex flex-col justify-between pt-24 pb-16 overflow-hidden">

        {/* Giant background text (Solid Red) behind the elements */}
        <div className="absolute top-8 left-0 right-0 z-0 flex justify-center select-none pointer-events-none overflow-hidden">
          <h1 
            className="font-display font-black text-red tracking-tighter text-center leading-none uppercase" 
            style={{ fontSize: 'clamp(6rem, 22vw, 18rem)', letterSpacing: '-0.04em' }}
          >
            APPLYT
          </h1>
        </div>

        {/* Hero Content Overlap Layout */}
        <div className="relative z-10 max-w-none w-full px-[5vw] grid grid-cols-12 gap-y-12 md:gap-x-8 pt-24 pb-4 flex-1 items-end">
          
          {/* Left Column: Copy + Social Proof */}
          <div className="col-span-12 md:col-span-4 space-y-16 self-end pb-2 mr-auto max-w-[280px] w-full text-left">
            <div className="reveal">
              <p className="text-[13px] text-ink-60 leading-relaxed">
                Empower your career transition with AI-powered resume engineering that parses requirements, flags critical gaps, and aligns your experience.
              </p>
            </div>
            
            <div className="reveal reveal-delay-2 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['JS', 'MK', 'AT'].map((init) => (
                  <div
                    key={init}
                    className="w-8 h-8 rounded-full border-2 border-cream bg-ink-20 flex items-center justify-center text-[10px] font-bold text-ink"
                  >
                    {init}
                  </div>
                ))}
              </div>
              <span className="text-[12px] text-ink-60 leading-tight">
                Trusted by job seekers<br />worldwide
              </span>
            </div>
          </div>

          {/* Center Column: Grayscale image with a deliberate circular crop overlap and AI Scan HUD */}
          <div className="col-span-12 md:col-span-4 flex justify-center items-center relative self-center py-6">
            
            {/* Outer Circular Scanning HUD Ring */}
            <div 
              className="absolute rounded-full border border-dashed border-red/40 animate-[spin_50s_linear_infinite] select-none pointer-events-none"
              style={{
                width: 'calc(clamp(280px, 24vw, 360px) + 24px)',
                height: 'calc(clamp(280px, 24vw, 360px) + 24px)',
              }}
            />

            {/* Inner Circular Radar-like Ring */}
            <div 
              className="absolute rounded-full border border-ink/5 animate-hud-pulse select-none pointer-events-none"
              style={{
                width: 'calc(clamp(280px, 24vw, 360px) + 48px)',
                height: 'calc(clamp(280px, 24vw, 360px) + 48px)',
              }}
            />

            {/* Square Bounding Box HUD Wrapper */}
            <div 
              className="absolute select-none pointer-events-none"
              style={{
                width: 'calc(clamp(280px, 24vw, 360px) + 32px)',
                height: 'calc(clamp(280px, 24vw, 360px) + 32px)',
              }}
            >
              {/* Corner L-Brackets */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-red/50" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-red/50" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-red/50" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-red/50" />

              {/* Minimal Tech Labels */}
              <div className="absolute -top-7 left-0 font-mono text-[9px] font-bold text-red/60 uppercase tracking-widest">
                SYS_INIT: ACTIVE
              </div>
              <div className="absolute -bottom-7 right-0 font-mono text-[9px] font-bold text-red/60 uppercase tracking-widest">
                MATCH: 92%
              </div>
            </div>

            {/* Image container */}
            <div 
              className="relative rounded-full overflow-hidden border-4 border-red shadow-2xl z-10 shrink-0 aspect-square"
              style={{
                width: 'clamp(280px, 24vw, 360px)',
                height: 'clamp(280px, 24vw, 360px)',
              }}
            >
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&auto=format&fit=crop"
                alt="Professional career architect"
                className="grayscale-img w-full h-full object-cover"
                loading="eager"
              />
              
              {/* Scanline overlay inside the circle */}
              <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent opacity-80 animate-hud-scan z-20 pointer-events-none" />
              
              <div className="absolute inset-0 bg-red/0 hover:bg-red/5 transition-all duration-500 pointer-events-none" />
            </div>
          </div>

          {/* Right Column: Title + Copy + CTA Button */}
          <div className="col-span-12 md:col-span-4 space-y-12 self-end pb-2 flex flex-col items-start text-left ml-auto max-w-[300px] w-full">
            <div className="reveal reveal-delay-1 space-y-4">
              <p className="text-[13px] text-ink-60 leading-relaxed">
                Automate ATS keyword matching, receive targeted study concepts, and secure more interviews with precision tracking.
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold leading-tight text-ink font-serif">
                Transform applications with intelligent AI.
              </h2>
            </div>

            <div className="reveal reveal-delay-3">
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 bg-ink text-cream px-6 py-3 text-[13px] font-semibold uppercase tracking-wider hover:bg-red transition-colors duration-200"
              >
                Analyze Now <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

      </section>

      {/* ── Stats Strip ── */}
      <section className="px-[5vw] py-16 border-y border-ink-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8">
          {STATS.map((s, i) => (
            <div
              key={s.num}
              className={`reveal reveal-delay-${i + 1} flex flex-col gap-1`}
            >
              <span className="stat-number text-[clamp(2.8rem,6vw,4.5rem)]">{s.num}</span>
              <span className="text-[13px] text-ink-60 font-medium uppercase tracking-wide">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="px-[5vw] py-24 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-16">
          <div>
            <span className="accent-tag mb-4 inline-block">Process</span>
            <h2
              className="text-headline-lg font-black uppercase text-ink leading-tight"
              style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
            >
              Three steps.<br />One unfair advantage.
            </h2>
          </div>
          <p className="text-[14px] text-ink-60 leading-relaxed max-w-xs md:mt-12">
            Unlock smarter decisions about every job application with AI that reads between the lines of any job description.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ink-20">
          {[
            { n: '01', title: 'Paste the JD', body: 'Copy any job description — from any job board, company page, or recruiter email — and paste it in.' },
            { n: '02', title: 'Upload your resume', body: 'Drop your current PDF resume. Our parser extracts your experience, skills, and achievements.' },
            { n: '03', title: 'Get your edge', body: 'Receive ATS keywords to add, skill gaps to close, and a prioritised study list for the interview.' },
          ].map((step, i) => (
            <div
              key={step.n}
              className={`reveal reveal-delay-${i + 1} bg-cream p-10 flex flex-col gap-5 group hover:bg-ink transition-colors duration-300`}
            >
              <span className="stat-number text-2xl group-hover:text-red transition-colors duration-300">
                {step.n}
              </span>
              <h3
                className="text-xl font-black uppercase text-ink group-hover:text-cream transition-colors duration-300 leading-tight"
                style={{ fontFamily: 'Barlow Condensed, sans-serif' }}
              >
                {step.title}
              </h3>
              <p className="text-[13px] text-ink-60 group-hover:text-cream/70 transition-colors duration-300 leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
