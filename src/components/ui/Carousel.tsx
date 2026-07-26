'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';

type CarouselProps = {
  children: ReactNode[];
  slidesToShow?: number;
  responsive?: { breakpoint: number; slidesToShow: number }[];
  autoplaySpeed?: number;
  className?: string;
};

function useSlidesToShow(defaultValue: number, responsive?: { breakpoint: number; slidesToShow: number }[]) {
  const [count, setCount] = useState(defaultValue);

  useEffect(() => {
    if (!responsive || responsive.length === 0) return;
    const sorted = [...responsive].sort((a, b) => b.breakpoint - a.breakpoint);
    const mqls = sorted.map(r => window.matchMedia(`(min-width: ${r.breakpoint}px)`));

    const update = () => {
      const match = sorted.find((_, i) => mqls[i].matches);
      setCount(match ? match.slidesToShow : defaultValue);
    };

    update();
    mqls.forEach(m => m.addEventListener('change', update));
    return () => mqls.forEach(m => m.removeEventListener('change', update));
  }, [defaultValue, responsive]);

  return count;
}

export default function Carousel({
  children,
  slidesToShow = 4,
  responsive,
  autoplaySpeed = 5000,
  className = '',
}: CarouselProps) {
  const count = useSlidesToShow(slidesToShow, responsive);
  const total = children.length;
  const maxIndex = Math.max(0, total - count);
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrent(prev => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent(prev => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (isPaused || autoplaySpeed <= 0 || maxIndex <= 0) return;
    const t = setInterval(next, autoplaySpeed);
    return () => clearInterval(t);
  }, [isPaused, next, autoplaySpeed, maxIndex]);

  useEffect(() => {
    setCurrent(prev => Math.min(prev, maxIndex));
  }, [maxIndex]);

  if (total === 0) return null;

  return (
    <div
      className={`relative select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onFocus={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out will-change-transform transform-gpu"
          style={{ transform: `translateX(-${current * (100 / count)}%)` }}
        >
          {children.map((child, i) => (
            <div
              key={i}
              className="min-w-0 shrink-0 px-1.5"
              style={{ flex: `0 0 ${100 / count}%` }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {maxIndex > 0 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
            aria-label="Previous slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70 active:scale-95"
            aria-label="Next slide"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="flex justify-center gap-2 mt-5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === current ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide group ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}