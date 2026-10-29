import React from 'react';
import { motion, type Transition, type Variants } from 'framer-motion';

// --- Motion tokens: one timing language for the whole site ---

/** Strong ease-out (expo). Entrances, reveals, anything settling into place. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
/** Exits: quick, gets out of the way. */
export const EASE_EXIT = [0.4, 0, 1, 1] as const;
/** iOS sheet curve — very steep start. Expanding panels, height changes. */
export const EASE_SHEET = [0.32, 0.72, 0, 1] as const;

/** Critically damped spring — no overshoot. Default for UI state changes. */
export const SPRING: Transition = { type: 'spring', duration: 0.45, bounce: 0 };
/** Slight bounce — only for "alive" elements like the Dynamic Island. */
export const SPRING_SOFT: Transition = { type: 'spring', duration: 0.5, bounce: 0.15 };

/** Reveal: small rise + de-blur. Nothing appears from nothing, nothing travels far. */
export const revealVariants: Variants = {
    hidden: { opacity: 0, y: 14, filter: 'blur(6px)' },
    visible: (delay: number = 0) => ({
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        transition: { duration: 0.7, ease: EASE_OUT, delay },
        // Drop the filter once settled: keeps text crisp and avoids a new containing block
        transitionEnd: { filter: 'none' },
    }),
};

/**
 * Scroll reveal for cards and section titles: close to static. A short fade the
 * first time it enters, no travel, no blur, no one-by-one delay. Spread onto a motion element.
 */
export const FADE_IN = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.15 },
    transition: { duration: 0.3, ease: 'easeOut' },
} as const;

/** Parent that staggers its `revealVariants` children. */
export const staggerVariants = (stagger = 0.06, delayChildren = 0): Variants => ({
    hidden: {},
    visible: { transition: { staggerChildren: stagger, delayChildren } },
});

type RevealProps = {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    as?: 'div' | 'section' | 'li' | 'article' | 'header';
} & Omit<React.HTMLAttributes<HTMLElement>, 'children'>;

/** Reveals once when ~15% in view. One entrance per container — don't nest. */
export const Reveal = ({ children, className, delay = 0, as = 'div', ...rest }: RevealProps) => {
    const Component = motion[as] as typeof motion.div;
    return (
        <Component
            variants={revealVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            custom={delay}
            className={className}
            {...(rest as any)}
        >
            {children}
        </Component>
    );
};
