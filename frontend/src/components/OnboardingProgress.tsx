import { Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Step {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Props {
  steps: Step[];
  currentStepIndex: number;
  completed?: boolean;
  onStepClick: (index: number) => void;
}

export function OnboardingProgress({ steps, currentStepIndex, completed, onStepClick }: Props) {
  const progress = steps.length > 0 ? (currentStepIndex / steps.length) * 100 : 0;
  const currentStep = steps[currentStepIndex];

  return (
    <div className="glass-card rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-muted font-semibold">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        <span className="text-accent font-bold bg-accent/10 px-2 py-0.5 rounded-full text-xs">
          {Math.round(progress)}%
        </span>
        <span className="text-text/80 font-medium capitalize">{currentStep?.label}</span>
      </div>

      <div
        className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Onboarding progress: ${Math.round(progress)}%`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-accent via-purple-400 to-accent-2"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <div className="flex gap-0 overflow-x-auto hide-scrollbar pb-1">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === currentStepIndex;
          const isCompleted = completed || idx < currentStepIndex;
          const isDisabled = !completed && idx > currentStepIndex;

          return (
            <div key={s.key} className="flex items-center gap-0 shrink-0">
              <button
                onClick={() => onStepClick(idx)}
                disabled={isDisabled}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all shrink-0 ${
                  isActive
                    ? 'bg-accent/10 border-accent text-accent'
                    : isCompleted
                    ? 'bg-white/[0.05] border-white/10 text-text/80 hover:bg-white/10'
                    : 'bg-transparent border-transparent text-text-muted/40 cursor-not-allowed'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-accent/50"
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
                <span className="relative z-10">
                  {isCompleted ? <Check className="h-3 w-3" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="relative z-10">{s.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={`w-4 h-0.5 mx-1 rounded-full transition-colors duration-300 ${
                    idx < currentStepIndex ? 'bg-accent/60' : 'bg-white/10'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
