import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

/*
 * Intro plate, drawn over the real hero: the page's own layout, measured.
 *
 * A faint grid fades in, then the layout's guides drop in: the column's outer edges,
 * the content edges inside its padding, and the centre line. Rows run across at the
 * hero's top and bottom, crosshairs mark where they meet, and dimension lines measure
 * it all, counting up to the real pixel values read from the page: the content width,
 * the side padding, the top padding, the hero's height and the photo. The hero sits
 * underneath in blocks (see BlockReveal); everything else waits in the dark. Then the
 * blocks wipe off and the plate clears.
 */

const DRAW = [0.65, 0, 0.35, 1] as const;
const OUT = [0.16, 1, 0.3, 1] as const;
const GUIDE = "absolute bg-white/[0.16]";
const LABEL = "relative px-1.5 bg-black font-mono text-[10px] leading-4 text-white/80 tabular-nums whitespace-nowrap";

type Frame = {
    outerL: number; outerR: number;   // the column, padding included
    left: number; right: number;      // the content inside it
    pad: number;                      // side padding
    mainTop: number;                  // where the column's top padding starts
    top: number; bottom: number;      // the hero's content
    photo?: { x: number; y: number; w: number; h: number };
};

/** Every length is read from the page itself, so the numbers are the real layout */
const measure = (): Frame | null => {
    const main = document.querySelector('main');
    const hero = document.getElementById('about');
    if (!main || !hero) return null;
    const m = main.getBoundingClientRect();
    const ms = getComputedStyle(main);
    const h = hero.getBoundingClientRect();
    const pad = parseFloat(ms.paddingLeft);
    const img = hero.querySelector('img')?.getBoundingClientRect();
    return {
        outerL: Math.round(m.left),
        outerR: Math.round(m.right),
        left: Math.round(m.left + pad),
        right: Math.round(m.right - parseFloat(ms.paddingRight)),
        pad: Math.round(pad),
        mainTop: Math.round(m.top),
        top: Math.round(h.top),
        bottom: Math.round(h.bottom - parseFloat(getComputedStyle(hero).paddingBottom)),
        photo: img ? { x: Math.round(img.left), y: Math.round(img.top), w: Math.round(img.width), h: Math.round(img.height) } : undefined,
    };
};

/** A number that counts up to `to` as its line draws */
const Count = ({ to, delay }: { to: number; delay: number }) => {
    const n = useMotionValue(0);
    const text = useTransform(n, (v) => String(Math.round(v)));
    useLayoutEffect(() => {
        const c = animate(n, to, { duration: 0.9, delay, ease: OUT });
        return () => c.stop();
    }, [n, to, delay]);
    return <motion.span>{text}</motion.span>;
};

/** Horizontal dimension: end ticks, a line drawing out from the middle, the length counting up */
const HDim = ({ x, w, y, delay, label }: { x: number; w: number; y: number; delay: number; label?: string }) => (
    <div className="absolute h-4 flex items-center justify-center text-white/50" style={{ left: x, width: w, top: y - 8 }}>
        <motion.span variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.3, delay } } }} className="absolute left-0 w-px h-3 bg-current" />
        <motion.span variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.9, ease: OUT, delay } } }} className="absolute inset-x-0 h-px bg-current origin-center" />
        <motion.span variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.3, delay } } }} className="absolute right-0 w-px h-3 bg-current" />
        <motion.span variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3, delay } } }} className={LABEL}>
            {label ?? <Count to={w} delay={delay} />}
        </motion.span>
    </div>
);

/** Vertical dimension, the same parts turned on end; the label reads upright */
const VDim = ({ x, y, h, delay }: { x: number; y: number; h: number; delay: number }) => (
    <div className="absolute w-4 flex flex-col items-center justify-center text-white/50" style={{ left: x - 8, top: y, height: h }}>
        <motion.span variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.3, delay } } }} className="absolute top-0 h-px w-3 bg-current" />
        <motion.span variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.9, ease: OUT, delay } } }} className="absolute inset-y-0 w-px bg-current origin-center" />
        <motion.span variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 0.3, delay } } }} className="absolute bottom-0 h-px w-3 bg-current" />
        <motion.span variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3, delay } } }} className={`${LABEL} !px-0 py-1`}>
            <Count to={h} delay={delay} />
        </motion.span>
    </div>
);

