import React from 'react';
import HeroSection from './homepage/HeroSection';
import ProblemSection from './homepage/ProblemSection';
import FeaturesSection from './homepage/FeaturesSection';
import HowItWorksSection from './homepage/HowItWorksSection';
import TransformationSection from './homepage/TransformationSection';
import CTASection from './homepage/CTASection';

// ============================================
// MAIN COMPONENT
// ============================================
const ScrollNarrativeHomepage: React.FC = () => {
  return (
    <div className="relative bg-dark-900">
      {/* Sections - Stripe-inspired Clean Design */}
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TransformationSection />
      <CTASection />
    </div>
  );
};

export default ScrollNarrativeHomepage;
