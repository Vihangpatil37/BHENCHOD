import type { Variants } from 'framer-motion';

// Timing durations in seconds (Framer Motion uses seconds, tokens are in ms)
const DURATION_FAST = 0.18;      // 180ms
const DURATION_STANDARD = 0.25;  // 250ms
const DURATION_MEDIUM = 0.35;    // 350ms
const DURATION_SLOW = 0.60;      // 600ms

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_STANDARD, ease: 'easeOut' },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: DURATION_STANDARD, ease: 'easeOut' },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION_STANDARD, ease: 'easeOut' },
  },
};

export const cardReveal: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: DURATION_MEDIUM, ease: [0.34, 1.56, 0.64, 1] }, // Spring-like easing for cards
  },
};

// Staggered reveal (~50-60ms per item)
export const sequentialReveal = (staggerDelay = 0.06): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

// AI breathing (2.8s glow pulse)
export const aiBreathing: Variants = {
  animate: {
    opacity: [0.7, 1, 0.7],
    boxShadow: [
      '0 0 15px rgba(112, 225, 255, 0.15)',
      '0 0 30px rgba(112, 225, 255, 0.35)',
      '0 0 15px rgba(112, 225, 255, 0.15)',
    ],
    transition: {
      duration: 2.8,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Hover effect for glass items (translateY(-2px) + reflection/border/shadow increase)
export const glassHover: Variants = {
  hover: {
    y: -2,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    transition: { duration: DURATION_FAST, ease: 'easeOut' },
  },
};

// Page transition: fade -> blur -> fade-in -> lift, never horizontal slide
export const pageTransition: Variants = {
  initial: { opacity: 0, filter: 'blur(10px)', y: 12 },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { duration: DURATION_SLOW, ease: 'easeInOut' },
  },
  exit: {
    opacity: 0,
    filter: 'blur(10px)',
    y: -12,
    transition: { duration: DURATION_STANDARD, ease: 'easeInOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

export const wordReveal: Variants = {
  hidden: { opacity: 0, y: '100%' },
  visible: { opacity: 1, y: '0%', transition: { duration: DURATION_SLOW, ease: 'easeOut' } },
};
