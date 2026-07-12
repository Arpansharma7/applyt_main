import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

/* ── Scroll-reveal hook ── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

export const FeaturesPage = () => {
  useReveal();

  return (
    <main className="min-h-screen bg-cream text-ink pt-24 pb-0">

      {/* ── Hero Header ── */}
      <header className="relative py-20 overflow-hidden border-b border-ink-20">
        <div className="max-w-4xl mx-auto px-[5vw] text-center">
          <span className="accent-tag mb-6 inline-block reveal">
            Precision Engineering
          </span>
          <h1
            className="font-display font-black uppercase text-ink leading-tight mb-6 reveal reveal-delay-1"
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)' }}
          >
            Surgical tools for the <span className="text-red">modern professional</span>.
          </h1>
          <p className="text-[16px] text-ink-60 max-w-2xl mx-auto leading-relaxed reveal reveal-delay-2">
            The Applyt AI suite provides deep semantic analysis, closing the gap between job description requirements and your professional story.
          </p>
        </div>
      </header>

      {/* ── Main Bento Grid ── */}
      <section className="px-[5vw] py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-7xl mx-auto">

          {/* Keyword Extraction — col-span-8 */}
          <div className="md:col-span-8 border border-ink-20 p-8 sm:p-10 relative overflow-hidden group reveal">
            <div className="flex flex-col md:flex-row gap-8 items-center h-full">
              <div className="flex-1 space-y-4">
                <div className="w-12 h-12 bg-ink rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-cream fill-cream" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                  </svg>
                </div>
                <h3 className="font-display font-black uppercase text-xl text-ink">Keyword Extraction</h3>
                <p className="text-[13px] text-ink-60 leading-relaxed">
                  Our semantic engine parses job descriptions with sub-millisecond latency, identifying technical requirements that standard scanners miss.
                </p>
                <ul className="space-y-2 mt-6">
                  <li className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink">
                    <CheckCircle2 className="w-4.5 h-4.5 text-red shrink-0" />
                    <span>Semantic Mapping</span>
                  </li>
                  <li className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-ink">
                    <CheckCircle2 className="w-4.5 h-4.5 text-red shrink-0" />
                    <span>Industry Dictionaries</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1 w-full rounded-sm overflow-hidden shadow-md border border-ink-20 bg-cream aspect-video md:aspect-auto md:h-[260px] relative">
                <img
                  alt="Resume Document Analysis"
                  className="grayscale-img w-full h-full object-cover object-top"
                  src="https://lh3.googleusercontent.com/aida/AP1WRLv6BvW_73o3kBJ03J1YBxbnU6U84TPneMWrWKwu3arWPCkSDBi_L8ndkpsWODRdz58HNT-iG9HryJ_jMVtrpqpDX8l_7ALWta5l-AyP6jQbpw8JuOA4DgDXNmOc8f0Gm4-pTDz3qqbMZ265XcM6CNZYmiaus0ZuxMGcjPp6UWPP9R6HfT7keTVTt8ZRjP_ArIoMrbluP9aUCgq0sslOnX8VKopG6_6SZDElMbKzhLIIMUH3yii2oVDDU0Nq"
                  loading="lazy"
                  width={400}
                  height={260}
                />
                <div className="absolute inset-0 bg-red/0 hover:bg-red/8 transition-all duration-700 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Live Parsing — col-span-4 */}
          <div className="md:col-span-4 border border-ink-20 p-8 flex flex-col justify-between reveal reveal-delay-1">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase tracking-widest text-ink-60">Real-time Feed</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red animate-pulse" />
              </div>
              <h3 className="font-display font-black uppercase text-xl text-ink">Live Parsing</h3>
              <p className="text-[13px] text-ink-60 leading-relaxed">Continuous assessment of uploaded documentation.</p>
            </div>
            <div className="mt-8 space-y-3">
              <div className="h-2 bg-ink-20 rounded-full overflow-hidden">
                <div className="h-full bg-red w-3/4 rounded-full" />
              </div>
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-ink-60">Architecture.pdf</span>
                <span className="text-red">78% Parsed</span>
              </div>
            </div>
          </div>

          {/* Resume Scoring — col-span-4, dark */}
          <div className="md:col-span-4 bg-ink text-cream p-8 flex flex-col justify-between shadow-xl reveal">
            <div className="space-y-6">
              <div className="w-12 h-12 bg-cream/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red fill-red" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l7.59-7.59L21 8l-9 9z"/>
                </svg>
              </div>
              <h3 className="font-display font-black uppercase text-xl text-cream">Resume Scoring</h3>
              <p className="text-[13px] text-cream/70 leading-relaxed">
                Objective parsing against 500+ standard data points used by top-tier technical recruiters.
              </p>
            </div>
            <div className="mt-8 flex justify-center">
              <div className="relative w-28 h-28">
                <div className="absolute inset-0 border-4 border-cream/10 rounded-full" />
                <div
                  className="absolute inset-0 border-4 border-red rounded-full"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 92%, 0 92%)' }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-3xl font-black text-cream leading-none">92</span>
                  <span className="text-[10px] text-cream/50 uppercase tracking-widest mt-1">Match</span>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Gap Analysis — col-span-8 */}
          <div className="md:col-span-8 border border-ink-20 p-8 sm:p-10 group relative overflow-hidden reveal reveal-delay-1">
            <div className="flex flex-col gap-6 h-full justify-between">
              <div className="flex justify-between items-start gap-4">
                <div className="max-w-md">
                  <h3 className="font-display font-black uppercase text-xl text-ink mb-2">Skill Gap Analysis</h3>
                  <p className="text-[13px] text-ink-60 leading-relaxed">
                    Bridge the distance between your current profile and the target role with automated suggestions.
                  </p>
                </div>
                <Link
                  to="/analyze"
                  className="w-10 h-10 border border-ink-20 flex items-center justify-center hover:bg-ink hover:text-cream transition-colors duration-200 shrink-0"
                  aria-label="Go to Analyze"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                <div className="space-y-5">
                  {[
                    { label: 'Cloud Engineering', pct: '85%', delta: '+12.5%' },
                    { label: 'Product Management', pct: '62%', delta: '+5.2%' },
                    { label: 'Stakeholder Relations', pct: '91%', delta: '+22.1%' },
                  ].map(({ label, pct, delta }) => (
                    <div key={label} className="space-y-2">
                      <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                        <span className="text-ink">{label}</span>
                        <span className="text-red">{delta}</span>
                      </div>
                      <div className="h-1.5 bg-ink-20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red"
                          style={{ width: pct }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-sm overflow-hidden border border-ink-20 bg-cream aspect-video relative">
                  <img
                    alt="Skill Radar Chart"
                    className="grayscale-img w-full h-full object-cover"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxHqgVBdvip0Mva6ixmnYiPLIYhTvKiL9TgFUBOT3jhNlxiumzJTzXSreY-quJS0oJur81kv7dcrhcBnhE_n2XBlQgQLRJfo_XrBqMHXnzcygtny5rf5kxJG7OFzO3n8KQfYXBJHv-56Xjj6Cip6MLJji5h2TT58Z88FJ2DCBpG8NOa3KX8Z7nSuT9vWYmTGU-e3cVN9KkK1NfFzi5GnW6L5o9JEfFESsqkhuezEuupZKbfWeXQOEQXg"
                    loading="lazy"
                    width={320}
                    height={180}
                  />
                  <div className="absolute inset-0 bg-red/0 hover:bg-red/8 transition-all duration-700 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Intelligence — full-width */}
          <div className="md:col-span-12 border border-ink-20 mt-6 reveal">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 mb-6">
                  <span className="accent-tag">Midnight Kinetic</span>
                </div>
                <h2
                  className="font-display font-black uppercase text-ink leading-tight mb-6"
                  style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
                >
                  Integrated Intelligence
                </h2>
                <p className="text-[14px] text-ink-60 mb-8 max-w-lg leading-relaxed">
                  Experience a singular dashboard for your entire career lifecycle. Monitor market shifts, skill demands, and your profile performance with surgical precision.
                </p>
                <div className="flex">
                  <Link
                    to="/analyze"
                    className="bg-ink text-cream px-6 py-3 text-[13px] font-semibold uppercase tracking-wider hover:bg-red transition-colors duration-200"
                  >
                    Explore Dashboard
                  </Link>
                </div>
              </div>
              <div className="relative bg-ink-20 min-h-[300px] lg:min-h-[400px] overflow-hidden">
                <img
                  alt="Integrated Intelligence Dashboard"
                  className="grayscale-img absolute inset-0 w-full h-full object-cover object-center"
                  src="https://lh3.googleusercontent.com/aida/AP1WRLtwNj9D-IQyjarlcestbXRgK8JnjeA2a9h8d5Es-BjEpuSmKxd54k1DjPE5SiiinquqzJ5BWAyBXYBz1Zvcazc_1nkYjgnDXg0J-w5OEinAOT-RksxYG2ecfflbGFm5yPRfpXFhD165lhP-7-mXB4A2p4Hw4VHr8jwVZGcvQxBAMK84L42px40FdvQBvLqpvTj3re5S3FOUW6Bv4VIra1m-VLDNBAbaMsxexdYzZQKHmI1A6Pg1y-K_b6pV"
                  loading="lazy"
                  width={600}
                  height={400}
                />
                <div className="absolute inset-0 bg-red/0 hover:bg-red/8 transition-all duration-700 pointer-events-none" />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-24 bg-ink text-cream">
        <div className="max-w-4xl mx-auto px-[5vw] text-center">
          <h2
            className="font-display font-black uppercase text-cream mb-8 leading-tight"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
          >
            Architect your future today.
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/analyze"
              className="bg-red text-cream px-10 py-4 text-[13px] font-semibold uppercase tracking-wider hover:bg-cream hover:text-ink transition-colors duration-200"
            >
              Analyze Resume
            </Link>
            <a
              href="https://linkedin.com/in/arpan-sharma-aiml"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-red text-red px-10 py-4 text-[13px] font-semibold uppercase tracking-wider hover:bg-red hover:text-cream transition-colors duration-200"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full border-t border-ink-20 bg-cream">
        <div className="max-w-7xl mx-auto px-[5vw] py-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <span className="font-display font-black uppercase text-xl text-ink">Applyt</span>
            <p className="text-[13px] text-ink-60 text-center md:text-left">© 2026 Applyt AI · <a href="https://linkedin.com/in/arpan-sharma-aiml" target="_blank" rel="noopener noreferrer" className="hover:text-red underline">Arpan Sharma</a></p>
          </div>
        </div>
      </footer>

    </main>
  );
};
