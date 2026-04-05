import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealOptions {
  selector: string;
  stagger?: number;
  y?: number;
  delay?: number;
}

export function useScrollReveal<T extends HTMLElement>({
  selector,
  stagger = 0.1,
  y = 30,
  delay = 0,
}: ScrollRevealOptions) {
  const containerRef = useRef<T>(null);

  useGSAP(() => {
    const el = containerRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from(el.querySelectorAll(selector), {
        y,
        opacity: 0,
        duration: 0.6,
        stagger,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });
  }, { scope: containerRef });

  return containerRef;
}
