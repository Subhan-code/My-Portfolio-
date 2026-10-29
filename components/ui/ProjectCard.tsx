import React from 'react';
import { motion, useSpring } from 'framer-motion';
import { ExternalLink, Github } from 'lucide-react';
import { cn, triggerHaptic } from '../../lib/utils';
import { EASE_OUT } from '../../lib/motion';

interface ProjectCardProps {
    title: string;
    /** One short line under the title — the only copy on the tile */
    tagline: string;
    link?: string;
    githubUrl?: string;
    videoUrl?: string;
    imageUrl?: string;
    /** Custom visual for projects without a screenshot */
    visual?: React.ReactNode;
    /** Flagship tile: larger title */
    featured?: boolean;
    index: number;
    isDimmed?: boolean;
    onHover?: () => void;
    onLeave?: () => void;
}

/** Square Apple-style tile: caption on top, media fills the rest. */
export const ProjectCard: React.FC<ProjectCardProps> = ({
    title,
    tagline,
    link,
    githubUrl,
    videoUrl,
    imageUrl,
    visual,
    featured = false,
    index,
    isDimmed,
    onHover,
    onLeave
}) => {
    // Critically damped hover spring. Scale only — lifting the hover target
    // itself can slide it out from under the cursor and flicker.
    const scale = useSpring(1, { stiffness: 300, damping: 35 });

    // Mouse only: on touch, a tap would fire hover and dim the other cards
    const handlePointerEnter = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        scale.set(1.01);
        onHover?.();
    };

    const handlePointerLeave = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        scale.set(1);
        onLeave?.();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
            whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)', transitionEnd: { filter: 'none' } }}
            viewport={{ once: true, amount: 0.2 }}
            // Only the pair sharing a row staggers
            transition={{ duration: 0.8, delay: (index % 2) * 0.08, ease: EASE_OUT }}
            style={{ scale }}
            onPointerEnter={handlePointerEnter}
            onPointerLeave={handlePointerLeave}
            className={cn(
                "group relative flex flex-col w-full aspect-square bg-[#f5f5f7] dark:bg-[#161617] rounded-[22px] overflow-hidden transition-opacity duration-300 ease-out will-change-transform",
                isDimmed ? "opacity-60" : "opacity-100"
            )}
        >
            {/* Caption */}
            <div className="relative z-10 flex items-start justify-between gap-2 px-4 pt-4 md:px-5 md:pt-5">
                <div className="min-w-0">
                    <h3 className={cn("text-gray-900 dark:text-white", "text-title-3")}>
                        {title}
                    </h3>
                    <p className="mt-1 text-footnote font-medium text-gray-500 dark:text-gray-400 tabular-nums line-clamp-2">
                        {tagline}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {githubUrl && (
                        <a
                            href={githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-300/80 dark:hover:bg-white/15 transition-[background-color,transform] duration-200 active:scale-[0.94]"
                            aria-label={`${title} on GitHub`}
                            onClick={(e) => { e.stopPropagation(); triggerHaptic(5); }}
                        >
                            <Github size={16} />
                        </a>
                    )}
                    {link && (
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-black/85 dark:bg-white/90 text-white dark:text-black hover:bg-black dark:hover:bg-white transition-[background-color,transform] duration-200 active:scale-[0.94]"
                            aria-label={`Visit ${title}`}
                            onClick={(e) => { e.stopPropagation(); triggerHaptic(10); }}
                        >
                            <ExternalLink size={16} />
                        </a>
                    )}
                </div>
            </div>

            {/* Media fills the rest of the square */}
            <div className="relative mt-3 flex-1 overflow-hidden">
                {visual ? (
                    visual
                ) : videoUrl ? (
                    <video src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                ) : imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    />
                ) : null}
            </div>
        </motion.div>
    );
};
