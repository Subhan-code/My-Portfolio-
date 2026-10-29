import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { FADE_IN } from '../../lib/motion';
import { T_BODY, T_META, Chevron } from './AppleSection';
import { SnapRow } from './SnapRow';

export type BentoProject = {
    name: string;
    detail: string;
    href: string;
    media: React.ReactNode;
};

const CAN_HOVER = "[@media(hover:hover)_and_(pointer:fine)]";

/**
 * Work cards: the project's visual IS the card, in a plain frame with a hairline
 * edge. The caption sits underneath, outside the frame: name on the left, one
 * line on the right. Even two-column grid; no mixed spans, no floating windows.
 */
export const ProjectBento = ({ projects, mobileRow = false }: {
    projects: BentoProject[];
    /** Phones: a swipeable snap row with page dots instead of a tall stack */
    mobileRow?: boolean;
}) => {
    const cards = projects.map((p) => (
        <motion.a
            key={p.name}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            {...FADE_IN}
            className={cn("group block min-w-0 select-none", mobileRow && "max-md:snap-start max-md:shrink-0 max-md:w-[82%]")}
        >
            <div className="relative aspect-[16/9] overflow-hidden rounded-[18px] bg-[#0a0a0a] transition-transform duration-150 ease-out active:scale-[0.99]">
                {/* Black and white at rest; the project's own colour comes back on hover */}
                <div className={cn("absolute inset-0 transition-[transform,filter] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER}:grayscale ${CAN_HOVER}:group-hover:grayscale-0 ${CAN_HOVER}:group-hover:scale-[1.02]`)}>
                    {p.media}
                </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between gap-4 px-0.5">
                <span className={cn(T_BODY, "font-medium text-neutral-50 inline-flex items-center gap-1")}>
                    {p.name}
                    <Chevron className={cn("w-3 h-3 text-[#a1a1a1] opacity-0 -translate-x-1 transition-[opacity,transform] duration-200", `${CAN_HOVER}:group-hover:opacity-100 ${CAN_HOVER}:group-hover:translate-x-0`)} />
                </span>
                <span className={cn(T_META, "text-[#a1a1a1] truncate")}>{p.detail}</span>
            </div>
        </motion.a>
    ));

    const GRID = "grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-8";
    if (!mobileRow) return <div className={GRID}>{cards}</div>;

    return (
        <SnapRow
            className="flex gap-3 -mx-5 px-5 scroll-px-5 sm:-mx-6 sm:px-6 sm:scroll-px-6 overflow-x-auto snap-x snap-mandatory overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-8 md:mx-0 md:px-0 md:pb-0 md:overflow-visible"
            dotsClassName="md:hidden"
        >
            {cards}
        </SnapRow>
    );
};
