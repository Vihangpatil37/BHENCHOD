import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { twMerge } from 'tailwind-merge';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
}

export const GlassCard = ({ children, className, ...props }: GlassCardProps) => {
  return (
    <motion.div
      className={twMerge(
        "bg-bg/65 backdrop-blur-[20px] rounded-[32px] border border-white/5 shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};
