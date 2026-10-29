
import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import Timeline from './Timeline';
import { PageVisitsFooter } from './PageVisitsFooter';
import { CopyButton } from './ui/CopyButton';
import { cn, triggerHaptic } from '../lib/utils';
import { EASE_OUT, revealVariants, staggerVariants } from '../lib/motion';
import { BackPill, PAGE_WIDTH } from './ui/PageShell';
import { DARK_CARD, T_DISPLAY, T_META, T_BODY, trackSpotlight, SpotlightLayer } from './ui/AppleSection';
import FilledCheckedIcon from './icons/FilledCheckedIcon';

export interface ArticleSection {
    id: string;
    title: string;
}

interface ArticleLayoutProps {
    onNavigate: (view: string, id?: string) => void;
    toggleTheme: () => void;
    isDark: boolean;
    sections: ArticleSection[];
    title: string;
    date: string;
    category?: string;
    children: React.ReactNode;
    prevArticle?: { title: string; id: string };
    nextArticle?: { title: string; id: string };
}

const CAN_HOVER = "[@media(hover:hover)_and_(pointer:fine)]";

/** The site's arrow, the ">" alone, flipped for "previous" */
const HalfArrow = ({ back = false }: { back?: boolean }) => (
    <svg viewBox="0 0 16 16" aria-hidden className={cn("w-3.5 h-3.5 shrink-0", back && "-scale-x-100")} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
);

