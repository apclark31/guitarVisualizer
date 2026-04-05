import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

interface UseRotatingTextOptions {
  words: readonly string[];
  interval?: number;
}

export function useRotatingText({ words, interval = 2.5 }: UseRotatingTextOptions) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const el = containerRef.current;
    if (!el || words.length === 0) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = words[0];
      return;
    }

    let index = 0;
    el.textContent = words[0];

    const cycle = () => {
      gsap.to(el, {
        opacity: 0,
        y: -12,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          index = (index + 1) % words.length;
          el.textContent = words[index];
          gsap.fromTo(
            el,
            { opacity: 0, y: 12 },
            { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
          );
        },
      });
    };

    const timer = setInterval(cycle, interval * 1000);
    return () => clearInterval(timer);
  }, { scope: containerRef });

  return containerRef;
}
