import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ref]);
}

const FEATURES = [
  {
    n: '01',
    tag: 'ATS Keywords',
    title: 'Instant Keyword\nExtraction',
    body: "Our semantic engine surfaces the exact hard skills, tools, and certifications recruiters programmed their ATS to reject you without.",
  },
  {
    n: '02',
    tag: 'Skill Gaps',
    title: 'Skill Gap\nAnalysis',
    body: "Know exactly what's missing before the interview. We cross-reference your resume with the JD and return a curated study list.",
  },
  {
    n: '03',
    tag: 'Resume Tuning',
    title: 'Resume\nOptimization',
    body: "Specific, actionable gap flags — not generic tips. Rewrite suggestions tuned to this job description and your actual experience.",
  },
  {
    n: '04',
    tag: 'Match Score',
    title: 'ATS Match\nScoring',
    body: "A 0–100 match score so you know whether to apply now, improve first, or move on — before wasting anyone's time.",
  },
];

export const BentoFeatures = () => {
  const sectionRef = useRef<HTMLElement>(null);
  useReveal(sectionRef as React.RefObject<HTMLElement>);

  return (
    <section ref={sectionRef as React.RefObject<HTMLElement>} className="px-[5vw] py-24 border-t border-ink-20" id="features">

      {/* Section header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16 reveal">
        <div>
          <span className="accent-tag mb-4 inline-block">Precision-engineered tools</span>
          <h2
            className="text-headline-lg font-black uppercase text-ink leading-tight"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Everything you need<br />to out-apply the field.
          </h2>
        </div>
        <Link
          to="/features"
          className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink hover:text-red transition-colors"
        >
          See full feature suite <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Feature grid — 2×2 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ink-20">
        {FEATURES.map((f, i) => (
          <div
            key={f.n}
            className={`reveal reveal-delay-${(i % 2) + 1} bg-cream p-10 group hover:bg-ink transition-colors duration-300 min-h-[280px] flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between mb-8">
              <span className="stat-number text-3xl group-hover:text-red transition-colors duration-300">
                {f.n}
              </span>
              <span className="accent-tag group-hover:border-red/40 group-hover:text-red/80 transition-colors">
                {f.tag}
              </span>
            </div>
            <div>
              <h3
                className="text-xl font-black uppercase text-ink group-hover:text-cream transition-colors duration-300 leading-tight mb-4 whitespace-pre-line"
                style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)' }}
              >
                {f.title}
              </h3>
              <p className="text-[13px] text-ink-60 group-hover:text-cream/70 transition-colors duration-300 leading-relaxed">
                {f.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA below grid */}
      <div className="mt-16 flex flex-col sm:flex-row items-center justify-between gap-6 reveal reveal-delay-3">
        <p
          className="text-headline-md font-black uppercase text-ink leading-tight"
          style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }}
        >
          Ready to close the gap?
        </p>
        <Link
          to="/analyze"
          className="inline-flex items-center gap-2 bg-red text-cream px-8 py-4 text-[13px] font-semibold uppercase tracking-wider hover:bg-ink transition-colors duration-200"
        >
          Analyze My Resume <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </section>
  );
};
