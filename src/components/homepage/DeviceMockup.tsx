import React from 'react';
import { motion } from 'framer-motion';

interface DeviceMockupProps {
    children: React.ReactNode;
    variant?: 'laptop' | 'window' | 'minimal';
    tilt?: number;
    className?: string;
    showChrome?: boolean;
    chromeDots?: boolean;
    animate?: boolean;
}

/**
 * Stripe-inspired device mockup component.
 * Wraps content in a stylized device frame with subtle shadows and optional 3D effects.
 */
const DeviceMockup: React.FC<DeviceMockupProps> = ({
    children,
    variant = 'window',
    tilt = 0,
    className = '',
    showChrome = true,
    chromeDots = true,
    animate = false,
}) => {
    const radiusClass = variant === 'laptop' ? 'rounded-[28px]' : 'rounded-2xl';
    const baseStyles = `
    relative overflow-hidden ${radiusClass}
    bg-[#0a0a0f] border border-white/10
    shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_50px_-10px_rgba(0,0,0,0.5),0_30px_60px_-15px_rgba(0,0,0,0.3)]
  `;

    const transformStyle = tilt !== 0 ? {
        transform: `perspective(1200px) rotateX(${tilt}deg)`,
        transformOrigin: 'center bottom',
    } : {};

    const content = (
        <div
            className={`${baseStyles} ${className}`}
            style={transformStyle}
        >
            {/* Browser Chrome */}
            {showChrome && (
                <div className="flex items-center gap-2 px-4 py-3 bg-[#151520] border-b border-white/5">
                    {chromeDots && (
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                        </div>
                    )}
                    {variant === 'laptop' && (
                        <div className="flex-1 mx-8">
                            <div className="bg-[#0a0a0f] rounded-lg px-4 py-1.5 text-xs text-gray-500 text-center border border-white/5">
                                kelvai.com
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Screen Content */}
            <div
                className={`relative ${variant === 'laptop' ? 'min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]' : ''}`}
            >
                {children}
            </div>

            {/* Bottom bar for laptop variant */}
            {variant === 'laptop' && (
                <div className="relative">
                    <div className="h-4 bg-gradient-to-b from-transparent to-[#0a0a0f]" />
                    <div className="relative h-6 bg-[#1a1a25] rounded-b-[24px] border-t border-white/5">
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-[#2b2b36]" />
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-2 rounded-full bg-[#111119]" />
                    </div>
                </div>
            )}
        </div>
    );

    if (animate) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                viewport={{ once: true, margin: "-100px" }}
            >
                {content}
            </motion.div>
        );
    }

    return content;
};

/**
 * 3D Laptop mockup with opening animation for scroll-triggered reveals.
 * Used for the rejection emails "laptop opening" effect.
 */
interface LaptopOpeningMockupProps {
    children: React.ReactNode;
    className?: string;
}

export const LaptopOpeningMockup: React.FC<LaptopOpeningMockupProps> = ({
    children,
    className = '',
}) => {
    return (
        <motion.div
            className={`relative ${className}`}
            initial={{
                opacity: 0,
                rotateX: -45,
                y: 60,
            }}
            whileInView={{
                opacity: 1,
                rotateX: 0,
                y: 0,
            }}
            transition={{
                duration: 1.2,
                ease: [0.16, 1, 0.3, 1],
            }}
            viewport={{ once: true, margin: "-50px" }}
            style={{
                perspective: '1200px',
                transformStyle: 'preserve-3d',
            }}
        >
            {/* Laptop screen */}
            <div
                className="relative rounded-t-2xl overflow-hidden bg-[#0a0a0f] border border-white/10 border-b-0"
                style={{
                    transformOrigin: 'center bottom',
                }}
            >
                {/* Screen bezel */}
                <div className="absolute inset-0 pointer-events-none border-4 border-[#1a1a25] rounded-t-2xl" />

                {/* Camera notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#2a2a35]">
                    <div className="absolute inset-0.5 rounded-full bg-[#1a1a1f]" />
                </div>

                {/* Content */}
                <div className="pt-6">
                    {children}
                </div>
            </div>

            {/* Laptop base/keyboard */}
            <div className="relative">
                <div className="h-4 bg-gradient-to-b from-[#1a1a25] to-[#25252f] rounded-b-xl border-x border-b border-white/5" />
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-16 h-1 rounded-full bg-[#35353f]" />
            </div>

            {/* Shadow/reflection */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-gradient-to-b from-black/30 to-transparent blur-xl rounded-full" />
        </motion.div>
    );
};

export default DeviceMockup;
