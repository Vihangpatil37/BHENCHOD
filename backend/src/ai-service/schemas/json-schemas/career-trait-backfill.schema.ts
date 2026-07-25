const traitWeightsSchema = {
  type: 'object',
  required: [
    'analytical_thinking',
    'creativity',
    'communication',
    'leadership',
    'research',
    'business_acumen',
    'technical_curiosity',
    'empathy',
    'patience',
    'risk_tolerance',
  ],
  additionalProperties: false,
  properties: {
    analytical_thinking: { type: 'number', minimum: 0, maximum: 100 },
    creativity: { type: 'number', minimum: 0, maximum: 100 },
    communication: { type: 'number', minimum: 0, maximum: 100 },
    leadership: { type: 'number', minimum: 0, maximum: 100 },
    research: { type: 'number', minimum: 0, maximum: 100 },
    business_acumen: { type: 'number', minimum: 0, maximum: 100 },
    technical_curiosity: { type: 'number', minimum: 0, maximum: 100 },
    empathy: { type: 'number', minimum: 0, maximum: 100 },
    patience: { type: 'number', minimum: 0, maximum: 100 },
    risk_tolerance: { type: 'number', minimum: 0, maximum: 100 },
  },
};

const eligibilitySchema = {
  type: 'object',
  required: [
    'min_maths',
    'min_science',
    'max_budget_tier',
    'min_study_duration_years',
  ],
  additionalProperties: false,
  properties: {
    min_maths: { type: 'number', minimum: 0, maximum: 100 },
    min_science: { type: 'number', minimum: 0, maximum: 100 },
    max_budget_tier: { type: 'integer', minimum: 1, maximum: 4 },
    min_study_duration_years: { type: 'number', minimum: 0 },
  },
};

export const careerTraitBackfillSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['trait_weights', 'eligibility'],
  additionalProperties: false,
  properties: {
    trait_weights: traitWeightsSchema,
    eligibility: eligibilitySchema,
  },
};
