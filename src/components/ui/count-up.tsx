"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

type CountUpProps = {
  end: number;
  suffix?: string;
};

export function CountUp({ end, suffix = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) {
      return;
    }

    const durationMs = 1800;
    const start = performance.now();

    const frame = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(eased * end));

      if (progress < 1) {
        requestAnimationFrame(frame);
      }
    };

    requestAnimationFrame(frame);
  }, [inView, end]);

  return (
    <span ref={ref}>
      {count.toLocaleString("uk-UA")}
      {suffix}
    </span>
  );
}
