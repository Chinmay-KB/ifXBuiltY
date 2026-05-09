"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Floating overlay with tagline + CTA, centered over the wall.
 * Fades out when user scrolls past 100px.
 * Uses a dark glassmorphic style against the dark wall background.
 */
export function FloatingOverlay() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY <= 100);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto mx-4 max-w-md rounded-3xl border border-white/10 bg-black/70 px-6 py-8 text-center backdrop-blur-xl sm:px-10 sm:py-10">
        <h1 className="font-display text-[26px] leading-[1.15] text-white sm:text-[38px]">
          What if your favorite brand built something{" "}
          <span className="text-chrome">totally different</span>?
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">
          Combine any company with any product. AI generates the parody screenshot.
        </p>
        <Link
          href="/generate"
          className="mt-6 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-chrome px-8 py-3 text-base font-bold text-ink shadow-lg shadow-chrome/25 transition-all hover:scale-105 hover:shadow-chrome/40"
        >
          Start generating →
        </Link>
      </div>
    </div>
  );
}
