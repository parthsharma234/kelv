import React, { useEffect, useRef } from 'react';
import { 
  Brain, 
  LineChart, 
  MessageSquareText, 
  FileSpreadsheet, 
  Lightbulb, 
  Sparkles 
} from 'lucide-react';

type FeatureProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
};

const Feature: React.FC<FeatureProps> = ({ icon, title, description, delay }) => {
  const featureRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              if (featureRef.current) {
                featureRef.current.classList.add('opacity-100');
                featureRef.current.classList.remove('opacity-0', 'translate-y-10');
              }
            }, delay);
          }
        });
      },
      { threshold: 0.1 }
    );
    
    if (featureRef.current) {
      observer.observe(featureRef.current);
    }
    
    return () => {
      if (featureRef.current) {
        observer.unobserve(featureRef.current);
      }
    };
  }, [delay]);
  
  return (
    <div 
      ref={featureRef}
      className="card opacity-0 translate-y-10 transition-all duration-700"
    >
      <div className="w-12 h-12 rounded-full bg-dark-700 flex items-center justify-center mb-4">
        <div className="text-orange-500">
          {icon}
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
};

const Features: React.FC = () => {
  const titleRef = useRef<HTMLDivElement>(null);
  
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
    
    if (titleRef.current) {
      observer.observe(titleRef.current);
    }
    
    return () => {
      if (titleRef.current) {
        observer.unobserve(titleRef.current);
      }
    };
  }, []);
  
  return (
    <section id="features" className="section bg-dark-800/50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-dark-900 to-transparent"></div>
      <div className="container relative z-10">
        <div 
          ref={titleRef}
          className="text-center max-w-2xl mx-auto mb-16 opacity-0 translate-y-10 transition-all duration-700"
        >
          <h2 className="mb-4">
            <span className="gradient-text">Advanced Features</span> to Elevate <br />
            Your Interview Skills
          </h2>
          <p className="text-gray-400 text-lg">
            Our AI-powered platform provides comprehensive tools to help you prepare,
            practice, and perfect your interview skills.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Feature 
            icon={<Brain className="w-6 h-6" />}
            title="AI Performance Analysis"
            description="Our AI evaluates your responses, body language, and communication style to provide detailed insights."
            delay={0}
          />
          <Feature 
            icon={<MessageSquareText className="w-6 h-6" />}
            title="Interview Simulations"
            description="Practice with realistic interview scenarios tailored to your target industry and position."
            delay={100}
          />
          <Feature 
            icon={<LineChart className="w-6 h-6" />}
            title="Progress Tracking"
            description="Monitor your improvement over time with detailed analytics and performance metrics."
            delay={200}
          />
          <Feature 
            icon={<FileSpreadsheet className="w-6 h-6" />}
            title="Custom Question Bank"
            description="Access thousands of real interview questions from top companies across various industries."
            delay={300}
          />
          <Feature 
            icon={<Lightbulb className="w-6 h-6" />}
            title="Personalized Coaching"
            description="Receive tailored feedback and specific suggestions to improve your weaknesses."
            delay={400}
          />
          <Feature 
            icon={<Sparkles className="w-6 h-6" />}
            title="Communication Enhancement"
            description="Fine-tune your verbal and non-verbal communication skills with expert guidance."
            delay={500}
          />
        </div>
      </div>
    </section>
  );
};

export default Features;