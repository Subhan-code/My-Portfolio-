import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useHoverIntent, useTapOutside, TooltipCard, TipItem } from './Tooltip';
import { istOffsetPhrase, istParts } from '../../lib/time';

/** Analog clock face for India: hands ease to each new second like a watch, never jump */
const ClockFace = ({ h, m, s }: { h: number; m: number; s: number }) => {
    const reduce = useReducedMotion();
    // Keep counting up past 360 so the second hand never spins backwards at :00
    const turns = useRef({ s: s * 6, last: s });
    if (s !== turns.current.last) {
        turns.current.s += ((s - turns.current.last + 60) % 60) * 6;
        turns.current.last = s;
    }
    // Hands pivot on the centre of the face; a slight overshoot on each tick, like a quartz watch
    const hand = (deg: number): React.CSSProperties => ({
        transform: `rotate(${deg}deg)`,
        transformOrigin: '22px 22px',
        transformBox: 'view-box',
        transition: reduce ? 'none' : 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1)',
    });

    return (
        <svg viewBox="0 0 44 44" aria-hidden className="w-11 h-11 shrink-0">
            <circle cx="22" cy="22" r="21" className="fill-white" />
            {Array.from({ length: 12 }).map((_, i) => (
                <line key={i} x1="22" y1="3.5" x2="22" y2={i % 3 === 0 ? 7 : 5.5} transform={`rotate(${i * 30} 22 22)`} className="stroke-black/70" strokeWidth={i % 3 === 0 ? 1.4 : 0.8} strokeLinecap="round" />
            ))}
            <line x1="22" y1="22" x2="22" y2="12" className="stroke-black" strokeWidth="2" strokeLinecap="round" style={hand((h % 12) * 30 + m * 0.5)} />
            <line x1="22" y1="22" x2="22" y2="7.5" className="stroke-black" strokeWidth="1.4" strokeLinecap="round" style={hand(m * 6 + s * 0.1)} />
            <line x1="22" y1="25.5" x2="22" y2="6" className="stroke-black/80" strokeWidth="0.8" strokeLinecap="round" style={hand(turns.current.s)} />
            <circle cx="22" cy="22" r="1.5" className="fill-black" />
        </svg>
    );
};

/** Digits that roll up when they change, like a flip clock without the flap */
const Rolling = ({ value }: { value: string }) => (
    <span className="inline-flex tabular-nums">
        {value.split('').map((ch, i) => (
            <span key={i} className="relative inline-block overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={ch}
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '-100%', opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
                        className="inline-block"
                    >
                        {ch}
                    </motion.span>
                </AnimatePresence>
            </span>
        ))}
    </span>
);

/**
 * "from India": hover or tap for a clock card. A live analog face, the time with
 * rolling digits, and how far ahead of the visitor India is right now.
 */
export const LocationIndicator = () => {
    const { open, setOpen, bind } = useHoverIntent();
    const ref = useRef<HTMLSpanElement>(null);
    const [now, setNow] = useState(istParts);
    useTapOutside(ref, open, () => setOpen(false));

    // Below the words when there's no room above (read in render so the first frame is right)
    const below = open && (ref.current?.getBoundingClientRect().top ?? 999) < 220;

    // Tick every second only while the card is open
    useEffect(() => {
        if (!open) return;
        setNow(istParts());
        const t = setInterval(() => setNow(istParts()), 1000);
        return () => clearInterval(t);
    }, [open]);

    const h12 = now.h % 12 || 12;
    const clock = `${h12}:${String(now.m).padStart(2, '0')}:${String(now.s).padStart(2, '0')}`;

    return (
        <span ref={ref} className="relative inline-block ml-1" {...bind}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                onFocus={() => setOpen(true)}
                onBlur={() => setOpen(false)}
                aria-expanded={open}
                className="cursor-help underline decoration-dotted decoration-white/30 underline-offset-4 hover:decoration-white/70 hover:text-neutral-50 transition-colors"
            >
                from India
            </button>

            <AnimatePresence>
                {open && (
                    <TooltipCard side={below ? 'bottom' : 'top'} align="center" width={224}>
                        <TipItem className="flex items-center gap-3">
                            <ClockFace {...now} />
                            <span className="min-w-0">
                                <span className="block text-[11px] leading-4 text-[#a1a1a1]">India · IST</span>
                                <span className="block text-[20px] leading-6 font-semibold text-neutral-50">
                                    <Rolling value={clock} />
                                    <span className="ml-1 text-[12px] font-medium text-[#a1a1a1]">{now.h < 12 ? 'am' : 'pm'}</span>
                                </span>
                            </span>
                        </TipItem>
                        <TipItem className="mt-2 flex items-center justify-between text-[11.5px] text-[#a1a1a1]">
                            <span>{istOffsetPhrase()}</span>
                            <span>UTC+5:30</span>
                        </TipItem>
                    </TooltipCard>
                )}
            </AnimatePresence>
        </span>
    );
};
