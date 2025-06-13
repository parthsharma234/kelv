import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import RedPandaLogo from './RedPandaLogo';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
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
    await signOut();
    setShowUserMenu(false);
    navigate('/');
  };

  const handlePlatformClick = () => {
    if (user) {
      navigate('/platform');
    } else {
      navigate('/login');
    }
    setIsOpen(false);
  };
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark-900/95 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <RedPandaLogo size="md" animate={true} />
            <span className="text-2xl font-bold gradient-text">Kelv AI</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-orange-400 transition-colors duration-300">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-orange-400 transition-colors duration-300">How It Works</a>
            <button
              onClick={handlePlatformClick}
              className="flex items-center gap-2 text-gray-300 hover:text-orange-400 transition-colors duration-300 font-medium"
            >
              <Brain className="w-4 h-4" />
              Platform
            </button>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-dark-700 transition-colors bg-dark-800 border border-dark-700"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium">{user.user_metadata?.full_name || user.email}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-dark-800 border border-dark-700 rounded-xl shadow-xl overflow-hidden">
                    <div className="p-4 border-b border-dark-700">
                      <p className="text-sm text-gray-400">Signed in as</p>
                      <p className="font-medium truncate">{user.email}</p>
                    </div>
                    <Link
                      to="/waitlist-success"
                      className="block px-4 py-3 text-sm hover:bg-dark-700 transition-colors flex items-center gap-3"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <RedPandaLogo size="sm" animate={false} />
                      Waitlist Status
                    </Link>
                    <Link
                      to="/platform"
                      className="block px-4 py-3 text-sm hover:bg-dark-700 transition-colors flex items-center gap-3"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Brain className="w-4 h-4 text-orange-400" />
                      Interview Platform
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-dark-700 transition-colors flex items-center gap-3 text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-orange-400 transition-colors duration-300 font-medium"
                >
                  Sign In
                </Link>
                <a href="#waitlist" className="btn btn-primary">Join Waitlist</a>
              </>
            )}
          </div>
          
          {/* Mobile Navigation Toggle */}
          <button 
            className="md:hidden text-gray-300 hover:text-orange-400"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
        
        {/* Mobile Navigation Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-dark-800 border-t border-dark-700 animate-slide-down">
            <div className="container py-4 flex flex-col space-y-4">
              <a 
                href="#features" 
                className="text-gray-300 hover:text-orange-400 transition-colors py-2 duration-300"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-gray-300 hover:text-orange-400 transition-colors py-2 duration-300"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </a>
              <button
                onClick={handlePlatformClick}
                className="text-left text-gray-300 hover:text-orange-400 transition-colors py-2 duration-300 flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                Platform
              </button>
              
              {user ? (
                <>
                  <Link
                    to="/waitlist-success"
                    className="text-gray-300 hover:text-orange-400 transition-colors py-2 duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Waitlist Status
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="text-left text-gray-300 hover:text-orange-400 transition-colors py-2 duration-300"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-left text-gray-300 hover:text-orange-400 transition-colors py-2 duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    Sign In
                  </Link>
                  <a 
                    href="#waitlist" 
                    className="btn btn-primary w-full"
                    onClick={() => setIsOpen(false)}
                  >
                    Join Waitlist
                  </a>
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