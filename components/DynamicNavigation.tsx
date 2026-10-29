import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from 'framer-motion';
import { cn, triggerHaptic } from '../lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { NumberTicker } from './NumberTicker';
import { AppleDock } from './AppleDock';
import { EASE_OUT, EASE_EXIT } from '../lib/motion';

interface DynamicNavigationProps {
    triggerRef: React.RefObject<HTMLElement>;
    toggleTheme: () => void;
    isDark: boolean;
    sections?: { id: string; title: string }[];
    activeSectionId?: string | null;
    onSectionClick?: (id: string) => void;
    onNavigate: (view: string) => void;
    currentView: string;
    enableIsland?: boolean;
    shouldHideDock?: boolean;
    /** Show the floating icon dock at the bottom while in island mode */
    showBottomDock?: boolean;
}

const NAV_ITEMS = [
    { name: 'Home', view: 'home' },
    { name: 'Projects', view: 'projects' },
    { name: 'Articles', view: 'blogs' },
    { name: 'Contact', view: 'contact' },
];

const TOC_PANEL = {
    hidden: { opacity: 0, scale: 0.95, y: -8, filter: 'blur(8px)' },
    visible: {
        opacity: 1, scale: 1, y: 0, filter: 'blur(0px)',
        transition: { duration: 0.38, ease: EASE_OUT, staggerChildren: 0.03, delayChildren: 0.04 },
    },
    exit: {
        opacity: 0, scale: 0.97, y: -4, filter: 'blur(6px)',
        transition: { duration: 0.18, ease: EASE_EXIT },
    },
};

