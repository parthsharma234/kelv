import React from 'react';
import HeroSection from './homepage/HeroSection';
import ProblemSection from './homepage/ProblemSection';
import ProductPreview from './homepage/ProductPreview';
import FeaturesSection from './homepage/FeaturesSection';
import HowItWorksSection from './homepage/HowItWorksSection';
import TransformationSection from './homepage/TransformationSection';
import SocialProofSection from './homepage/SocialProofSection';
import CTASection from './homepage/CTASection';

/**
 * Stripe-inspired homepage with storytelling narrative flow
 */
const ScrollNarrativeHomepage: React.FC = () => {
  return (
    <div className="relative">
      {/* Hero: The hook */}
      <HeroSection />

      {/* Problem: The pain point with laptop opening animation */}
      <ProblemSection />

      {/* Product Preview: Show what we actually do */}
      <ProductPreview />

      {/* Features: Deep dive into capabilities */}
      <FeaturesSection />

      {/* How It Works: The path to results */}
      <HowItWorksSection />

      {/* Transformation: Before/after proof */}
      <TransformationSection />

      {/* Social Proof: Credibility */}
      <SocialProofSection />

      {/* CTA: The ask */}
      <CTASection />
    </div>
  );
};

export default ScrollNarrativeHomepage;
