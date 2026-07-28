import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import RedPandaLogo from './RedPandaLogo';
import { AnimatePresence, motion } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
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
    if (location.pathname === '/platform') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/platform');
    }
    setIsOpen(false);
  };

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: href } });
    } else {
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const state = location.state as { scrollTo?: string } | null;
    if (state?.scrollTo) {
      setTimeout(() => {
        document.querySelector(state.scrollTo!)?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isScrolled
          ? 'border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-[20px]'
          : 'border-b border-transparent bg-transparent'
      }`}
      style={{ height: 'var(--header-h)' }}
    >
      <div
        className="flex items-center justify-between h-full"
        style={{ maxWidth: 'calc(var(--page-max) + var(--page-outer) * 2)', margin: '0 auto', padding: '0 var(--page-outer)' }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <RedPandaLogo size="md" animate={true} />
          <span style={{ fontSize: '15px', fontWeight: 'var(--fw-semi)', color: 'var(--text)', letterSpacing: '-0.01em' }}>
            Kelv
          </span>
        </Link>

        {/* Desktop nav — flat links, no pill container */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => handleNavClick('#features')}
            style={{ fontSize: '14px', fontWeight: 'var(--fw-regular)', color: 'var(--text-3)' }}
            className="transition-colors duration-150 hover:text-[var(--text)] bg-none border-none cursor-pointer p-0"
          >
            Features
          </button>
          <button
            onClick={handlePlatformClick}
            style={{ fontSize: '14px', fontWeight: 'var(--fw-regular)', color: 'var(--text-3)' }}
            className="transition-colors duration-150 hover:text-[var(--text)] bg-none border-none cursor-pointer p-0"
          >
            Platform
          </button>

          {user ? (
            <div className="relative ml-2">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 transition-colors duration-150"
                style={{ fontSize: '14px', color: 'var(--text-3)' }}
              >
                <div className="w-7 h-7 rounded-full bg-[var(--orange)] flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-white" />
                </div>
                <span style={{ color: 'var(--text-2)' }}>
                  {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 overflow-hidden"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  >
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '11px', color: 'var(--text-4)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Signed in as</p>
                      <p className="truncate mt-0.5" style={{ fontSize: '13px', color: 'var(--text-2)' }}>{user.email}</p>
                    </div>
                    <Link
                      to="/waitlist-success"
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                      style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none' }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <RedPandaLogo size="sm" animate={false} />
                      Waitlist Status
                    </Link>
                    <Link
                      to="/platform"
                      className="flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                      style={{ fontSize: '13px', color: 'var(--text-3)', textDecoration: 'none' }}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Brain className="w-3.5 h-3.5" style={{ color: 'var(--orange)' }} />
                      Interview Platform
                    </Link>
                    <button
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="w-full text-left flex items-center gap-2.5 px-4 py-2.5 transition-colors hover:bg-white/[0.04]"
                      style={{ fontSize: '13px', color: '#f87171', borderTop: '1px solid var(--border)' }}
                    >
                      {isSigningOut ? (
                        <div className="w-3.5 h-3.5 border border-red-400/60 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      {isSigningOut ? 'Signing out…' : 'Sign out'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-ghost ml-2"
              >
                Log in
              </Link>
              <button
                onClick={() => handleNavClick('#waitlist')}
                className="btn-primary"
                style={{ fontSize: '13px', padding: '8px 18px' }}
              >
                Request access
              </button>
            </>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-1 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="md:hidden absolute top-full left-0 right-0"
            style={{
              background: 'var(--bg)',
              borderBottom: '1px solid var(--border)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <div className="flex flex-col py-4" style={{ padding: '16px var(--page-outer)' }}>
              <button
                onClick={() => handleNavClick('#features')}
                className="text-left py-3 transition-colors"
                style={{ fontSize: '14px', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}
              >
                Features
              </button>
              <button
                onClick={handlePlatformClick}
                className="text-left py-3 transition-colors"
                style={{ fontSize: '14px', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)' }}
              >
                Platform
              </button>
              {user ? (
                <>
                  <Link
                    to="/waitlist-success"
                    className="py-3 transition-colors"
                    style={{ fontSize: '14px', color: 'var(--text-3)', borderBottom: '1px solid var(--border-soft)', textDecoration: 'none' }}
                    onClick={() => setIsOpen(false)}
                  >
                    Waitlist Status
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setIsOpen(false); }}
                    disabled={isSigningOut}
                    className="text-left py-3 transition-colors"
                    style={{ fontSize: '14px', color: '#f87171' }}
                  >
                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="py-3 transition-colors"
                    style={{ fontSize: '14px', color: 'var(--text-3)', textDecoration: 'none', borderBottom: '1px solid var(--border-soft)' }}
                    onClick={() => setIsOpen(false)}
                  >
                    Log in
                  </Link>
                  <div className="pt-4">
                    <button
                      onClick={() => handleNavClick('#waitlist')}
                      className="btn-primary w-full justify-center"
                    >
                      Request access
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
