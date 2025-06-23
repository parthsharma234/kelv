import React from 'react';

// University Logo Component using Clearbit Logo API
export const UniversityLogo: React.FC<{ 
  domain: string; 
  alt: string; 
  className?: string;
  style?: React.CSSProperties;
}> = ({ domain, alt, className = "w-6 h-6", style }) => (
  <img 
    src={`https://logo.clearbit.com/${domain}`}
    alt={alt}
    className={`${className} object-contain`}
    style={{ 
      ...style, 
      background: 'transparent',
      backgroundColor: 'transparent',
      border: 'none',
      boxShadow: 'none'
    }}
    onError={(e) => {
      // Fallback to a simple colored circle with university initial if logo fails
      const target = e.target as HTMLImageElement;
      target.style.display = 'none';
    }}
  />
);

// Prestigious Universities with their domains
export const prestigiousUniversities = [
  { domain: 'harvard.edu', name: 'Harvard University' },
  { domain: 'yale.edu', name: 'Yale University' },
  { domain: 'princeton.edu', name: 'Princeton University' },
  { domain: 'stanford.edu', name: 'Stanford University' },
  { domain: 'mit.edu', name: 'MIT' },
  { domain: 'columbia.edu', name: 'Columbia University' },
  { domain: 'upenn.edu', name: 'University of Pennsylvania' },
  { domain: 'dartmouth.edu', name: 'Dartmouth College' },
  { domain: 'brown.edu', name: 'Brown University' },
  { domain: 'cornell.edu', name: 'Cornell University' },
  { domain: 'uchicago.edu', name: 'University of Chicago' },
  { domain: 'northwestern.edu', name: 'Northwestern University' },
  { domain: 'duke.edu', name: 'Duke University' },
  { domain: 'georgetown.edu', name: 'Georgetown University' },
  { domain: 'vanderbilt.edu', name: 'Vanderbilt University' },
  { domain: 'rice.edu', name: 'Rice University' },
  { domain: 'berkeley.edu', name: 'UC Berkeley' },
  { domain: 'caltech.edu', name: 'Caltech' },
  { domain: 'carnegiemellon.edu', name: 'Carnegie Mellon' },
  { domain: 'jhu.edu', name: 'Johns Hopkins' }
];
