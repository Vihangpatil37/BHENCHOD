/**
 * Default trait_weights configuration for career catalog import.
 *
 * Each category has a base profile (0–100 scale, 10 traits).
 * After applying the base profile, keyword modifiers are applied
 * based on the career name (case-insensitive substring match).
 */

export interface TraitProfile {
  analytical_thinking: number;
  creativity: number;
  communication: number;
  leadership: number;
  research: number;
  business_acumen: number;
  technical_curiosity: number;
  empathy: number;
  patience: number;
  risk_tolerance: number;
}

/**
 * Base trait profile per category_code.
 */
export const BASE_TRAIT_PROFILES: Record<string, TraitProfile> = {
  science: {
    analytical_thinking: 80,
    creativity: 50,
    communication: 45,
    leadership: 40,
    research: 65,
    business_acumen: 30,
    technical_curiosity: 75,
    empathy: 40,
    patience: 55,
    risk_tolerance: 45,
  },
  commerce: {
    analytical_thinking: 65,
    creativity: 40,
    communication: 60,
    leadership: 55,
    research: 40,
    business_acumen: 80,
    technical_curiosity: 35,
    empathy: 35,
    patience: 50,
    risk_tolerance: 55,
  },
  arts_humanities: {
    analytical_thinking: 45,
    creativity: 75,
    communication: 75,
    leadership: 45,
    research: 50,
    business_acumen: 30,
    technical_curiosity: 30,
    empathy: 65,
    patience: 55,
    risk_tolerance: 45,
  },
  diploma: {
    analytical_thinking: 65,
    creativity: 40,
    communication: 40,
    leadership: 35,
    research: 35,
    business_acumen: 30,
    technical_curiosity: 70,
    empathy: 35,
    patience: 55,
    risk_tolerance: 40,
  },
  iti_polytechnic: {
    analytical_thinking: 55,
    creativity: 30,
    communication: 30,
    leadership: 25,
    research: 20,
    business_acumen: 25,
    technical_curiosity: 75,
    empathy: 30,
    patience: 65,
    risk_tolerance: 35,
  },
  vocational: {
    analytical_thinking: 35,
    creativity: 55,
    communication: 55,
    leadership: 40,
    research: 25,
    business_acumen: 45,
    technical_curiosity: 40,
    empathy: 45,
    patience: 55,
    risk_tolerance: 50,
  },
  government_defence: {
    analytical_thinking: 55,
    creativity: 25,
    communication: 55,
    leadership: 70,
    research: 40,
    business_acumen: 35,
    technical_curiosity: 30,
    empathy: 50,
    patience: 65,
    risk_tolerance: 60,
  },
  emerging_future: {
    analytical_thinking: 75,
    creativity: 55,
    communication: 45,
    leadership: 40,
    research: 55,
    business_acumen: 45,
    technical_curiosity: 85,
    empathy: 30,
    patience: 40,
    risk_tolerance: 65,
  },
};

/**
 * Keyword modifiers applied additively to the base profile.
 * Keys are lowercase substrings to match against the career name.
 * Values are partial TraitProfile with only the traits that get modified.
 */
export const KEYWORD_MODIFIERS: Record<string, Partial<TraitProfile>> = {
  manager: { leadership: 15, business_acumen: 10 },
  director: { leadership: 15, business_acumen: 10 },
  head: { leadership: 15, business_acumen: 10 },
  chief: { leadership: 15, business_acumen: 10 },
  cfo: { leadership: 15, business_acumen: 10 },
  cto: { leadership: 15, business_acumen: 10 },
  engineer: { technical_curiosity: 10, analytical_thinking: 5 },
  technician: { technical_curiosity: 10, analytical_thinking: 5 },
  developer: { technical_curiosity: 10, analytical_thinking: 5 },
  programmer: { technical_curiosity: 10, analytical_thinking: 5 },
  analyst: { research: 15, analytical_thinking: 10 },
  scientist: { research: 15, analytical_thinking: 10 },
  researcher: { research: 15, analytical_thinking: 10 },
  designer: { creativity: 15 },
  artist: { creativity: 15 },
  stylist: { creativity: 15 },
  curator: { creativity: 15 },
  teacher: { empathy: 15, communication: 10 },
  counselor: { empathy: 15, communication: 10 },
  therapist: { empathy: 15, communication: 10 },
  trainer: { empathy: 15, communication: 10 },
  coach: { empathy: 15, communication: 10 },
  instructor: { empathy: 15, communication: 10 },
  officer: { leadership: 10, risk_tolerance: 10 },
  founder: { leadership: 10, risk_tolerance: 10 },
  entrepreneur: { leadership: 10, risk_tolerance: 10 },
  consultant: { communication: 10, business_acumen: 5 },
  advisor: { communication: 10, business_acumen: 5 },
};

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Compute trait_weights for a career based on its category and name.
 * Applies base profile + keyword modifiers, then clamps all values 0–100.
 */
export function computeTraitWeights(
  categoryCode: string,
  careerName: string,
): TraitProfile {
  const base = BASE_TRAIT_PROFILES[categoryCode];
  if (!base) {
    throw new Error(`Unknown category_code: ${categoryCode}`);
  }

  const nameLower = careerName.toLowerCase();
  const result: TraitProfile = { ...base };

  for (const [keyword, modifier] of Object.entries(KEYWORD_MODIFIERS)) {
    if (nameLower.includes(keyword)) {
      for (const [trait, delta] of Object.entries(modifier)) {
        result[trait as keyof TraitProfile] += delta;
      }
    }
  }

  // Clamp all values to 0–100
  for (const key of Object.keys(result) as (keyof TraitProfile)[]) {
    result[key] = clamp(result[key]);
  }

  return result;
}
