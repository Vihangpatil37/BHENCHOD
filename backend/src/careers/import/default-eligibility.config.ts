/**
 * Default eligibility configuration for career catalog import.
 *
 * Maps category + sub_domain combinations to eligibility constraints.
 * government_defence is special-cased with granular rules per sub-domain.
 */

export interface EligibilityConstraints {
  min_maths: number;
  min_science: number;
  min_biology: number;
  required_stream: string; // 'PCM' | 'PCB' | 'PCMB' | 'Commerce' | 'Arts' | 'any'
  min_study_duration_years: number;
  max_study_duration_years: number;
  max_budget_tier: number;
}

/** Generic eligibility for a category (applied as a fallback). */
export interface CategoryEligibilityRule {
  fallback: EligibilityConstraints;
  overrides?: Record<string, Partial<EligibilityConstraints>>;
}

/**
 * Eligibility rules keyed by category_code.
 */
export const ELIGIBILITY_RULES: Record<string, EligibilityConstraints | CategoryEligibilityRule> = {
  science: {
    fallback: {
      min_maths: 0,
      min_science: 0,
      min_biology: 0,
      required_stream: 'any',
      min_study_duration_years: 4,
      max_study_duration_years: 6,
      max_budget_tier: 3,
    },
    overrides: {
      science_pcm: {
        min_maths: 60,
        min_science: 55,
        min_biology: 0,
        required_stream: 'PCM',
      },
      science_pcb: {
        min_maths: 0,
        min_science: 60,
        min_biology: 55,
        required_stream: 'PCB',
      },
      science_pcmb: {
        min_maths: 55,
        min_science: 60,
        min_biology: 50,
        required_stream: 'PCMB',
      },
    },
  },

  commerce: {
    min_maths: 40,
    min_science: 0,
    min_biology: 0,
    required_stream: 'Commerce',
    min_study_duration_years: 3,
    max_study_duration_years: 5,
    max_budget_tier: 3,
  },

  arts_humanities: {
    min_maths: 0,
    min_science: 0,
    min_biology: 0,
    required_stream: 'Arts',
    min_study_duration_years: 3,
    max_study_duration_years: 5,
    max_budget_tier: 2,
  },

  diploma: {
    min_maths: 35,
    min_science: 35,
    min_biology: 0,
    required_stream: 'any',
    min_study_duration_years: 3,
    max_study_duration_years: 3,
    max_budget_tier: 2,
  },

  iti_polytechnic: {
    min_maths: 0,
    min_science: 0,
    min_biology: 0,
    required_stream: 'any',
    min_study_duration_years: 1,
    max_study_duration_years: 2,
    max_budget_tier: 1,
  },

  vocational: {
    min_maths: 0,
    min_science: 0,
    min_biology: 0,
    required_stream: 'any',
    min_study_duration_years: 0.5,
    max_study_duration_years: 2,
    max_budget_tier: 1,
  },

  // government_defence is special-cased — see computeGovernmentEligibility()
  government_defence: {
    fallback: {
      min_maths: 0,
      min_science: 0,
      min_biology: 0,
      required_stream: 'any',
      min_study_duration_years: 0,
      max_study_duration_years: 0,
      max_budget_tier: 1,
    },
    overrides: {},
  },

  emerging_future: {
    fallback: {
      min_maths: 55,
      min_science: 50,
      min_biology: 0,
      required_stream: 'PCM',
      min_study_duration_years: 4,
      max_study_duration_years: 6,
      max_budget_tier: 2,
    },
    overrides: {
      creator_economy: {
        min_maths: 0,
        min_science: 0,
        min_biology: 0,
        required_stream: 'any',
        min_study_duration_years: 0,
        max_study_duration_years: 2,
        max_budget_tier: 1,
      },
      freelancing: {
        min_maths: 0,
        min_science: 0,
        min_biology: 0,
        required_stream: 'any',
        min_study_duration_years: 0,
        max_study_duration_years: 2,
        max_budget_tier: 1,
      },
      entrepreneurship_emerging: {
        min_maths: 0,
        min_science: 0,
        min_biology: 0,
        required_stream: 'any',
        min_study_duration_years: 0,
        max_study_duration_years: 2,
        max_budget_tier: 1,
      },
    },
  },
};

