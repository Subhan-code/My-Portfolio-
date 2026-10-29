import React, { useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { triggerHaptic } from '../../lib/utils';

/**
 * Easter egg: tap or click the name three times quickly and the letters do a wave.
 * The text is only split into letters while it waves, so kerning stays intact otherwise.
 */
export const NameWave = ({ children }: { children: string }) => {
    const reduce = useReducedMotion();
    const [wave, setWave] = useState(0);
    const taps = useRef<number[]>([]);

    const onClick = () => {
        const now = Date.now();
        taps.current = [...taps.current.filter((t) => now - t < 650), now];
        if (taps.current.length >= 3 && !reduce) {
            taps.current = [];
            triggerHaptic([5, 25, 5, 25, 5]);
            setWave((w) => w + 1);
        }
    };

    return (
        <span
            onClick={onClick}
            // A triple-click would otherwise select the whole heading
            onMouseDown={(e) => { if (e.detail > 1) e.preventDefault(); }}
            className="cursor-default"
        >
            {wave === 0 ? children : (
                <span key={wave} aria-label={children}>
                    {children.split('').map((ch, i) => (
                        <motion.span
                            key={i}
                            aria-hidden
                            className="inline-block whitespace-pre"
                            initial={{ y: 0 }}
                            animate={{ y: [0, -9, 0], rotate: [0, -4, 0] }}
                            transition={{ duration: 0.55, delay: i * 0.035, ease: [0.34, 1.56, 0.64, 1] }}
                            onAnimationComplete={i === children.length - 1 ? () => setWave(0) : undefined}
                        >
                            {ch}
                        </motion.span>
                    ))}
                </span>
            )}
        </span>
    );
};
