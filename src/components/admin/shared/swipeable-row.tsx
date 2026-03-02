"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";

export function SwipeableRow({
  children,
  onSwipeLeft,
  onSwipeRight,
}: {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ["#FFF5F5", "#FFFFFF", "#E6FFED"],
  );

  const onDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x < -80 && onSwipeLeft) {
      onSwipeLeft();
    } else if (info.offset.x > 80 && onSwipeRight) {
      onSwipeRight();
    }
    animate(x, 0, { type: "spring", stiffness: 300, damping: 30 });
  };

  return (
    <div className="relative overflow-hidden rounded-xl">
      <motion.div style={{ background }} className="absolute inset-0" />
      <motion.div
        drag="x"
        dragConstraints={{ left: -120, right: 120 }}
        onDragEnd={onDragEnd}
        style={{ x }}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
