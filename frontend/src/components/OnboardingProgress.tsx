import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';

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
    <GlassCard elevation={2} className="p-5 space-y-4 rounded-[24px]">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary font-semibold">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        <span className="text-brand font-bold bg-brand/10 px-2.5 py-0.5 rounded-full text-xs border border-brand/20">
          {Math.round(progress)}%
        </span>
        <span className="text-text-primary font-medium capitalize">{currentStep?.label}</span>
      </div>

      {/* Progress Track */}
      <div
        className="w-full bg-white/[0.05] h-2 rounded-[999px] overflow-hidden border border-white/[0.08]"
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Onboarding progress: ${Math.round(progress)}%`}
      >
        <motion.div
          className="h-full rounded-[999px] bg-gradient-to-r from-brand via-recommendation-purple to-ai-cyan"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }} // standard/medium transition
        />
      </div>

      {/* Steps List */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 pt-1">
        {steps.map((s, idx) => {
          const Icon = s.icon;
          const isActive = idx === currentStepIndex;
          const isCompleted = completed || idx < currentStepIndex;
          const isDisabled = !completed && idx > currentStepIndex;

          return (
            <div key={s.key} className="flex items-center shrink-0">
              <button
                onClick={() => onStepClick(idx)}
                disabled={isDisabled}
                className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border border-solid transition-all duration-180 ${
                  isActive
                    ? 'bg-brand/10 border-brand text-brand shadow-[0_0_15px_rgba(91,124,250,0.15)]'
                    : isCompleted
                    ? 'bg-white/[0.05] border-white/[0.08] text-text-primary hover:bg-white/[0.12] hover:border-white/[0.12]'
                    : 'bg-transparent border-transparent text-text-disabled cursor-not-allowed'
                }`}
                aria-current={isActive ? 'step' : undefined}
              >
                {isActive && (
                  <motion.span
                    className="absolute inset-0 rounded-full border border-brand/50"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} // 2.8s AI breathing cycle
                  />
                )}
                <span className="relative z-10 flex items-center justify-center">
                  {isCompleted ? <Check className="h-3 w-3 text-brand" /> : <Icon className="h-3.5 w-3.5" />}
                </span>
                <span className="relative z-10">{s.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <div
                  className={`w-4 h-0.5 mx-2 rounded-full transition-colors duration-300 ${
                    idx < currentStepIndex ? 'bg-brand/40' : 'bg-white/[0.08]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
