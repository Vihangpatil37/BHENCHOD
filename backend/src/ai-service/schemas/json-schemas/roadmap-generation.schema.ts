export const roadmapGenerationSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  type: 'object',
  required: ['career_code', 'career_name', 'phases'],
  additionalProperties: false,
  properties: {
    career_code: { type: 'string' },
    career_name: { type: 'string' },
    estimated_total_duration: { type: 'string' },
    overview: { type: 'string' },
    phases: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['phase', 'duration', 'action_items'],
        additionalProperties: false,
        properties: {
          phase: { type: 'string' },
          duration: { type: 'string' },
          goal: { type: 'string' },
          action_items: { type: 'array', items: { type: 'string' } },
          skills_to_build: { type: 'array', items: { type: 'string' } },
          recommended_resources: { type: 'array', items: { type: 'string' } },
          entrance_exams: { type: 'array', items: { type: 'string' } },
          certifications: { type: 'array', items: { type: 'string' } },
          projects: { type: 'array', items: { type: 'string' } },
          internships: { type: 'array', items: { type: 'string' } },
          checkpoints: { type: 'array', items: { type: 'string' } },
          milestone: { type: 'string' },
        },
      },
    },
    salary_progression: {
      type: 'array',
      items: {
        type: 'object',
        required: ['stage'],
        additionalProperties: false,
        properties: {
          stage: { type: 'string' },
          product_company: { type: 'string' },
          mnc_service: { type: 'string' },
          remote_startup: { type: 'string' },
          faang_equivalent: { type: 'string' },
        },
      },
    },
    higher_studies: { type: 'array', items: { type: 'string' } },
    alternative_paths: { type: 'array', items: { type: 'string' } },
    common_mistakes: { type: 'array', items: { type: 'string' } },
    final_checklist: { type: 'array', items: { type: 'string' } },
    mermaid: {
      type: 'object',
      required: ['nodes', 'edges'],
      additionalProperties: false,
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'label'],
            additionalProperties: false,
            properties: {
              id: { type: 'string' },
              label: { type: 'string' },
            },
          },
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            required: ['from', 'to'],
            additionalProperties: false,
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
            },
          },
        },
      },
    },
  },
};
