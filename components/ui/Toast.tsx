import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/*
 * A tiny site-wide toast: a dark material pill that springs up from the bottom,
 * says one thing, and leaves. Call `toast('Copied')` from anywhere.
 */

const EVENT = 'site-toast';

export const toast = (text: string) => window.dispatchEvent(new CustomEvent(EVENT, { detail: text }));

export const Toaster = () => {
    const [item, setItem] = useState<{ id: number; text: string } | null>(null);

    useEffect(() => {
        let t = 0;
        const on = (e: Event) => {
            setItem({ id: Date.now(), text: (e as CustomEvent<string>).detail });
            window.clearTimeout(t);
            t = window.setTimeout(() => setItem(null), 1900);
        };
        window.addEventListener(EVENT, on);
        return () => { window.removeEventListener(EVENT, on); window.clearTimeout(t); };
    }, []);

    return (
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] z-[120] flex justify-center">
            <AnimatePresence mode="popLayout">
                {item && (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 16, scale: 0.92, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 8, scale: 0.96, filter: 'blur(4px)', transition: { duration: 0.15 } }}
                        transition={{ type: 'spring', duration: 0.42, bounce: 0.22 }}
                        className="px-4 h-9 inline-flex items-center rounded-full bg-[#1c1c1e]/85 backdrop-blur-2xl backdrop-saturate-150 ring-1 ring-inset ring-white/[0.09] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_16px_36px_-10px_rgba(0,0,0,0.8)] text-[13px] font-medium text-[#a1a1a1]"
                    >
                        {item.text}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
