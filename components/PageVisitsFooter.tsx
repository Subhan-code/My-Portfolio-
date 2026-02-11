import React, { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { LiquidMetalButton } from './ui/liquid-metal';
import NumberFlow from '@number-flow/react';
import { getOrCreateVisitorId } from '../lib/fingerprint';

export const PageVisitsFooter = () => {
  const [visits, setVisits] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hasIncremented = useRef(false);

  // Loading animation loop


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
            setIsLoading(false);
            // Delay setting the number slightly so NumberFlow mounts with 0 first, then animates.
            setTimeout(() => setVisits(data.uniqueVisitors), 100);
          } else {
            console.warn("Unexpected API response structure:", data);
            setIsLoading(false);
            setVisits(0);
          }
        } else {
          console.error("Failed to fetch stats:", response.status);
          setIsLoading(false);
          setVisits(0);
        }
      } catch (error) {
        console.error("Error tracking visitor:", error);
        setIsLoading(false);
        setVisits(0);
      }
    };

    trackAndFetchStats();
  }, []);



  const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return (s[(v - 20) % 10] || s[v] || s[0]);
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
        {isLoading ? (
          <span className="animate-pulse">Fetching signal...</span>
        ) : (
          <>
            You are the <NumberFlow value={visits} format={{ useGrouping: true }} className="mx-1 inline-block" />{getOrdinalSuffix(visits)} visitor
          </>
        )}
      </LiquidMetalButton>
    </div>
  );
};