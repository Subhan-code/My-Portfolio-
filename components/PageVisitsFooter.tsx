import React, { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { LiquidMetalButton } from './ui/liquid-metal';
import { animate } from "framer-motion";
import { getOrCreateVisitorId } from '../lib/fingerprint';

export const PageVisitsFooter = () => {
  const [visits, setVisits] = useState<number>(0);
  const [displayVisits, setDisplayVisits] = useState<number>(0);
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Prevent double invocation in React.StrictMode during development
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    const trackAndFetchStats = async () => {
      try {
        const fingerprint = getOrCreateVisitorId();

        // Track visit (POST)
        await fetch('/api/visitors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ fingerprint }),
          cache: 'no-store'
        });

        // Fetch stats (GET)
        const response = await fetch('/api/visitors', {
          method: 'GET',
          cache: 'no-store'
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched visitor stats:", data);
          if (typeof data.uniqueVisitors === 'number') {
            setVisits(data.uniqueVisitors);
          } else {
            console.warn("Unexpected API response structure:", data);
            setVisits(0);
          }
        } else {
          console.error("Failed to fetch stats:", response.status);
        }
      } catch (error) {
        console.error("Error tracking visitor:", error);
      }
    };

    trackAndFetchStats();
  }, []);

  // Animate the display value when visits updates
  useEffect(() => {
    if (visits === 0) return;

    const controls = animate(0, visits, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate: (value) => setDisplayVisits(Math.round(value))
    });

    return () => controls.stop();
  }, [visits]);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
  };


  return (
    <div className="flex justify-center items-center pointer-events-auto relative z-20">
      <LiquidMetalButton
        size="md"
        shimmer
        borderWidth={4}
        metalConfig={{
          colorBack: "#6b5828",
          colorTint: "#ffd700",
          distortion: 0.2,
          speed: 0.3,
        }}
        className="scale-90 md:scale-100"
      >
        You are the {getOrdinal(displayVisits)} visitor
      </LiquidMetalButton>
    </div>
  );
};