import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const variants = {
  primary: 'bg-cta text-cta-text font-bold hover:brightness-110 shadow-lg shadow-cta/20',
  secondary: 'bg-white/5 border border-white/10 text-text hover:bg-white/10',
  ghost: 'text-text-muted hover:text-white hover:bg-white/5',
  destructive: 'bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={twMerge(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all focus-ring disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
