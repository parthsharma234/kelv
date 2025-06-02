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
      <div className="container relative z-10">
        <div 
          ref={sectionRef}
          className="max-w-2xl mx-auto bg-dark-800/80 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-dark-700 relative overflow-hidden opacity-0 translate-y-10 transition-all duration-700"
        >
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Be the First to <span className="gradient-text">Experience Sol AI</span>
              </h2>
              <p className="mt-6 text-gray-300 text-lg max-w-xl mx-auto">
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