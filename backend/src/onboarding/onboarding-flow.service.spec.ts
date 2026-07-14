import { BadRequestException } from '@nestjs/common';
import { OnboardingFlowService, ONBOARDING_STEPS } from './onboarding-flow.service';

describe('OnboardingFlowService', () => {
  const service = new OnboardingFlowService();

  describe('getStepIndex', () => {
    it('returns index for valid step', () => {
      expect(service.getStepIndex('personal')).toBe(0);
      expect(service.getStepIndex('scenarios')).toBe(7);
    });

    it('returns -1 for invalid step', () => {
      expect(service.getStepIndex('invalid')).toBe(-1);
    });
  });

  describe('getCompletionPercentage', () => {
    it('returns 100 for complete', () => {
      expect(service.getCompletionPercentage('complete')).toBe(100);
    });

    it('returns 0 for invalid step', () => {
      expect(service.getCompletionPercentage('invalid')).toBe(0);
    });

    it('calculates correct percentage for each step', () => {
      ONBOARDING_STEPS.forEach((step, i) => {
        const pct = Math.round(((i + 1) / ONBOARDING_STEPS.length) * 100);
        expect(service.getCompletionPercentage(step)).toBe(pct);
      });
    });
  });

  describe('validateStepTransition', () => {
    it('allows jumping back to any completed step', () => {
      expect(() => service.validateStepTransition('skills', 'personal')).not.toThrow();
      expect(() => service.validateStepTransition('skills', 'academic')).not.toThrow();
    });

    it('allows forward by exactly 1 step', () => {
      expect(() => service.validateStepTransition('personal', 'academic')).not.toThrow();
      expect(() => service.validateStepTransition('academic', 'interests')).not.toThrow();
    });

    it('rejects skipping forward', () => {
      expect(() => service.validateStepTransition('personal', 'skills'))
        .toThrow(BadRequestException);
      expect(() => service.validateStepTransition('personal', 'scenarios'))
        .toThrow(BadRequestException);
    });

    it('rejects invalid target step', () => {
      expect(() => service.validateStepTransition('personal', 'invalid_step'))
        .toThrow(BadRequestException);
    });

    it('allows editing any step from complete', () => {
      expect(() => service.validateStepTransition('complete', 'personal')).not.toThrow();
      expect(() => service.validateStepTransition('complete', 'scenarios')).not.toThrow();
    });
  });

  describe('getNextStep', () => {
    it('returns next step', () => {
      expect(service.getNextStep('personal')).toBe('academic');
      expect(service.getNextStep('work_preferences')).toBe('constraints');
    });

    it('returns complete after last step', () => {
      expect(service.getNextStep('scenarios')).toBe('complete');
    });

    it('returns complete for invalid step', () => {
      expect(service.getNextStep('invalid')).toBe('complete');
    });
  });
});
