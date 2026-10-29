import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Copy, Check, Github } from 'lucide-react';

import { cn, triggerHaptic } from '../lib/utils';
import profilePic from '../XPFP.jpg';
import { revealVariants, staggerVariants, EASE_OUT, FADE_IN } from '../lib/motion';
import { DynamicNavigation } from './DynamicNavigation';
import { PageVisitsFooter } from './PageVisitsFooter';
import { LocationIndicator } from './ui/LocationIndicator';
import { BlurShimmerText } from './ui/BlurShimmerText';
import { ScrollFillText } from './ui/ScrollFillText';
import { SectionTitle, Chevron, BlogCard, T_DISPLAY, T_TITLE, T_BODY, T_META, DARK_CARD, LINK_UNDERLINE, trackSpotlight, SpotlightLayer } from './ui/AppleSection';
import { POSTS } from '../lib/posts';
import { ProjectBento, type BentoProject } from './ui/ProjectBento';
import { ProjectCite, Words, wordCount } from './ui/ProjectCite';
import { useGithubStars, AMICRO_REPO, AMICRO_STARS } from '../lib/stars';
import { HandNote } from './ui/HandNote';
import { ToolsDock } from './ui/ToolsDock';
import { LoveHeart } from './ui/LoveHeart';
import { BlockReveal } from './ui/BlockReveal';
import { NameWave } from './ui/NameWave';
import { toast } from './ui/Toast';
import { TooltipCard } from './ui/Tooltip';
import { SnapRow } from './ui/SnapRow';
import {
    AmicroVisual,
    MonochartsVisual,
    AizenVerseVisual,
    OxygenVisual,
} from './ui/ProjectVisuals';

interface PortfolioHomeProps {
    onNavigate: (view: string, id?: string) => void;
    toggleTheme: () => void;
    isDark: boolean;
    /** False while the preloader covers the page — hold the entrance until it lifts */
    introReady?: boolean;
}

const SECTIONS = [
    { id: 'about', title: 'About' },
    { id: 'work', title: 'Work' },
    { id: 'articles', title: 'Articles' },
    { id: 'projects', title: 'Projects' },
    { id: 'lab', title: 'Experiments' },
    { id: 'contact', title: 'Contact' },
];

const WORK = [
    {
        name: 'US-based product company',
        role: 'Design Engineer',
        dates: 'Present',
        desc: 'Building interfaces, motion and component systems.',
    },
    {
        name: 'IBM SkillsBuild',
        role: 'AI/ML Intern',
        dates: 'Jun–Jul 2024',
        desc: 'Built and deployed an AI chatbot using IBM Watson Assistant, reducing manual query workload by ~40%.',
        details: [
            'Developed a Diabetes Prediction ML model achieving 75% accuracy.',
        ],
    },
];

// The best four, laid out as a bento: wide + narrow, then narrow + wide
const PROJECTS: BentoProject[] = [
    { name: 'Amicro', detail: 'Micro-interactions. {stars} stars.', href: 'https://amicro.dev', media: <AmicroVisual /> },
    { name: 'Oxygen UI', detail: 'Solana primitives.', href: 'https://oxygenui.xyz', media: <OxygenVisual /> },
    { name: 'Monocharts', detail: 'Charts for React.', href: 'https://github.com/Subhan-code/Monocharts', media: <MonochartsVisual /> },
    { name: 'Aizen Verse', detail: 'Anime streaming.', href: 'https://aizen-verse.vercel.app/', media: <AizenVerseVisual /> },
];

// The bio, in pieces around its live parts (the clock and the two projects), and the
// running word index where each piece starts, for the word-by-word blur-in
const BIO = ['Design Engineer', ', building interfaces and component systems in the open. Creator of'] as const;
const W = (() => {
    const at = [0, wordCount(BIO[0])];          // bio start, the clock
    at.push(at[1] + 1 + wordCount(BIO[1]));     // Amicro
    at.push(at[2] + 1);                         // "and"
    at.push(at[3] + 1);                         // Oxygen UI
    at.push(at[4] + 2);                         // the full stop
    at.push(at[5] + 1);                         // total
    return at;
})();

// One quiet column: the same gap after every section
const SECTION_SPACE = "pb-11 md:pb-12 scroll-mt-24";
// Hover effects only where a real pointer exists; touch gets the plain list
const CAN_HOVER = "[@media(hover:hover)_and_(pointer:fine)]";


