import React, { useState, useEffect } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
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
  
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-dark-900/95 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'
      }`}
    >
      <div className="container">
        <nav className="flex items-center justify-between">
          <a href="/" className="flex items-center space-x-2">
            <Zap className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold">Sol AI</span>
          </a>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-300 hover:text-orange-400 transition-colors">Features</a>
            <a href="#how-it-works" className="text-gray-300 hover:text-orange-400 transition-colors">How It Works</a>
            <a href="#testimonials" className="text-gray-300 hover:text-orange-400 transition-colors">Success Stories</a>
            <a href="#waitlist" className="btn btn-primary">Join Waitlist</a>
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
                className="text-gray-300 hover:text-orange-400 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                className="text-gray-300 hover:text-orange-400 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                How It Works
              </a>
              <a 
                href="#testimonials" 
                className="text-gray-300 hover:text-orange-400 transition-colors py-2"
                onClick={() => setIsOpen(false)}
              >
                Success Stories
              </a>
              <a 
                href="#waitlist" 
                className="btn btn-primary w-full"
                onClick={() => setIsOpen(false)}
              >
                Join Waitlist
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;