export const GridReveal = ({ onComplete }: { onComplete: () => void }) => {
    const [m, setM] = useState<Frame | null>(null);
    const [ready, setReady] = useState(false);
    // Latest callback without restarting the timeline when the parent re-renders
    const done = useRef(onComplete);
    done.current = onComplete;

    // Measure once the page underneath is styled: the Tailwind CDN writes its CSS just
    // after React commits, so wait two frames (and again when fonts land)
    useEffect(() => {
        const read = () => { setM(measure()); setReady(true); };
        let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(read); });
        document.fonts?.ready.then(read);
        return () => cancelAnimationFrame(raf);
    }, []);

    // The timeline starts once, on the first measurement; later re-measures only move lines
    useEffect(() => {
        if (!ready) return;
        const t = setTimeout(() => done.current(), 2200);
        return () => clearTimeout(t);
    }, [ready]);

    // Until measured, cover the whole page. Inline styles, since the Tailwind CDN hasn't
    // written its classes yet: without this the page shows for a few frames, unstyled
    if (!m) return <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000', pointerEvents: 'none' }} />;

    const mid = Math.round((m.outerL + m.outerR) / 2);
    const cols = [
        { x: m.outerL, faint: true }, { x: m.left }, { x: mid, faint: true }, { x: m.right }, { x: m.outerR, faint: true },
    ];
    const rows = [m.top, m.bottom];
    // Phones have no room beside the column: the vertical dimensions move inside it
    const gutter = m.outerL >= 40;
    const vx = gutter ? m.outerL - 20 : m.left + 10;

    return (
        <motion.div
            aria-hidden
            initial="hidden"
            animate="show"
            exit="exit"
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
        >
            {/* Below the hero stays dark until the reveal, so the eye stays on the plate */}
            <motion.div
                variants={{ hidden: { opacity: 1 }, show: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.6, delay: 0.35, ease: 'easeOut' } } }}
                className="absolute inset-x-0 bottom-0 bg-black [mask-image:linear-gradient(to_bottom,transparent,black_16px)]"
                style={{ top: m.bottom + 12 }}
            />
            {/* Above the hero too, so the nav arrives with the page */}
            <motion.div
                variants={{ hidden: { opacity: 1 }, show: { opacity: 1 }, exit: { opacity: 0, transition: { duration: 0.5, delay: 0.3, ease: 'easeOut' } } }}
                className="absolute inset-x-0 top-0 bg-black [mask-image:linear-gradient(to_top,transparent,black_32px)]"
                style={{ height: Math.max(0, m.top - 12) }}
            />

            <motion.div variants={{ exit: { opacity: 0, transition: { duration: 0.8, delay: 0.45, ease: 'easeOut' } } }} className="absolute inset-0">
                {/* Fine 8px-rhythm grid, aligned to the content edge, faint enough to read the blocks through */}
                <motion.div
                    variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } } }}
                    className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_50%_35%,black_30%,transparent_80%)]"
                    style={{
                        backgroundImage:
                            'linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)',
                        backgroundSize: '24px 24px',
                        backgroundPosition: `${m.left}px ${m.top}px`,
                    }}
                />

                {/* Column guides drop in: outer edges and centre faint, content edges bright */}
                {cols.map((c, i) => (
                    <motion.span
                        key={`c${i}`}
                        variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 0.9, ease: DRAW, delay: 0.05 + i * 0.06 } } }}
                        className={`${GUIDE} top-0 bottom-0 w-px origin-top ${c.faint ? '!bg-white/[0.07]' : ''}`}
                        style={{ left: c.x }}
                    />
                ))}
                {/* Then the hero's rows run across */}
                {rows.map((y, i) => (
                    <motion.span
                        key={`r${i}`}
                        variants={{ hidden: { scaleX: 0 }, show: { scaleX: 1, transition: { duration: 1, ease: DRAW, delay: 0.2 + i * 0.1 } } }}
                        className={`${GUIDE} left-0 right-0 h-px origin-left`}
                        style={{ top: y }}
                    />
                ))}
                {/* Padding bands: the space between the column edge and its content, hatched */}
                {m.pad > 0 && [m.outerL, m.right].map((x, i) => (
                    <motion.span
                        key={`p${i}`}
                        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.5, delay: 0.55 } } }}
                        className="absolute"
                        style={{
                            left: x, width: m.pad, top: m.top, height: m.bottom - m.top,
                            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 6px)',
                        }}
                    />
                ))}

                {/* Crosshairs where the content edges meet the hero's rows */}
                {rows.flatMap((y, ri) => [m.left, m.right].map((x, ci) => (
                    <motion.span
                        key={`x${ri}${ci}`}
                        variants={{ hidden: { opacity: 0, scale: 0.4 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35, delay: 0.75 + ri * 0.08 } } }}
                        className="absolute w-[11px] h-[11px] -translate-x-1/2 -translate-y-1/2 text-white/60"
                        style={{ left: x, top: y }}
                    >
                        <span className="absolute left-1/2 inset-y-0 w-px -translate-x-1/2 bg-current" />
                        <span className="absolute top-1/2 inset-x-0 h-px -translate-y-1/2 bg-current" />
                    </motion.span>
                )))}

                {/* The lengths, each counting up to its real value */}
                <HDim x={m.left} w={m.right - m.left} y={m.top - 28} delay={0.45} />
                {m.pad > 0 && <HDim x={m.outerL} w={m.pad} y={m.bottom + 22} delay={0.7} label={String(m.pad)} />}
                {m.pad > 0 && <HDim x={m.right} w={m.pad} y={m.bottom + 22} delay={0.75} label={String(m.pad)} />}
                {m.top - m.mainTop > 40 && <VDim x={vx} y={m.mainTop} h={m.top - m.mainTop} delay={0.55} />}
                <VDim x={gutter ? m.outerR + 20 : m.right - 10} y={m.top} h={m.bottom - m.top} delay={0.65} />
                {/* The photo's size; phones skip it, where the bio sits right under the photo */}
                {m.photo && gutter && <HDim x={m.photo.x} w={m.photo.w} y={m.photo.y + m.photo.h + 14} delay={0.8} />}
            </motion.div>
        </motion.div>
    );
};
