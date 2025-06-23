import React from 'react';
import { Mail, Instagram } from 'lucide-react';
import RedPandaLogo from './RedPandaLogo';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-900 border-t border-dark-700 py-12 md:py-16">
      <div className="container">          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center space-x-3 justify-center">
              <RedPandaLogo size="md" animate={true} />
              <span className="text-2xl font-bold gradient-text">Kelv AI</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400" />
                <span>Contact us:</span>
                <a 
                  href="mailto:team@kelvai.com" 
                  className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  team@kelvai.com
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <Instagram className="w-4 h-4 text-orange-400" />
                <span>Follow us:</span>
                <a 
                  href="https://instagram.com/kelv.ai" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                >
                  @kelv.ai
                </a>
              </div>
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