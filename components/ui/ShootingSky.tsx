import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

type Star = { id: number; left: number; top: number; tail: number };

/**
 * A quiet night sky: every few seconds a single streak crosses the upper part
 * of the page. Decorative only — hidden from assistive tech, off for reduced motion.
 */
export const ShootingSky = () => {
    const reduce = useReducedMotion();
    const [stars, setStars] = useState<Star[]>([]);

    useEffect(() => {
        if (reduce) return;
        let id = 0;
        let timer: ReturnType<typeof setTimeout>;
        const spawn = () => {
            const star: Star = {
                id: id++,
                left: window.innerWidth * (0.25 + Math.random() * 0.7),
                top: window.innerHeight * Math.random() * 0.35,
                tail: 50 + Math.random() * 40,
            };
            setStars((s) => [...s.slice(-2), star]);
            // Remove once its streak has finished
            setTimeout(() => setStars((s) => s.filter((x) => x.id !== star.id)), 1400);
            timer = setTimeout(spawn, 2600 + Math.random() * 3200);
        };
        timer = setTimeout(spawn, 1200);
        return () => clearTimeout(timer);
    }, [reduce]);

    return (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
            <style>{`
                @keyframes shooting-star {
                    0%   { opacity: 0; transform: rotate(145deg) translateX(0); }
                    15%  { opacity: 1; }
                    100% { opacity: 0; transform: rotate(145deg) translateX(280px); }
                }
            `}</style>
            {stars.map((s) => (
                <span
                    key={s.id}
                    className="absolute h-px origin-left rounded-full"
                    style={{
                        left: s.left,
                        top: s.top,
                        width: s.tail,
                        // Head leads in the direction of travel, tail fades behind it
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85))',
                        animation: 'shooting-star 1.3s cubic-bezier(0.16,1,0.3,1) forwards',
                    }}
                />
            ))}
        </div>
    );
};
