import { Injectable, BadRequestException } from '@nestjs/common';

export const ONBOARDING_STEPS = [
  'personal',
  'academic',
  'interests',
  'skills',
  'goals',
  'work_preferences',
  'constraints',
  'scenarios',
];

@Injectable()
export class OnboardingFlowService {
  getStepIndex(stepKey: string): number {
    return ONBOARDING_STEPS.indexOf(stepKey.toLowerCase());
  }

  getCompletionPercentage(stepKey: string): number {
    if (stepKey.toLowerCase() === 'complete') return 100;
    const idx = this.getStepIndex(stepKey);
    if (idx === -1) return 0;
    return Math.round(((idx + 1) / ONBOARDING_STEPS.length) * 100);
  }

  validateStepTransition(currentStep: string, targetStep: string): void {
    const currentIdx = this.getStepIndex(currentStep);
    const targetIdx = this.getStepIndex(targetStep);

    if (targetIdx === -1 && targetStep.toLowerCase() !== 'complete') {
      throw new BadRequestException(`Invalid target onboarding step: ${targetStep}`);
    }

    // If onboarding is complete, they can edit any step directly
    if (currentStep.toLowerCase() === 'complete') {
      return;
    }

    // A user can jump backward to any completed step, or forward by exactly 1 step
    if (targetIdx > currentIdx + 1) {
      throw new BadRequestException(
        `Cannot skip to step "${targetStep}". You must complete the intervening steps first.`
      );
    }
  }

  getNextStep(currentStep: string): string {
    const idx = this.getStepIndex(currentStep);
    if (idx === -1 || idx === ONBOARDING_STEPS.length - 1) {
      return 'complete';
    }
    return ONBOARDING_STEPS[idx + 1];
  }
}
