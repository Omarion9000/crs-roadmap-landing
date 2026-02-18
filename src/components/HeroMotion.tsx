"use client";

import { motion, type Variants } from "framer-motion";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const itemFast: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: EASE },
  },
};

type Props = {
  children: React.ReactNode;
};

export default function HeroMotion({ children }: Props) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* This wrapper lets us use motion “slots” inside via data attributes */}
      {children}

      {/* NOTE: This file only defines variants; actual usage is in page.tsx */}
    </motion.div>
  );
}

export { item, itemFast };
