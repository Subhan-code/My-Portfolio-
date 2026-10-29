import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const words = [
  "Hello",
  "Bonjour",
  "Ciao",
  "Olà",
  "Guten tag",
  "Здравствуйте",
  "Hallå",
  "السَّلَامُ عَلَيْكُمْ",
  "नमस्ते",
  "నమస్కారం",
  "こんにちは"
];

interface PreloaderProps {
  onComplete: () => void;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete }) => {
  const [index, setIndex] = useState(0);
  const [dimension, setDimension] = useState({ width: 0, height: 0 });

  useEffect(() => {
    setDimension({ width: window.innerWidth, height: window.innerHeight });

    // Prevent scrolling
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // Hard cap so the intro never holds the page hostage
    const autoCompleteTimer = setTimeout(onComplete, 2400);

    if (index === words.length - 1) {
      // Hold the last word just long enough to read it
      const timeout = setTimeout(onComplete, 350);
      return () => {
        clearTimeout(timeout);
        clearTimeout(autoCompleteTimer);
      };
    }

    const timeout = setTimeout(() => {
      setIndex(index + 1);
    }, index === 0 ? 700 : 120);
    return () => {
      clearTimeout(timeout);
      clearTimeout(autoCompleteTimer);
    };
  }, [index, onComplete]);

  return (
    <motion.div
      initial={{ y: 0 }}
      exit={{
        y: "-100vh",
        transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1] }
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-black text-black dark:text-white overflow-visible"
    >
      <motion.div
        className="flex items-center gap-3 z-10"
        initial={{ opacity: 0, filter: 'blur(6px)' }}
        animate={{ opacity: 1, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
        <span
          className={cn(
            "text-4xl md:text-6xl font-sans font-semibold text-black dark:text-white"
          )}
        >
          {words[index]}
        </span>
      </motion.div>

      {/* Curve Tail */}
      <svg className="absolute top-full w-full h-[calc(100vh*0.2)] fill-white dark:fill-black pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M0 0 Q50 100 100 0 L100 0 L0 0" vectorEffect="non-scaling-stroke" />
      </svg>
    </motion.div>
  );
};