const TOC_ITEM = {
    hidden: { opacity: 0, y: 6, filter: 'blur(3px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.32, ease: EASE_OUT } },
    exit: { opacity: 0, transition: { duration: 0.1 } },
};

// High stiffness = fast. Low damping = bouncy. Low mass = lightweight/snappy.
const SPRING_TRANSITION = { type: "spring" as const, stiffness: 500, damping: 22, mass: 0.6 };
// Island is an 'alive' element: a touch of bounce, but damped enough to never wobble
const ISLAND_SPRING = { type: "spring" as const, stiffness: 500, damping: 32, mass: 0.6 };

export const DynamicNavigation: React.FC<DynamicNavigationProps> = ({
    triggerRef,
    toggleTheme,
    isDark,
    sections = [],
    activeSectionId,
    onSectionClick,
    onNavigate,
    currentView,
    enableIsland = false,
    shouldHideDock = false,
    showBottomDock = true
}) => {
    const [isOpen, setIsOpen] = useState(false);

    // Mobile Detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Island State
    const [isScrolled, setIsScrolled] = useState(false);
    const [isIslandExpanded, setIsIslandExpanded] = useState(false);
    const { scrollYProgress } = useScroll();
    const [progressValue, setProgressValue] = useState(0);
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

    useMotionValueEvent(scrollYProgress, "change", (latest) => {
        setProgressValue(Math.round(latest * 100));
    });

    useEffect(() => {
        const handleScroll = () => {
            if (!enableIsland) {
                if (isScrolled) setIsScrolled(false);
                return;
            }
            if (triggerRef.current) {
                // Use getBoundingClientRect for accurate position relative to viewport
                const rect = triggerRef.current.getBoundingClientRect();
                // Calculate the absolute bottom position of the trigger element in the document
                const triggerBottomAbsolute = rect.bottom + window.scrollY;

                // Trigger slightly before (100px) the user scrolls past the element
                const shouldBeScrolled = window.scrollY > (triggerBottomAbsolute - 100);

                if (shouldBeScrolled !== isScrolled) {
                    setIsScrolled(shouldBeScrolled);
                    triggerHaptic(5); // Subtle haptic on mode switch
                    // If we scroll back up, ensure island is closed so menu trigger looks right
                    if (!shouldBeScrolled) setIsIslandExpanded(false);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [triggerRef, isScrolled, enableIsland]);

    useEffect(() => {
        if (!isOpen) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = previous; };
    }, [isOpen]);

    const navRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!isIslandExpanded) return;
        const onPointerDown = (e: PointerEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) setIsIslandExpanded(false);
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [isIslandExpanded]);

    // Close on escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
                setIsIslandExpanded(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    const handleNavClick = (view: string) => {
        triggerHaptic(15);
        onNavigate(view);
        setIsOpen(false);
    };

    const handleToggle = () => {
        triggerHaptic(10);
        if (isIslandMode) {
            setIsIslandExpanded(!isIslandExpanded);
        } else {
            setIsOpen(!isOpen);
        }
    };

    const handleThemeToggle = () => {
        triggerHaptic(10);
        toggleTheme();
    };

    // Logic to determine active mode
    // 1. Island Mode: Scrolled AND Island Enabled AND Menu is NOT open AND Not Hidden
    const isIslandMode = isScrolled && enableIsland && !isOpen && !shouldHideDock;

    // Responsive Widths
    // Compact: a small pill that grows into a small menu
    const getOpenWidth = () => isMobile ? "min(88vw, 320px)" : 320;
    const getClosedWidth = () => isMobile ? 136 : 148;
    const getIslandWidth = () => isMobile ? 196 : 208;
    const getTriggerHeight = () => (isIslandMode ? 36 : 40);

    return (
        <>
            {/* BACKGROUND BACKDROP */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity",
                    isOpen ? "opacity-100 pointer-events-auto duration-300 ease-out" : "opacity-0 pointer-events-none duration-200 ease-in"
                )}
                onClick={() => setIsOpen(false)}
            />

            {/* FIXED CONTAINER */}
            <div ref={navRef} className="fixed top-5 left-0 w-full z-50 flex flex-col items-center pointer-events-none">

                {/* 
            UNIFIED TRIGGER BUTTON 
        */}
                <div className="pointer-events-auto z-50">
                    <motion.button
                        onClick={handleToggle}
                        aria-expanded={isIslandMode ? isIslandExpanded : isOpen}
                        aria-label={isIslandMode ? 'Jump to section' : (isOpen ? 'Close menu' : 'Open menu')}
                        transition={isIslandMode ? ISLAND_SPRING : SPRING_TRANSITION}
                        className={cn(
                            "relative flex items-center overflow-hidden shadow-2xl border transition-colors duration-300",
                            // Invert Colors based on theme
                            "bg-[#111] dark:bg-white border-white/10 dark:border-black/5",
                            "hover:bg-[#1a1a1a] dark:hover:bg-[#f2f2f2]"
                        )}
                        initial={false}
                        animate={{
                            width: isOpen
                                ? getOpenWidth()
                                : (isIslandMode ? getIslandWidth() : getClosedWidth()),
                            height: getTriggerHeight(),
                            borderRadius: isIslandMode ? 18 : 20,
                        }}
                    >
                        <AnimatePresence mode="popLayout">
                            {isIslandMode ? (
                                /* --- ISLAND CONTENT --- */
                                <motion.div
                                    key="island-content"
                                    initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex flex-col w-full px-1"
                                >
                                    <div className="flex items-center justify-between w-full pl-2 pr-2 h-[36px]">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className={cn(
                                                "text-[12px] font-medium truncate max-w-[100px] md:max-w-[130px]", // Reduced font size and max-width for mobile
                                                "text-white dark:text-black"
                                            )}>
                                                {sections.find(s => s.id === activeSectionId)?.title || "Contents"}
                                            </span>
                                            <ChevronDown size={13} className={cn("text-[#a1a1a1] dark:text-black/50 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]", isIslandExpanded && "rotate-180")} />
                                        </div>

                                        <div className="flex items-center gap-3 pl-2">
                                            <div className="text-[10px] font-medium text-white dark:text-black tabular-nums">
                                                <NumberTicker value={progressValue} />
                                            </div>
                                            <div className="relative w-3.5 h-3.5 flex items-center justify-center"> {/* w-4 h-4 -> w-3.5 h-3.5 */}
                                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="5" className="text-[#a1a1a1] dark:text-black/10" />
                                                    <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="5" className="text-white dark:text-black" style={{ pathLength: smoothProgress }} />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>

                                </motion.div>
                            ) : (
                                /* --- MENU TRIGGER CONTENT --- */
                                <motion.div
                                    key="menu-trigger"
                                    initial={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                    className="flex items-center justify-between w-full h-full pl-1.5 pr-4"
                                >
                                    {/* The little face stays: it's the brand */}
                                    <StellarBuddy className="scale-[0.75] origin-left" />

                                    <div className="flex items-center">
                                        <div className="relative h-3.5 w-11 overflow-hidden flex flex-col items-end"> {/* h-4 -> 3.5, w-12 -> 11 */}
                                            <div className={cn(
                                                "flex flex-col items-end gap-1 transition-transform duration-500 ease-[cubic-bezier(0.32,0.725,0,1)]",
                                                isOpen ? "-translate-y-[18px]" : "translate-y-0" // 20px -> 18px
                                            )}>
                                                <span className="text-[10px] font-bold tracking-widest text-[#a1a1a1] dark:text-black h-[14px] flex items-center">MENU</span> {/* text-11 -> 10, h-16 -> 14 */}
                                                <span className="text-[10px] font-bold tracking-widest text-[#a1a1a1] dark:text-black h-[14px] flex items-center">CLOSE</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>

                {/* Section list — its own surface, so the pill never has to morph its height */}
                <AnimatePresence>
                    {isIslandMode && isIslandExpanded && sections.length > 0 && (
                        <motion.div
                            key="island-toc"
                            variants={TOC_PANEL}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            style={{ transformOrigin: 'top center' }}
                            className="pointer-events-auto mt-2 w-[260px] p-1.5 rounded-[20px] bg-[#111] dark:bg-white border border-white/10 dark:border-black/5 shadow-2xl"
                        >
                            <ul className="flex flex-col gap-0.5 max-h-[min(60vh,320px)] overflow-y-auto overscroll-contain">
                                {sections.map((section) => {
                                    const isActive = activeSectionId === section.id;
                                    return (
                                        <motion.li key={section.id} variants={TOC_ITEM}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic(10);
                                                    if (onSectionClick) onSectionClick(section.id);
                                                    setIsIslandExpanded(false);
                                                }}
                                                aria-current={isActive ? 'location' : undefined}
                                                className={cn(
                                                    "flex w-full items-center justify-between px-3 py-2 rounded-[14px] text-[13px] text-left transition-colors duration-150 active:scale-[0.98]",
                                                    isActive
                                                        ? "bg-white/10 dark:bg-black/5 text-white dark:text-black font-medium"
                                                        : "text-[#a1a1a1] dark:text-black/60 hover:bg-white/5 dark:hover:bg-black/[0.03] hover:text-white dark:hover:text-black"
                                                )}
                                            >
                                                <span className="truncate">{section.title}</span>
                                                {isActive && <Check size={12} strokeWidth={2} className="opacity-60 shrink-0 ml-2" />}
                                            </button>
                                        </motion.li>
                                    );
                                })}
                            </ul>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 
            EXPANDED MENU CONTENT 
            (Only visible when Open)
        */}
                <div className="flex flex-col items-center gap-2 mt-2 w-full perspective-1000">

                    {/* MAIN CARD (NAVIGATION) */}
                    <motion.nav
                        aria-label="Main"
                        aria-hidden={!isOpen}
                        initial={false}
                        animate={isOpen ? {
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            height: 216,
                            width: getOpenWidth(),
                            pointerEvents: "auto"
                        } : {
                            opacity: 0,
                            y: -20,
                            scale: 0.95,
                            height: 0,
                            width: isMobile ? 136 : 148,
                            pointerEvents: "none"
                        }}
                        transition={SPRING_TRANSITION}
                        className="relative bg-[#111] dark:bg-white border border-white/10 dark:border-black/5 rounded-[20px] shadow-2xl overflow-hidden flex flex-col items-center origin-top"
                    >
                        <div className="w-full h-full p-2 flex flex-col justify-center">
                            {NAV_ITEMS.map((item, i) => {
                                const isCurrent = item.view === currentView;
                                return (
                                    <motion.button
                                        key={item.name}
                                        type="button"
                                        onClick={() => handleNavClick(item.view)}
                                        aria-current={isCurrent ? 'page' : undefined}
                                        tabIndex={isOpen ? 0 : -1}
                                        // Items cascade in after the card opens, and leave together
                                        initial={false}
                                        animate={isOpen
                                            ? { opacity: 1, y: 0, filter: 'blur(0px)', transition: { delay: 0.08 + i * 0.04, duration: 0.35, ease: EASE_OUT } }
                                            : { opacity: 0, y: -6, filter: 'blur(3px)', transition: { duration: 0.12 } }}
                                        whileTap={{ scale: 0.97 }}
                                        className={cn(
                                            "flex items-center justify-center w-full h-11 px-4 rounded-[14px] font-sans text-[15px] font-medium text-center transition-colors duration-150",
                                            isCurrent
                                                ? "bg-white/[0.08] dark:bg-black/[0.05] text-white dark:text-black"
                                                : "text-[#a1a1a1] dark:text-black/60 hover:bg-white/[0.05] dark:hover:bg-black/[0.03] hover:text-white dark:hover:text-black"
                                        )}
                                    >
                                        {item.name}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </motion.nav>

                </div>
            </div>

            {/* APPLE STYLE DOCK - Appears only when scrolled (Island Mode) */}
            <AppleDock
                visible={Boolean(isIslandMode) && showBottomDock}
                onNavigate={onNavigate}
                toggleTheme={handleThemeToggle}
                isDark={isDark}
            />
        </>
    );
};

// --- Stellar Buddy Component ---

const StellarBuddy = ({ className }: { className?: string }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftPupilRef = useRef<HTMLDivElement>(null);
    const rightPupilRef = useRef<HTMLDivElement>(null);
    const [isBlinking, setIsBlinking] = useState(false);

    useEffect(() => {
        const movePupils = (e: MouseEvent | TouchEvent) => {
            if (!containerRef.current || !leftPupilRef.current || !rightPupilRef.current) return;

            let clientX, clientY;
            if ('touches' in e) {
                // For touch events, we might not want to track as aggressively or at all,
                // but if we do, use the first touch.
                return; // Disable pupil tracking on touch to save perfs
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }

            const rect = containerRef.current.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;

            // Limit movement range (approx 15% of size)
            const maxMove = rect.width * 0.15;

            let dx = clientX - cx;
            let dy = clientY - cy;

            const dist = Math.hypot(dx, dy);
            if (dist > maxMove) {
                dx = (dx / dist) * maxMove;
                dy = (dy / dist) * maxMove;
            }

            const transform = `translate(${dx}px, ${dy}px)`;
            leftPupilRef.current.style.transform = transform;
            rightPupilRef.current.style.transform = transform;
        };

        window.addEventListener('mousemove', movePupils);
        return () => window.removeEventListener('mousemove', movePupils);
    }, []);

    // Blinking Logic
    useEffect(() => {
        let blinkTimeout: ReturnType<typeof setTimeout>;

        const blink = () => {
            setIsBlinking(true);
            setTimeout(() => setIsBlinking(false), 200);

            // Random interval between 3s and 6s
            const nextBlink = Math.random() * 3000 + 3000;
            blinkTimeout = setTimeout(blink, nextBlink);
        };

        blinkTimeout = setTimeout(blink, 3000);
        return () => clearTimeout(blinkTimeout);
    }, []);

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-10 h-10 rounded-full flex items-center justify-center gap-[6px] shadow-sm overflow-hidden shrink-0",
                // Light Mode (White Theme): White Buddy
                "bg-[radial-gradient(circle_at_40%_40%,#fff,#f0f0f0_40%,#d4d4d4_70%)]",
                // Dark Mode (Black Theme): Black Buddy
                "dark:bg-[radial-gradient(circle_at_40%_40%,#333,#111_40%,#000_70%)]",
                "border border-black/5 dark:border-black/10", // Subtle definition
                className
            )}
        >
            <motion.div
                ref={leftPupilRef}
                animate={{ height: isBlinking ? 3 : 13 }}
                className="w-[5px] bg-[#050505] dark:bg-white rounded-full"
            />
            <motion.div
                ref={rightPupilRef}
                animate={{ height: isBlinking ? 3 : 13 }}
                className="w-[5px] bg-[#050505] dark:bg-white rounded-full"
            />
        </div>
    );
};