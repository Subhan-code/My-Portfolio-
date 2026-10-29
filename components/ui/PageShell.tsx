import React from 'react';
import { motion } from 'framer-motion';
import { cn, triggerHaptic } from '../../lib/utils';
import { revealVariants, staggerVariants } from '../../lib/motion';
import { T_DISPLAY, T_BODY, T_META, LINK_UNDERLINE } from './AppleSection';

/* One shell for every inner page: same width, same back pill, same title block. */

export const PAGE_WIDTH = "max-w-[680px] mx-auto px-5 sm:px-6";

export const BackPill = ({ onClick, label = 'Syed Subhan' }: { onClick: () => void; label?: string }) => (
    <button
        type="button"
        onClick={() => { triggerHaptic(10); onClick(); }}
        className="group inline-flex items-center gap-1.5 h-10 pl-3 pr-4 rounded-full bg-[#1c1c1c] text-[14px] text-[#a1a1a1] hover:text-white hover:bg-[#242424] active:scale-[0.97] transition-[color,background-color,transform] duration-200"
    >
        {/* Chevron nudges back on hover: it points where it goes */}
        <svg viewBox="0 0 20 20" className="w-4 h-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m12.5 4.75-5 5.25 5 5.25" />
        </svg>
        {label}
    </button>
);

export const PageHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <motion.header variants={staggerVariants(0.07)} initial="hidden" animate="visible" className="pt-14 pb-10">
        <motion.h1 variants={revealVariants} className={cn(T_DISPLAY, "font-bold text-neutral-50")}>{title}</motion.h1>
        {subtitle && (
            <motion.p variants={revealVariants} className={cn(T_BODY, "mt-2 max-w-[460px] text-[#a1a1a1]")}>{subtitle}</motion.p>
        )}
    </motion.header>
);

/** Inner page frame: black ground, back pill on top, content in the shared column */
export const PageShell = ({ onBack, children, className }: { onBack: () => void; children: React.ReactNode; className?: string }) => (
    <div className={cn("min-h-[100dvh] bg-black text-neutral-50 font-sans", className)}>
        <div className={PAGE_WIDTH}>
            <div className="h-20 flex items-center">
                <BackPill onClick={onBack} />
            </div>
            {children}
        </div>
    </div>
);

/** The one footer line used outside the home page */
export const SiteFooter = ({ wide = false }: { wide?: boolean }) => (
    <footer className="bg-black">
        <div className={cn(PAGE_WIDTH, wide && "max-w-[880px] px-5", "py-8 border-t border-white/[0.06] flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between")}>
            <p className={cn(T_META, "text-[#a1a1a1]")}>© {new Date().getFullYear()} Syed Subhan</p>
            <nav aria-label="Get in touch" className={cn(T_META, "flex items-center gap-4 text-[#a1a1a1]")}>
                <a href="https://x.com/SubhanHQ" target="_blank" rel="noopener noreferrer" className={cn(LINK_UNDERLINE, "hover:text-white")}>DM me</a>
                <span aria-hidden className="text-[#a1a1a1]">or</span>
                <a href="mailto:syednotion@gmail.com" className={cn(LINK_UNDERLINE, "hover:text-white")}>Mail me</a>
                <span aria-hidden className="text-[#a1a1a1]">·</span>
                <a href="https://github.com/Subhan-code" target="_blank" rel="noopener noreferrer" className={cn(LINK_UNDERLINE, "hover:text-white")}>GitHub</a>
            </nav>
        </div>
    </footer>
);
