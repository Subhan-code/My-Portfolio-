import React from 'react';

// Typographic covers for projects that don't ship a screenshot.
// One mark, centered, nothing else — the caption under the tile carries the details.

/** A project's own cover image, filling the card */
const Cover = ({ src, alt }: { src: string; alt: string }) => (
    <img src={src} alt={alt} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover select-none" />
);

export const AmicroVisual = () => <Cover src="/projects/amicro.jpg" alt="Amicro: micro-interactions for modern web" />;

export const MonochartsVisual = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-white select-none p-6">
        <p className="font-sans text-[clamp(1.5rem,6vw,2.25rem)] font-semibold leading-none">
            monocharts
        </p>
        {/* Sleek animated monochrome chart bars */}
        <div className="flex items-end gap-1.5 h-7 w-28">
            <span className="flex-1 bg-white/20 rounded-sm h-[35%] group-hover:h-[65%] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="flex-1 bg-white/40 rounded-sm h-[70%] group-hover:h-[40%] transition-all duration-500 delay-75 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="flex-1 bg-white/25 rounded-sm h-[45%] group-hover:h-[90%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="flex-1 bg-white rounded-sm h-[85%] group-hover:h-[55%] transition-all duration-500 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="flex-1 bg-white/30 rounded-sm h-[60%] group-hover:h-[100%] transition-all duration-500 delay-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="flex-1 bg-white/60 rounded-sm h-[95%] group-hover:h-[75%] transition-all duration-500 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
        </div>
    </div>
);

export const CardioEnsembleVisual = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#090b0e] text-white select-none p-6 overflow-hidden">
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="font-sans text-[clamp(1.35rem,5.5vw,2rem)] font-semibold leading-none">
                Cardio<span className="text-emerald-400">Ensemble</span>
            </p>
        </div>
        {/* ECG pulse waveform */}
        <div className="w-32 h-6 flex items-center justify-center relative">
            <svg viewBox="0 0 120 28" fill="none" className="w-full h-full text-emerald-400/80 group-hover:text-emerald-400 transition-colors">
                <path
                    d="M0 14h35l4-8 4 18 5-22 4 16 3-4h35"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="group-hover:stroke-emerald-300 transition-colors"
                />
            </svg>
        </div>
    </div>
);

export const AmacroVisual = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0a0a] text-white select-none">
        <p className="font-sans text-[clamp(1.75rem,7vw,2.75rem)] font-semibold leading-none">
            amacro
        </p>
        {/* Morphing frame transition */}
        <div className="w-12 h-6 rounded-md border border-white/20 flex items-center justify-center group-hover:w-16 group-hover:border-white/60 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <span className="w-1.5 h-1.5 rounded-full bg-white/70 group-hover:scale-125 transition-transform" />
        </div>
    </div>
);

export const OxygenVisual = () => <Cover src="/projects/oxygen-ui.jpg" alt="Oxygen UI: Solana components for modern apps" />;

export const AizenVerseVisual = () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 bg-[#0a0714] text-white select-none p-6 overflow-hidden">
        {/* Subtle ambient purple glow */}
        <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(168,85,247,0.18),transparent_65%)] pointer-events-none group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />

        <div className="relative z-10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
            <p className="font-sans text-[clamp(1.4rem,5.5vw,2rem)] font-bold leading-none tracking-tight">
                Aizen <span className="text-purple-400">Verse</span>
            </p>
        </div>

        {/* Minimalist streaming audio / watch party waves */}
        <div className="relative z-10 flex items-center justify-center gap-1 h-5 w-24">
            <span className="w-1 bg-purple-400/30 rounded-full h-[30%] group-hover:h-[75%] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="w-1 bg-purple-400/50 rounded-full h-[60%] group-hover:h-[40%] transition-all duration-500 delay-75 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="w-1 bg-purple-400/80 rounded-full h-[90%] group-hover:h-[100%] transition-all duration-500 delay-100 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="w-1 bg-purple-400 rounded-full h-[45%] group-hover:h-[90%] transition-all duration-500 delay-150 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="w-1 bg-purple-400/70 rounded-full h-[75%] group-hover:h-[50%] transition-all duration-500 delay-200 ease-[cubic-bezier(0.16,1,0.3,1)]" />
            <span className="w-1 bg-purple-400/40 rounded-full h-[35%] group-hover:h-[80%] transition-all duration-500 delay-300 ease-[cubic-bezier(0.16,1,0.3,1)]" />
        </div>
    </div>
);
