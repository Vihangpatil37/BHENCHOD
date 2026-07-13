import { BadRequestException } from '@nestjs/common';
import { JsonValidatorService } from './json-validator.service';

// ---------------------------------------------------------------------------
// Fixtures per task type
// ---------------------------------------------------------------------------
const fixtures = {
  career_recommendation: {
    valid: {
      final_recommendations: [
        { career_code: 'cs', rank: 1, ai_score: 85, explanation: 'Good fit', roadmap: 'Study CS', suggested_colleges: ['MIT'], suggested_certifications: ['AWS'] },
      ],
    },
    missingField: { final_recommendations: [{ career_code: 'cs', rank: 1 }] },
    wrongType:   { final_recommendations: [{ career_code: 'cs', rank: 'first', ai_score: 85, explanation: 'x', roadmap: 'y' }] },
  },
  counselor_chat: {
    valid:      { reply: 'Hello', recommended_links: [], suggested_questions: [] },
    missingField: {},
    wrongType:   { reply: 123 },
  },
  career_trait_backfill: {
    valid: {
      trait_weights: { analytical_thinking: 80, creativity: 50, communication: 60, leadership: 40, research: 70, business_acumen: 30, technical_curiosity: 90, empathy: 50, patience: 40, risk_tolerance: 20 },
      eligibility: { min_maths: 60, min_science: 50, max_budget_tier: 3, min_study_duration_years: 4 },
    },
    missingField: { trait_weights: { analytical_thinking: 80 } },
    wrongType:   { trait_weights: { analytical_thinking: 'high', creativity: 50, communication: 60, leadership: 40, research: 70, business_acumen: 30, technical_curiosity: 90, empathy: 50, patience: 40, risk_tolerance: 20 }, eligibility: { min_maths: 60, min_science: 50, max_budget_tier: 3, min_study_duration_years: 4 } },
  },
  report_summary: {
    valid:      { summary_text: 'Summary text' },
    missingField: {},
    wrongType:   { summary_text: 42 },
  },
  roadmap_generation: {
    valid:      { career_code: 'cs', steps: [{ phase: 'School', duration: '2y', action_items: ['Study'] }] },
    missingField: { career_code: 'cs' },
    wrongType:   { career_code: 'cs', steps: 'not-an-array' },
  },
} as const;

const service = new JsonValidatorService();

// ---------------------------------------------------------------------------
// Schema validation — every task type
// ---------------------------------------------------------------------------
describe('validate', () => {
  describe.each(Object.entries(fixtures))('%s', (taskType, f) => {
    it('accepts valid data', () => {
      expect(() => service.validateAndRepair(JSON.stringify(f.valid), taskType)).not.toThrow();
    });

    it('rejects missing required field', () => {
      expect(() => service.validateAndRepair(JSON.stringify(f.missingField as any), taskType))
        .toThrow(BadRequestException);
    });

    it('rejects wrong field type', () => {
      expect(() => service.validateAndRepair(JSON.stringify(f.wrongType as any), taskType))
        .toThrow(BadRequestException);
    });
  });
});

// ---------------------------------------------------------------------------
// Repair — one bounded pass, representative schema
// ---------------------------------------------------------------------------
describe('repair', () => {
  const validObj = { reply: 'hello', recommended_links: [], suggested_questions: [] };
  const validStr = JSON.stringify(validObj);

  it('strips ```json fences', () => {
    expect(() => service.validateAndRepair('```json\n' + validStr + '\n```', 'counselor_chat')).not.toThrow();
  });

  it('strips prose before/after JSON', () => {
    expect(() => service.validateAndRepair('Here is the JSON: ' + validStr, 'counselor_chat')).not.toThrow();
  });

  it('removes trailing commas', () => {
    const withTrailing = validStr.replace(/}$/, ',}');
    expect(() => service.validateAndRepair(withTrailing, 'counselor_chat')).not.toThrow();
  });

  it('handles single-quoted keys', () => {
    const singleQuoted = validStr.replace(/"/g, "'");
    expect(() => service.validateAndRepair(singleQuoted, 'counselor_chat')).not.toThrow();
  });

  it('fails fast on truncated JSON', () => {
    expect(() => service.validateAndRepair('{"reply": "hel', 'counselor_chat')).toThrow(BadRequestException);
  });

  it('fails fast on non-JSON garbage', () => {
    expect(() => service.validateAndRepair('not json at all', 'counselor_chat')).toThrow(BadRequestException);
  });

  it('does not loop — single repair attempt', () => {
    // JSON with unbalanced braces should fail after one repair, not hang
    const unbalanced = '{"reply": "hello", "extra": {';
    expect(() => service.validateAndRepair(unbalanced, 'counselor_chat')).toThrow(BadRequestException);
  });
});
