import React, { useEffect, useRef, useState } from 'react';
import { cn, triggerHaptic } from '../../lib/utils';
import { Chevron } from './AppleSection';

/**
 * A horizontal snap row with page dots underneath, like an iOS page control.
 * The active dot follows the swipe; tapping a dot jumps to that card.
 * With `controls`, round ‹ › buttons sit beside the dots and step one card at a time.
 */
export const SnapRow = ({ children, className, dotsClassName, controls = false, label = 'items' }: {
    children: React.ReactNode;
    /** Classes for the scroll container (layout, gutters, breakpoints) */
    className?: string;
    /** Classes for the dots row, e.g. "md:hidden" when the row turns into a grid */
    dotsClassName?: string;
    /** Show previous/next buttons (a real carousel at every size) */
    controls?: boolean;
    /** What the row holds, for button labels: "Previous articles" */
    label?: string;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [active, setActive] = useState(0);
    const [edges, setEdges] = useState({ start: true, end: false });
    const count = React.Children.count(children);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let frame = 0;
        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const kids = Array.from(el.children) as HTMLElement[];
                const start = kids[0]?.offsetLeft ?? 0;
                const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
                setEdges({ start: el.scrollLeft <= 4, end: atEnd });
                // At the far end the last card can't snap to the start, so claim it there
                if (atEnd) return setActive(kids.length - 1);
                let best = 0;
                kids.forEach((k, i) => {
                    if (Math.abs(k.offsetLeft - start - el.scrollLeft) < Math.abs(kids[best].offsetLeft - start - el.scrollLeft)) best = i;
                });
                setActive(best);
            });
        };
        onScroll();
        el.addEventListener('scroll', onScroll, { passive: true });
        const ro = new ResizeObserver(onScroll);
        ro.observe(el);
        return () => { el.removeEventListener('scroll', onScroll); ro.disconnect(); cancelAnimationFrame(frame); };
    }, []);

    const goTo = (i: number) => {
        const el = ref.current;
        const kids = el ? (Array.from(el.children) as HTMLElement[]) : [];
        const target = kids[Math.max(0, Math.min(i, kids.length - 1))];
        if (!el || !target) return;
        triggerHaptic(5);
        el.scrollTo({ left: target.offsetLeft - kids[0].offsetLeft, behavior: 'smooth' });
    };

    // Arrow keys step the carousel when focus is inside it
    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1); }
    };

    const step = (dir: -1 | 1) => (
        <button
            type="button"
            onClick={() => goTo(active + dir)}
            disabled={dir < 0 ? edges.start : edges.end}
            aria-label={`${dir < 0 ? 'Previous' : 'Next'} ${label}`}
            className={cn(
                "group/step w-8 h-8 rounded-full flex items-center justify-center bg-[#171717] ring-1 ring-inset ring-white/[0.06] text-[#a1a1a1]",
                "transition-[background-color,color,opacity,transform] duration-150 ease-out hover:bg-[#1f1f1f] hover:text-white active:scale-[0.92]",
                "disabled:opacity-30 disabled:pointer-events-none"
            )}
        >
            <Chevron
                dir={dir < 0 ? 'left' : 'right'}
                className={cn("w-3 h-3 transition-transform duration-200 ease-out", dir < 0 ? "group-hover/step:-translate-x-px" : "group-hover/step:translate-x-px")}
            />
        </button>
    );

    return (
        <>
            <div ref={ref} onKeyDown={onKeyDown} className={className}>{children}</div>
            {count > 1 && (
                <div className={cn("flex items-center gap-3 pt-1", controls ? "justify-between" : "justify-center", dotsClassName)}>
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: count }).map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => goTo(i)}
                                aria-label={`Go to item ${i + 1}`}
                                aria-current={active === i}
                                // Small dot, generous hit area
                                className="relative h-5 flex items-center before:absolute before:-inset-x-1.5 before:inset-y-0"
                            >
                                <span className={cn(
                                    "block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                                    active === i ? "w-4 bg-white/70" : "w-1.5 bg-white/20"
                                )} />
                            </button>
                        ))}
                    </div>
                    {controls && <div className="flex items-center gap-1.5">{step(-1)}{step(1)}</div>}
                </div>
            )}
        </>
    );
};
