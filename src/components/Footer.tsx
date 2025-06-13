import React from 'react';
import RedPandaLogo from './RedPandaLogo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-900 border-t border-dark-700 py-12 md:py-16">
      <div className="container">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center space-x-3 justify-center">
            <RedPandaLogo size="md" animate={true} />
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