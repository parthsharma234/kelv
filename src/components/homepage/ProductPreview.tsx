import React from 'react';
import { motion } from 'framer-motion';
import DeviceMockup from './DeviceMockup';
import MockupInterview from './MockupInterview';

const ProductPreview: React.FC = () => {
  return (
    <section className="relative overflow-hidden py-24 lg:py-28" style={{ background: 'var(--bg)' }}>
      <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-orange-500/[0.03] blur-[120px]" />

      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="mb-12 grid gap-8 lg:mb-14 lg:grid-cols-[0.9fr,1.1fr] lg:items-end"
        >
          <div>
            <span className="mb-4 inline-block text-xs uppercase tracking-[0.3em] text-orange-400">
              Live in action
            </span>
            <h2 className="mb-5 text-4xl font-semibold text-white lg:text-5xl">
              One screen.
              <br />
              All the pressure points.
            </h2>
          </div>
          <p className="max-w-2xl text-lg text-gray-400 lg:justify-self-end lg:text-xl">
            Kelv keeps the interview grounded in reality, then surfaces the signal you usually miss until the rejection email arrives.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-100px' }}
          className="relative mx-auto max-w-4xl xl:max-w-5xl"
        >
          <div className="absolute inset-0 scale-110 bg-gradient-to-r from-orange-500/10 via-transparent to-blue-500/10 blur-3xl" />

          <DeviceMockup variant="laptop" showChrome>
            <MockupInterview />
          </DeviceMockup>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            viewport={{ once: true }}
            className="absolute top-[62%] z-10 max-w-[200px] p-4 -left-2 shadow-2xl lg:-left-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500" />
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Live transcript</p>
            </div>
            <p className="text-sm font-medium text-white">See the exact line that helped or hurt the answer</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            viewport={{ once: true }}
            className="absolute top-[12%] z-10 max-w-[200px] p-4 -right-2 shadow-2xl lg:-right-10" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <p className="text-[10px] uppercase tracking-wider text-gray-500">Delivery signal</p>
            </div>
            <p className="text-sm font-medium text-white">
              Tracks pacing, hesitation, and filler load while the interview is still happening
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ProductPreview;
