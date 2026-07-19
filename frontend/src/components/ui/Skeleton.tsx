import { twMerge } from 'tailwind-merge';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={twMerge(
        'bg-white/[0.04] border border-white/[0.06] overflow-hidden relative',
        variant === 'text' && 'h-4 w-3/4 rounded-[4px]',
        variant === 'rect' && 'rounded-[18px]',
        variant === 'circle' && 'rounded-full',
        'before:absolute before:inset-0 before:translate-x-[-100%] before:bg-gradient-to-r before:from-transparent before:via-white/[0.05] before:to-transparent before:animate-[shimmer_1.8s_infinite]',
        className
      )}
    />
  );
}
