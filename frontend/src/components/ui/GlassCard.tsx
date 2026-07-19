import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
  elevation?: 1 | 2 | 3 | 4;
  hoverEffect?: boolean;
}

export const GlassCard = ({
  children,
  className,
  elevation = 2,
  hoverEffect = false,
  ...props
}: GlassCardProps) => {
  // Mapping elevation settings as per Section 3.9
  const elevationClasses = {
    1: 'backdrop-blur-[25px] bg-white/[0.05] border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.30)]',
    2: 'backdrop-blur-[30px] bg-white/[0.05] border-white/[0.08] shadow-[0_10px_30px_rgba(0,0,0,0.30)]',
    3: 'backdrop-blur-[35px] bg-white/[0.08] border-white/[0.12] shadow-[0_20px_60px_rgba(0,0,0,0.45)]',
    4: 'backdrop-blur-[45px] bg-white/[0.10] border-white/[0.12] shadow-[0_40px_120px_rgba(0,0,0,0.55)]',
  };

  const reflectionStyles = {
    1: { boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.05)' },
    2: { boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.08)' },
    3: { boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.10)' },
    4: { boxShadow: 'inset 1px 1px 0px rgba(255, 255, 255, 0.12)' },
  };

  const hoverMotionProps = hoverEffect
    ? {
        whileHover: {
          y: -2,
          boxShadow: elevation === 2 
            ? '0 20px 60px rgba(0, 0, 0, 0.45)' 
            : elevationClasses[elevation].match(/shadow-\[([^\]]+)\]/)?.[1] || undefined,
          // border brightness increases
          borderColor: elevation >= 3 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.12)',
        },
        transition: { duration: 0.18, ease: 'easeOut' as const }, // timed to fast token (180ms)
      }
    : {};

  return (
    <motion.div
      className={twMerge(
        'rounded-[24px] border border-solid transition-colors duration-180',
        elevationClasses[elevation],
        className
      )}
      style={reflectionStyles[elevation]}
      {...hoverMotionProps}
      {...props}
    >
      {children}
    </motion.div>
  );
};
