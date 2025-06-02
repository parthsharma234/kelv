import React, { useEffect, useRef } from 'react';
import { Brain, MessageSquare, LineChart, ArrowRight } from 'lucide-react';

const steps = [
  {
    number: "01",
    title: "Create Your Profile",
    description: "Tell us about your target roles, industries, and experience level so we can personalize your preparation journey.",
    icon: Brain,
    color: "from-orange-500/20 to-orange-400/5"
  },
  {
    number: "02",
    title: "Practice Interviews",
    description: "Engage in realistic AI-powered mock interviews tailored to your specific job targets and experience level.",
    icon: MessageSquare,
    color: "from-orange-400/20 to-orange-300/5"
  },
  {
    number: "03",
    title: "Track Progress",
    description: "Monitor your improvement over time and focus on areas that need additional attention for continuous growth.",
    icon: LineChart,
    color: "from-orange-300/20 to-orange-200/5"
  }
];

const HowItWorks: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsRefs = useRef<(HTMLDivElement | null)[]>([]);
  
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
    
    stepsRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
      
      stepsRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);
  
  return (
    <section id="how-it-works" className="section relative overflow-hidden">
      <div className="container">
        <div 
          ref={sectionRef}
          className="text-center max-w-2xl mx-auto mb-16 opacity-0 translate-y-10 transition-all duration-700"
        >
          <h2 className="mb-4">
            <span className="gradient-text">How Sol Interview</span> Works
          </h2>
          <p className="text-gray-400 text-lg">
            Our streamlined process helps you prepare effectively and track your improvement
            for interview success.
          </p>
        </div>
        
        <div className="space-y-24 md:space-y-32 max-w-5xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={step.number}
                ref={el => stepsRefs.current[index] = el}
                className={`flex flex-col ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-8 items-center opacity-0 translate-y-10 transition-all duration-700`}
              >
                <div className="flex-1 relative group">
                  <div className="relative overflow-hidden rounded-xl aspect-video bg-dark-800 p-8 border border-dark-700">
                    <div className="absolute inset-0 bg-gradient-to-br opacity-30 transition-opacity duration-700 group-hover:opacity-50" style={{ backgroundImage: `linear-gradient(to bottom right, ${step.color})` }}></div>
                    
                    <div className="relative h-full flex items-center justify-center">
                      <div className="transform transition-all duration-700 group-hover:scale-110 group-hover:rotate-3">
                        <Icon className="w-24 h-24 text-orange-500/80" />
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-dark-800 to-transparent"></div>
                  </div>
                  
                  <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/5 via-orange-400/5 to-transparent rounded-xl blur-xl opacity-0 transition-opacity duration-700 group-hover:opacity-100"></div>
                </div>
                
                <div className="flex-1">
                  <div className="text-orange-500 font-bold text-lg mb-2 flex items-center">
                    {step.number}
                    <ArrowRight className="w-4 h-4 ml-2 animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-gray-400 mb-6">{step.description}</p>
                  
                  <div className="h-1 w-20 bg-gradient-to-r from-orange-500 to-orange-400/20 rounded-full"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl -z-10"></div>
    </section>
  );
};

export default HowItWorks;