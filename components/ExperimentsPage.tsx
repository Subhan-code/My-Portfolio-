import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn, triggerHaptic } from '../lib/utils';
import { FADE_IN, revealVariants, staggerVariants } from '../lib/motion';
import { ShootingSky } from './ui/ShootingSky';
import { DotField } from './ui/DotField';
import { BlurShimmerText } from './ui/BlurShimmerText';
import { LiquidMetalButton } from './ui/liquid-metal';
import { RainbowButton } from './RainbowButton';
import { NativeMagnetic } from './ui/NativeMagnetic';
import { NativeCounterUp } from './ui/NativeCounterUp';
import { SiteFooter } from './ui/PageShell';

const CAN_HOVER = "[@media(hover:hover)_and_(pointer:fine)]";
const NO_HOVER = "[@media(hover:none)]";
const ROLES = ["Design Engineer", "Indie Developer", "Open-Source Builder"];

/* ------------------------------------------------------------------ */
/* Pieces                                                              */
/* ------------------------------------------------------------------ */

const Arrow = () => (
    <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
);

/**
 * Masonry tile: the live demo is the whole tile, no visible name (each demo already
 * says what it is). The name stays for screen readers. Tiles that open something
 * show a round arrow on hover; touch screens keep it visible.
 */
const LabTile = ({ name, height, index, onSelect, children }: {
    name: string;
    height: number;
    index: number;
    onSelect?: () => void;
    children: React.ReactNode;
}) => (
    <motion.article
        aria-label={name}
        {...FADE_IN}
        style={{ height }}
        className="group relative mb-3 break-inside-avoid overflow-hidden rounded-[20px] bg-[#0b0b0b] ring-1 ring-inset ring-white/[0.07] transition-[box-shadow,transform] duration-300 hover:ring-white/[0.12] active:scale-[0.995]"
    >
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>

        {onSelect && (
            <button
                type="button"
                onClick={() => { triggerHaptic(10); onSelect(); }}
                aria-label={`Open ${name}`}
                className="absolute inset-0 flex items-end justify-end p-3.5"
            >
                <span
                    className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center bg-white text-black transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                        `${CAN_HOVER}:opacity-0 ${CAN_HOVER}:translate-y-1.5 ${CAN_HOVER}:group-hover:opacity-100 ${CAN_HOVER}:group-hover:translate-y-0`,
                        `${NO_HOVER}:opacity-100`
                    )}
                >
                    <Arrow />
                </span>
            </button>
        )}
    </motion.article>
);

/**
 * The side-timeline from the home page, as a self-contained demo. The active
 * section advances like a page being read; hovering magnifies neighbours like a
 * dock, and clicking jumps to a section.
 */
const TIMELINE_SECTIONS = ['About', 'Work', 'Articles', 'Projects', 'Contact'];

