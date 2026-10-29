import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn, triggerHaptic } from '../../lib/utils';
import { useHoverIntent, useTapOutside } from './Tooltip';
import { Chevron } from './AppleSection';

/*
 * A project named inside a sentence, with its icon beside it.
 *
 * The sentence blurs in word by word (see Words); once it has, each icon badge makes
 * room for itself on a spring, pushing the words apart. Hover, focus or tap the badge
 * and a card springs up out of it: the project's image, its name and one sentence.
 */

const CARD_W = 272;
// Spring the card in from its caret; it leaves faster than it came
const POP = { type: 'spring', duration: 0.4, bounce: 0.2 } as const;

/** Splits plain text into words that blur in one after another; `from` is the running word index */
export const Words = ({ text, from }: { text: string; from: number }) => (
    <>
        {text.split(/\s+/).filter(Boolean).map((w, i, all) => (
            <React.Fragment key={i}>
                <span className="wd" style={{ '--i': from + i } as React.CSSProperties}>{w}</span>
                {i < all.length - 1 && ' '}
            </React.Fragment>
        ))}
    </>
);
export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;


export const ProjectCite = ({ name, href, icon, note, image, from, roomAt, ready, autoOpen = false }: {
    name: string;
    href: string;
    /** The project's own logo, square */
    icon: string;
    /** One sentence, numbers included */
    note: string;
    image: string;
    /** Word index for the blur-in */
    from: number;
    /** Milliseconds after `ready` before the badge makes room */
    roomAt: number;
    /** The sentence is on screen: start the badge */
    ready: boolean;
    /** Open the card once by itself after the badge lands (first visit in a session) */
    autoOpen?: boolean;
}) => {
    const reduce = useReducedMotion();
    const { open, setOpen, bind } = useHoverIntent(120, 160);
    const ref = useRef<HTMLSpanElement>(null);
    const badgeRef = useRef<HTMLButtonElement>(null);
    useTapOutside(ref, open, () => setOpen(false));
    const domain = new URL(href).hostname.replace(/^www\./, '');

    // Escape closes, and so does scrolling away from a card that opened by itself
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        const y = window.scrollY;
        const onScroll = () => Math.abs(window.scrollY - y) > 80 && setOpen(false);
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('scroll', onScroll); };
    }, [open, setOpen]);

    // Shown once on arrival, so the card is seen without hunting for it
    useEffect(() => {
        if (!ready || !autoOpen) return;
        let seen = false;
        try { seen = sessionStorage.getItem('cite-seen') === '1'; } catch { }
        if (seen) return;
        // Marked seen only when it actually opens, so a cancelled timer doesn't use it up
        const t = setTimeout(() => {
            try { sessionStorage.setItem('cite-seen', '1'); } catch { }
            setOpen(true);
        }, reduce ? 300 : roomAt + 800);
        return () => clearTimeout(t);
    }, [ready, autoOpen, roomAt, reduce, setOpen]);

    // Placed as it opens, centred on the badge and kept on screen; below the line when
    // there's no room above. The caret follows the badge wherever the card ends up.
    const a = open ? ref.current?.getBoundingClientRect() : undefined;
    const b = open ? badgeRef.current?.getBoundingClientRect() : undefined;
    let left = 0, caret = CARD_W / 2, below = false;
    if (a && b) {
        const bx = b.left + b.width / 2;
        const x = Math.min(Math.max(bx - CARD_W / 2, 16), window.innerWidth - 16 - CARD_W);
        left = x - a.left;
        caret = bx - x;
        below = a.top < 330;
    }

    return (
        <span
            ref={ref}
            className="relative inline"
            {...bind}
            // Tabbing away closes it; a click inside (onto the card's link) doesn't
            onBlur={(e) => e.relatedTarget && !ref.current?.contains(e.relatedTarget as Node) && setOpen(false)}
        >
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => triggerHaptic(8)}
                // One word-unit for the whole name: an underline can't reach into inline-block words
                style={{ '--i': from } as React.CSSProperties}
                className={cn("wd text-neutral-50 underline underline-offset-4 transition-[text-decoration-color] duration-200", open ? "decoration-neutral-50" : "decoration-[#a1a1a1]")}
            >
                {name}
            </a>
            <button
                ref={badgeRef}
                type="button"
                aria-expanded={open}
                aria-label={`About ${name}`}
                onClick={() => { triggerHaptic(6); setOpen((o) => !o); }}
                onFocus={() => setOpen(true)}
                className={cn(
                    // Small, with room either side so the logo never crowds the words
                    "inline-block w-[15px] h-[15px] mx-1.5 p-0 rounded-[4px] bg-black align-[-0.16em] overflow-hidden",
                    "transition-transform duration-[400ms] ease-[var(--spring)] [@media(hover:hover)]:hover:scale-110 active:scale-95",
                    open && "scale-110",
                    ready && "cite-room"
                )}
                style={{ '--bd': `${roomAt}ms` } as React.CSSProperties}
            >
                <img src={icon} alt="" className="block w-full h-full object-cover" />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.span
                        role="dialog"
                        aria-label={name}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: below ? -6 : 6, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', transition: reduce ? { duration: 0.15 } : { ...POP, opacity: { duration: 0.25 }, filter: { duration: 0.25 } } }}
                        exit={{ opacity: 0, scale: reduce ? 1 : 0.96, filter: reduce ? 'none' : 'blur(4px)', transition: { duration: 0.18, ease: 'easeOut' } }}
                        style={{ left, width: CARD_W, transformOrigin: `${caret}px ${below ? '0%' : '100%'}` }}
                        className={cn("absolute z-50 flex", below ? "top-full mt-1 flex-col-reverse" : "bottom-full mb-1 flex-col")}
                    >
                        <span className="block p-2 rounded-[20px] bg-[#171717] shadow-[0_18px_48px_rgba(0,0,0,0.6)] text-left whitespace-normal">
                            <img src={image} alt="" className="block w-full aspect-[16/9] object-cover rounded-[14px]" />
                            <a href={href} target="_blank" rel="noopener noreferrer" className="group/head flex items-center gap-2 px-2 pt-3">
                                <img src={icon} alt="" className="w-[18px] h-[18px] shrink-0 rounded-[5px]" />
                                <span className="flex-1 min-w-0 truncate text-[13px] leading-5 font-semibold text-neutral-50">{name}</span>
                                <span className="text-[12px] text-[#a1a1a1]">{domain}</span>
                                <Chevron className="w-3 h-3 text-[#a1a1a1] transition-transform duration-300 ease-[var(--spring)] group-hover/head:translate-x-0.5" />
                            </a>
                            <span className="block px-2 pt-1 pb-2 text-[12px] leading-[18px] text-[#a1a1a1]">{note}</span>
                        </span>
                        {/* Caret: points at the badge, wherever the card had to shift to */}
                        <svg viewBox="0 0 20 11" aria-hidden className={cn("w-5 h-[11px] fill-[#171717]", below && "rotate-180")} style={{ marginLeft: caret - 10 }}>
                            <polygon points="0,0 20,0 10,10" />
                        </svg>
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
};
