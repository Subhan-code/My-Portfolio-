import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from './Toast';
import { triggerHaptic } from '../../lib/utils';

/**
 * Easter egg for designers: press G to toggle the layout grid, like in a design tool.
 * The same grid the intro plate draws: an 8-column layout on the content column,
 * with a 24px baseline behind it.
 */
export const GridToggle = () => {
    const [on, setOn] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
            const t = e.target as HTMLElement;
            if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
            toast(on ? 'Grid hidden' : 'Layout grid · press G to hide');
            triggerHaptic(6);
            setOn(!on);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [on]);

    return (
        <AnimatePresence>
            {on && (
                <motion.div
                    aria-hidden
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                    className="pointer-events-none fixed inset-0 z-[90]"
                >
                    {/* Baseline grid */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: 'linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
                            backgroundSize: '100% 24px',
                        }}
                    />
                    {/* 8 columns across the 680px content column, drawn in one after another */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-full max-w-[680px] px-5 sm:px-6 grid grid-cols-8 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <motion.span
                                key={i}
                                initial={{ scaleY: 0 }}
                                animate={{ scaleY: 1 }}
                                transition={{ duration: 0.5, delay: i * 0.03, ease: [0.65, 0, 0.35, 1] }}
                                className="origin-top bg-white/[0.035] border-x border-white/[0.07]"
                            />
                        ))}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
