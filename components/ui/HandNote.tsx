import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../../lib/utils';
import { istOffsetPhrase } from '../../lib/time';

// Pen-stroke curve: slow start, quick middle, slow finish
const DRAW = [0.65, 0, 0.35, 1] as const;


/**
 * A handwritten margin note with the live local time in India; only the time
 * itself gets the squiggle underline.
 *
 * Easter egg: tap it and the note flips to how far ahead of you India is.
 */
export const HandNote = ({ delay = 1.2 }: { delay?: number }) => {
    const reduce = useReducedMotion();
    const [time, setTime] = useState('');
    const [flipped, setFlipped] = useState(false);

    useEffect(() => {
        const update = () => setTime(
            new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
        );
        update();
        const t = setInterval(update, 15_000);
        return () => clearInterval(t);
    }, []);

    // After the first entrance, redraws (flipping back) start right away
    const introDone = useRef(false);
    useEffect(() => {
        const t = setTimeout(() => { introDone.current = true; }, (delay + 1.5) * 1000);
        return () => clearTimeout(t);
    }, [delay]);

    // Flip back on its own, like a note you glance at
    useEffect(() => {
        if (!flipped) return;
        const t = setTimeout(() => setFlipped(false), 3200);
        return () => clearTimeout(t);
    }, [flipped]);

    if (!time) return null;

    const draw = (d: number, duration: number) =>
        reduce ? { duration: 0 } : { duration, delay: delay + d, ease: DRAW };
    const swap = reduce
        ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
        : {
            initial: { opacity: 0, y: 6, filter: 'blur(3px)' },
            animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
            exit: { opacity: 0, y: -6, filter: 'blur(3px)' },
        };

    return (
        <motion.button
            type="button"
            onClick={() => { triggerHaptic(6); setFlipped((f) => !f); }}
            aria-label={`It's ${time} in India right now. Tap to compare with your time.`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileTap={{ scale: 0.97 }}
            transition={reduce ? { duration: 0 } : { duration: 0.5, delay, ease: 'easeOut' }}
            className="relative inline-flex items-baseline -rotate-2 origin-left font-handwriting text-[21px] leading-none text-[#a1a1a1] select-none cursor-pointer"
        >
            <AnimatePresence mode="popLayout" initial={false}>
                {flipped ? (
                    <motion.span key="offset" {...swap} transition={{ type: 'spring', duration: 0.35, bounce: 0 }} className="text-[#a1a1a1]">
                        {istOffsetPhrase()}
                    </motion.span>
                ) : (
                    <motion.span key="time" {...swap} transition={{ type: 'spring', duration: 0.35, bounce: 0 }} className="inline-flex items-baseline gap-1.5">
                        <span className="relative text-[#a1a1a1]">
                            {time}
                            <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute left-0 -bottom-[7px] w-full h-[7px] text-[#a1a1a1] overflow-visible" fill="none">
                                <motion.path
                                    d="M1 6 C 20 2, 35 9, 52 5 S 82 2, 99 6"
                                    stroke="currentColor"
                                    strokeWidth={1.3}
                                    strokeLinecap="round"
                                    vectorEffect="non-scaling-stroke"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={introDone.current ? (reduce ? { duration: 0 } : { duration: 0.45, delay: 0.1, ease: DRAW }) : draw(0.9, 0.5)}
                                />
                            </svg>
                        </span>
                        <span>in India</span>
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
