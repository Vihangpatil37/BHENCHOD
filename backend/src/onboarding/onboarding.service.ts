import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  StudentProfile,
  StudentProfileDocument,
  StudentDNA,
} from './schemas/student-profile.schema';
import {
  StudentDNAHistory,
  StudentDNAHistoryDocument,
} from './schemas/student-dna-history.schema';
import { OnboardingFlowService } from './onboarding-flow.service';
import { TraitEngineService } from './trait-engine.service';
import { AIServiceClient } from '../ai-service/ai-service.client';
import { EventEmitter } from 'events';

// Create event emitter for recommendation wiring in Phase 4
export const onboardingEvents = new EventEmitter();

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    @InjectModel(StudentProfile.name)
    private readonly profileModel: Model<StudentProfileDocument>,
    @InjectModel(StudentDNAHistory.name)
    private readonly dnaHistoryModel: Model<StudentDNAHistoryDocument>,
    private readonly flowService: OnboardingFlowService,
    private readonly traitEngine: TraitEngineService,
    private readonly aiClient: AIServiceClient,
  ) {}

  async startOnboarding(userId: string) {
    let profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile) {
      profile = new this.profileModel({
        user_id: userId,
        onboarding_step: 'personal',
        completion_percentage: 0,
      });
      await profile.save();
      this.logger.log(`Started onboarding session for user: ${userId}`);
      onboardingEvents.emit('ONBOARDING_STARTED', { user_id: userId });
    }
    return profile;
  }

  async resumeOnboarding(userId: string) {
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile) {
      // Auto-start if not exists
      return this.startOnboarding(userId);
    }
    return profile;
  }

  async saveStep(userId: string, stepKey: string, stepData: any) {
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile) {
      throw new NotFoundException(
        'Onboarding profile not found. Call start first.',
      );
    }

    const normalizedStep = stepKey.toLowerCase();

    // Validate step transition
    this.flowService.validateStepTransition(
      profile.onboarding_step,
      normalizedStep,
    );

    // Save the step data dynamically into the corresponding sub-document/field
    switch (normalizedStep) {
      case 'personal':
        profile.personal = stepData;
        break;
      case 'academic':
        profile.academic = stepData;
        break;
      case 'interests':
        profile.interests = stepData;
        break;
      case 'skills':
        profile.skills = stepData;
        break;
      case 'goals':
        profile.goals = stepData.goals;
        break;
      case 'work_preferences':
        profile.work_preferences = stepData.work_preferences;
        break;
      case 'constraints':
        profile.constraints = stepData;
        break;
      case 'scenarios':
        profile.scenario_responses = stepData.scenario_responses;
        break;
      default:
        throw new BadRequestException(`Unknown step key: ${stepKey}`);
    }

    // Update current step index and progression percentage if onboarding is not complete
    if (profile.onboarding_step !== 'complete') {
      const nextStep = this.flowService.getNextStep(normalizedStep);
      if (
        this.flowService.getStepIndex(normalizedStep) >=
        this.flowService.getStepIndex(profile.onboarding_step)
      ) {
        profile.onboarding_step = nextStep;
      }
      profile.completion_percentage =
        this.flowService.getCompletionPercentage(normalizedStep);
    }

    await profile.save();
    this.logger.log(
      `Saved onboarding step ${normalizedStep} for user: ${userId}`,
    );

    onboardingEvents.emit('ONBOARDING_STEP_COMPLETED', {
      user_id: userId,
      step: normalizedStep,
      completion_percentage: profile.completion_percentage,
    });

    // Emit profile updated event if step is not personal (profile-relevant change)
    if (normalizedStep !== 'personal') {
      onboardingEvents.emit('PROFILE_UPDATED', { user_id: userId });
    }

    return profile;
  }

  async completeOnboarding(userId: string) {
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile) {
      throw new NotFoundException('Onboarding profile not found');
    }

    // Ensure all steps are completed (step key must be 'complete' or we are on the final step 'scenarios')
    if (
      profile.onboarding_step !== 'complete' &&
      profile.onboarding_step !== 'scenarios'
    ) {
      throw new BadRequestException(
        `Cannot complete onboarding yet. Current step is: ${profile.onboarding_step}`,
      );
    }

    // 1. Compute DNA traits deterministically
    const dna = this.traitEngine.computeDNA(profile);

    // 2. Save DNA traits to profile
    profile.current_dna = dna;
    profile.onboarding_step = 'complete';
    profile.completion_percentage = 100;
    await profile.save();

    // 3. Log DNA Snapshot in history
    const history = new this.dnaHistoryModel({
      user_id: userId,
      dna_snapshot: dna,
      trigger: 'onboarding_complete',
    });
    await history.save();

    this.logger.log(
      `Completed onboarding and generated DNA for user: ${userId}`,
    );

    // 4. Emit event to trigger recommendation pipeline (Phase 4 stub)
    onboardingEvents.emit('ONBOARDING_COMPLETED', {
      user_id: userId,
      dna,
    });

    return dna;
  }

  async generateScenarios(userId: string): Promise<any> {
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile) {
      throw new NotFoundException('Onboarding profile not found.');
    }

    const context = {
      student_profile: {
        personal: profile.personal,
        academic: profile.academic,
        interests: profile.interests,
        skills: profile.skills,
        goals: profile.goals,
        work_preferences: profile.work_preferences,
        constraints: profile.constraints,
      },
    };

    const response = await this.aiClient.run('scenario_generation', context);
    profile.pending_scenarios = response.data?.scenarios || [];
    await profile.save();
    return response.data;
  }

  async getDNA(userId: string): Promise<StudentDNA> {
    const profile = await this.profileModel.findOne({ user_id: userId }).exec();
    if (!profile || !profile.current_dna) {
      throw new NotFoundException(
        'Student DNA not found. Onboarding must be completed first.',
      );
    }
    return profile.current_dna;
  }
}
