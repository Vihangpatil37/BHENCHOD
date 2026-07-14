export const scenarioGenerationSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['scenarios'],
  additionalProperties: false,
  properties: {
    scenarios: {
      type: 'array',
      minItems: 10,
      maxItems: 10,
      items: {
        type: 'object',
        required: ['id', 'question', 'options', 'trait'],
        additionalProperties: false,
        properties: {
          id: { type: 'integer', minimum: 1, maximum: 10 },
          question: { type: 'string', minLength: 10 },
          options: {
            type: 'array',
            minItems: 4,
            maxItems: 4,
            items: { type: 'string', minLength: 1 },
          },
          trait: { type: 'string' },
        },
      },
    },
  },
};
