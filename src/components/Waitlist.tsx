import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';

const Waitlist: React.FC = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // In a real implementation, you would submit to a backend
    console.log('Submitting email:', email);
    setSubmitted(true);
    setError('');
  };
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('opacity-100');
            entry.target.classList.remove('opacity-0', 'translate-y-10');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);
  
  return (
    <section id="waitlist" className="section relative">
      <div className="container">
        <div 
          ref={sectionRef}
          className="max-w-3xl mx-auto bg-dark-800 rounded-2xl p-8 md:p-12 border border-dark-700 relative overflow-hidden opacity-0 translate-y-10 transition-all duration-700"
        >
          {/* Background decoration */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-dark-800/95 to-dark-800/80"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Be the First to <span className="gradient-text">Experience Sol AI</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                Join our exclusive waitlist to get early access and special offers when we launch.
              </p>
            </div>
            
            {!submitted ? (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={`flex-1 px-4 py-3 bg-dark-700 border ${
                      error ? 'border-red-500' : 'border-dark-600'
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/50`}
                  />
                  <button
                    type="submit"
                    className="btn btn-primary whitespace-nowrap"
                  >
                    Join Waitlist
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                </div>
                
                {error && (
                  <p className="mt-2 text-red-500 text-sm">{error}</p>
                )}
                
                <p className="mt-4 text-sm text-gray-500 text-center">
                  We respect your privacy. Unsubscribe at any time.
                </p>
              </form>
            ) : (
              <div className="text-center py-6 max-w-md mx-auto">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">You're on the List!</h3>
                <p className="text-gray-400">
                  Thank you for joining our waitlist. We'll notify you when Sol  AI launches.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Waitlist;