export const reportSummarySchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['summary_text'],
  additionalProperties: false,
  properties: {
    summary_text: { type: 'string' },
  },
};
