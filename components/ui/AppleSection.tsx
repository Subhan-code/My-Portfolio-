import React from 'react';
import { motion } from 'framer-motion';
import { cn, triggerHaptic } from '../../lib/utils';
import { FADE_IN } from '../../lib/motion';

/* Four sizes for the whole home page. Pick by role, never by pixel. No negative tracking anywhere. */
export const T_DISPLAY = "font-sans text-[28px] leading-[34px] md:text-[32px] md:leading-[40px]"; // page titles, name, closing line
export const T_TITLE = "font-sans text-[17px] leading-[24px]";                                  // section titles, role morph
export const T_BODY = "font-sans text-[14px] leading-[22px]";                                   // body, card + row titles
export const T_META = "font-sans text-[12px] leading-[18px]";                                                       // details, dates, footer

/** The site's two text colours: everything is one of these, never an in-between opacity */
export const C_TEXT = "text-neutral-50";
export const C_MUTED = "text-[#a1a1a1]";

/** The one card surface: a flat near-black fill, no edge, 22px corners. Presses in slightly on touch. */
export const DARK_CARD = "relative rounded-[22px] bg-[#171717] transition-[background-color,transform] duration-300 hover:bg-[#1b1b1b] active:scale-[0.99]";

/** Text link whose underline draws in from the left on hover */
export const LINK_UNDERLINE = "bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-[position:0_100%] hover:bg-[length:100%_1px] focus-visible:bg-[length:100%_1px] transition-[background-size,color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

/**
 * Cursor spotlight: put `onMouseMove={trackSpotlight}` on a `group` card and drop
 * <SpotlightLayer /> inside it. A soft light follows the pointer, mouse only.
 */
export const trackSpotlight = (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
};

export const SpotlightLayer = () => (
    <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit] opacity-0 transition-opacity duration-300 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
        style={{ background: 'radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.07), transparent 70%)' }}
    />
);

/** 2 cards per row at max: 1 column on small mobile, 2 columns from small screens up */
export const TILE_GRID = "grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6";

/* ------------------------------------------------------------------ */
/* Section header — the section's name and, optionally, a quiet link   */
/* ------------------------------------------------------------------ */

type SectionHeaderProps = {
    title: string;
    linkLabel?: string;
    onLink?: () => void;
    className?: string;
};

export const SectionHeader = ({ title, linkLabel, onLink, className }: SectionHeaderProps) => (
    <header className={cn("mb-6 flex items-baseline justify-between gap-4", className)}>
        <h2 className="text-title-2 text-gray-900 dark:text-white">{title}</h2>
        {linkLabel && onLink && (
            <button
                type="button"
                onClick={() => { triggerHaptic(10); onLink(); }}
                className="text-subhead text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-150 shrink-0"
            >
                {linkLabel}
            </button>
        )}
    </header>
);

/* ------------------------------------------------------------------ */
/* Tile — the media IS the card. Caption sits underneath, outside.     */
/* ------------------------------------------------------------------ */

type TileProps = {
    title: string;
    /** One muted line under the title */
    meta?: string;
    /** Right-aligned detail on the title row (year, count…) */
    aside?: string;
    /** External URL — opens in a new tab */
    href?: string;
    /** Internal action, used when there is no href */
    onSelect?: () => void;
    /** Secondary link shown as text in the meta row, e.g. source code */
    sourceUrl?: string;
    imageUrl?: string;
    videoUrl?: string;
    /** Custom media (component visual, typographic cover) */
    media?: React.ReactNode;
    index?: number;
};

export const Tile = ({ title, meta, aside, href, onSelect, sourceUrl, imageUrl, videoUrl, media, index = 0 }: TileProps) => {
    const interactive = Boolean(href || onSelect);
    const frameProps = href
        ? { href, target: '_blank', rel: 'noopener noreferrer', onClick: () => triggerHaptic(10) }
        : onSelect
            ? { type: 'button' as const, onClick: () => { triggerHaptic(10); onSelect(); } }
            : {};
    // Polymorphic frame: link out, internal button, or static
    const Frame: React.FC<any> = (href ? 'a' : onSelect ? 'button' : 'div') as any;

    return (
        <motion.article
            {...FADE_IN}
            className="group min-w-0"
        >
            <Frame
                {...frameProps}
                aria-label={interactive ? title : undefined}
                className={cn(
                    "relative block w-full aspect-[16/10] overflow-hidden rounded-[22px] sm:rounded-[26px] bg-[#f5f5f7] dark:bg-[#161617] text-left",
                    "shadow-[0_4px_16px_rgba(0,0,0,0.03)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.35)]",
                    interactive && "transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.5)] active:scale-[0.985]"
                )}
            >
                <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.025]">
                    {media ?? (videoUrl ? (
                        <video src={videoUrl} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                    ) : imageUrl ? (
                        <img src={imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                    ) : null)}
                </div>
            </Frame>

            <div className="mt-3 flex items-baseline justify-between gap-3">
                <h3 className="min-w-0 truncate font-sans text-subhead font-medium text-gray-900 dark:text-white">
                    {title}
                    {interactive && (
                        <Chevron className="inline-block w-3 h-3 ml-0.5 -mt-0.5 opacity-0 -translate-x-0.5 transition-[opacity,transform] duration-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0" />
                    )}
                </h3>
                {aside && <span className="shrink-0 text-footnote text-gray-400 dark:text-gray-500 tabular-nums">{aside}</span>}
            </div>
            {(meta || sourceUrl) && (
                <p className="mt-0.5 text-footnote text-gray-500 dark:text-gray-400 line-clamp-2">
                    {meta}
                    {sourceUrl && (
                        <>
                            {meta && <span aria-hidden> · </span>}
                            <a
                                href={sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => triggerHaptic(5)}
                                className="underline decoration-gray-300 dark:decoration-white/20 underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Source
                            </a>
                        </>
                    )}
                </p>
            )}
        </motion.article>
    );
};

