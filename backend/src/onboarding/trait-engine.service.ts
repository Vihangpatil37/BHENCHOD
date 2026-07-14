import { Injectable, Logger } from '@nestjs/common';
import { StudentProfile, StudentDNA } from './schemas/student-profile.schema';

interface TraitConfig {
  subjects?: Record<string, number>;
  interests?: Record<string, number>;
  skills?: Record<string, number>;
  profile_weight: number; // weight of profile vs scenarios (0.0 to 1.0)
}

@Injectable()
export class TraitEngineService {
  private readonly logger = new Logger(TraitEngineService.name);

  // Pure deterministic mapping configurations
  private readonly TRAIT_CONFIG: Record<string, TraitConfig> = {
    analytical_thinking: {
      subjects: { maths: 0.5, science: 0.5 },
      interests: { research: 0.6, technology: 0.4 },
      skills: { logical_thinking: 0.6, math: 0.4 },
      profile_weight: 0.7,
    },
    creativity: {
      interests: { design: 0.6, media: 0.4 },
      skills: { creativity: 0.7, drawing: 0.3 },
      profile_weight: 0.7,
    },
    communication: {
      subjects: { english: 0.6, sst: 0.4 },
      interests: { teaching: 0.3, media: 0.7 },
      skills: { communication: 1.0 },
      profile_weight: 0.7,
    },
    leadership: {
      interests: { business: 0.6, government: 0.4 },
      skills: { leadership: 0.7, communication: 0.3 },
      profile_weight: 0.6,
    },
    research: {
      subjects: { science: 0.7, maths: 0.3 },
      interests: { research: 0.8, nature: 0.2 },
      skills: { observation: 0.6, logical_thinking: 0.4 },
      profile_weight: 0.7,
    },
    business_acumen: {
      interests: { business: 0.6, finance: 0.4 },
      skills: { leadership: 0.5, logical_thinking: 0.5 },
      profile_weight: 0.7,
    },
    technical_curiosity: {
      subjects: { computer: 0.6, maths: 0.4 },
      interests: { technology: 0.7, machines: 0.3 },
      skills: { coding: 0.8, problem_solving: 0.2 },
      profile_weight: 0.7,
    },
    empathy: {
      interests: { helping_people: 0.7, teaching: 0.3 },
      skills: { patience: 0.6, communication: 0.4 },
      profile_weight: 0.6,
    },
    patience: {
      interests: { nature: 0.5, research: 0.5 },
      skills: { patience: 0.8, observation: 0.2 },
      profile_weight: 0.7,
    },
    risk_tolerance: {
      interests: { business: 0.7, sports: 0.3 },
      skills: { problem_solving: 0.6, leadership: 0.4 },
      profile_weight: 0.5,
    },
  };

  computeDNA(profile: StudentProfile): StudentDNA {
    this.logger.log(`Computing StudentDNA for profile of user: ${profile.user_id}`);
    
    const dna: any = {};
    const traits = Object.keys(this.TRAIT_CONFIG);

    for (const trait of traits) {
      const config = this.TRAIT_CONFIG[trait];

      // 1. Compute Subject Component
      let subjectScore = 0;
      if (config.subjects && profile.academic?.class10?.subjects) {
        let weightSum = 0;
        for (const [sub, weight] of Object.entries(config.subjects)) {
          const score = (profile.academic.class10.subjects as any)[sub] || 0;
          subjectScore += score * weight;
          weightSum += weight;
        }
        if (weightSum > 0) subjectScore /= weightSum;
      }

      // 2. Compute Interests Component
      let interestScore = 0;
      if (config.interests && profile.interests) {
        let weightSum = 0;
        for (const [intName, weight] of Object.entries(config.interests)) {
          const score = (profile.interests as any)[intName] || 0;
          interestScore += score * weight;
          weightSum += weight;
        }
        if (weightSum > 0) interestScore /= weightSum;
      }

      // 3. Compute Skills Component (scale 1-5 to 0-100)
      let skillScore = 0;
      if (config.skills && profile.skills) {
        let weightSum = 0;
        for (const [skillName, weight] of Object.entries(config.skills)) {
          const rawVal = (profile.skills as any)[skillName] || 1;
          // Normalize 1-5 to 0-100
          const score = ((rawVal - 1) / 4) * 100;
          skillScore += score * weight;
          weightSum += weight;
        }
        if (weightSum > 0) skillScore /= weightSum;
      }

      // Average the profile components that are configured
      const profileComponents: number[] = [];
      if (config.subjects && profile.academic?.class10?.subjects) profileComponents.push(subjectScore);
      if (config.interests && profile.interests) profileComponents.push(interestScore);
      if (config.skills && profile.skills) profileComponents.push(skillScore);

      const profileAvg = profileComponents.length > 0
        ? profileComponents.reduce((a, b) => a + b, 0) / profileComponents.length
        : 50; // default middle fallback

      // 4. Compute Scenarios Component
      let scenarioSum = 50; // base starting score for scenarios to keep it bounded 0-100
      if (profile.scenario_responses && profile.scenario_responses.length > 0) {
        let impactSum = 0;
        for (const resp of profile.scenario_responses) {
          const impact = resp.trait_weights instanceof Map 
            ? resp.trait_weights.get(trait)
            : (resp.trait_weights as any)?.[trait];
          
          if (impact !== undefined && impact !== null) {
            impactSum += impact;
          }
        }
        scenarioSum = Math.min(100, Math.max(0, scenarioSum + impactSum));
      }

      // Combine profile avg with scenario responses
      const finalScore = profileAvg * config.profile_weight + scenarioSum * (1 - config.profile_weight);
      
      // Save rounded value
      dna[trait] = Math.round(Math.min(100, Math.max(0, finalScore)));
    }

    dna.computed_at = new Date();
    dna.source_version = 'v1';

    return dna as StudentDNA;
  }
}
