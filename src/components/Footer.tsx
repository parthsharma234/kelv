import React from 'react';
import { Zap, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-900 border-t border-dark-700 py-12 md:py-16">
      <div className="container">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center space-x-2 justify-center">
            <Zap className="w-8 h-8 text-orange-500" />
            <span className="text-xl font-bold">Sol AI</span>
          </div>
        </div>
        
        <div className="border-t border-dark-700 mt-8 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} Sol AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;