/* ------------------------------------------------------------------ */
/* Blog header + card — Apple website styling vibes                   */
/* ------------------------------------------------------------------ */

/**
 * "See all" with a half arrow (a shaft and a single barb). On hover the shaft
 * stretches and the barb glides with it, so the arrow reaches toward where it goes.
 */
/** The site's only arrow: the ">" part, nothing else. Rotate it with `dir`. */
export const Chevron = ({ dir = 'right', className }: { dir?: 'right' | 'left' | 'up' | 'down'; className?: string }) => (
    <svg
        viewBox="0 0 16 16"
        aria-hidden
        className={cn("w-3.5 h-3.5 shrink-0", { left: "rotate-180", up: "-rotate-90", down: "rotate-90", right: "" }[dir], className)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="m6 3.5 4.5 4.5L6 12.5" />
    </svg>
);

/** "See all >": the chevron steps forward on hover, toward where it goes. */
export const SeeAll = ({ onClick, label = 'See all' }: { onClick: () => void; label?: string }) => (
    <button
        type="button"
        onClick={() => { triggerHaptic(10); onClick(); }}
        className={cn(T_META, "group inline-flex items-center gap-0.5 text-[#a1a1a1] hover:text-white transition-colors shrink-0")}
    >
        <span className={LINK_UNDERLINE}>{label}</span>
        <Chevron className="w-3 h-3 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5" />
    </button>
);

/** Section header: the title, with an optional action on the right ("See all"…). */
export const SectionTitle = ({
    title,
    onSeeAll,
    aside,
    className,
}: {
    title: string;
    onSeeAll?: () => void;
    aside?: React.ReactNode;
    className?: string;
}) => (
    <motion.header {...FADE_IN} className={cn("mb-4 flex items-center justify-between gap-4", className)}>
        <h2 className={cn(T_TITLE, "font-semibold text-neutral-50")}>{title}</h2>
        {aside ?? (onSeeAll && <SeeAll onClick={onSeeAll} />)}
    </motion.header>
);

type BlogCardProps = {
    title: string;
    excerpt: string;
    /** When and how long, as one plain line: "Aug 12, 2024 · 4 min read" */
    meta: string;
    onSelect: () => void;
    className?: string;
};

const CAN_HOVER_SECTION = "[@media(hover:hover)_and_(pointer:fine)]";

/**
 * Article card, sized by its words: when and how long on top, the title and one line
 * under it. Cards in a row stretch to the tallest. On hover the chevron steps in
 * beside the title and the excerpt brightens; a press sinks it slightly.
 */
export const BlogCard = ({ title, excerpt, meta, onSelect, className }: BlogCardProps) => (
    <motion.button
        type="button"
        data-article-card
        onClick={() => { triggerHaptic(10); onSelect(); }}
        {...FADE_IN}
        className={cn("group flex w-full text-left", className)}
    >
        <div onMouseMove={trackSpotlight} className={cn("flex-1 flex flex-col gap-3 p-5 overflow-hidden", DARK_CARD)}>
            <SpotlightLayer />
            <span className={cn(T_META, "relative z-[2] text-[#a1a1a1] tabular-nums")}>{meta}</span>
            <div className="relative z-[2] mt-auto">
                <h3 className={cn(T_BODY, "font-medium text-neutral-50 line-clamp-2")}>
                    {title}
                    <Chevron className={cn("inline-block w-3 h-3 ml-1 -mt-0.5 opacity-0 -translate-x-1 transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]", `${CAN_HOVER_SECTION}:group-hover:opacity-100 ${CAN_HOVER_SECTION}:group-hover:translate-x-0`)} />
                </h3>
                <p className={cn(T_META, "mt-1 text-[#a1a1a1] line-clamp-2 transition-colors duration-300", `${CAN_HOVER_SECTION}:group-hover:text-neutral-50`)}>{excerpt}</p>
            </div>
        </div>
    </motion.button>
);

/* ------------------------------------------------------------------ */
/* Typographic cover — for writing and experiments that have no image  */
/* ------------------------------------------------------------------ */

export const TextCover = ({ label, title }: { label: string; title: string }) => (
    <div className="absolute inset-0 flex flex-col justify-between p-4 md:p-5">
        <span className="text-caption text-[#a1a1a1]">{label}</span>
        <span className="font-sans font-semibold text-title-2 text-gray-900 dark:text-white text-balance">{title}</span>
    </div>
);
