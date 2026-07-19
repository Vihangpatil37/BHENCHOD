import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'bg-brand hover:bg-brand-hover active:bg-brand-pressed text-text-primary shadow-[0_4px_12px_rgba(91,124,250,0.2)] border-transparent',
  secondary: 'bg-white/[0.05] border-white/[0.08] text-text-primary hover:bg-white/[0.12] hover:border-white/[0.12] active:bg-white/[0.16] shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
  ghost: 'bg-transparent border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.08] active:bg-white/[0.12]',
  danger: 'bg-error hover:bg-error-hover active:bg-error-hover text-text-primary shadow-[0_4px_12px_rgba(239,68,68,0.2)] border-transparent',
  destructive: 'bg-error hover:bg-error-hover active:bg-error-hover text-text-primary shadow-[0_4px_12px_rgba(239,68,68,0.2)] border-transparent',
};

const sizes = {
  sm: 'px-4 py-2 text-xs h-[36px]',
  md: 'px-5 py-2.5 text-sm h-[44px]', // meets 44px min touch target on mobile
  lg: 'px-7 py-3.5 text-base h-[52px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={twMerge(
          'inline-flex items-center justify-center gap-2 font-semibold border border-solid rounded-[18px] transition-all duration-180 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-ai-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070D] active:scale-[0.98] disabled:opacity-35 disabled:cursor-not-allowed disabled:pointer-events-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse duration-[700ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse duration-[700ms] delay-150" />
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse duration-[700ms] delay-300" />
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
