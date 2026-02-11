import React, { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { LiquidMetalButton } from './ui/liquid-metal';

export const PageVisitsFooter = () => {
  const [visits, setVisits] = useState<number>(0);
  const hasIncremented = useRef(false);

  useEffect(() => {
    // Prevent double invocation in React.StrictMode during development
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    const fetchAndIncrement = async () => {
      try {
        // Call our internal API route which handles the external API securely
        const response = await fetch('/api/visit');

        if (response.ok) {
          const data = await response.json();
          if (typeof data.count === 'number') {
            setVisits(data.count);
          } else {
            console.warn("Unexpected internal API response:", data);
            setVisits(0);
          }
        } else {
          console.error("Internal API failed:", response.status);
          // Silent fail or retry logic could go here
        }
      } catch (error) {
        console.error("Error fetching visit count:", error);
      }
    };

    fetchAndIncrement();
  }, []);

  const getOrdinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n.toLocaleString() + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  //   if (visits === null) {
  //     return null; 
  //   }

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
        You are the {getOrdinal(visits)} visitor
      </LiquidMetalButton>
    </div>
  );
};