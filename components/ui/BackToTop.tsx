import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'framer-motion';
import { cn, triggerHaptic } from '../../lib/utils';

/**
 * Back to top: appears after the first screen, the ring around it fills with
 * scroll progress, and the arrow lifts on hover. `raised` clears the search pill.
 */
export const BackToTop = ({ raised = false }: { raised?: boolean }) => {
    const [visible, setVisible] = useState(false);
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    type="button"
                    aria-label="Back to top"
                    onClick={() => { triggerHaptic(10); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    initial={{ opacity: 0, scale: 0.8, y: 8, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.85, y: 8, filter: 'blur(4px)', transition: { duration: 0.15 } }}
                    transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
                    whileTap={{ scale: 0.92 }}
                    style={{ bottom: `calc(${raised ? '5rem' : '1.25rem'} + env(safe-area-inset-bottom, 0px))` }}
                    className={cn(
                        "group fixed right-5 z-40 w-11 h-11 rounded-full flex items-center justify-center",
                        "bg-[#171717]/90 backdrop-blur-md ring-1 ring-inset ring-white/[0.08] text-[#a1a1a1] hover:text-white shadow-[0_8px_24px_rgba(0,0,0,0.4)] transition-colors"
                    )}
                >
                    {/* Progress ring */}
                    <svg viewBox="0 0 44 44" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden>
                        <circle cx="22" cy="22" r="20.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                        <motion.circle cx="22" cy="22" r="20.5" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" style={{ pathLength: progress }} />
                    </svg>
                    <svg
                        viewBox="0 0 16 16"
                        aria-hidden
                        className="relative w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.75}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        {/* The ">" chevron, pointing up */}
                        <path d="M3.5 10 8 5.5l4.5 4.5" />
                    </svg>
                </motion.button>
            )}
        </AnimatePresence>
    );
};