/* --- Experiments & Components: rounded Apple cards with a tiny live preview --- */

const KanbanPreview = () => (
    <div aria-hidden className="flex gap-2 h-full">
        {[3, 2, 1].map((n, col) => (
            <div key={col} className="flex-1 rounded-[10px] bg-white/[0.04] p-1.5 flex flex-col gap-1.5">
                {Array.from({ length: n }).map((_, i) => (
                    <span
                        key={i}
                        className={cn(
                            "h-4 rounded-[5px] bg-white/[0.12] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                            // One card lifts and slides a column over on hover
                            col === 0 && i === 0 && `${CAN_HOVER}:group-hover:translate-x-[calc(100%+0.5rem)] ${CAN_HOVER}:group-hover:-translate-y-0.5 ${CAN_HOVER}:group-hover:bg-white/30`
                        )}
                    />
                ))}
            </div>
        ))}
    </div>
);

const ComponentsPreview = () => (
    <div aria-hidden className="h-full flex items-center justify-center gap-3 sm:gap-4">
        <span className="relative inline-flex h-5 w-9 rounded-full bg-white/15 transition-colors duration-500 group-hover:bg-white/40">
            <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-4" />
        </span>
        <span className="px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-medium">
            Button
        </span>
    </div>
);

const LabCard = ({ title, preview, onSelect, index }: {
    title: string; preview: React.ReactNode; onSelect: () => void; index: number;
}) => (
    <motion.button
        type="button"
        onClick={() => { triggerHaptic(10); onSelect(); }}
        {...FADE_IN}
        onMouseMove={trackSpotlight}
        className={cn("group text-left flex flex-col p-2 sm:p-3 overflow-hidden select-none", DARK_CARD)}
    >
        <SpotlightLayer />
        <div className="relative z-[2] h-24 sm:h-28 rounded-[14px] bg-black/40 p-2.5 sm:p-3 overflow-hidden">{preview}</div>
        <span className={cn(T_BODY, "relative z-[2] px-2 sm:px-3 pt-3 sm:pt-3.5 pb-1 sm:pb-1.5 font-medium text-neutral-50 flex items-center justify-between")}>
            {title}
            {/* Arrow slides in on hover */}
            <Chevron className="w-3 h-3 text-[#a1a1a1] -translate-x-0.5 transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:text-white [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0" />
        </span>
    </motion.button>
);

/* --- Original footer pieces: icon dock with email copy --- */

const XIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.294 19.497h2.039L6.486 3.24H4.298l13.309 17.41z" />
    </svg>
);

const GmailIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className={className}>
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.22 24 3.434 24 5.457z" />
    </svg>
);

