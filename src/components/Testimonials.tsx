import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Software Engineer",
    company: "Hired at Google",
    quote: "Sol Interview was a game-changer in my job search. The AI feedback helped me identify weaknesses in my responses that I never noticed before. After just two weeks of practice, I felt so much more confident in my actual interviews.",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: 2,
    name: "Sarah Chen",
    role: "Product Manager",
    company: "Hired at Microsoft",
    quote: "The personalized feedback on my communication style was invaluable. Sol Interview helped me organize my thoughts better and present my experiences in a more compelling way. I credit this platform for helping me land my dream role.",
    avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: 3,
    name: "Michael Rodriguez",
    role: "UX Designer",
    company: "Hired at Adobe",
    quote: "As someone who gets nervous during interviews, Sol Interview was the perfect way to practice in a low-pressure environment. The AI picked up on my nervous habits and helped me work through them. My confidence improved tremendously.",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=300"
  },
  {
    id: 4,
    name: "Priya Patel",
    role: "Marketing Specialist",
    company: "Hired at Shopify",
    quote: "The industry-specific questions and scenarios were spot on. I was asked almost identical questions in my actual interviews! The progress tracking helped me focus on improving my weakest areas, which made all the difference.",
    avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=300"
  }
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  
  const nextTestimonial = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };
  
  const prevTestimonial = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };
  
  useEffect(() => {
    const interval = setInterval(nextTestimonial, 8000);
    return () => clearInterval(interval);
  }, []);
  
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
    <section id="testimonials" className="section bg-dark-800/50 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-900/50 to-transparent"></div>
      <div className="container relative z-10">
        <div 
          ref={sectionRef}
          className="text-center max-w-2xl mx-auto mb-16 opacity-0 translate-y-10 transition-all duration-700"
        >
          <h2 className="mb-4">
            <span className="gradient-text">Success Stories</span> From Our Users
          </h2>
          <p className="text-gray-400 text-lg">
            Hear from professionals who transformed their interview skills and landed their dream jobs.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto relative">
          {/* Testimonial carousel */}
          <div className="overflow-hidden relative py-8">
            <div 
              className="transition-transform duration-700 ease-out flex"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-dark-700 rounded-2xl p-8 border border-dark-600 relative">
                    <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                        <img 
                          src={testimonial.avatar} 
                          alt={testimonial.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div>
                        <div className="flex items-center mb-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                          ))}
                        </div>
                        <h4 className="text-lg font-semibold">{testimonial.name}</h4>
                        <p className="text-sm text-gray-400">{testimonial.role} • {testimonial.company}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <p className="text-gray-300 italic">"{testimonial.quote}"</p>
                    </div>
                    
                    {/* Decorative quotes */}
                    <div className="absolute top-6 right-8 text-6xl text-orange-500/10 font-serif">
                      "
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Carousel controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button 
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full border border-dark-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i === activeIndex ? 'bg-orange-500' : 'bg-dark-600 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            
            <button 
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full border border-dark-600 flex items-center justify-center text-gray-400 hover:text-white hover:border-orange-500 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;