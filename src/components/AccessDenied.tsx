import React from 'react';
import { Link } from 'react-router-dom';
import { Lock, Mail, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const AccessDenied: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-dark-900 text-white flex items-center justify-center p-4"
    >
      <div className="bg-dark-800/80 backdrop-blur-sm rounded-xl border border-dark-700 shadow-xl p-8 md:p-12 text-center max-w-lg w-full transform transition-all duration-300 hover:shadow-2xl hover:shadow-orange-500/30">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
          className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-orange-500/30"
        >
          <Lock className="w-12 h-12 text-white" />
        </motion.div>

        <h1 className="text-4xl font-bold gradient-text mb-4">
          Access Restricted
        </h1>

        <p className="text-gray-300 text-lg mb-8 leading-relaxed">
          Unfortunately, your account does not currently have access to the full platform. We're working hard to onboard users!
        </p>
        <p className="text-gray-400 text-sm mb-8 leading-relaxed italic">
          If you are a beta user and believe this is an error, please try logging out and logging back in.
        </p>

        <div className="space-y-4">
          <Link
            to="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-300 shadow-md shadow-orange-500/20"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Back Home
          </Link>
          <a
            href="mailto:team@kelvai.com"
            className="w-full inline-flex items-center justify-center px-6 py-3 border border-dark-600 text-base font-medium rounded-md text-gray-300 bg-dark-700 hover:bg-dark-600 transition-colors duration-300"
          >
            <Mail className="w-5 h-5 mr-2" />
            Contact Support
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default AccessDenied; 