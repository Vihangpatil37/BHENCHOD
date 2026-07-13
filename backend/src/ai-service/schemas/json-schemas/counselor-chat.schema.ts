export const counselorChatSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['reply'],
  additionalProperties: false,
  properties: {
    reply: { type: 'string' },
    recommended_links: {
      type: 'array',
      items: { type: 'string' },
    },
    suggested_questions: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};