const TimelineProgress = () => {
    const [active, setActive] = useState(0);
    const [hovered, setHovered] = useState<number | null>(null);

    useEffect(() => {
        if (hovered !== null) return; // hold still while someone is exploring it
        const t = setInterval(() => setActive((a) => (a + 1) % TIMELINE_SECTIONS.length), 1400);
        return () => clearInterval(t);
    }, [hovered]);

    const scaleFor = (i: number) => {
        if (hovered === null) return 0.55;
        return Math.max(1 - Math.abs(i - hovered) * 0.22, 0.55);
    };

    return (
        <div className="flex flex-col gap-1" onMouseLeave={() => setHovered(null)}>
            {TIMELINE_SECTIONS.map((s, i) => {
                const isActive = i === active;
                return (
                    <button
                        key={s}
                        type="button"
                        aria-label={s}
                        onMouseEnter={() => setHovered(i)}
                        onClick={() => setActive(i)}
                        className="relative flex items-center h-5"
                    >
                        <motion.span
                            className={cn("block h-1.5 rounded-full origin-left", isActive ? "bg-white" : "bg-white/20")}
                            animate={{ width: isActive ? 32 : 18, scaleY: scaleFor(i) * 1.4, opacity: isActive ? 1 : 0.4 + scaleFor(i) * 0.6 }}
                            transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
                        />
                        <AnimatePresence>
                            {(isActive || hovered === i) && (
                                <motion.span
                                    initial={{ opacity: 0, x: -4, filter: 'blur(3px)' }}
                                    animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, x: -4, filter: 'blur(3px)', transition: { duration: 0.12 } }}
                                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                    className={cn("absolute left-11 text-[12px] whitespace-nowrap", isActive ? "text-white" : "text-[#a1a1a1]")}
                                >
                                    {s}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                );
            })}
        </div>
    );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const ExperimentsPage = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
    return (
        <div className="relative min-h-screen bg-black text-neutral-50 font-sans overflow-x-clip">
            <ShootingSky />

            <div className="relative z-10 max-w-[880px] mx-auto px-5">
                {/* --- HEADER: rounded pill buttons --- */}
                <header className="h-20 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => { triggerHaptic(10); onNavigate('home'); }}
                        className="inline-flex items-center gap-2 h-11 pl-3.5 pr-5 rounded-full bg-[#1c1c1c] text-[16px] text-[#a1a1a1] hover:text-white hover:bg-[#242424] transition-colors"
                    >
                        <svg viewBox="0 0 20 20" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <path d="m12.5 4.75-5 5.25 5 5.25" />
                        </svg>
                        Syed Subhan
                    </button>
                    <a
                        href="https://x.com/SubhanHQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Syed Subhan on X"
                        className="w-11 h-11 rounded-full flex items-center justify-center bg-[#1c1c1c] text-[#a1a1a1] hover:text-white hover:bg-[#242424] transition-colors"
                    >
                        <svg viewBox="0 0 24 24" className="w-[17px] h-[17px]" fill="currentColor" aria-hidden>
                            <path d="M5 4.5h3.75l3.96 5.3 4.7-5.3H19l-5.55 6.28L19.5 19.5h-3.74l-4.48-6.08-5.38 6.08H4.3l6.24-7.06L5 4.5Zm2.4 1.2 9 12.6h1.7l-9-12.6H7.4Z" />
                        </svg>
                    </a>
                </header>

                <main>
                    {/* --- OPENING: the living dot field under the page title --- */}
                    <section className="relative -mx-5 px-5 h-[220px] md:h-[280px] flex items-end pb-8">
                        <DotField className="absolute inset-0 w-full h-full" />
                        <motion.div variants={staggerVariants(0.07)} initial="hidden" animate="visible" className="relative">
                            <motion.h1 variants={revealVariants} className="font-sans text-[28px] leading-[34px] md:text-[32px] md:leading-[40px] font-bold text-neutral-50">
                                Components
                            </motion.h1>
                            <motion.p variants={revealVariants} className="mt-2 text-[14px] leading-[22px] text-[#a1a1a1]">
                                Components and experiments behind this site. Hover, press, pull.
                            </motion.p>
                        </motion.div>
                    </section>

                    {/* --- MASONRY OF LIVE TILES --- */}
                    <section aria-label="Lab collection" className="columns-1 sm:columns-2 gap-3">
                        <LabTile index={0} name="Kanban Board" height={208} onSelect={() => onNavigate('kanban')}>
                            <div aria-hidden className="flex gap-2 w-[62%] h-[52%]">
                                {[3, 2, 1].map((n, col) => (
                                    <div key={col} className="flex-1 rounded-[8px] bg-white/[0.04] p-1.5 flex flex-col gap-1.5">
                                        {Array.from({ length: n }).map((_, i) => (
                                            <span
                                                key={i}
                                                className={cn(
                                                    "h-4 rounded-[5px] bg-white/[0.12] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                                    col === 0 && i === 0 && `${CAN_HOVER}:group-hover:translate-x-[calc(100%+0.5rem)] ${CAN_HOVER}:group-hover:bg-white/30`
                                                )}
                                            />
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </LabTile>

                        <LabTile index={1} name="Timeline Progress" height={252}>
                            <div className="w-[150px]"><TimelineProgress /></div>
                        </LabTile>

                        <LabTile index={2} name="Role Morph" height={180}>
                            <BlurShimmerText texts={ROLES} interval={2.2} blur={6} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }} className="text-[20px] leading-[28px] font-medium text-[#a1a1a1]" />
                        </LabTile>

                        <LabTile index={2} name="Liquid Metal" height={252}>
                            <LiquidMetalButton size="sm" shimmer borderWidth={3}>Liquid metal</LiquidMetalButton>
                        </LabTile>

                        <LabTile index={3} name="Counter" height={208}>
                            <NativeCounterUp value={2600} suffix="+" className="text-[44px] font-semibold text-white tabular-nums" />
                        </LabTile>

                        <LabTile index={4} name="Magnetic" height={292}>
                            <NativeMagnetic strength={0.4}>
                                <span className="inline-flex px-5 py-2.5 rounded-full bg-white text-black text-[14px] font-semibold">Pull me</span>
                            </NativeMagnetic>
                        </LabTile>

                        <LabTile index={5} name="Toggle" height={180}>
                            <span aria-hidden className="relative inline-flex h-7 w-12 rounded-full bg-white/15 transition-colors duration-500 group-hover:bg-white/40">
                                <span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-5" />
                            </span>
                        </LabTile>

                        <LabTile index={6} name="Rainbow Button" height={252}>
                            <RainbowButton>Get started</RainbowButton>
                        </LabTile>

                        <LabTile index={7} name="Code Mark" height={208}>
                            <span aria-hidden className="flex items-center font-mono font-bold text-[30px] leading-none text-white select-none">
                                <span className={cn("inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER}:group-hover:-translate-x-[5px]`)}>&lt;</span>
                                <span className={cn("inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER}:group-hover:-rotate-6`)}>/</span>
                                <span className={cn("inline-block transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER}:group-hover:translate-x-[5px]`)}>&gt;</span>
                            </span>
                        </LabTile>
                    </section>
                </main>
            </div>

            {/* --- FOOTER: the same line as every other page --- */}
            <div className="relative z-10 mt-24">
                <SiteFooter wide />
            </div>
        </div>
    );
};
