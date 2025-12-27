import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RedPandaLogo from './RedPandaLogo';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { user, signOut, isPlatformEnabled } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setShowUserMenu(false);
    setIsSigningOut(false);
    navigate('/');
  };

  const handlePlatformClick = () => {
    if (user) {
      // If we're already on the platform page, scroll to top
      if (location.pathname === '/platform') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/platform');
      }
    } else {
      navigate('/login');
    }
    setIsOpen(false);
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);

    // If we're on a different page, navigate to home first
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: href } });
    } else {
      // We're on the home page, just scroll
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Add effect to handle scroll after navigation
  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      // Wait for the page to render
      setTimeout(() => {
        const element = document.querySelector(state.scrollTo!);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#050508]/90 backdrop-blur-xl border-b border-white/5 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.35)]'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <RedPandaLogo size="md" animate={true} />
            <span className="text-2xl font-bold gradient-text">Kelv AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <button
              onClick={() => handleNavClick('#features')}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 whitespace-nowrap"
            >
              Features
            </button>
            <button
              onClick={handlePlatformClick}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-300 whitespace-nowrap"
            >
              Platform
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2 hover:border-white/20 transition-colors whitespace-nowrap"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-3 w-56 bg-[#0a0a0f]/95 border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl"
                    >
                      <div className="p-4 border-b border-white/10">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Signed in as</p>
                        <p className="font-medium text-gray-200 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/waitlist-success"
                        className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3 whitespace-nowrap"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <RedPandaLogo size="sm" animate={false} />
                        Waitlist Status
                      </Link>
                      {isPlatformEnabled && (
                        <Link
                          to="/platform"
                          className="block px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-3 whitespace-nowrap"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Brain className="w-4 h-4 text-orange-400" />
                          Interview Platform
                        </Link>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors flex items-center gap-3 text-red-400"
                        disabled={isSigningOut}
                      >
                        {isSigningOut ? (
                          <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-300 whitespace-nowrap border border-white/10 rounded-full px-4 py-2 hover:border-white/20"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => handleNavClick('#waitlist')}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-400 whitespace-nowrap"
                >
                  Join Waitlist
                </button>
              </>
            )}
          </div>

          {/* Mobile Navigation Toggle */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#070709]/95 border-t border-white/10 backdrop-blur-xl animate-slide-down">
            <div className="container py-4 flex flex-col space-y-4">
              <button
                onClick={() => handleNavClick('#features')}
                className="text-left text-gray-300 hover:text-white transition-colors py-2 duration-300"
              >
                Features
              </button>
              <button
                onClick={handlePlatformClick}
                className="text-left text-gray-300 hover:text-white transition-colors py-2 duration-300"
              >
                Platform
              </button>

              {user ? (
                <>
                  <Link
                    to="/waitlist-success"
                    className="text-gray-300 hover:text-white transition-colors py-2 duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Waitlist Status
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="text-left text-gray-300 hover:text-white transition-colors py-2 duration-300"
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <LogOut className="w-4 h-4" />
                    )}
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-left text-gray-300 hover:text-white transition-colors py-2 duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={() => handleNavClick('#waitlist')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-400"
                  >
                    Join Waitlist
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
