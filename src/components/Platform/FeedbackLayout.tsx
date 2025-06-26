import React from 'react';
import { motion } from 'framer-motion';

/**
 * FeedbackLayout is a reusable layout for interview results/feedback pages.
 *
 * Props:
 * - icon: ReactNode (icon for the header)
 * - title: string (main title)
 * - subtitle: string (subtitle/description)
 * - colorClass: string (Tailwind gradient color classes for header/icon)
 * - performanceCard: ReactNode (4-column grid for performance card)
 * - mainMetrics: ReactNode (main metrics section)
 * - sidebar: ReactNode (sidebar content)
 * - children: ReactNode (optional, for custom content)
 */
export interface FeedbackLayoutProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  colorClass: string;
  performanceCard: React.ReactNode;
  mainMetrics: React.ReactNode;
  sidebar: React.ReactNode;
  children?: React.ReactNode;
}

export const FeedbackLayout: React.FC<FeedbackLayoutProps> = ({
  icon,
  title,
  subtitle,
  colorClass,
  performanceCard,
  mainMetrics,
  sidebar,
  children,
}) => (
  <div className="min-h-screen bg-dark-900 pt-24 pb-16">
    <div className="container max-w-6xl mx-auto px-4">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-20 h-20 bg-gradient-to-br ${colorClass} rounded-full flex items-center justify-center mb-4`}>
            {icon}
          </div>
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-4">{title}</h1>
            <p className="text-gray-400 text-lg">{subtitle}</p>
          </div>
        </div>
      </motion.div>

      {/* Performance Card (4-column grid) */}
      {performanceCard}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content (2 columns) */}
        <div className="lg:col-span-2 space-y-8">
          {mainMetrics}
          {children}
        </div>
        {/* Sidebar (1 column) */}
        <div className="space-y-6">
          {sidebar}
        </div>
      </div>
    </div>
  </div>
); 