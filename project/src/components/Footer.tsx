import React from 'react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-900 border-t border-dark-700 py-12 md:py-16">
      <div className="container">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center space-x-3 justify-center">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 relative overflow-hidden">
                {/* Neural network pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-1 left-1 w-1 h-1 bg-white rounded-full"></div>
                  <div className="absolute top-3 right-2 w-0.5 h-0.5 bg-white rounded-full"></div>
                  <div className="absolute bottom-2 left-2 w-0.5 h-0.5 bg-white rounded-full"></div>
                  <div className="absolute bottom-1 right-1 w-1 h-1 bg-white rounded-full"></div>
                  {/* Connection lines */}
                  <div className="absolute top-1.5 left-1.5 w-6 h-0.5 bg-white/30 rotate-45 origin-left"></div>
                  <div className="absolute top-3.5 left-3 w-4 h-0.5 bg-white/30 -rotate-45 origin-left"></div>
                </div>
                {/* Central AI symbol */}
                <div className="relative z-10 w-5 h-5 border-2 border-white rounded-lg flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-300 rounded-full animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold gradient-text">Kelv AI</span>
          </div>
        </div>
        
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} Kelv AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;