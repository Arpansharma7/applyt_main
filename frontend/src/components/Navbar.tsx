import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signInWithGoogle, logout } = useAuth();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const navLink = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => {
          if (active) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className={`text-[13px] font-semibold tracking-wider uppercase transition-colors duration-200 ${
          active ? 'text-red' : 'text-ink-60 hover:text-ink'
        }`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-[5vw] py-4 bg-cream/90 backdrop-blur-md border-b border-ink-20">
      <Link
        to="/"
        onClick={() => {
          if (location.pathname === '/') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        className="font-display font-black text-xl tracking-tight text-ink uppercase"
      >
        Applyt
      </Link>

      {/* Desktop nav */}
      <nav className="hidden md:flex items-center gap-8">
        {navLink('/', 'Home')}
        {navLink('/analyze', 'Analyze')}
        {navLink('/features', 'Features')}
        {navLink('/tracker', 'Tracker')}
      </nav>

      {/* Desktop Auth Section */}
      <div className="hidden md:flex items-center gap-4 relative" ref={dropdownRef}>
        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-3 cursor-pointer outline-none select-none hover:opacity-85 transition-opacity"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-ink-20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red text-cream flex items-center justify-center text-xs font-bold font-display uppercase">
                  {user.displayName?.slice(0, 2) || 'US'}
                </div>
              )}
              <span className="text-[12px] font-semibold text-ink">{user.displayName}</span>
            </button>

            {/* Dropdown Card */}
            {showProfileDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-cream border border-ink-20 p-5 shadow-xl space-y-4 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-12 h-12 rounded-full border border-ink-20" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red text-cream flex items-center justify-center text-sm font-bold font-display uppercase">
                      {user.displayName?.slice(0, 2) || 'US'}
                    </div>
                  )}
                  <div className="overflow-hidden text-left">
                    <h5 className="font-display font-black uppercase text-sm text-ink truncate leading-tight">{user.displayName}</h5>
                    <p className="text-[11px] text-ink-60 truncate font-mono mt-0.5">{user.email}</p>
                  </div>
                </div>

                <div className="border-t border-ink-20 pt-3">
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      logout();
                    }}
                    className="w-full bg-ink text-cream py-2.5 text-[11px] font-bold uppercase tracking-wider hover:bg-red transition-colors duration-200 cursor-pointer text-center"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          location.pathname !== '/analyze' && location.pathname !== '/tracker' ? (
            <div className="flex items-center gap-4">
              <button
                onClick={signInWithGoogle}
                className="text-[13px] font-semibold uppercase tracking-wider text-ink-60 hover:text-ink transition-colors duration-200 px-2 cursor-pointer"
              >
                Sign In
              </button>
              <Link
                to="/analyze"
                className="inline-flex items-center gap-2 bg-ink text-cream px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wider hover:bg-red transition-colors duration-200"
              >
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4 opacity-0 pointer-events-none select-none" aria-hidden="true">
              <button className="text-[13px] font-semibold uppercase tracking-wider px-2">
                Sign In
              </button>
              <div className="inline-flex items-center gap-2 bg-ink text-cream px-5 py-2.5 text-[13px] font-semibold uppercase tracking-wider">
                Get Started <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )
        )}
      </div>

      {/* Mobile Menu Trigger */}
      <button
        className="md:hidden text-ink"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-cream border-b border-ink-20 px-[5vw] py-6 flex flex-col gap-5">
          <Link to="/" className="text-sm font-semibold uppercase tracking-wider text-ink" onClick={() => { setIsOpen(false); if (location.pathname === '/') window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Home</Link>
          <Link to="/analyze" className="text-sm font-semibold uppercase tracking-wider text-ink" onClick={() => { setIsOpen(false); if (location.pathname === '/analyze') window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Analyze</Link>
          <Link to="/features" className="text-sm font-semibold uppercase tracking-wider text-ink" onClick={() => { setIsOpen(false); if (location.pathname === '/features') window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Features</Link>
          <Link to="/tracker" className="text-sm font-semibold uppercase tracking-wider text-ink" onClick={() => { setIsOpen(false); if (location.pathname === '/tracker') window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Tracker</Link>
          
          {user ? (
            <div className="flex items-center gap-3 py-3 border-t border-ink-20 mt-2">
              {user.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || 'User'} className="w-8 h-8 rounded-full border border-ink-20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-red text-cream flex items-center justify-center text-xs font-bold font-display uppercase">
                  {user.displayName?.slice(0, 2) || 'US'}
                </div>
              )}
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-ink">{user.displayName}</p>
                <button
                  onClick={() => { setIsOpen(false); logout(); }}
                  className="text-[11px] font-bold uppercase tracking-wider text-red hover:underline mt-0.5 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            location.pathname !== '/analyze' && location.pathname !== '/tracker' ? (
              <div className="flex flex-col gap-3 py-3 border-t border-ink-20 mt-2">
                <button
                  onClick={() => { setIsOpen(false); signInWithGoogle(); }}
                  className="w-full border border-ink text-ink py-2.5 text-sm font-semibold uppercase tracking-wider hover:bg-ink hover:text-cream transition-colors duration-200 text-center cursor-pointer"
                >
                  Sign In with Google
                </button>
                <Link
                  to="/analyze"
                  className="inline-flex items-center justify-center gap-2 bg-ink text-cream px-5 py-3 text-sm font-semibold uppercase tracking-wider hover:bg-red transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : null
          )}
        </div>
      )}
    </header>
  );
};
