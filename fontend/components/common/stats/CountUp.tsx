'use client';

import { useEffect, useRef, useState } from 'react';

export interface NumberFormatProps {
  locale?: string;
  formatOptions?: Intl.NumberFormatOptions;
  prefix?: string;
  suffix?: string;
}

interface CountUpProps extends NumberFormatProps {
  value: number;
  duration?: number;
}

export function CountUp({
  value,
  duration = 1250,
  locale = 'vi-VN',
  formatOptions,
  prefix = '',
  suffix = '',
}: CountUpProps) {
  const element = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  const [displayValue, setDisplayValue] = useState(0);
  const formatter = new Intl.NumberFormat(locale, formatOptions ?? { maximumFractionDigits: 0 });
  const finalText = `${prefix}${formatter.format(value)}${suffix}`;

  useEffect(() => {
    let frame = 0;
    let observer: IntersectionObserver | undefined;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finish = () => {
      started.current = true;
      observer?.disconnect();
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setDisplayValue(value));
    };
    const start = () => {
      observer?.disconnect();
      if (motion.matches || started.current || duration <= 0) {
        finish();
        return;
      }
      const startTime = performance.now();
      const tick = (now: number) => {
        started.current = true;
        const progress = Math.min(Math.max((now - startTime) / duration, 0), 1);
        setDisplayValue(progress === 1 ? value : value * (1 - (1 - progress) ** 3));
        if (progress < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    const onMotionChange = () => {
      if (motion.matches) finish();
    };

    if (motion.matches || started.current || !('IntersectionObserver' in window)) start();
    else {
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) start();
      }, { threshold: 0.1 });
      if (element.current) observer.observe(element.current);
    }
    motion.addEventListener('change', onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      motion.removeEventListener('change', onMotionChange);
    };
  }, [value, duration]);

  return (
    <span ref={element} className="inline-grid max-w-full tabular-nums" data-slot="count-up">
      <span className="sr-only">{finalText}</span>
      {/* Reserve the final width; only the final value is exposed to assistive technology. */}
      <span aria-hidden="true" className="invisible col-start-1 row-start-1 motion-reduce:visible">
        {finalText}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1 motion-reduce:hidden">
        {prefix}{formatter.format(displayValue)}{suffix}
      </span>
    </span>
  );
}
