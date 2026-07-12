import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '../../lib/utils';

interface SectionRevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  id?: string;
}

export function SectionReveal({ children, delay = 0, className, id }: SectionRevealProps) {
  const variant: Variants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: "easeOut", delay },
    },
  };

  return (
    <motion.section
      id={id}
      variants={variant}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={cn(className)}
    >
      {children}
    </motion.section>
  );
}
