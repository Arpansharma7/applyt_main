import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { BentoFeatures } from './components/BentoFeatures';
import { AnalyzePage } from './pages/AnalyzePage';
import { FeaturesPage } from './pages/FeaturesPage';
import { TrackerPage } from './pages/TrackerPage';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const Footer = () => {
  const location = useLocation();

  const handleLinkClick = (path: string) => {
    if (location.pathname === path) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-ink-20 px-[5vw] py-16 bg-cream">
      <div className="flex flex-col md:flex-row justify-between gap-12">

        {/* Brand */}
        <div className="flex flex-col gap-4 max-w-xs">
          <span
            className="text-xl font-black uppercase tracking-tight text-ink"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.5rem' }}
          >
            Applyt
          </span>
          <p className="text-[13px] text-ink-60 leading-relaxed">
            AI-powered resume analysis that helps job seekers close the gap between their resume and the job they want.
          </p>
          <p className="text-[12px] text-ink-60 mt-2">
            © 2026 Applyt AI · <a href="https://linkedin.com/in/arpan-sharma-aiml" target="_blank" rel="noopener noreferrer" className="hover:text-red underline">Arpan Sharma</a>
          </p>
        </div>

        {/* Links */}
        <div className="flex gap-16">
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-ink-60 mb-1">Product</span>
            <Link to="/" onClick={() => handleLinkClick('/')} className="text-[13px] text-ink-60 hover:text-red transition-colors">Home</Link>
            <Link to="/analyze" onClick={() => handleLinkClick('/analyze')} className="text-[13px] text-ink-60 hover:text-red transition-colors">Analyze</Link>
            <Link to="/features" onClick={() => handleLinkClick('/features')} className="text-[13px] text-ink-60 hover:text-red transition-colors">Features</Link>
            <Link to="/tracker" onClick={() => handleLinkClick('/tracker')} className="text-[13px] text-ink-60 hover:text-red transition-colors">Tracker</Link>
          </div>
        </div>

        {/* CTA box matching reference */}
        <div className="max-w-sm border border-ink-20 p-6 flex flex-col gap-4">
          <p
            className="font-black uppercase text-ink leading-tight"
            style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1.4rem' }}
          >
            Build your career<br />with AI-powered analysis
          </p>
          <p className="text-[13px] text-ink-60 leading-relaxed">
            Join job seekers using Applyt to match smarter, apply faster, and land more interviews.
          </p>
          <Link
            to="/analyze"
            onClick={() => handleLinkClick('/analyze')}
          className="inline-flex items-center gap-2 bg-red text-cream px-5 py-3 text-[13px] font-semibold uppercase tracking-wider hover:bg-ink transition-colors duration-200 self-start"
        >
          Start Free →
        </Link>
      </div>

      </div>
    </footer>
  );
};

import { AuthProvider } from './context/AuthContext';

const HomePage = () => (
  <div className="bg-cream min-h-screen text-ink">
    <Hero />
    <BentoFeatures />
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/tracker" element={<TrackerPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
