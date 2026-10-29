import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { cn } from '../../lib/utils';

/*
 * Block reveal for the hero's first load.
 *
 * While `blocked`, every line of the wrapped content is covered by a flat block
 * (measured from the browser's own line boxes, so it fits each line exactly). When
 * `blocked` turns false, each block wipes off left to right, line by line, and the
 * real text is underneath.
 *
 * `active` is read once: if the intro isn't playing, this renders its children as-is.
 */

type Rect = { x: number; y: number; w: number; h: number };
const DRAW = [0.65, 0, 0.35, 1] as const;

/** One box per visual line, from the text's own line boxes (not its wrappers') */
const measureLines = (el: HTMLElement): Rect[] => {
    const base = el.getBoundingClientRect();
    const rects: DOMRect[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const range = document.createRange();
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (!n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        rects.push(...Array.from(range.getClientRects()));
    }
    const lines: Rect[] = [];
    for (const r of rects) {
        if (r.width < 1 || r.height < 1) continue;
        const y = r.top - base.top;
        // Same line if the centres sit close (superscripts and inline buttons share a line)
        const cy = y + r.height / 2;
        const line = lines.find((l) => Math.abs(l.y + l.h / 2 - cy) < Math.max(l.h, r.height) / 2);
        if (line) {
            const right = Math.max(line.x + line.w, r.right - base.left);
            const bottom = Math.max(line.y + line.h, y + r.height);
            line.x = Math.min(line.x, r.left - base.left);
            line.y = Math.min(line.y, y);
            line.w = right - line.x;
            line.h = bottom - line.y;
        } else {
            lines.push({ x: r.left - base.left, y, w: r.width, h: r.height });
        }
    }
    return lines;
};

export const BlockReveal = ({
    active, blocked, children, className, delay = 0, box = false,
}: {
    /** Is the intro playing? Read once on mount. */
    active: boolean;
    /** Covered now; flips to false to reveal */
    blocked: boolean;
    children: React.ReactNode;
    className?: string;
    /** Seconds before this element's blocks start wiping */
    delay?: number;
    /** One block over the whole element (images) instead of one per line */
    box?: boolean;
}) => {
    const reduce = useReducedMotion();
    const [intro] = useState(active && !reduce);
    const ref = useRef<HTMLSpanElement>(null);
    const [lines, setLines] = useState<Rect[]>([]);

    useEffect(() => {
        if (!intro || !ref.current) return;
        const el = ref.current;
        const read = () => {
            setLines(box ? [{ x: 0, y: 0, w: el.offsetWidth, h: el.offsetHeight }] : measureLines(el));
        };
        // Measure once styled: the Tailwind CDN writes its CSS just after React commits,
        // so wait two frames. Fonts landing or any resize rewraps the text: measure again.
        let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(read); });
        document.fonts?.ready.then(read);
        const ro = new ResizeObserver(() => requestAnimationFrame(read));
        ro.observe(el);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, [intro, box]);

    if (!intro) return <span className={cn("block", className)}>{children}</span>;

    const state = blocked ? 'blocked' : 'open';

    return (
        <span ref={ref} className={cn("relative block", className)}>
            {/* Hidden while blocked (opacity keeps the layout we measure); shown the moment the
                wipe starts, still under the blocks until their edge passes. Inline, not a
                class: the Tailwind CDN writes classes a beat after the first paint */}
            <span className="block" style={{ opacity: blocked ? 0 : 1 }}>{children}</span>
            {lines.map((l, i) => (
                <motion.span
                    key={i}
                    aria-hidden
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={state}
                    variants={{
                        // Blocks draw in quickly, line by line, like a pen filling a box
                        blocked: { clipPath: 'inset(0 0% 0 0%)', transition: { duration: 0.45, ease: DRAW, delay: 0.15 + i * 0.06 } },
                        // Then wipe off left to right, revealing the text beneath
                        open: { clipPath: 'inset(0 0% 0 100%)', transition: { duration: 0.6, ease: DRAW, delay: delay + i * 0.08 } },
                    }}
                    className={cn(
                        "pointer-events-none absolute z-10 bg-[#171717]",
                        box ? "rounded-[inherit]" : "rounded-[3px]"
                    )}
                    style={{ left: l.x, top: l.y + (box ? 0 : 1), width: l.w, height: l.h - (box ? 0 : 2) }}
                />
            ))}
        </span>
    );
};
