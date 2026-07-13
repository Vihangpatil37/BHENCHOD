export const roadmapGenerationSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['career_code', 'steps'],
  additionalProperties: false,
  properties: {
    career_code: { type: 'string' },
    steps: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['phase', 'duration', 'action_items'],
        additionalProperties: false,
        properties: {
          phase: { type: 'string' },
          duration: { type: 'string' },
          action_items: { type: 'array', items: { type: 'string' } },
          key_milestone: { type: 'string' },
        },
      },
    },
  },
};