export const ArticleLayout: React.FC<ArticleLayoutProps> = ({
    onNavigate,
    sections,
    title,
    date,
    category = "Development",
    children,
    prevArticle,
    nextArticle
}) => {
    const [activeSection, setActiveSection] = useState<string | null>(sections[0]?.id || null);

    // Reading progress: a hairline across the top that fills as you read
    const { scrollYProgress } = useScroll();
    const progress = useSpring(scrollYProgress, { stiffness: 160, damping: 30, restDelta: 0.001 });

    // Scroll spy drives the side timeline
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
            { rootMargin: '-40% 0px -40% 0px', threshold: 0 }
        );
        sections.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [sections]);

    const scrollToSection = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
        setActiveSection(id);
    };

    const [toasts, setToasts] = useState<{ id: number }[]>([]);
    const handleCopyStatus = (isCopied: boolean) => {
        if (!isCopied) return;
        const newId = Date.now();
        setToasts((prev) => [...prev, { id: newId }]);
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== newId)), 3000);
    };

    return (
        <div className="min-h-[100dvh] bg-black text-neutral-50 font-sans">
            {/* Reading progress */}
            <motion.div aria-hidden style={{ scaleX: progress }} className="fixed top-0 inset-x-0 z-50 h-[2px] origin-left bg-white/70" />

            <Timeline sections={sections} activeId={activeSection} onSectionClick={scrollToSection} />

            <main className={PAGE_WIDTH}>
                {/* Top bar: back to the list, copy this page's link */}
                <div className="h-20 flex items-center justify-between">
                    <BackPill onClick={() => onNavigate('blogs')} label="Articles" />
                    <CopyButton
                        content={typeof window !== 'undefined' ? window.location.href : ''}
                        onCopiedChange={handleCopyStatus}
                        variant="ghost"
                        className="h-10 px-4 rounded-full bg-[#1c1c1c] hover:!bg-[#242424] text-[#a1a1a1] hover:text-white text-[14px] transition-colors"
                    >
                        <span className="font-medium">Copy link</span>
                    </CopyButton>
                </div>

                {/* Header */}
                <motion.header
                    id={sections[0]?.id || 'top'}
                    variants={staggerVariants(0.07)}
                    initial="hidden"
                    animate="visible"
                    className="pt-14 pb-10 scroll-mt-24"
                >
                    <motion.p variants={revealVariants} className={cn(T_META, "text-[#a1a1a1] tabular-nums")}>
                        {date}
                    </motion.p>
                    <motion.h1 variants={revealVariants} className={cn(T_DISPLAY, "mt-2 font-bold text-neutral-50 text-balance")}>
                        {title}
                    </motion.h1>
                </motion.header>

                {/* Body: the article's own markup, normalised by .article-prose */}
                <motion.article
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.7, ease: EASE_OUT }}
                    className="article-prose pb-8"
                >
                    {children}
                </motion.article>

                {/* Previous / next */}
                {(prevArticle || nextArticle) && (
                    <nav aria-label="More articles" className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {prevArticle ? (
                            <button
                                type="button"
                                onMouseMove={trackSpotlight}
                                onClick={() => { triggerHaptic(10); onNavigate('blogs', prevArticle.id); }}
                                className={cn("group p-5 text-left overflow-hidden", DARK_CARD)}
                            >
                                <SpotlightLayer />
                                <span className={cn(T_META, "relative z-[2] flex items-center gap-1.5 text-[#a1a1a1]")}>
                                    <span className={cn("transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER}:group-hover:-translate-x-1`)}><HalfArrow back /></span>
                                    Previous
                                </span>
                                <span className={cn(T_BODY, "relative z-[2] mt-1.5 block font-medium text-neutral-50 line-clamp-1")}>{prevArticle.title}</span>
                            </button>
                        ) : <div className="hidden sm:block" />}
                        {nextArticle && (
                            <button
                                type="button"
                                onMouseMove={trackSpotlight}
                                onClick={() => { triggerHaptic(10); onNavigate('blogs', nextArticle.id); }}
                                className={cn("group p-5 text-right overflow-hidden", DARK_CARD)}
                            >
                                <SpotlightLayer />
                                <span className={cn(T_META, "relative z-[2] flex items-center justify-end gap-1.5 text-[#a1a1a1]")}>
                                    Next
                                    <span className={cn("transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER}:group-hover:translate-x-1`)}><HalfArrow /></span>
                                </span>
                                <span className={cn(T_BODY, "relative z-[2] mt-1.5 block font-medium text-neutral-50 line-clamp-1")}>{nextArticle.title}</span>
                            </button>
                        )}
                    </nav>
                )}

                <div className="py-16">
                    <PageVisitsFooter />
                </div>
            </main>

            {/* Stacked "Copied" toasts */}
            <div
                className="fixed right-5 z-50 flex flex-col items-end pointer-events-none"
                style={{ bottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))' }}
            >
                <AnimatePresence mode="popLayout">
                    {toasts.map((toast, index) => {
                        const offset = toasts.length - 1 - index;
                        if (offset > 2) return null;
                        return (
                            <motion.div
                                key={toast.id}
                                layout
                                initial={{ opacity: 0, y: 24, scale: 0.94, filter: 'blur(4px)' }}
                                animate={{ opacity: 1 - offset * 0.25, y: -offset * 12, scale: 1 - offset * 0.05, filter: 'blur(0px)', zIndex: 100 - offset }}
                                exit={{ opacity: 0, scale: 0.94, filter: 'blur(4px)', transition: { duration: 0.18 } }}
                                transition={{ type: 'spring', duration: 0.45, bounce: 0.1 }}
                                className="absolute bottom-0 right-0 w-[280px] pointer-events-auto flex items-center gap-3 p-3 pr-10 rounded-[16px] bg-[#1c1c1c]/95 backdrop-blur-xl ring-1 ring-inset ring-white/[0.08] shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                            >
                                <FilledCheckedIcon size={24} className="text-white shrink-0" />
                                <span className="flex flex-col">
                                    <span className="text-[13px] font-medium text-neutral-50">Copied</span>
                                    <span className="text-[12px] text-[#a1a1a1]">Link added to clipboard</span>
                                </span>
                                <button
                                    type="button"
                                    aria-label="Dismiss"
                                    className="absolute top-1/2 -translate-y-1/2 right-3 w-6 h-6 rounded-full flex items-center justify-center text-[#a1a1a1] hover:text-white hover:bg-white/[0.06] transition-colors"
                                    onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M18 6 6 18M6 6l12 12" /></svg>
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};
