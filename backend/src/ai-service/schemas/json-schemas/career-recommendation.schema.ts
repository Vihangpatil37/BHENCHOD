export const careerRecommendationSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['final_recommendations'],
  additionalProperties: false,
  properties: {
    final_recommendations: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['career_code', 'rank', 'ai_score', 'explanation', 'roadmap'],
        additionalProperties: false,
        properties: {
          career_code: { type: 'string' },
          rank: { type: 'integer', minimum: 1 },
          ai_score: { type: 'number', minimum: 0, maximum: 100 },
          explanation: { type: 'string' },
          roadmap: { type: 'string' },
          suggested_colleges: { type: 'array', items: { type: 'string' } },
          suggested_certifications: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};
