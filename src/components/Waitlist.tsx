import React, { useRef, useEffect } from 'react';
import WaitlistForm from '../../app/components/WaitlistForm';

const Waitlist: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  
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
    <section id="waitlist" className="section relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 via-dark-800/50 to-dark-900"></div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] blur-3xl bg-gradient-to-br from-orange-500/10 via-orange-400/5 to-transparent rounded-full"></div>
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10">
        <div 
          ref={sectionRef}
          className="max-w-3xl mx-auto bg-dark-800/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-dark-700 relative overflow-hidden opacity-0 translate-y-10 transition-all duration-700"
        >
          {/* Card background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-dark-800/95 to-dark-800/80"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-orange-500/5 via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Be the First to <span className="gradient-text">Experience Sol AI</span>
              </h2>
              <p className="text-gray-300 text-lg max-w-xl mx-auto">
                Join our exclusive waitlist to get early access and special offers when we launch.
              </p>
            </div>
            
            <WaitlistForm />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Waitlist;