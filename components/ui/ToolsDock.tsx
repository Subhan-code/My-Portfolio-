import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from 'framer-motion';
import { cn, triggerHaptic } from '../../lib/utils';
import { TooltipCard } from './Tooltip';

/*
 * The tools I work in, as a macOS dock. Icons swell toward the pointer (neighbours a
 * little, the one under it most), sit in grey until hovered, name themselves in a
 * tooltip, and hop like a launching app when clicked. Touch gets a still row; a tap
 * still hops.
 */

const TOOLS = [
    { name: 'Figma', icon: '/AppIcons/figma.png' },
    { name: 'VS Code', icon: '/AppIcons/vscode.png' },
    { name: 'Motion', icon: '/AppIcons/motion.png' },
    { name: 'Notion', icon: '/AppIcons/notion.png' },
    { name: 'Brave', icon: '/AppIcons/brave.png' },
    { name: 'Discord', icon: '/AppIcons/discord.png' },
    { name: 'Gumroad', icon: '/AppIcons/gumroad.png' },
    { name: 'Reddit', icon: '/AppIcons/reddit.png' },
];

// Resting size, the size right under the pointer, and how far the swell reaches
const BASE = { phone: 30, desk: 40 };
const PEAK = 58;
const REACH = 130;

const DockIcon = ({ name, icon, mouseX, base }: { name: string; icon: string; mouseX: MotionValue<number>; base: number }) => {
    const ref = useRef<HTMLButtonElement>(null);
    const reduce = useReducedMotion();
    const hop = useAnimationControls();
    const [hover, setHover] = useState(false);

    // Distance from the pointer to this icon's centre drives its size, through a spring
    const distance = useTransform(mouseX, (x) => {
        const r = ref.current?.getBoundingClientRect();
        return r ? x - (r.left + r.width / 2) : Infinity;
    });
    const target = useTransform(distance, [-REACH, 0, REACH], [base, reduce ? base : PEAK, base]);
    const size = useSpring(target, { mass: 0.1, stiffness: 180, damping: 13 });

    const launch = () => {
        triggerHaptic(8);
        if (reduce) return;
        // Two hops, the second smaller, the way the dock bounces an opening app
        hop.start({ y: [0, -14, 0, -6, 0], transition: { duration: 0.8, times: [0, 0.28, 0.55, 0.75, 1], ease: 'easeOut' } });
    };

    return (
        <motion.button
            ref={ref}
            type="button"
            aria-label={name}
            onClick={launch}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{ width: size, height: size }}
            className="group relative shrink-0"
        >
            <AnimatePresence>
                {hover && (
                    <TooltipCard side="top" align="center" width="auto" className="!px-2.5 !py-1 !rounded-full text-[12px] font-medium text-neutral-50 pointer-events-none">
                        {name}
                    </TooltipCard>
                )}
            </AnimatePresence>
            {/* Every icon on the same tile, so mixed icon files read as one set */}
            <motion.span animate={hop} className="block w-full h-full rounded-[22%] overflow-hidden bg-[#171717]">
                <img
                    src={icon}
                    alt=""
                    draggable={false}
                    className={cn(
                        "w-full h-full object-cover select-none transition-[filter] duration-300",
                        // Grey at rest, its own colour under the pointer
                        "[@media(hover:hover)_and_(pointer:fine)]:grayscale [@media(hover:hover)_and_(pointer:fine)]:group-hover:grayscale-0"
                    )}
                />
            </motion.span>
        </motion.button>
    );
};

export const ToolsDock = () => {
    const mouseX = useMotionValue(Infinity);
    const [base, setBase] = useState(BASE.desk);

    // Phones get a smaller resting size so all nine fit the column
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 639px)');
        const set = () => setBase(mq.matches ? BASE.phone : BASE.desk);
        set();
        mq.addEventListener('change', set);
        return () => mq.removeEventListener('change', set);
    }, []);

    return (
        <div
            onMouseMove={(e) => mouseX.set(e.clientX)}
            onMouseLeave={() => mouseX.set(Infinity)}
            // Tall enough for the swell, so nothing below moves when it grows
            className="flex items-end justify-center gap-1.5 sm:gap-2.5"
            style={{ height: PEAK + 6 }}
        >
            {TOOLS.map((t) => <DockIcon key={t.name} {...t} mouseX={mouseX} base={base} />)}
        </div>
    );
};