/**
 * Sub-domains within government_defence that are open at Class 10/12 level.
 * These have short/no study duration requirements.
 */
export const GOVT_OPEN_ENTRY_SUBDOMAINS = new Set([
  'ssc',
  'railways_rrb',
]);

/**
 * Government defence sub-domains where officer-level roles require graduation.
 * These need enrichment flagging.
 */
export const GOVT_GRADUATE_REQUIRED_SUBDOMAINS = new Set([
  'upsc',
  'judiciary',
  'research_organisations',
  'teaching_govt',
  'capf',
  'police_services',
]);

/**
 * Indian defence force Agniveer/Soldier entries open at younger levels.
 */
export const GOVT_DEFENCE_NON_OFFICER_SUBDOMAINS = new Set([
  'indian_army',
  'indian_navy',
  'indian_air_force',
]);

/**
 * Compute eligibility for a government_defence career based on sub_domain.
 */
export function computeGovernmentEligibility(
  subDomainCode: string,
): EligibilityConstraints & { needs_enrichment: boolean } {
  // Open SSC/RRB entries — Class 10/12 level
  if (GOVT_OPEN_ENTRY_SUBDOMAINS.has(subDomainCode)) {
    return {
      min_maths: 0,
      min_science: 0,
      min_biology: 0,
      required_stream: 'any',
      min_study_duration_years: 0,
      max_study_duration_years: 1,
      max_budget_tier: 1,
      needs_enrichment: false,
    };
  }

  // Defence non-officer (Agniveer, Soldier GD, Sailor, Vayu)
  if (GOVT_DEFENCE_NON_OFFICER_SUBDOMAINS.has(subDomainCode)) {
    return {
      min_maths: 0,
      min_science: 0,
      min_biology: 0,
      required_stream: 'any',
      min_study_duration_years: 0,
      max_study_duration_years: 1,
      max_budget_tier: 1,
      needs_enrichment: false,
    };
  }

  // Graduate-required roles
  if (GOVT_GRADUATE_REQUIRED_SUBDOMAINS.has(subDomainCode)) {
    return {
      min_maths: 0,
      min_science: 0,
      min_biology: 0,
      required_stream: 'any',
      min_study_duration_years: 3,
      max_study_duration_years: 5,
      max_budget_tier: 2,
      needs_enrichment: true,
    };
  }

  // Default for other government sub-domains
  return {
    min_maths: 0,
    min_science: 0,
    min_biology: 0,
    required_stream: 'any',
    min_study_duration_years: 0,
    max_study_duration_years: 3,
    max_budget_tier: 2,
    needs_enrichment: false,
  };
}

/**
 * Compute eligibility constraints for a career based on its category and sub_domain.
 *
 * Returns the eligibility constraints and a flag indicating if the entry
 * should be marked as `needs_enrichment`.
 */
export function computeEligibility(
  categoryCode: string,
  subDomainCode: string,
): { eligibility: EligibilityConstraints; needs_enrichment: boolean } {
  // Special case: government_defence
  if (categoryCode === 'government_defence') {
    const result = computeGovernmentEligibility(subDomainCode);
    return {
      eligibility: {
        min_maths: result.min_maths,
        min_science: result.min_science,
        min_biology: result.min_biology,
        required_stream: result.required_stream,
        min_study_duration_years: result.min_study_duration_years,
        max_study_duration_years: result.max_study_duration_years,
        max_budget_tier: result.max_budget_tier,
      },
      needs_enrichment: result.needs_enrichment,
    };
  }

  const rule = ELIGIBILITY_RULES[categoryCode];
  if (!rule) {
    throw new Error(`Unknown category_code: ${categoryCode}`);
  }

  // Simple rule (no sub-domain overrides)
  if (!('fallback' in rule)) {
    return { eligibility: rule as EligibilityConstraints, needs_enrichment: false };
  }

  // Rule with overrides
  const { fallback, overrides } = rule;
  if (overrides && subDomainCode in overrides) {
    const override = overrides[subDomainCode]!;
    return {
      eligibility: { ...fallback, ...override },
      needs_enrichment: false,
    };
  }

  return { eligibility: fallback, needs_enrichment: false };
}
