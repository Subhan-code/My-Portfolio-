import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, triggerHaptic } from '../../lib/utils';

/** Footer heart that pops when tapped: a spring squash, then six specks burst out and fade. */
export const LoveHeart = () => {
    const [pops, setPops] = useState(0);
    const [loved, setLoved] = useState(false);

    const pop = () => {
        triggerHaptic([6, 30, 10]);
        setLoved(true);
        setPops((p) => p + 1);
    };

    return (
        <button
            type="button"
            onClick={pop}
            aria-label={loved ? 'Thanks for the love' : 'Send some love'}
            className="relative inline-flex w-6 h-6 -m-1.5 items-center justify-center rounded-full"
        >
            <motion.svg
                key={pops}
                viewBox="0 0 24 24"
                aria-hidden
                initial={pops ? { scale: 0.6 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.45, bounce: 0.55 }}
                className={cn("w-3 h-3 transition-[fill] duration-200", loved ? "fill-white" : "fill-white/50 [@media(hover:hover)_and_(pointer:fine)]:hover:fill-white/80")}
            >
                <path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.5 2.9 4.5 6.6 4.5c2.1 0 3.6 1.1 4.4 2.4h2c.8-1.3 2.3-2.4 4.4-2.4 3.7 0 5.7 4 4.2 7.3C19.5 16.4 12 21 12 21Z" />
            </motion.svg>
            <AnimatePresence>
                {pops > 0 && Array.from({ length: 6 }).map((_, i) => {
                    const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
                    return (
                        <motion.span
                            key={`${pops}-${i}`}
                            aria-hidden
                            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                            animate={{ x: Math.cos(a) * 13, y: Math.sin(a) * 13, opacity: 0, scale: 0.4 }}
                            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            className="pointer-events-none absolute w-1 h-1 rounded-full bg-white"
                        />
                    );
                })}
            </AnimatePresence>
        </button>
    );
};
