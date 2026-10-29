"use client";

import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '../../lib/utils';

gsap.registerPlugin(ScrollTrigger);

interface ScrollFillTextProps {
    className?: string;
}

export const ScrollFillText: React.FC<ScrollFillTextProps> = ({ className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const target = textRef.current;

            if (target) {
                gsap.to(target, {
                    backgroundSize: "200% 200%",
                    ease: "none",
                    scrollTrigger: {
                        trigger: containerRef.current,
                        start: "top 80%",
                        end: "bottom 35%",
                        scrub: true,
                    }
                });
            }
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} className={cn("py-0 flex justify-center w-full", className)}>
            <div className="w-full relative">
                <figure className="max-w-[520px] mx-auto text-center">
                    <blockquote className="font-sans text-[22px] leading-[30px] md:text-[26px] md:leading-[34px] font-semibold text-balance scroll-fill-container">
                        {/* Base layer is white/20; the white sweep grows over it as you scroll */}
                        <span
                            ref={textRef}
                            style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                backgroundImage: 'linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.2) 60%)',
                            }}
                            className="scroll-fill-span bg-clip-text text-transparent inline will-change-[background-size]"
                        >
                            “Design is a solution to a problem. Art is a question to a problem.”
                        </span>
                    </blockquote>
                    <figcaption className="mt-4 font-sans text-[12px] leading-[18px] text-[#a1a1a1]">John Maeda</figcaption>
                </figure>
            </div>
        </section>
    );
};
