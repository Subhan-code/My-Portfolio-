import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

interface Tool {
    name: string;
    icon: string;
    bg: string;
}

const tools: Tool[] = [
    { name: 'React', icon: 'https://cdn.simpleicons.org/react/61DAFB', bg: 'bg-[#61DAFB]/10' },
    { name: 'Next.js', icon: 'https://cdn.simpleicons.org/nextdotjs/000000/ffffff', bg: 'bg-black dark:bg-white' },
    { name: 'TypeScript', icon: 'https://cdn.simpleicons.org/typescript/3178C6', bg: 'bg-[#3178C6]/10' },
    { name: 'Node.js', icon: 'https://cdn.simpleicons.org/nodedotjs/339933', bg: 'bg-[#339933]/10' },
    { name: 'PostgreSQL', icon: 'https://cdn.simpleicons.org/postgresql/4169E1', bg: 'bg-[#4169E1]/10' }, // Center
    { name: 'Tailwind', icon: 'https://cdn.simpleicons.org/tailwindcss/06B6D4', bg: 'bg-[#06B6D4]/10' },
    { name: 'Framer', icon: 'https://cdn.simpleicons.org/framer/0055FF/ffffff', bg: 'bg-[#0055FF]/10' },
    { name: 'Python', icon: 'https://cdn.simpleicons.org/python/3776AB', bg: 'bg-[#3776AB]/10' },
    { name: 'Docker', icon: 'https://cdn.simpleicons.org/docker/2496ED', bg: 'bg-[#2496ED]/10' },
];

export const ToolsDock: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLDivElement>(null);
    const iconsRef = useRef<Array<HTMLDivElement | null>>([]);

    const headerText = "{ Crafting with my Core Tech Stack }";
    const headerChars = headerText.split('');
    const centerIndex = 4; // PostgreSQL

    useLayoutEffect(() => {
        // GSAP Context to ensure cleanup
        const ctx = gsap.context(() => {

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 95%",
                    end: "bottom 30%",
                    scrub: 1.2,
                }
            });



            // 1. Animate Text (Split char stagger)
            const chars = textRef.current?.children;
            if (chars) {
                tl.fromTo(chars,
                    { y: 30, opacity: 0, skewY: 5 },
                    { y: 0, opacity: 1, skewY: 0, duration: 1, stagger: { amount: 0.8, from: "center" }, ease: "power2.out" },
                    0
                );
            }

            // 2. Animate Icons
            const icons = iconsRef.current;
            icons.forEach((icon, index) => {
                if (!icon) return;
                const dist = Math.abs(index - centerIndex);

                tl.fromTo(icon,
                    { y: 100, opacity: 0, rotationX: 45, scale: 0.7 },
                    {
                        y: 0,
                        opacity: 1,
                        rotationX: 0,
                        scale: index === centerIndex ? 1.1 : 1,
                        duration: 1.5,
                        ease: "power2.out"
                    },
                    dist * 0.15 + 0.2
                );
            });

        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <div ref={containerRef} className="w-full flex flex-col items-center justify-center overflow-hidden relative py-2 md:py-4">
            <div className="flex flex-col items-center gap-6 w-full max-w-6xl px-4">

                <h2 ref={textRef} className="text-[clamp(0.8rem,4vw,1.8rem)] font-medium text-gray-900 dark:text-gray-100 font-mono text-center leading-tight">
                    {headerChars.map((char, i) => (
                        <span key={i} className="inline-block" style={{ minWidth: char === ' ' ? '0.2em' : 'auto' }}>
                            {char === ' ' ? '\u00A0' : char}
                        </span>
                    ))}
                </h2>

                <div className="flex items-center justify-center gap-4 md:gap-8 px-4 py-8" style={{ perspective: '1000px' }}>
                    {tools.map((tool, index) => (
                        <div
                            key={tool.name}
                            ref={(el) => { iconsRef.current[index] = el; }}
                            className={`
                            relative group
                            w-[clamp(1.8rem,6vw,3.5rem)] h-[clamp(1.8rem,6vw,3.5rem)]
                            rounded-lg md:rounded-lg 
                            flex items-center justify-center 
                            ${tool.bg}
                            shadow-lg
                            cursor-pointer
                            ${index === centerIndex ? 'z-10' : 'z-0'}
                        `}
                        >
                            <div className="w-1/2 h-1/2 flex items-center justify-center">
                                <img src={tool.icon} alt={tool.name} className="w-full h-full object-contain" />
                            </div>

                            <div className="absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-semibold text-gray-500 dark:text-gray-300 pointer-events-none whitespace-nowrap bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                {tool.name}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};