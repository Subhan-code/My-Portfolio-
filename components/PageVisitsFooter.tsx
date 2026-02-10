import React, { useState, useEffect, useRef } from 'react';
import { Eye } from 'lucide-react';
import { LiquidMetalButton } from './ui/liquid-metal';

// Helper functions for Cookies
function setCookie(cname: string, cvalue: string, exdays: number) {
  if (typeof document === 'undefined') return;
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname: string) {
  if (typeof document === 'undefined') return "";
  let name = cname + "=";
  try {
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
  } catch (e) {
    console.warn("Error reading cookies:", e);
    return "";
  }
  return "";
}

export const PageVisitsFooter = () => {
  const [visits, setVisits] = useState(0);
  const hasIncremented = useRef(false);

  useEffect(() => {
    if (hasIncremented.current) return;
    hasIncremented.current = true;

    const incrementAndShowValue = () => {
      const cookieName = "visitcounter";
      const value = getCookie(cookieName) || "0";
      const newValue = Number(value) + 1;

      setCookie(cookieName, newValue.toString(), 365);
      setVisits(newValue);
    };

    incrementAndShowValue();
  }, []);

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
        You are the {getOrdinal(visits)} visitor
      </LiquidMetalButton>
    </div>
  );
};