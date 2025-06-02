import React from 'react';
import { Zap, Twitter, Linkedin, Instagram } from 'lucide-react';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-dark-900 border-t border-dark-700 py-12 md:py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="w-8 h-8 text-orange-500" />
              <span className="text-xl font-bold">Sol AI</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Advanced AI-powered interview preparation platform that helps you land your dream job with confidence.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-dark-800 flex items-center justify-center text-gray-400 hover:text-orange-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">About</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Careers</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Blog</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Press</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-3">
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Help Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Privacy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">Terms</a></li>
              <li><a href="#waitlist" className="text-gray-400 hover:text-orange-400 transition-colors">Join Waitlist</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-dark-700 mt-12 pt-8 text-center text-gray-500 text-sm">
          <p>&copy; {currentYear} Sol AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;