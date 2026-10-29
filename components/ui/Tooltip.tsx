import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

/*
 * One tooltip system for the whole site, in the spirit of macOS:
 * - one flat dark surface and a soft shadow: no edge, no inner highlight
 * - it grows out of its trigger (origin-aware), springs in, and leaves faster than it came
 * - "warm" hover: once one tooltip has opened, moving to the next opens it instantly
 * - its contents settle in a few milliseconds behind the card
 */

let lastClosedAt = 0;
const WARM_MS = 450;

/** Hover intent with a short open delay, a shorter close delay, and warm hand-off between tooltips */
export const useHoverIntent = (openDelay = 160, closeDelay = 100) => {
    const [open, setOpen] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    const clear = () => window.clearTimeout(timer.current);
    const show = useCallback(() => {
        clear();
        const warm = Date.now() - lastClosedAt < WARM_MS;
        if (warm) setOpen(true);
        else timer.current = window.setTimeout(() => setOpen(true), openDelay);
    }, [openDelay]);
    const hide = useCallback(() => {
        clear();
        timer.current = window.setTimeout(() => {
            setOpen((was) => { if (was) lastClosedAt = Date.now(); return false; });
        }, closeDelay);
    }, [closeDelay]);

    useEffect(() => clear, []);
    return { open, setOpen, show, hide, bind: { onMouseEnter: show, onMouseLeave: hide } };
};

/** Close when tapping anywhere outside `ref` (touch has no mouse-leave) */
export const useTapOutside = (ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) => {
    useEffect(() => {
        if (!open) return;
        const onDown = (e: PointerEvent) => { if (!ref.current?.contains(e.target as Node)) close(); };
        document.addEventListener('pointerdown', onDown);
        return () => document.removeEventListener('pointerdown', onDown);
    }, [open, close, ref]);
};

type Side = 'top' | 'bottom';
type Align = 'start' | 'center' | 'end';

const ORIGIN: Record<Side, Record<Align, string>> = {
    top: { start: 'bottom left', center: 'bottom center', end: 'bottom right' },
    bottom: { start: 'top left', center: 'top center', end: 'top right' },
};
const PLACE: Record<Side, string> = { top: 'bottom-full mb-2.5', bottom: 'top-full mt-2.5' };
// Centring lives in the animated transform (x: -50%), since motion owns `transform`
const ALIGN: Record<Align, string> = { start: 'left-0', center: 'left-1/2', end: 'right-0' };

const cardVariants = (side: Side, align: Align, reduce: boolean | null): Variants => {
    const x = align === 'center' ? '-50%' : 0;
    return {
    hidden: reduce
        ? { opacity: 0, x }
        : { opacity: 0, x, scale: 0.94, y: side === 'top' ? 6 : -6, filter: 'blur(6px)' },
    shown: {
        opacity: 1, x, scale: 1, y: 0, filter: 'blur(0px)',
        transition: reduce
            ? { duration: 0.12 }
            : { type: 'spring', duration: 0.38, bounce: 0.18, staggerChildren: 0.035, delayChildren: 0.04 },
        transitionEnd: { filter: 'none' },
    },
    gone: {
        opacity: 0, x, scale: reduce ? 1 : 0.97, filter: reduce ? 'none' : 'blur(3px)',
        transition: { duration: 0.12, ease: [0.4, 0, 1, 1] },
    },
    };
};

/** One line or block inside a card: settles a beat after the card */
export const TipItem = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <motion.div
        variants={{ hidden: { opacity: 0, y: 3 }, shown: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } } }}
        className={className}
    >
        {children}
    </motion.div>
);

/** The material card. Render inside <AnimatePresence> and a `relative` trigger wrapper. */
export const TooltipCard = ({
    children, side = 'top', align = 'start', width = 260, className, id,
}: {
    children: React.ReactNode;
    side?: Side;
    align?: Align;
    /** Pixels, or 'auto' to fit short labels */
    width?: number | 'auto';
    className?: string;
    id?: string;
}) => {
    const reduce = useReducedMotion();
    return (
        <motion.div
            id={id}
            role="tooltip"
            variants={cardVariants(side, align, reduce)}
            initial="hidden"
            animate="shown"
            exit="gone"
            style={{ transformOrigin: ORIGIN[side][align], width, whiteSpace: width === 'auto' ? 'nowrap' : undefined }}
            className={cn(
                "absolute z-50 p-3 text-left rounded-[16px]",
                "bg-[#171717] shadow-[0_16px_40px_-8px_rgba(0,0,0,0.8)]",
                PLACE[side], ALIGN[align], className
            )}
        >
            {children}
        </motion.div>
    );
};