const SocialDock = () => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [copied, setCopied] = useState(false);

    const socialLinks = [
        { icon: XIcon, label: "Twitter", href: "https://x.com/intent/user?screen_name=SubhanHQ" },
        { icon: GmailIcon, label: "Email", href: "mailto:syednotion@gmail.com" },
        { icon: Github, label: "GitHub", href: "https://github.com/Subhan-code" }
    ];

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        navigator.clipboard.writeText('syednotion@gmail.com');
        setCopied(true);
        triggerHaptic(15);
        toast('Email copied');
        setTimeout(() => setCopied(false), 2000);
    };

    // Neighbours swell with the hovered icon, like the macOS dock
    const getWidth = (index: number) => {
        const baseWidth = 56;
        if (hoveredIndex === null) return baseWidth;
        const distance = Math.abs(hoveredIndex - index);
        if (distance === 0) return 68;
        if (distance === 1) return 60;
        return baseWidth;
    };

    return (
        <div className="flex justify-center items-end h-[70px] pb-2">
            <ul className="flex items-end gap-2 list-none m-0 p-0">
                {socialLinks.map((link, index) => (
                    <li
                        key={link.label}
                        className="relative flex items-center justify-center transition-all duration-300"
                        style={{ width: `${getWidth(index)}px` }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() => triggerHaptic(10)}
                    >
                        <AnimatePresence>
                            {hoveredIndex === index && (
                                <TooltipCard side="top" align="center" width="auto" className="hidden md:block !p-0 !rounded-full pointer-events-auto">
                                    {link.label === 'Email' ? (
                                        // Email: the address, and a copy button whose icon morphs into a check
                                        <button
                                            type="button"
                                            onClick={handleCopy}
                                            className="group/copy flex items-center gap-2 h-8 pl-3 pr-1.5 text-[12px] font-medium text-[#a1a1a1]"
                                        >
                                            syednotion@gmail.com
                                            <span className="relative w-6 h-6 rounded-full bg-white/[0.08] group-hover/copy:bg-white/[0.14] transition-colors flex items-center justify-center">
                                                <AnimatePresence mode="popLayout" initial={false}>
                                                    <motion.span
                                                        key={copied ? 'check' : 'copy'}
                                                        initial={{ scale: 0.4, opacity: 0, filter: 'blur(2px)' }}
                                                        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                                        exit={{ scale: 0.4, opacity: 0, filter: 'blur(2px)' }}
                                                        transition={{ type: 'spring', duration: 0.3, bounce: 0.3 }}
                                                    >
                                                        {copied ? <Check className="w-3 h-3 text-white" /> : <Copy className="w-3 h-3 text-[#a1a1a1]" />}
                                                    </motion.span>
                                                </AnimatePresence>
                                            </span>
                                        </button>
                                    ) : (
                                        <span className="flex items-center h-8 px-3 text-[12px] font-medium text-[#a1a1a1]">{link.label}</span>
                                    )}
                                    {/* Invisible bridge so the tooltip stays while the cursor travels up to it */}
                                    <span aria-hidden className="absolute top-full left-0 w-full h-3" />
                                </TooltipCard>
                            )}
                        </AnimatePresence>
                        <a
                            href={link.href}
                            target={link.label === 'Email' ? undefined : "_blank"}
                            rel={link.label === 'Email' ? undefined : "noopener noreferrer"}
                            aria-label={link.label}
                            className="w-full aspect-square p-1 flex items-center justify-center"
                        >
                            <div className="w-full h-full rounded-full bg-[#171717] flex items-center justify-center hover:bg-[#222] transition-colors">
                                <link.icon className="w-1/2 h-1/2 text-neutral-50" />
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export const PortfolioHome: React.FC<PortfolioHomeProps> = ({ onNavigate, toggleTheme, isDark, introReady = true }) => {
    const triggerRef = useRef<HTMLHeadingElement>(null);    const [activeSection, setActiveSection] = useState<string | null>('about');
    const [openRow, setOpenRow] = useState<number | null>(null);
    // First visit plays the blueprint intro: hero text starts under blocks instead of fading in
    const [playIntro] = useState(!introReady);
    // Amicro's star count is live from GitHub (cached an hour; last known figure until then)
    const stars = useGithubStars(AMICRO_REPO, AMICRO_STARS);
    const projects = PROJECTS.map((p) => ({ ...p, detail: p.detail.replace('{stars}', stars) }));
    // Return visits blur the bio in word by word, so the badges wait for the last word;
    // after the intro they wait for the blocks to finish wiping instead
    const roomAt = playIntro ? 900 : W[6] * 45 + 450;

    // Photo easter egg: long-press or double-click starts an iOS-style jiggle;
    // it settles by itself, or on the next tap
    const [jiggle, setJiggle] = useState(false);
    const pressTimer = useRef<number | undefined>(undefined);
    const stopTimer = useRef<number | undefined>(undefined);
    const startJiggle = () => {
        triggerHaptic([8, 40, 8]);
        setJiggle(true);
        window.clearTimeout(stopTimer.current);
        stopTimer.current = window.setTimeout(() => setJiggle(false), 2600);
    };
    const jiggleHandlers = {
        onPointerDown: () => {
            if (jiggle) { setJiggle(false); return; }
            pressTimer.current = window.setTimeout(startJiggle, 550);
        },
        onPointerUp: () => window.clearTimeout(pressTimer.current),
        onPointerLeave: () => window.clearTimeout(pressTimer.current),
        onDragStart: () => window.clearTimeout(pressTimer.current),
        onDoubleClick: startJiggle,
        onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
    };
    useEffect(() => () => { window.clearTimeout(pressTimer.current); window.clearTimeout(stopTimer.current); }, []);

    // Scroll spy — drives the side timeline and the island's section label
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
            { rootMargin: '-40% 0px -40% 0px' }
        );
        SECTIONS.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });
        // Contact is short — claim it once the page bottoms out
        const onScroll = () => {
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) setActiveSection('contact');
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => { observer.disconnect(); window.removeEventListener('scroll', onScroll); };
    }, []);

    const scrollToSection = (id: string) => {
        triggerHaptic(5);
        const el = document.getElementById(id);
        if (!el) return;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' });
        setActiveSection(id);
    };

    return (
        <div className="relative min-h-screen bg-black text-neutral-50 font-sans overflow-x-clip">
            <DynamicNavigation
                triggerRef={triggerRef}
                toggleTheme={toggleTheme}
                isDark={isDark}
                sections={SECTIONS}
                activeSectionId={activeSection}
                onSectionClick={scrollToSection}
                onNavigate={onNavigate}
                currentView="home"
                enableIsland={true}
                shouldHideDock={activeSection === 'contact'}
                showBottomDock={false}
            />

            {/* Bottom room on phones so the back-to-top button never sits on the footer */}
            <main className="max-w-[680px] mx-auto px-5 sm:px-6 pt-32 md:pt-40 pb-24 sm:pb-10 relative z-10">
                {/* --- HERO / ABOUT — phones: photo beside the name, like a profile header.
                    Desktop: the original layout, photo on the right. One grid, two arrangements. --- */}
                <section id="about" className={SECTION_SPACE}>
                    <div className="grid grid-cols-[64px_minmax(0,1fr)] gap-x-4 items-center md:grid-cols-[minmax(0,1fr)_132px] md:gap-x-10 md:items-start">
                        <motion.div
                            initial={playIntro ? false : { opacity: 0, scale: 0.96, filter: 'blur(8px)' }}
                            animate={introReady || playIntro ? { opacity: 1, scale: 1, filter: 'blur(0px)' } : undefined}
                            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.15 }}
                            drag
                            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                            dragElastic={0.2}
                            whileHover={{ scale: 1.02, cursor: 'grab' }}
                            whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
                            {...jiggleHandlers}
                            className="relative w-16 md:w-[132px] col-start-1 row-start-1 row-span-2 md:col-start-2 md:row-span-4 z-20 touch-none [-webkit-touch-callout:none]"
                        >
                            {/* Easter egg: long-press (or double-click) and it jiggles like an
                                iOS home screen in edit mode, minus badge and all */}
                            <motion.div
                                animate={jiggle ? { rotate: [-1.8, 1.8] } : { rotate: 0 }}
                                transition={jiggle ? { duration: 0.12, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } : { type: 'spring', duration: 0.3, bounce: 0 }}
                                className="relative"
                            >
                                <BlockReveal active={playIntro} blocked={!introReady} box delay={0.05} className="rounded-[18px] md:rounded-2xl">
                                    <div className="aspect-square w-full rounded-[18px] md:rounded-2xl overflow-hidden pointer-events-none select-none">
                                        <img src={profilePic} alt="Syed Subhan" className="w-full h-full object-cover pointer-events-none" />
                                    </div>
                                </BlockReveal>
                                <AnimatePresence>
                                    {jiggle && (
                                        <motion.span
                                            aria-hidden
                                            initial={{ scale: 0.4, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.12 } }}
                                            transition={{ type: 'spring', duration: 0.35, bounce: 0.35 }}
                                            className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-[#3a3a3c] flex items-center justify-center shadow-md"
                                        >
                                            <span className="block w-2 h-[1.5px] rounded-full bg-white" />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </motion.div>

                        <motion.div
                            variants={staggerVariants(0.07)}
                            // First visit: the text is already in place under blueprint blocks
                            initial={playIntro ? 'visible' : 'hidden'}
                            animate={introReady || playIntro ? 'visible' : 'hidden'}
                            className="contents"
                        >
                            <motion.h1 ref={triggerRef} variants={revealVariants} className={cn(T_DISPLAY, "max-md:text-[24px] max-md:leading-[30px] font-bold text-neutral-50 col-start-2 row-start-1 self-end md:col-start-1 md:self-auto")}>
                                <BlockReveal active={playIntro} blocked={!introReady}>
                                    <span className="text-[#a1a1a1]">Hi, I'm</span> <NameWave>Syed Subhan</NameWave>
                                </BlockReveal>
                            </motion.h1>

                            {/* Role morph — letter by letter */}
                            <motion.div variants={revealVariants} className="col-start-2 row-start-2 self-start md:col-start-1 mt-0.5 md:mt-1 md:mb-5">
                                <BlockReveal active={playIntro} blocked={!introReady} delay={0.1}>
                                    <BlurShimmerText
                                        texts={["Design Engineer", "Indie Developer", "Open-Source Builder"]}
                                        interval={2.6}
                                        blur={6}
                                        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                                        className={cn(T_TITLE, "font-medium text-[#a1a1a1]")}
                                    />
                                </BlockReveal>
                            </motion.div>

                            {/* Bio: one quiet paragraph. Return visits blur it in word by word; then each
                                project's icon makes room beside its name and opens a card about it. */}
                            <motion.div variants={revealVariants} className={cn(T_BODY, "col-span-2 md:col-span-1 md:col-start-1 mt-5 md:mt-0 max-w-[460px] text-[#a1a1a1]")}>
                                <BlockReveal active={playIntro} blocked={!introReady} delay={0.18}>
                                    <p className={cn(!playIntro && "cite-play")}>
                                        <Words text={BIO[0]} from={0} />{' '}
                                        <span className="wd" style={{ '--i': W[1] } as React.CSSProperties}><LocationIndicator /></span>
                                        <Words text={BIO[1]} from={W[1] + 1} />{' '}
                                        <ProjectCite
                                            name="Amicro"
                                            href="https://amicro.dev"
                                            icon="/projects/amicro-icon.png"
                                            image="/projects/amicro.jpg"
                                            note={`Open-source micro-interactions for React. ${stars} GitHub stars, 5M+ views, Vercel OSS ’26.`}
                                            from={W[2]}
                                            roomAt={roomAt}
                                            ready={introReady}
                                            autoOpen
                                        />
                                        <Words text="and" from={W[3]} />{' '}
                                        <ProjectCite
                                            name="Oxygen UI"
                                            href="https://oxygenui.xyz"
                                            icon="/projects/oxygen-icon.png"
                                            image="/projects/oxygen-ui.jpg"
                                            note="Solana UI primitives, backed by Solana Foundation India."
                                            from={W[4]}
                                            roomAt={roomAt + 120}
                                            ready={introReady}
                                        />
                                        <Words text="." from={W[5]} />
                                    </p>
                                </BlockReveal>
                            </motion.div>

                            <motion.div variants={revealVariants} className="col-span-2 md:col-span-1 md:col-start-1 mt-5">
                                <HandNote delay={introReady ? 1.1 : 2.5} />
                            </motion.div>
                        </motion.div>
                    </div>
                </section>

                {/* --- WORK --- */}
                <section id="work" className={SECTION_SPACE}>
                    <SectionTitle title="Work" />
                    {/* Plain rows: space separates them, no rules or frames */}
                    <ul>
                        {WORK.map((w, i) => (
                            <motion.li
                                key={w.name}
                                {...FADE_IN}
                                className="group"
                            >
                                {/* Hover opens on desktop; tap toggles on touch */}
                                <button
                                    type="button"
                                    onClick={() => { triggerHaptic(8); setOpenRow(openRow === i ? null : i); }}
                                    aria-expanded={openRow === i}
                                    className="w-full flex items-center gap-3 py-3 text-left select-none"
                                >
                                    <span className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-x-6 gap-y-0.5">
                                        <span className={cn(T_BODY, "font-medium text-neutral-50")}>{w.name}</span>
                                        <span className={cn(T_META, "text-[#a1a1a1] sm:text-right tabular-nums")}>
                                            {w.role} · {w.dates}
                                        </span>
                                    </span>
                                    {/* Touch only: + turns into × when open */}
                                    <svg viewBox="0 0 24 24" aria-hidden className={cn("hidden [@media(hover:none)]:block w-4 h-4 shrink-0 text-[#a1a1a1] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", openRow === i && "rotate-45")} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                </button>

                                <div className={cn(
                                    "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                                    openRow === i ? "grid-rows-[1fr]" : "grid-rows-[0fr] [@media(hover:hover)_and_(pointer:fine)]:group-hover:grid-rows-[1fr]"
                                )}>
                                    <div className={cn(
                                        "overflow-hidden transition-opacity duration-300",
                                        openRow === i ? "opacity-100" : "opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 group-hover:delay-100"
                                    )}>
                                        <div className="pb-3 space-y-1.5">
                                            <p className={cn(T_META, "text-[#a1a1a1]")}>{w.desc}</p>
                                            {w.details?.map((d) => (
                                                <p key={d} className={cn(T_META, "text-[#a1a1a1]")}>{d}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.li>
                        ))}
                    </ul>
                </section>

                {/* --- ARTICLES — rounded Apple cards in a snap row, page dots underneath --- */}
                <section id="articles" className={SECTION_SPACE}>
                    <SectionTitle title="Articles" onSeeAll={() => onNavigate('blogs')} />
                    {/* A slide carousel at every size: swipe, drag the trackpad, the arrow keys,
                        or the round buttons. The next card always peeks in so it reads as more. */}
                    <SnapRow
                        controls
                        label="articles"
                        className="-mx-5 px-5 scroll-px-5 sm:-mx-6 sm:px-6 sm:scroll-px-6 flex gap-3 overflow-x-auto snap-x snap-mandatory overscroll-x-contain py-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {POSTS.map((post, i) => (
                            <BlogCard
                                key={post.id}
                                meta={`${post.date} · ${post.readTime}`}
                                title={post.title}
                                excerpt={post.excerpt}
                                onSelect={() => onNavigate('blogs', post.id)}
                                className="snap-start shrink-0 w-[82%] sm:w-[45%]"
                            />
                        ))}
                    </SnapRow>
                </section>

                {/* --- PROJECTS — swipe row on phones, grid on desktop --- */}
                <section id="projects" className={SECTION_SPACE}>
                    <SectionTitle title="Projects" />
                    <ProjectBento projects={projects} mobileRow />
                </section>

                {/* --- EXPERIMENTS & COMPONENTS --- */}
                <section id="lab" className={SECTION_SPACE}>
                    <SectionTitle title="Experiments" onSeeAll={() => onNavigate('experiments')} />
                    {/* Two compact cards side by side, even on phones */}
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                        <LabCard index={0} title="Kanban Board" preview={<KanbanPreview />} onSelect={() => onNavigate('kanban')} />
                        <LabCard index={1} title="Components" preview={<ComponentsPreview />} onSelect={() => onNavigate('experiments')} />
                    </div>
                </section>

                {/* --- TOOLS — a dock that swells toward the pointer --- */}
                <section id="tools" className={SECTION_SPACE}>
                    <SectionTitle title="Tools" aside={<span className={cn(T_META, "text-[#a1a1a1]")}>What I make things in</span>} />
                    <ToolsDock />
                </section>

                {/* --- SCROLL-FILL SENTENCE --- */}
                <div className="pt-4 md:pt-6 pb-12 md:pb-14">
                    <ScrollFillText />
                </div>

                {/* --- VISITOR COUNTER (original, above contact) --- */}
                <div className="mb-8">
                    <PageVisitsFooter />
                </div>

                {/* --- CONTACT + ORIGINAL FOOTER --- */}
                <section id="contact" className="scroll-mt-32">
                    <div className="flex flex-col items-center text-center">
                        <h2 className={cn(T_DISPLAY, "font-semibold text-neutral-50 mb-6 md:mb-8 max-w-[420px] text-balance")}>
                            Let's build something extraordinary
                        </h2>

                        <div className="relative z-10 mb-8">
                            <SocialDock />
                        </div>

                        {/* Footer: credit on the left, a direct line on the right. Stacks on phones. */}
                        <div className={cn(T_META, "w-full pt-5 pb-2 flex flex-col-reverse items-center gap-3 sm:flex-row sm:justify-between text-[#a1a1a1]")}>
                            <p className="inline-flex items-center gap-1.5 tabular-nums">
                                © {new Date().getFullYear()} Syed Subhan
                                <span aria-hidden className="text-[#a1a1a1]">·</span>
                                Built with love <LoveHeart />
                            </p>
                            <nav aria-label="Get in touch" className="flex items-center gap-4">
                                <a href="https://x.com/SubhanHQ" target="_blank" rel="noopener noreferrer" className={cn(LINK_UNDERLINE, "text-[#a1a1a1] hover:text-white")}>DM me</a>
                                <span aria-hidden className="text-[#a1a1a1]">or</span>
                                <a href="mailto:syednotion@gmail.com" className={cn(LINK_UNDERLINE, "text-[#a1a1a1] hover:text-white")}>Mail me</a>
                            </nav>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};
